import { existsSync, readFileSync } from "fs";
import { join } from "path";
import * as countryCodes from "../src/index";

/**
 * `dist/countries.json` and `dist/countries.csv` are written by
 * `scripts/export-data.mjs` during `npm run build`, so this suite needs a
 * build first (CI runs `npm run build` before `npm test`).
 */
const dist = join(__dirname, "..", "dist");
const all = countryCodes.all();

describe("data exports", () => {
  test("dist/countries.json exists (run `npm run build` first)", () => {
    expect(existsSync(join(dist, "countries.json"))).toBe(true);
    expect(existsSync(join(dist, "countries.csv"))).toBe(true);
  });

  test("countries.json round-trips to all()", () => {
    const exported = JSON.parse(readFileSync(join(dist, "countries.json"), "utf8"));
    expect(exported).toEqual(all);
  });

  test("countries.csv has one row per country, every field in the header, and arrays joined with |", () => {
    const lines = readFileSync(join(dist, "countries.csv"), "utf8").trimEnd().split("\n");
    expect(lines.length).toBe(all.length + 1);

    const header = lines[0].split(",");
    const fields = new Set(all.flatMap((c) => Object.keys(c)));
    expect(new Set(header)).toEqual(fields);

    // Jamaica: two area codes, a comma-free record, so a naive split is exact.
    const jm = lines.find((line) => line.startsWith("Jamaica,"))!;
    const row = Object.fromEntries(header.map((key, i) => [key, jm.split(",")[i]]));
    expect(row.areaCodes).toBe("876|658");
    expect(row.countryCodeNumeric).toBe("388");
    expect(row.nationalNumberLengths).toBe("10");
  });

  test("countries.csv quotes cells containing commas", () => {
    const csv = readFileSync(join(dist, "countries.csv"), "utf8");
    // Andorra's language name has a comma, so it must be quoted.
    expect(csv).toContain('"Catalan, Valencian"');
  });
});
