# country-codes-list: guide for AI coding agents

`country-codes-list` is an npm package with one record per country (250 records): ISO codes, currency, official language, calling code, phone number lengths, tax identifier, region and flag. It has zero runtime dependencies and ships TypeScript types.

This file serves two readers: an agent that USES the package in a consumer project (read up to "Pair with"), and an agent that CONTRIBUTES to this repo (read "Contributor workflow").

```bash
npm install country-codes-list
```

```js
const countryCodes = require("country-codes-list");   // CommonJS
import * as countryCodes from "country-codes-list";    // through Node's CJS interop, no native ESM build
```

## API cheat sheet

| Export | Signature | Example |
| --- | --- | --- |
| `all()` | `(): CountryData[]` | `all().length // 250` |
| `filter(key, value)` | `(key: CountryScalarProperty, value: string): CountryData[]` | `filter("currencyCode", "XCG").map(c => c.countryCode) // ['CW', 'SX']` |
| `findOne(key, value)` | `(key: CountryScalarProperty, value: string): CountryData \| undefined` | `findOne("countryCodeAlpha3", "ARG").countryNameEn // 'Argentina'` |
| `findOneByCode(code)` | `(code: string): CountryData \| undefined` | `findOneByCode("UK").countryCode // 'GB'`, `findOneByCode("840").countryCode // 'US'` |
| `customList(key?, label?, opts?)` | `(key = "countryCode", label = "{countryNameEn} ({countryCode})", { filter? }): Record<string, string>` | `customList("countryCode", "{flag} {countryNameEn}")["US"] // '🇺🇸 United States of America'` |
| `customGroupedList(key?, label?, opts?)` | `(key = "countryCallingCode", label = same, { filter? }): Partial<Record<string, string[]>>` | `customGroupedList("countryCallingCode", "{countryCode}")["1"] // ['AG', 'AI', ..., 'UM'] (26)` |
| `customArray(fields?, opts?)` | `<F>(fields = { name, value }, { sortBy?: keyof F, sortDataBy?: CountryScalarProperty, filter? }): Record<keyof F, string>[]` | `customArray({ name: "{countryNameEn}", value: "{countryCode}" }, { sortBy: "name" })` |
| `utils.groupBy(array, key)` | `<T>(array: T[], key: keyof T): Record<string, T[]>` | `utils.groupBy(all(), "region")["Arab States"].length // 22` |

Types: `CountryData` (one record), `CountryProperty` (every key), `CountryScalarProperty` (string-valued keys only). All key parameters above take `CountryScalarProperty`.

Templates use `{placeholder}` syntax with any string or number field. Array fields and unknown names stay in the output as written.

## Field table

| Field | Type | Populated | Gotcha |
| --- | --- | --- | --- |
| `countryNameEn` | `string` | all | |
| `countryNameLocal` | `string` | all | |
| `countryCode` | `string` | all | ISO 3166-1 alpha-2. Unique. Never `UK` or `EL`. |
| `countryCodeAlpha3` | `string` | all | ISO 3166-1 alpha-3. Unique. |
| `countryCodeNumeric` | `string` | all but `XK` | Three digits with leading zeros (`"004"`). Generated. |
| `altCodes` | `string[]` optional | `GB` (`["UK"]`), `GR` (`["EL"]`) | Absent on other records. Search it with `findOneByCode`. |
| `currencyCode` | `string` | all but `AQ` | ISO 4217. |
| `currencyNameEn` | `string` | all but `AQ` | |
| `currencyNumeric` | `string` | all but `AQ` | Three digits. Generated. |
| `currencyDecimals` | `number \| null` | all but `AQ` (`null`) | `0` for JPY, `3` for BHD. Generated. |
| `currencySymbol` | `string` | all but `AQ` | Not unique: 29 currencies show `$`. Falls back to the code (`CHF`). Generated. |
| `tinType` | `string` | 62 of 250 | Empty string means "not recorded". |
| `tinName` | `string` | 64 of 250 | Empty string means "not recorded". |
| `officialLanguageCode` | `string` | all | ISO 639-1, or ISO 639-3 when no 639-1 code exists. First official language only. |
| `officialLanguageNameEn` | `string` | all | |
| `officialLanguageNameLocal` | `string` | all | |
| `countryCallingCode` | `string` | all | E.164 country code only. Digits, no `+`, no area code. Shared by many countries (`1`, `44`, `61`). |
| `areaCodes` | `string[]` | NANP members except `US` and `UM`, plus `CC`, `CX`, `SJ` | Empty means "not recorded", not "none". |
| `nationalNumberLengths` | `number[]` | all but `AQ`, `BV`, `GS`, `HM`, `PN`, `TF`, `UM` | A set, not a range. Fixed-line and mobile only. Generated. |
| `region` | `string` | all | Six ITU values: Africa, Arab States, Asia & Pacific, Europe, North America, South/Latin America. |
| `flag` | `string` | all | Emoji derived from `countryCode`. |

## Rules for correct use

- Use `findOneByCode` for codes from outside your code (locales, VAT numbers, APIs). It accepts alpha-2, alpha-3, `altCodes` and 3-digit numeric codes, case-insensitive.
- Use `findOne("countryCode", x)` only for exact, uppercase ISO codes. `findOne("countryCode", "UK")` is `undefined`.
- Use `includes`, never min/max, on `nationalNumberLengths`. NL is `[9, 11]`, so 10 digits is invalid.
- Strip the trunk prefix (the leading `0`) before you compare a length. Keep the area code.
- Treat an empty `areaCodes` or `nationalNumberLengths` as "not recorded", never as "none".
- Never use `currencySymbol` as a key or for lookup. Use `currencyCode`.
- Use `customList` only with a unique key (`countryCode`, `countryCodeAlpha3`). Use `customGroupedList` for shared keys (`countryCallingCode`, `currencyCode`, `region`, `officialLanguageCode`).
- Never pass `altCodes`, `areaCodes` or `nationalNumberLengths` as a key or `sortDataBy`. TypeScript rejects them.
- Do not rely on `all() === all()`. Each call returns a new array. Do not mutate the country objects inside it.
- Do not rely on dataset order. It is not alphabetical (33 records are appended at the end). Sort the result if order matters.
- Zero-pad numeric codes: `findOneByCode("004")` resolves, `findOneByCode("4")` does not.
- In `customArray`, `sortBy` names a key of YOUR template (`"name"`). `sortDataBy` names a dataset field (`"countryNameEn"`).
- Read the CSV numeric columns (`countryCodeNumeric`, `currencyNumeric`) as text to keep leading zeros.

## Recipes

Each snippet was run against `dist/`. Outputs are real.

```js
const countryCodes = require("country-codes-list");

// Is this national number a possible length for the country? (digit count only)
function hasPossibleLength(code, nationalNumber) {
  const country = countryCodes.findOneByCode(code);
  if (!country) return false;
  const digits = nationalNumber.replace(/\D/g, "").length;
  return country.nationalNumberLengths.includes(digits); // [] => false, not "unknown"
}
hasPossibleLength("GB", "2079460958"); // true
hasPossibleLength("AQ", "123"); // false, AQ has no recorded lengths

// Format money with the right minor units
const us = countryCodes.findOneByCode("US");
new Intl.NumberFormat("en", { style: "currency", currency: us.currencyCode }).format(1234.5);
// '$1,234.50'

// Dial prefix for a NANP member: calling code plus its first area code
const jm = countryCodes.findOneByCode("JM");
`+${jm.countryCallingCode}${jm.areaCodes[0]}`; // '+1876'

// Every country that uses the euro
countryCodes.customGroupedList("currencyCode", "{countryCode}")["EUR"].length; // 37

// <select> options with flags, sorted by label
countryCodes.customArray(
  { label: "{flag} {countryNameEn}", value: "{countryCode}" },
  { sortBy: "label" }
);
```

## Pair with

| Need | Package | Join on |
| --- | --- | --- |
| Translated country names | `i18n-iso-countries` | `countryCode` |
| Full phone number validation and formatting | `libphonenumber-js` | `countryCode` |

Do NOT expect from this package: timezones, subdivisions (states, provinces), translated names (only English and one local name), multiple official languages, historical or withdrawn codes (`AN`, `CS`, `YU` are absent), or phone validation beyond digit counts.

## Contributor workflow

### Repo layout

```
src/index.ts            public API
src/countriesData.ts    the dataset (250 records) and the CountryData type
src/utils/              groupBy, supplant (template rendering)
tests/                  jest, 8 suites, 204 tests
scripts/                data generators and the JSON/CSV exporter (dev only, not in the tarball)
dist/                   build output, gitignored, generated by `npm run build`
```

The npm tarball contains only `dist/` (`files: ["dist"]`). This file is not published.

### Commands

```bash
npm ci
npm run build   # tsc, then scripts/export-data.mjs writes dist/countries.json and dist/countries.csv
npm test        # jest; tests/exports.test.ts needs a build first
```

CI (`.github/workflows/ci.yml`) runs build and test on Node 22 and 24 for every PR and every push to `master`.

### Hand-maintained vs generated fields

| Kind | Fields | How to change |
| --- | --- | --- |
| Hand-maintained | `countryNameEn`, `countryNameLocal`, `countryCode`, `countryCodeAlpha3`, `altCodes`, `currencyCode`, `currencyNameEn`, `tinType`, `tinName`, `officialLanguage*`, `countryCallingCode`, `areaCodes`, `region`, `flag` | Edit `src/countriesData.ts` directly. |
| Generated | `countryCodeNumeric`, `currencyNumeric`, `currencyDecimals`, `currencySymbol`, `nationalNumberLengths` | Run the generator. Never edit by hand. |

Generated fields sit at the end of each record, after `flag`, in a fixed order (see `scripts/dataset.mjs`).

| Command | Fields | Source |
| --- | --- | --- |
| `npm run data:numeric` | `countryCodeNumeric` | ISO 3166-1 table embedded in `scripts/generate-numeric-codes.mjs`. |
| `npm run data:currencies` | `currencyNumeric`, `currencyDecimals`, `currencySymbol` | ISO 4217 List One XML from SIX Group (fetched live) and `Intl.NumberFormat` from Node's ICU. |
| `npm run data:number-lengths` | `nationalNumberLengths` | libphonenumber `PhoneNumberMetadata.xml`, pinned to a tag (`--ref=vX.Y.Z` to change it). |
| `npm run data:all` | all of the above | Runs the three in order. |

Rules for the generators:

- The currency and number-length generators need network access. No generator runs in CI.
- Each one rewrites only its own field lines in `src/countriesData.ts`. A second run produces no diff.
- `--check` is a dry run that exits with code 1 on drift.
- If you change `currencyCode` by hand, run `npm run data:currencies` afterwards so the derived fields follow.
- When you regenerate, record the source version (List One `Pblshd` date, CLDR version, libphonenumber tag) in the commit message. The scripts print these values.

### Invariant tests and the known-gaps ledger

`tests/dataset-invariants.test.ts` asserts properties of every record: unique codes, ISO 3166-1 completeness (249 codes plus `XK`), valid ISO 4217, valid ISO 639, E.164 limits, the six regions, flag derivation. Reference lists are inlined. No network at test time.

Each violated invariant has a `KNOWN_GAPS_*` constant that lists the violators with a reason. The test asserts the ledger is EXACTLY the set of violators. As a result:

- A new violator fails the test.
- A fixed record that is still in the ledger also fails the test.

Contract: when you fix a data gap, remove its ledger entry in the same change. The ledgers can only shrink. Current entries: `currencyCode`/`currencyNameEn` empty for `AQ`, `nationalNumberLengths` empty for seven territories, `DE` exceeds the E.164 length ceiling (`15` national digits). Do not add a ledger entry to make a test pass unless the gap is real and documented.

Other suites: `altCodes` admission policy, calling codes and NANP, `customGroupedList`, immutability of the shared dataset, withdrawn ISO codes, JSON/CSV exports.

### How to add or fix a dataset value

1. Find the record in `src/countriesData.ts` by `countryCode`.
2. If the field is hand-maintained, edit the line. Keep the field order.
3. If the field is generated, change its input (for example `currencyCode`) and run the generator.
4. Run `npm run build && npm test`.
5. If an invariant test fails because of a ledger entry, remove the entry.
6. In the PR body, give the source for the new value and a confidence level.

### Commit and PR conventions

- Write commit messages, PR titles and PR bodies in English.
- Do not add "Co-Authored-By" or "Generated with" lines.
- Do not bump the version in feature or fix PRs. Releases are separate.
- A release is a tag `vX.Y.Z` on `master`. `.github/workflows/publish.yml` builds, tests, publishes to npm through OIDC trusted publishing (no token), and creates the GitHub Release.
- Dependabot keeps `typescript` below 7 because `ts-jest` does not support it yet. Do not bump it by hand.
- Do not edit `README.md` examples without running them against `dist/` first.

### Do not

- Do not edit `dist/`. It is gitignored and rebuilt.
- Do not edit generated fields by hand.
- Do not reorder the dataset. Consumers may depend on the current order.
- Do not add runtime dependencies.
- Do not add `altCodes` that collide with a live ISO alpha-2 code or reuse a withdrawn code. The admission policy tests reject them.
