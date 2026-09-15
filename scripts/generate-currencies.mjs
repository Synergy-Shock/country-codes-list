#!/usr/bin/env node
/**
 * Writes `currencyNumeric`, `currencyDecimals` and `currencySymbol` into
 * `src/countriesData.ts`, derived from each record's existing `currencyCode`.
 *
 *   node scripts/generate-currencies.mjs            # rewrite the dataset in place
 *   node scripts/generate-currencies.mjs --check    # dry run; exit 1 on drift
 *
 * Sources:
 *   - numeric code and minor units: the ISO 4217 maintenance agency's "List
 *     One" XML (SIX Group), fetched live. The `Pblshd` date is printed so a
 *     regeneration can be dated in its commit message.
 *   - symbols depend on the CLDR version bundled with the running Node; the
 *     CLDR version is printed too, so record both in the commit message when
 *     regenerating (a CLDR bump can legitimately change `--check` results).
 *   - symbol: CLDR via Node's built-in ICU, `Intl.NumberFormat("en", ...)`
 *     with `currencyDisplay: "narrowSymbol"`, falling back to `"symbol"` and
 *     finally to the code itself when CLDR has no symbol at all. Symbols are
 *     the English-locale ones and are deliberately not disambiguated ("$" for
 *     USD, CAD and AUD alike) — that is what "narrow" means in CLDR.
 *
 * `currencyCode` itself is never touched; records without one get `""`,
 * `null`, `""`.
 */

import { applyGenerated } from "./dataset.mjs";

const LIST_ONE_URL =
  "https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/lists/list-one.xml";

/** code -> { numeric, decimals } from every <CcyNtry> in List One. */
const parseListOne = (xml) => {
  const table = new Map();
  const field = (entry, tag) => entry.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))?.[1];
  for (const [, entry] of xml.matchAll(/<CcyNtry>([\s\S]*?)<\/CcyNtry>/g)) {
    const code = field(entry, "Ccy");
    if (!code) continue; // "No universal currency" rows (Antarctica, ...)
    const minor = field(entry, "CcyMnrUnts");
    const row = {
      numeric: field(entry, "CcyNbr"),
      decimals: minor === "N.A." ? null : Number(minor),
    };
    if (!/^\d{3}$/.test(row.numeric) || Number.isNaN(row.decimals)) {
      throw new Error(`${code}: unparseable List One row ${JSON.stringify(entry)}`);
    }
    const seen = table.get(code);
    if (seen && (seen.numeric !== row.numeric || seen.decimals !== row.decimals)) {
      throw new Error(`${code}: List One rows disagree on numeric/minor units`);
    }
    table.set(code, row);
  }
  return table;
};

const symbolFor = (code) => {
  const part = (currencyDisplay) =>
    new Intl.NumberFormat("en", { style: "currency", currency: code, currencyDisplay })
      .formatToParts(0)
      .find((p) => p.type === "currency").value;
  const narrow = part("narrowSymbol");
  return narrow !== code ? narrow : part("symbol");
};

const response = await fetch(LIST_ONE_URL);
if (!response.ok) {
  console.error(`error: fetching ${LIST_ONE_URL} failed with HTTP ${response.status}`);
  process.exit(1);
}
const xml = await response.text();
console.log(`ISO 4217 List One published ${xml.match(/Pblshd="([^"]*)"/)?.[1] ?? "?"}; symbols from CLDR ${process.versions.cldr} (Node ${process.versions.node})`);
const iso4217 = parseListOne(xml);

const currencyOf = (record) => {
  const code = JSON.parse(record.fields.get("currencyCode").value);
  if (code === "") return { numeric: "", decimals: null, symbol: "" };
  const row = iso4217.get(code);
  if (!row) throw new Error(`${record.countryCode}: ${code} is not in ISO 4217 List One`);
  return { ...row, symbol: symbolFor(code) };
};

applyGenerated([
  ["currencyNumeric", (record) => JSON.stringify(currencyOf(record).numeric)],
  ["currencyDecimals", (record) => JSON.stringify(currencyOf(record).decimals)],
  ["currencySymbol", (record) => JSON.stringify(currencyOf(record).symbol)],
]);
