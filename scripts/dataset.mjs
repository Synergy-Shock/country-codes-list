/**
 * Shared plumbing for the `scripts/generate-*.mjs` data generators.
 *
 * Every generator derives one or more fields from an external source and
 * writes them into `src/countriesData.ts` as a targeted text transform: the
 * file is walked line by line, only the generated field's line is replaced or
 * inserted, and every other byte is left exactly as it was. That keeps the
 * generators idempotent (a second run is a no-op) and keeps hand edits to the
 * other fields from ever being reformatted or reordered.
 *
 * Generated fields always sit at the end of a record, after `flag`, in
 * `GENERATED_FIELD_ORDER` — regardless of which generator ran first.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const DATASET_PATH = fileURLToPath(
  new URL("../src/countriesData.ts", import.meta.url)
);

/** Canonical order of the script-generated fields at the end of a record. */
export const GENERATED_FIELD_ORDER = [
  "countryCodeNumeric",
  "currencyNumeric",
  "currencyDecimals",
  "currencySymbol",
  "nationalNumberLengths",
];

const RECORD_OPEN = /^ {2}\{$/;
const RECORD_CLOSE = /^ {2}\},$/;
// First line of any top-level field. Wrapped values (`countryNameLocal:` on
// its own line, Canada's multi-line `areaCodes`) still match on this line.
const FIELD_LINE = /^ {4}([A-Za-z0-9_]+):(?: (.*?),?)?$/;

/**
 * Splits the dataset into records. Each record knows its line range and, for
 * every top-level field, the index of the field's first line plus the value
 * text on that line (`undefined` when the value is wrapped onto later lines).
 */
export function readRecords(lines) {
  const records = [];
  let current = null;
  lines.forEach((line, index) => {
    if (RECORD_OPEN.test(line)) {
      if (current) {
        throw new Error(`line ${index + 1}: record opened inside a record`);
      }
      current = { start: index, fields: new Map() };
      return;
    }
    if (!current) return;
    if (RECORD_CLOSE.test(line)) {
      current.end = index;
      const code = current.fields.get("countryCode")?.value;
      current.countryCode = code ? JSON.parse(code) : null;
      if (!current.countryCode) {
        throw new Error(`record ending at line ${index + 1} has no countryCode`);
      }
      records.push(current);
      current = null;
      return;
    }
    const field = line.match(FIELD_LINE);
    if (field && !current.fields.has(field[1])) {
      current.fields.set(field[1], { index, value: field[2] });
    }
  });
  if (current) throw new Error("unterminated record at end of file");
  return records;
}

/**
 * Returns `source` with `field` set on every record to the TypeScript literal
 * returned by `valueFor(record)`, plus the list of records whose value changed.
 * Existing lines are replaced in place; missing ones are inserted at the
 * field's canonical position. Nothing else in the file moves.
 */
export function upsertField(source, field, valueFor) {
  const order = GENERATED_FIELD_ORDER.indexOf(field);
  if (order === -1) throw new Error(`${field} is not a generated field`);

  const lines = source.split("\n");
  const records = readRecords(lines);
  const changes = [];
  const edits = [];

  for (const record of records) {
    const line = `    ${field}: ${valueFor(record)},`;
    const existing = record.fields.get(field);
    if (existing) {
      if (lines[existing.index] === line) continue;
      changes.push({
        countryCode: record.countryCode,
        before: existing.value,
        after: line,
      });
      edits.push({ index: existing.index, replace: true, line });
      continue;
    }
    // Insert before the first later generated field, else before the closing brace.
    const later = GENERATED_FIELD_ORDER.slice(order + 1)
      .map((name) => record.fields.get(name)?.index)
      .filter((index) => index !== undefined);
    const at = later.length ? Math.min(...later) : record.end;
    changes.push({ countryCode: record.countryCode, before: null, after: line });
    edits.push({ index: at, replace: false, line });
  }

  // Apply back-to-front so earlier indices stay valid.
  for (const edit of edits.sort((a, b) => b.index - a.index)) {
    lines.splice(edit.index, edit.replace ? 1 : 0, edit.line);
  }
  return { source: lines.join("\n"), records, changes };
}

/**
 * Standard generator entry point: applies every `[field, valueFor]` pair,
 * prints the drift, and writes the dataset. With `--check` it writes nothing
 * and exits 1 when anything would change, so it doubles as a re-sync check.
 */
export function applyGenerated(fields, { argv = process.argv.slice(2) } = {}) {
  const check = argv.includes("--check");
  const original = readFileSync(DATASET_PATH, "utf8");
  let source = original;
  let total = 0;

  for (const [field, valueFor] of fields) {
    const result = upsertField(source, field, valueFor);
    source = result.source;
    total += result.changes.length;
    for (const change of result.changes) {
      const before = change.before === null ? "(absent)" : change.before;
      console.log(
        `  ${change.countryCode}.${field}: ${before} -> ${change.after.trim()}`
      );
    }
  }

  if (source === original) {
    console.log("in sync, 0 changes");
    return;
  }
  if (check) {
    console.log(`\n${total} change(s). Re-run without --check to apply.`);
    process.exit(1);
  }
  writeFileSync(DATASET_PATH, source);
  console.log(`\nwrote ${total} change(s) to src/countriesData.ts`);
}
