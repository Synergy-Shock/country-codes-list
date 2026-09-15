# country-codes-list

A list of 250 countries with ISO codes, currencies, languages, phone codes and tax identifiers.

[![npm version](https://img.shields.io/npm/v/country-codes-list)](https://www.npmjs.com/package/country-codes-list)
[![CI](https://github.com/Synergy-Shock/country-codes-list/actions/workflows/ci.yml/badge.svg)](https://github.com/Synergy-Shock/country-codes-list/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/country-codes-list)](https://github.com/Synergy-Shock/country-codes-list/blob/master/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/country-codes-list)](https://www.npmjs.com/package/country-codes-list)

## Why this package

- One record per country. It includes data that other packages do not ship together: TIN/VAT identifiers, local-language names, alternative codes (`UK`, `EL`) and national phone number lengths.
- Zero runtime dependencies.
- TypeScript types for every record and every function.
- A test suite that checks dataset-wide invariants (unique codes, valid ISO 4217, ITU-T E.164 limits).
- The same data as JSON and CSV files, on npm and on a CDN.

## Install

```bash
npm install country-codes-list
```

The package is CommonJS with named exports. `import` works through Node's CommonJS interop. There is no native ESM build.

```js
const countryCodes = require("country-codes-list");
// or
import * as countryCodes from "country-codes-list";
import { findOneByCode } from "country-codes-list";
```

## Quick start

Look up a country by any code:

```js
const countryCodes = require("country-codes-list");

countryCodes.findOneByCode("UK").countryCode; // 'GB'
countryCodes.findOneByCode("840").countryNameEn; // 'United States of America'
```

Build the options of a `<select>` element:

```js
countryCodes.customArray(
  { name: "{countryNameEn}", value: "{countryCode}" },
  { sortBy: "name" }
);
// [{ name: 'Afghanistan', value: 'AF' }, { name: 'Åland Islands', value: 'AX' }, ...]
```

Group countries by calling code:

```js
countryCodes.customGroupedList("countryCallingCode", "{countryCode}")["1"];
// ['AG', 'AI', 'AS', 'BB', 'BM', 'CA', 'DM', 'GD', 'GU', 'JM', 'KN', 'LC',
//  'MS', 'PR', 'SX', 'TT', 'US', 'VC', 'VG', 'VI', 'DO', 'BS', 'KY', 'MP',
//  'TC', 'UM']
```

## Data fields

Each record is a `CountryData` object. The example column shows the `US` record.

| Field | Type | Example | Notes and source |
| --- | --- | --- | --- |
| `countryNameEn` | `string` | `"United States of America"` | English name. |
| `countryNameLocal` | `string` | `"United States of America"` | Name in the local language. |
| `countryCode` | `string` | `"US"` | [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2). Unique. |
| `countryCodeAlpha3` | `string` | `"USA"` | [ISO 3166-1 alpha-3](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3). Unique. |
| `countryCodeNumeric` | `string` | `"840"` | ISO 3166-1 numeric, three digits with leading zeros (`"004"` for AF). Empty only for `XK` (Kosovo). |
| `altCodes` | `string[]` (optional) | absent | Other 2-letter codes in use. Only `GB` (`["UK"]`) and `GR` (`["EL"]`) have it. Use `findOneByCode` to search it. |
| `currencyCode` | `string` | `"USD"` | [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217) code. Empty for `AQ` (Antarctica). |
| `currencyNameEn` | `string` | `"United States dollar"` | ISO 4217 English name. Empty for `AQ`. |
| `currencyNumeric` | `string` | `"840"` | ISO 4217 numeric, three digits. Empty for `AQ`. Source: [ISO 4217 List One](https://www.six-group.com/en/products-services/financial-information/data-standards.html). |
| `currencyDecimals` | `number \| null` | `2` | ISO 4217 minor units: `0` for JPY, `3` for BHD. `null` for `AQ`. Same source. |
| `currencySymbol` | `string` | `"$"` | CLDR English narrow symbol from Node's ICU. Not unique. Falls back to the code (`"CHF"`). Empty for `AQ`. |
| `tinType` | `string` | `"EIN"` | Short name of the tax identifier. Populated for 62 of 250 records. Source: [Wikipedia](https://en.wikipedia.org/wiki/VAT_identification_number). |
| `tinName` | `string` | `"Tax Identification Number"` | Full name of the tax identifier. Populated for 64 of 250 records. Same source. |
| `officialLanguageCode` | `string` | `"en"` | ISO 639-1 code of the first official language. ISO 639-3 when the language has no 639-1 code. Source: [OSM Nominatim](https://wiki.openstreetmap.org/wiki/Nominatim/Country_Codes). |
| `officialLanguageNameEn` | `string` | `"English"` | English name of that language. |
| `officialLanguageNameLocal` | `string` | `"English"` | Name of that language in the language itself. |
| `countryCallingCode` | `string` | `"1"` | ITU-T E.164 country code, 1 to 3 digits, no `+`. Source: [Wikipedia](https://en.wikipedia.org/wiki/List_of_country_calling_codes). |
| `areaCodes` | `string[]` | `[]` | National area codes after the calling code. Populated for [NANP](https://en.wikipedia.org/wiki/North_American_Numbering_Plan) members (not US or UM), plus `CC`, `CX` and `SJ`. An empty array means "not recorded". |
| `nationalNumberLengths` | `number[]` | `[10]` | Possible digit counts of the national number, sorted. Empty for `AQ`, `BV`, `GS`, `HM`, `PN`, `TF`, `UM`. Source: [libphonenumber](https://github.com/google/libphonenumber) (fixed-line and mobile only). |
| `region` | `string` | `"North America"` | One of six [ITU regions](https://www.itu.int/en/ITU-D/Statistics/Pages/definitions/regions.aspx). |
| `flag` | `string` | `"🇺🇸"` | Flag emoji, derived from `countryCode`. |

## Things to know

**`nationalNumberLengths` is a set, not a range.** Numbering plans have holes. The Netherlands is `[9, 11]`, so a 10-digit Dutch number is not valid. Use `includes`, never a min/max comparison.

```js
const nl = countryCodes.findOneByCode("NL").nationalNumberLengths; // [9, 11]
nl.includes(10); // false, correct
10 >= Math.min(...nl) && 10 <= Math.max(...nl); // true, wrong
```

**The area code is counted, the trunk prefix is not.** The British number `020 7946 0958` has a national number of `2079460958`. That is 10 digits, area code included. Remove the leading `0` before you compare.

```js
countryCodes.findOneByCode("GB").nationalNumberLengths.includes("2079460958".length); // true
```

**`currencySymbol` is not unique.** 29 currencies show `"$"` (USD, CAD, AUD, MXN and more). `"£"`, `"kr"`, `"¥"` and `"₩"` are also shared. Do not use the symbol as a key.

**`customList` keys must be unique.** `countryCode` and `countryCodeAlpha3` are unique. `countryCallingCode`, `currencyCode`, `region` and `officialLanguageCode` are not. With a shared key, only the last country survives. Use `customGroupedList` for shared keys.

**Array fields are not keys or placeholders.** `altCodes`, `areaCodes` and `nationalNumberLengths` are arrays. `filter`, `findOne`, `customList`, `customGroupedList` and `sortDataBy` reject them (a TypeScript error). A placeholder such as `{areaCodes}` stays in the output as written.

**`all()` returns a new array on each call.** `all() === all()` is `false`. You can sort or change the returned array without effect on the dataset. The country objects inside are shared. Treat them as read-only.

**Dataset order is not alphabetical.** Most records are sorted by `countryCode`. 33 records (`SZ`, `MK`, `PH`, `NL`, `AE`, ..., `XK`) come at the end, and `KI`, `KN` come after `KR`. If you need a specific order, sort the result.

**`findOneByCode` validates before it uppercases.** Input must be 2 or 3 ASCII letters, or 3 ASCII digits, after trim. All other input returns `undefined`. Unicode case mapping (`"ß"` to `"SS"`) cannot make a valid code from invalid input.

**`UK` and `EL` are not ISO codes.** `findOneByCode("UK")` returns the United Kingdom, but `countryCode` stays `"GB"`. `findOne("countryCode", "UK")` returns `undefined`.

**`region` has six values.** `Africa`, `Arab States`, `Asia & Pacific`, `Europe`, `North America` and `South/Latin America`. These are the ITU classes.

## API reference

All examples use `const countryCodes = require("country-codes-list");`.

### `all()`

```ts
all(): CountryData[]
```

Returns every country in dataset order, as a new array.

```js
countryCodes.all().length; // 250
countryCodes.all()[0].countryNameEn; // 'Andorra'
```

### `filter(key, value)`

```ts
filter(key: CountryScalarProperty, value: string): CountryData[]
```

Returns every country where `key` equals `value` exactly.

```js
countryCodes.filter("currencyCode", "XCG").map((c) => c.countryCode);
// ['CW', 'SX']
```

### `findOne(key, value)`

```ts
findOne(key: CountryScalarProperty, value: string): CountryData | undefined
```

Returns the first country where `key` equals `value` exactly. The comparison is case-sensitive and ignores `altCodes`.

```js
countryCodes.findOne("countryCodeAlpha3", "ARG").countryNameEn; // 'Argentina'
countryCodes.findOne("countryCode", "ZZ"); // undefined
```

### `findOneByCode(code)`

```ts
findOneByCode(code: string): CountryData | undefined
```

Resolves an alpha-2, alpha-3, alternative or numeric code to a country. The match is case-insensitive and ignores surrounding spaces. Official codes win over alternative codes. Use it for codes from a browser locale, a VAT number or an external API.

```js
countryCodes.findOneByCode("UK").countryCode; // 'GB'
countryCodes.findOneByCode("gbr").countryCode; // 'GB'
countryCodes.findOneByCode("EL").countryCode; // 'GR'
countryCodes.findOneByCode("004").countryCode; // 'AF'
countryCodes.findOneByCode("4"); // undefined, numeric codes need three digits
countryCodes.findOneByCode("ZZ"); // undefined
```

### `customList(key?, label?, options?)`

```ts
customList(
  key?: CountryScalarProperty,   // default "countryCode"
  label?: string,                // default "{countryNameEn} ({countryCode})"
  options?: { filter?: (country: CountryData) => boolean }
): Record<string, string>
```

Returns an object with one entry per country. `key` selects the property that becomes the object key. `label` is a template. Each `{placeholder}` is replaced with the value of that property. Unknown placeholders and array fields stay as written.

```js
countryCodes.customList("countryCode", "[{countryCode}] {countryNameEn}: +{countryCallingCode}");
// {
//   AD: '[AD] Andorra: +376',
//   AF: '[AF] Afghanistan: +93',
//   AG: '[AG] Antigua and Barbuda: +1',
//   ...
// }
```

### `customGroupedList(key?, label?, options?)`

```ts
customGroupedList(
  key?: CountryScalarProperty,   // default "countryCallingCode"
  label?: string,                // default "{countryNameEn} ({countryCode})"
  options?: { filter?: (country: CountryData) => boolean }
): Partial<Record<string, string[]>>
```

Same as `customList`, but each key maps to an array of all matching countries. Groups keep dataset order. A key that no country matched is absent, so the type is `Partial`.

```js
countryCodes.customGroupedList("region", "{countryNameEn}", {
  filter: (country) => country.currencyCode === "EUR",
});
// { Europe: ['Andorra', 'Austria', 'Åland Islands', 'Belgium', ...], 'South/Latin America': [...], ... }

const onlyAR = countryCodes.customGroupedList("region", "{countryCode}", {
  filter: (country) => country.countryCode === "AR",
});
onlyAR["Europe"]; // undefined
onlyAR["Europe"]?.length ?? 0; // 0
```

### `customArray(fields?, options?)`

```ts
customArray<F extends Record<string, string>>(
  fields?: F,   // default { name: "{countryNameEn} ({countryCode})", value: "{countryCode}" }
  options?: {
    sortBy?: keyof F;                             // a key of YOUR template
    sortDataBy?: CountryScalarProperty;           // a dataset property
    filter?: (country: CountryData) => boolean;
  }
): Record<keyof F, string>[]
```

Returns one object per country, shaped like `fields`. Each value is a template with `{placeholder}` syntax.

| Option | Applies to | Effect |
| --- | --- | --- |
| `filter` | dataset | Keeps only the countries that return `true`. Runs first. |
| `sortDataBy` | dataset property (`"countryNameEn"`) | Sorts the countries before rendering. |
| `sortBy` | key of your template (`"name"`) | Sorts the output after rendering. |

Both sorts use `Intl.Collator` with accent sensitivity.

```js
countryCodes.customArray(
  { label: "{flag} {countryNameEn}", value: "{countryCode}" },
  { filter: (c) => c.region === "North America", sortBy: "label" }
);
// [
//   { label: '🇧🇲 Bermuda', value: 'BM' },
//   { label: '🇨🇦 Canada', value: 'CA' },
//   { label: '🇵🇲 Saint Pierre and Miquelon', value: 'PM' },
//   { label: '🇺🇸 United States of America', value: 'US' }
// ]
```

### `utils.groupBy(array, key)`

```ts
utils.groupBy<T>(array: T[], key: keyof T): Record<string, T[]>
```

Groups any array of objects by one key. `customGroupedList` uses it internally.

```js
countryCodes.utils.groupBy(countryCodes.all(), "region")["Arab States"].length; // 22
```

### Types

```ts
import type { CountryData, CountryProperty, CountryScalarProperty } from "country-codes-list";
```

| Type | Meaning |
| --- | --- |
| `CountryData` | One record. See [Data fields](#data-fields). |
| `CountryProperty` | Every key of `CountryData`, arrays and `currencyDecimals` included. |
| `CountryScalarProperty` | Only the string-valued keys. `filter`, `findOne`, `customList`, `customGroupedList` and `sortDataBy` accept this type. |

```ts
const key: CountryScalarProperty = "currencyCode";
const pick = (country: CountryData) => country[key];
```

## Data exports

The package also ships the dataset as files, for spreadsheets, Python, SQL or a web page:

| File | Content |
| --- | --- |
| `dist/countries.json` | The array that `all()` returns, pretty-printed. |
| `dist/countries.csv` | One row per country. The header lists every field. |

Both files are on jsDelivr, pinned to the major version:

```
https://cdn.jsdelivr.net/npm/country-codes-list@3/dist/countries.json
https://cdn.jsdelivr.net/npm/country-codes-list@3/dist/countries.csv
```

```js
const countries = await fetch(
  "https://cdn.jsdelivr.net/npm/country-codes-list@3/dist/countries.json"
).then((r) => r.json());
```

CSV format notes:

- UTF-8 without a BOM. Import the file as UTF-8.
- Rows end with LF. Cells are quoted per RFC 4180.
- Array fields (`altCodes`, `areaCodes`, `nationalNumberLengths`) are joined with `|`. `null` is an empty cell.
- `countryCodeNumeric` and `currencyNumeric` keep their leading zeros. Read these columns as text, or `"004"` becomes `4`.

## Contributing

Build and test:

```bash
npm ci
npm run build   # tsc, then writes dist/countries.json and dist/countries.csv
npm test        # jest, 8 suites
```

CI runs the same steps on Node 22 and 24. Write PR titles and bodies in English.

### Generated fields

Five fields are written by scripts, not by hand. Do not edit them manually. The scripts need network access and do not run in CI.

| Command | Fields | Source |
| --- | --- | --- |
| `npm run data:numeric` | `countryCodeNumeric` | ISO 3166-1 table embedded in the script. |
| `npm run data:currencies` | `currencyNumeric`, `currencyDecimals`, `currencySymbol` | ISO 4217 List One XML (SIX Group) and Node's ICU. |
| `npm run data:number-lengths` | `nationalNumberLengths` | libphonenumber `PhoneNumberMetadata.xml`, pinned to a tag. |
| `npm run data:all` | All of the above | Runs the three scripts in order. |

Each script replaces only its own field in `src/countriesData.ts`. A second run makes no change. Add `--check` for a dry run that exits with code 1 on drift.

### Invariant tests and the known-gaps ledger

`tests/dataset-invariants.test.ts` asserts rules for every record: unique codes, valid ISO 4217, valid ISO 639, E.164 limits, the six regions. Some rules have known exceptions. Each exception is listed in a `KNOWN_GAPS_*` constant with a reason.

The test asserts that the ledger is exactly the set of violators. If you fix a data gap, remove its ledger entry in the same PR. If you do not, the test fails.

## Migration

### v2.x to v3.0

| Change | Before (v2) | After (v3) |
| --- | --- | --- |
| `countryCallingCode` holds the E.164 code only. | `JM` was `'876'`. | `JM` is `'1'`, and `areaCodes` is `['876', '658']`. |
| `areaCodes` is a required `string[]`. | Optional `any[]`. | Always present. Empty means "not recorded". |
| Key parameters accept `CountryScalarProperty` only. | `customList("altCodes", ...)` compiled. | TypeScript error. Use `findOneByCode("UK")` for alternative codes. |

To dial a full number, join the calling code and an area code: `` `+${cc}${areaCodes[0]}` ``.

### v1.x to v2.0

| Change | Before (v1) | After (v2) |
| --- | --- | --- |
| `CountryProperty` is a type, not an enum. | `CountryProperty.countryCode` | `"countryCode"`, with `import type`. |
| Named CommonJS exports. | `require("country-codes-list")` | Same, or `import * as countryCodes` through interop. |
| Property keys are type-checked. | `filter("invalidKey", "x")` compiled. | TypeScript error. |
