#!/usr/bin/env node
/**
 * Emits the dataset as `dist/countries.json` and `dist/countries.csv`, for
 * consumers that are not JavaScript (spreadsheets, Python, SQL loaders, a CDN
 * URL). Runs after `tsc` as part of `npm run build`, so both files ship in the
 * package next to `dist/index.js`.
 *
 * CSV: header row of every field; array fields joined with `|`; `null` as an
 * empty cell; RFC 4180 quoting (double quotes around any cell containing a
 * quote, comma or line break, with embedded quotes doubled).
 */

import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const dist = new URL("../dist/", import.meta.url);
const countries = require("../dist/countriesData.js").default;

writeFileSync(new URL("countries.json", dist), JSON.stringify(countries, null, 2) + "\n");

// Union of every record's keys, each new key placed right after the key that
// precedes it in its own record — so the optional `altCodes` lands after
// `countryCodeAlpha3` like in the type, not at the end of the header.
const header = [];
for (const record of countries) {
  const keys = Object.keys(record);
  keys.forEach((key, i) => {
    if (header.includes(key)) return;
    header.splice(i === 0 ? 0 : header.indexOf(keys[i - 1]) + 1, 0, key);
  });
}

const cell = (value) => {
  const text = Array.isArray(value) ? value.join("|") : value === null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const rows = [header, ...countries.map((record) => header.map((key) => cell(record[key] ?? "")))];
writeFileSync(new URL("countries.csv", dist), rows.map((row) => row.join(",")).join("\n") + "\n");

console.log(`exported ${countries.length} countries to dist/countries.json and dist/countries.csv`);
