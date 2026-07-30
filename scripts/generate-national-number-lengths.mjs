#!/usr/bin/env node
/**
 * Derives `nationalNumberLengths` for every record in `src/countriesData.ts`
 * from Google's libphonenumber metadata.
 *
 * Source: https://github.com/google/libphonenumber
 *         resources/PhoneNumberMetadata.xml — Copyright (C) 2009 The
 *         Libphonenumber Authors, licensed under the Apache License 2.0.
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Only the derived digit counts are copied into this repository; no upstream
 * code or markup ships with the package.
 *
 * Dev tooling only. Never runs in CI (it needs network, and libphonenumber tags
 * roughly weekly — an upstream release must not break unrelated PRs) and never
 * ships (`files: ["dist"]` in package.json).
 *
 * Usage:
 *   node scripts/generate-national-number-lengths.mjs            # dry run; exit 1 on drift
 *   node scripts/generate-national-number-lengths.mjs --write    # rewrite the dataset in place
 *   node scripts/generate-national-number-lengths.mjs --json     # print the derived map only
 *   node scripts/generate-national-number-lengths.mjs --ref=v9.0.36
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/**
 * Pinned upstream ref. Never fetch `master`: libphonenumber tags roughly twice
 * a month, so an unpinned run is not reproducible and any drift report it
 * produces is meaningless. Bump this deliberately, and record the new ref in
 * the commit message.
 */
const LIBPHONENUMBER_REF = "v9.0.35";

const METADATA_URL = (ref) =>
  `https://raw.githubusercontent.com/google/libphonenumber/${ref}/resources/PhoneNumberMetadata.xml`;

/**
 * The number types whose ranges count as "a phone number someone would be
 * asked to type". Toll-free, premium-rate, shared-cost, VoIP, pager, UAN and
 * voicemail ranges are deliberately excluded — they have their own lengths and
 * would widen almost every country's set to no useful end.
 */
const NUMBER_TYPES = ["fixedLine", "mobile"];

/**
 * libphonenumber territories with no ISO 3166-1 assignment of their own.
 * ISO folds both into `SH` (Saint Helena, Ascension and Tristan da Cunha), but
 * merging them would be wrong: `AC` dials `+247` while this dataset's SH record
 * is `+290`. `TA` also dials `+290` and its only length (4) already falls
 * inside SH's set, so ignoring both loses nothing.
 */
const IGNORED_TERRITORIES = new Set(["AC", "TA"]);

/**
 * Dataset records with no upstream territory, which therefore get `[]`.
 * libphonenumber's own metadata explains two of them: French Southern
 * Territories is "not covered due to lack of information about its numbering
 * plan", and Pitcairn "is not supported since evidence seems to be that the 50
 * inhabitants use satellite phones". The rest are uninhabited or have no
 * permanent population, and so no civil numbering plan.
 */
const EXPECTED_MISSING = new Set(["AQ", "BV", "GS", "HM", "PN", "TF", "UM"]);

/**
 * Every record's `region` line — the anchor the new key is written before.
 * `areaCodes` would read better as the anchor, since the new key belongs
 * directly after it, but Canada's `areaCodes` array is wrapped across 30-odd
 * lines. `region` is a single-line string on all 250 records.
 */
const REGION_LINE = /^ {4}region: "[^"]*",$/;
const LENGTHS_LINE = /^ {4}nationalNumberLengths: \[[^\]]*\],$/;
const COUNTRY_CODE_LINE = /^ {4}countryCode: "([A-Z]{2})",$/;

const DATASET_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "countriesData.ts"
);

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/**
 * Expands a `possibleLengths` attribute value — a comma-separated list of
 * digit counts where a token may also be an inclusive `[min-max]` range.
 * Throws on anything else so that new upstream syntax fails loudly instead of
 * silently dropping a country's lengths.
 */
const parseLengths = (value, territoryId) => {
  const lengths = [];
  for (const token of value.split(",")) {
    const range = token.match(/^\[(\d+)-(\d+)\]$/);
    if (range) {
      for (let n = Number(range[1]); n <= Number(range[2]); n += 1) {
        lengths.push(n);
      }
    } else if (/^-?\d+$/.test(token)) {
      // `-1` is libphonenumber's "not applicable" sentinel.
      const n = Number(token);
      if (n > 0) lengths.push(n);
    } else {
      throw new Error(
        `${territoryId}: unparseable possibleLengths token ${JSON.stringify(token)}`
      );
    }
  }
  return lengths;
};

/**
 * Reads the national possible lengths out of one `<territory>` block.
 *
 * Scoping to the `<fixedLine>` / `<mobile>` subtrees is load-bearing, not
 * stylistic: `<noInternationalDialling>` carries its own `<possibleLengths>`
 * (the Netherlands' is `national="5,6"`), which would otherwise be folded in.
 * Reading the `national` attribute by name matters for the same reason —
 * Germany's tag is `<possibleLengths national="[5-15]" localOnly="[2-4]"/>`,
 * and `localOnly` values are not valid national significant numbers.
 */
const lengthsForTerritory = (block, territoryId) => {
  const lengths = new Set();
  for (const type of NUMBER_TYPES) {
    const subtree = block.match(
      new RegExp(`<${type}>([\\s\\S]*?)</${type}>`)
    );
    if (!subtree) continue;
    const attr = subtree[1].match(/<possibleLengths\b[^>]*\bnational="([^"]*)"/);
    if (!attr) continue;
    for (const n of parseLengths(attr[1], territoryId)) lengths.add(n);
  }
  // Numeric comparator is required — the default lexicographic sort would
  // order Germany as [10, 11, 5, 6, ...].
  return [...lengths].sort((a, b) => a - b);
};

/** territory id -> { callingCode, lengths } for every geographic territory. */
const parseMetadata = (xml) => {
  // Strip comments first: the file header names TF and PN in prose and the DTD
  // block contains literal `<fixedLine ...>` element declarations.
  const stripped = xml.replace(/<!--[\s\S]*?-->/g, "");
  const territories = new Map();

  for (const chunk of stripped.split(/(?=<territory\b)/)) {
    if (!chunk.startsWith("<territory")) continue;
    const block = chunk.slice(0, chunk.indexOf("</territory>"));

    const id = block.match(/<territory\s[^>]*?\bid="([^"]+)"/)?.[1];
    // `001` is the UN M.49 "World" code libphonenumber uses for the
    // non-geographic entities (+800, +870, +882, ...). Not countries.
    if (!id || id === "001" || IGNORED_TERRITORIES.has(id)) continue;

    territories.set(id, {
      callingCode: block.match(/\bcountryCode="(\d+)"/)?.[1] ?? "",
      lengths: lengthsForTerritory(block, id),
    });
  }
  return territories;
};

// ---------------------------------------------------------------------------
// Dataset
// ---------------------------------------------------------------------------

/**
 * Walks the dataset literal line by line and returns one entry per record:
 * its country code, its current lengths (if the field is already present) and
 * the line indices the writer needs.
 */
const readDataset = (lines) => {
  const records = [];
  let countryCode = null;
  let callingCode = null;

  lines.forEach((line, index) => {
    const code = line.match(COUNTRY_CODE_LINE);
    if (code) {
      countryCode = code[1];
      callingCode = null;
      return;
    }
    const calling = line.match(/^ {4}countryCallingCode: "(\d*)",$/);
    if (calling) {
      callingCode = calling[1];
      return;
    }
    if (!REGION_LINE.test(line)) return;

    const previous = lines[index - 1] ?? "";
    const present = LENGTHS_LINE.test(previous);
    records.push({
      countryCode,
      callingCode,
      anchor: index,
      replaces: present ? index - 1 : null,
      existing: present
        ? JSON.parse(
            previous.slice(previous.indexOf("["), previous.lastIndexOf("]") + 1)
          )
        : null,
    });
  });

  return records;
};

const formatLine = (lengths) =>
  `    nationalNumberLengths: [${lengths.join(", ")}],`;

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const fail = (message) => {
  console.error(`error: ${message}`);
  process.exit(1);
};

const args = process.argv.slice(2);
const write = args.includes("--write");
const asJson = args.includes("--json");
const ref = args.find((a) => a.startsWith("--ref="))?.slice(6) ?? LIBPHONENUMBER_REF;

const response = await fetch(METADATA_URL(ref));
if (!response.ok) {
  fail(`fetching ${METADATA_URL(ref)} failed with HTTP ${response.status}`);
}
const territories = parseMetadata(await response.text());

const source = readFileSync(DATASET_PATH, "utf8");
const lines = source.split("\n");
const records = readDataset(lines);

// --- Preflight: anything surprising means the repo or upstream changed shape,
// --- and a human needs to look before 250 lines get rewritten.
const codes = records.map((r) => r.countryCode);
if (records.length !== 250) {
  fail(`expected 250 records, found ${records.length}`);
}
if (codes.some((c) => c === null)) {
  fail("a record's region line was not preceded by a countryCode line");
}
if (new Set(codes).size !== codes.length) {
  fail("duplicate countryCode values in the dataset");
}

const unexpectedlyMissing = codes.filter(
  (c) => !territories.has(c) && !EXPECTED_MISSING.has(c)
);
if (unexpectedlyMissing.length) {
  fail(
    `no libphonenumber territory for ${unexpectedlyMissing.join(", ")} — ` +
      "confirm the country really has no numbering plan, then add it to EXPECTED_MISSING"
  );
}
const staleExpectedMissing = [...EXPECTED_MISSING].filter((c) =>
  territories.has(c)
);
if (staleExpectedMissing.length) {
  fail(
    `libphonenumber now covers ${staleExpectedMissing.join(", ")} — ` +
      "remove them from EXPECTED_MISSING and from the test ledger"
  );
}
const unmapped = [...territories.keys()].filter((id) => !codes.includes(id));
if (unmapped.length) {
  fail(
    `libphonenumber territories absent from the dataset: ${unmapped.join(", ")} — ` +
      "add the country, or add the id to IGNORED_TERRITORIES with a justification"
  );
}

// --- Free audit: upstream also records the calling code, so a mismatch is a
// --- signal about the countryCallingCode column. Warn, never fail.
for (const record of records) {
  const upstream = territories.get(record.countryCode);
  if (upstream && upstream.callingCode !== record.callingCode) {
    console.warn(
      `warning: ${record.countryCode} dials +${record.callingCode} here but ` +
        `+${upstream.callingCode} upstream`
    );
  }
}

const derived = new Map(
  records.map((r) => [r.countryCode, territories.get(r.countryCode)?.lengths ?? []])
);

if (asJson) {
  console.log(JSON.stringify(Object.fromEntries(derived), null, 2));
  process.exit(0);
}

const changes = records.filter(
  (r) =>
    JSON.stringify(r.existing) !== JSON.stringify(derived.get(r.countryCode))
);

const populated = [...derived.values()].filter((l) => l.length).length;
console.log(`libphonenumber ${ref}`);
console.log(
  `${records.length} records — ${populated} populated, ${records.length - populated} empty`
);

for (const record of changes) {
  const before = record.existing ? `[${record.existing.join(", ")}]` : "(absent)";
  console.log(
    `  ${record.countryCode}: ${before} -> [${derived.get(record.countryCode).join(", ")}]`
  );
}

if (!changes.length) {
  console.log("in sync, 0 changes");
  process.exit(0);
}

if (!write) {
  console.log(`\n${changes.length} change(s). Re-run with --write to apply.`);
  process.exit(1);
}

// Apply back-to-front so earlier line indices stay valid.
const output = [...lines];
for (const record of [...records].reverse()) {
  const line = formatLine(derived.get(record.countryCode));
  if (record.replaces !== null) output[record.replaces] = line;
  else output.splice(record.anchor, 0, line);
}
writeFileSync(DATASET_PATH, output.join("\n"));
console.log(`\nwrote ${changes.length} change(s) to src/countriesData.ts`);
