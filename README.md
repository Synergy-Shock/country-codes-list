# country-codes-list

Country data for forms, phone inputs and invoices: ISO codes, currency with minor units, calling code, phone number lengths, tax ID name and flag for 250 countries, in one record per country.

[![npm version](https://img.shields.io/npm/v/country-codes-list)](https://www.npmjs.com/package/country-codes-list)
[![npm downloads](https://img.shields.io/npm/dm/country-codes-list)](https://www.npmjs.com/package/country-codes-list)
[![bundle size](https://img.shields.io/bundlejs/size/country-codes-list)](https://bundlejs.com/?q=country-codes-list)
[![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](https://github.com/Synergy-Shock/country-codes-list/blob/master/package.json)
[![types](https://img.shields.io/npm/types/country-codes-list)](https://github.com/Synergy-Shock/country-codes-list/blob/master/src/index.ts)
[![CI](https://github.com/Synergy-Shock/country-codes-list/actions/workflows/ci.yml/badge.svg)](https://github.com/Synergy-Shock/country-codes-list/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/country-codes-list)](https://github.com/Synergy-Shock/country-codes-list/blob/master/LICENSE)

<!-- PLAYGROUND LINK (placeholder): the page is not live yet (404). When GitHub Pages serves it, move the line below out of this comment. If Pages is not enabled, delete this whole comment.
**Playground:** [synergy-shock.github.io/country-codes-list](https://synergy-shock.github.io/country-codes-list/) (search and filter the dataset in the browser)
-->

```bash
npm install country-codes-list
```

```js
const { findOneByCode } = require("country-codes-list");

findOneByCode("UK").countryCode; // 'GB' (also 'gbr', '826', 'gb')
findOneByCode("NL").nationalNumberLengths; // [9, 11] digits after +31
findOneByCode("JP").currencyDecimals; // 0, so ¥1234 has no cents
findOneByCode("DE").tinType; // 'USt-IdNr.'
findOneByCode("AR").flag; // '🇦🇷'
```

## What's inside

Each of the 250 records has these fields. See [Data fields](#data-fields) for types, sources and gaps.

| Group | Fields |
| --- | --- |
| Codes | `countryCode` (alpha-2), `countryCodeAlpha3`, `countryCodeNumeric`, `altCodes` (`UK`, `EL`) |
| Names | `countryNameEn`, `countryNameLocal` |
| Currency | `currencyCode`, `currencyNameEn`, `currencyNumeric`, `currencyDecimals`, `currencySymbol` |
| Phone | `countryCallingCode`, `areaCodes`, `nationalNumberLengths` |
| Tax | `tinType`, `tinName` (64 countries) |
| Language | `officialLanguageCode`, `officialLanguageNameEn`, `officialLanguageNameLocal` (first official language) |
| Other | `region` (6 ITU-based values), `flag` (emoji) |

## Compared with other packages

Checked on 2026-10-16 against the latest npm versions. Size is the browser entry bundled with esbuild, minified and gzipped.

| | country-codes-list 3.2 | [countries-list](https://www.npmjs.com/package/countries-list) 3.4 | [i18n-iso-countries](https://www.npmjs.com/package/i18n-iso-countries) 7.14 | [world-countries](https://www.npmjs.com/package/world-countries) 5.1 | [libphonenumber-js](https://www.npmjs.com/package/libphonenumber-js) 1.13 |
| --- | --- | --- | --- | --- | --- |
| Records | 250 | 252 (adds `AC`, `TA`) | 250 | 250 | 245 phone regions |
| Alpha-2, alpha-3 | yes | yes | yes | yes | alpha-2 only |
| ISO numeric country code | yes | no | yes | yes | no |
| Country names | English and one local name | English and native | 78 languages | English, native, 23 translations | no |
| Currency | code, name, numeric, decimals, symbol | codes; details through an opt-in import | no | code, name, symbol | no |
| Calling code | yes | yes | no | yes | yes |
| Phone number check | digit counts only | no | no | no | full parse, validation, formatting |
| Tax ID name (VAT, EIN, CUIT) | 64 countries | no | no | no | no |
| Languages | first official language | several per country, ISO 639-1 | no | several per country, with names | no |
| Capital, borders, TLD, coordinates | no | capital only | no | yes | no |
| Flag emoji | field | `getEmojiFlag()` | no | field | no |
| ESM build | no (CommonJS, works with `import`) | yes | no | yes | yes |
| TypeScript types | yes | yes | yes | yes | yes |
| Runtime dependencies | 0 | 0 | 1 | 0 | 0 |
| Min + gzip | 19 KB | 15 KB | 7 KB, plus about 2.5 KB per registered locale (the Node entry loads all 78) | 124 KB | 51 KB |
| License | MIT | MIT | MIT | ODbL 1.0 | MIT |

Use another package instead if you need:

- **Country names in many languages:** `i18n-iso-countries`, or `Intl.DisplayNames` (see [Translated country names](#translated-country-names)).
- **Real phone number validation or formatting:** `libphonenumber-js`. This package only checks the digit count.
- **Capitals, borders, coordinates, area or several languages per country:** `world-countries` (note its ODbL license).
- **A native ESM build or the smallest bundle with names, capitals and languages:** `countries-list`.

These packages join well with this one on `countryCode`.

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
| `tinType` | `string` | `"EIN"` | Short name of the tax identifier. Populated for 63 of 250 records. Source: [Wikipedia](https://en.wikipedia.org/wiki/VAT_identification_number). |
| `tinName` | `string` | `"Tax Identification Number"` | Full name of the tax identifier. Populated for 65 of 250 records. Same source. |
| `officialLanguageCode` | `string` | `"en"` | ISO 639-1 code of the first official language. ISO 639-3 when the language has no 639-1 code. Source: [OSM Nominatim](https://wiki.openstreetmap.org/wiki/Nominatim/Country_Codes). |
| `officialLanguageNameEn` | `string` | `"English"` | English name of that language. |
| `officialLanguageNameLocal` | `string` | `"English"` | Name of that language in the language itself. |
| `countryCallingCode` | `string` | `"1"` | ITU-T E.164 country code, 1 to 3 digits, no `+`. Source: [Wikipedia](https://en.wikipedia.org/wiki/List_of_country_calling_codes). |
| `areaCodes` | `string[]` | `[]` | National area codes after the calling code. Populated for [NANP](https://en.wikipedia.org/wiki/North_American_Numbering_Plan) members (not US or UM), plus `CC`, `CX` and `SJ`. An empty array means "not recorded". |
| `nationalNumberLengths` | `number[]` | `[10]` | Possible digit counts of the national number, sorted. Empty for `AQ`, `BV`, `GS`, `HM`, `PN`, `TF`, `UM`. Source: [libphonenumber](https://github.com/google/libphonenumber) (fixed-line and mobile only). |
| `region` | `string` | `"North America"` | One of six values adapted from the [ITU regions](https://www.itu.int/en/ITU-D/Statistics/Pages/definitions/regions.aspx). |
| `flag` | `string` | `"🇺🇸"` | Flag emoji, derived from `countryCode`. |

## Things to know

**`nationalNumberLengths` is a set, not a range.** Numbering plans have holes. The Netherlands is `[9, 11]`, so a 10-digit Dutch number is not valid. Use `includes`, never a min/max comparison.

```js
const nl = countryCodes.findOneByCode("NL").nationalNumberLengths; // [9, 11]
nl.includes(10); // false, correct
10 >= Math.min(...nl) && 10 <= Math.max(...nl); // true, wrong
```

**The area code is counted, the trunk prefix is not.** The British number `020 7946 0958` has a national number of `2079460958`. That is 10 digits, area code included. Remove the leading `0` before you compare. Exception: in Italy (`IT`), San Marino (`SM`) and Vatican City (`VA`) the leading `0` of a fixed-line number is part of the national number. Keep it there.

```js
countryCodes.findOneByCode("GB").nationalNumberLengths.includes("2079460958".length); // true
countryCodes.findOneByCode("IT").nationalNumberLengths.includes("0612345678".length); // true, the 0 counts
```

**`currencySymbol` is not unique.** 29 currencies show `"$"` (USD, CAD, AUD, MXN and more). `"£"`, `"kr"`, `"¥"` and `"₩"` are also shared. Do not use the symbol as a key.

**`customList` keys must be unique.** `countryCode` and `countryCodeAlpha3` are unique. `countryCallingCode`, `currencyCode`, `region` and `officialLanguageCode` are not. With a shared key, only the last country survives. Use `customGroupedList` for shared keys.

**Object key order follows JavaScript rules.** `customList` and `customGroupedList` return plain objects. Integer-like keys, such as calling codes, come first in ascending numeric order (`"1"`, `"7"`, `"20"`, ...). Other keys keep insertion order. Sort `Object.keys()` yourself if you need another order.

**Array fields are not keys or placeholders.** `altCodes`, `areaCodes` and `nationalNumberLengths` are arrays. `filter`, `findOne`, `customList`, `customGroupedList` and `sortDataBy` reject them (a TypeScript error). A placeholder such as `{areaCodes}` stays in the output as written.

**`all()` returns a new array on each call.** `all() === all()` is `false`. You can sort or change the returned array without effect on the dataset. The country objects inside are shared. Treat them as read-only.

**Dataset order is not alphabetical.** Most records are sorted by `countryCode`. 33 records (`SZ`, `MK`, `PH`, `NL`, `AE`, ..., `XK`) come at the end, and `KI`, `KN` come after `KR`. If you need a specific order, sort the result.

**`findOneByCode` validates before it uppercases.** Input must be 2 or 3 ASCII letters, or 3 ASCII digits, after trim. All other input returns `undefined`. Unicode case mapping (`"ß"` to `"SS"`) cannot make a valid code from invalid input.

**`UK` and `EL` are not ISO codes.** `findOneByCode("UK")` returns the United Kingdom, but `countryCode` stays `"GB"`. `findOne("countryCode", "UK")` returns `undefined`.

**`region` has six values.** `Africa`, `Arab States`, `Asia & Pacific`, `Europe`, `North America` and `South/Latin America`. They follow the ITU classification, with two changes: ITU's "The Americas" is split in two, and ITU's "CIS" countries are placed in `Europe` or `Asia & Pacific`.

## Translated country names

The dataset has an English name and one local name. For other languages, use the `Intl` API that is built into Node and browsers. It needs no extra data.

```js
const names = new Intl.DisplayNames(["es"], { type: "region" });
const collator = new Intl.Collator("es");

countryCodes
  .all()
  .map((c) => ({ label: names.of(c.countryCode), value: c.countryCode }))
  .sort((a, b) => collator.compare(a.label, b.label))
  .slice(0, 3);
// [{ label: 'Afganistán', value: 'AF' }, { label: 'Albania', value: 'AL' }, { label: 'Alemania', value: 'DE' }]
```

The names come from the CLDR data of the runtime, so they can differ between Node versions and browsers. In Node 24 (CLDR 48), all 250 codes have a name in `es`, `de`, `ja`, `ar` and `pt-BR`, `XK` (`'Kosovo'`) included. A locale with little CLDR data, such as `haw`, returns the code itself for most countries. An unsupported locale falls back to the default locale. Pass `{ type: "region", fallback: "none" }` to get `undefined` instead of the code.

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

### `findByPhonePrefix(input)`

```ts
findByPhonePrefix(input: string): CountryData[]
```

Returns the countries a dialled number can belong to, from its leading digits. Non-digits are ignored and a leading `00` is dropped, so `+1 876 ...`, `001876...` and `1 (876) ...` read the same. The digits must start with the calling code, so pass international numbers only. A domestic number is read as if it began with a calling code (`2125550100` is read as `+212` and returns EH and MA). Numbers that start with `0` (national trunk prefix, or the `011` exit code) return `[]`.

Countries that share the calling code are narrowed by `areaCodes`:

- A recorded area code that matches the next digits wins (`+1 876` is Jamaica).
- If the next digits can still become a recorded area code (`+1`, `+1 8`), the result is every country with that calling code.
- Otherwise the result is the countries with no recorded area codes (`+1 212` is US and UM). If every country in the group records area codes, the result is the whole group (`+599 5` is BQ and CW).

Groups with no area codes are not narrowed: `+44` returns all four. `CX` and `CC` record area code `8`, which Western Australia also uses, so `+61 8` returns `CX` and `CC`. The function checks prefixes only. It does not validate the number. Results keep dataset order.

```js
countryCodes.findByPhonePrefix("+1 876 555 0100").map((c) => c.countryCode); // ['JM']
countryCodes.findByPhonePrefix("+1 (212) 555-0100").map((c) => c.countryCode); // ['US', 'UM']
countryCodes.findByPhonePrefix("+44 20 7946 0958").map((c) => c.countryCode); // ['GG', 'IM', 'JE', 'GB']
countryCodes.findByPhonePrefix("0059 99 123").map((c) => c.countryCode); // ['CW']
countryCodes.findByPhonePrefix("not a number"); // []
```

### `customList(key?, label?, options?)`

```ts
customList(
  key?: CountryScalarProperty,   // default "countryCode"
  label?: string,                // default "{countryNameEn} ({countryCode})"
  options?: { filter?: (country: CountryData) => boolean }
): Record<string, string>
```

Returns an object with one entry per country. `key` selects the property that becomes the object key. `label` is a template. Each `{placeholder}` is replaced with the value of that property. Unknown placeholders and array fields stay as written. A `null` value (`currencyDecimals` for `AQ`) renders as an empty string.

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

Both sorts use `Intl.Collator` with accent sensitivity. `sortBy` compares the rendered string. A label that starts with `{flag}` therefore sorts by alpha-2 code, not by name (`🇦🇱 Albania` comes after `🇦🇩 Andorra`). To sort flag labels by name, use `sortDataBy: "countryNameEn"`.

```js
countryCodes.customArray(
  { label: "{flag} {countryNameEn}", value: "{countryCode}" },
  { filter: (c) => c.region === "North America", sortDataBy: "countryNameEn" }
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
| `dist/metadata.json` | `{ version, recordCount, sources }`: package version, record count and the upstream versions behind the generated fields (ISO 4217 List One date, CLDR, libphonenumber tag). |

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
npm test        # jest, 10 suites
```

CI runs the same steps on Node 22 and 24. Write PR titles and bodies in English.

### Generated fields

Five fields are written by scripts, not by hand. Do not edit them manually. The currency and number-length scripts need network access. No script runs in CI.

| Command | Fields | Source |
| --- | --- | --- |
| `npm run data:numeric` | `countryCodeNumeric` | ISO 3166-1 table embedded in the script. |
| `npm run data:currencies` | `currencyNumeric`, `currencyDecimals`, `currencySymbol` | ISO 4217 List One XML (SIX Group) and Node's ICU. |
| `npm run data:number-lengths` | `nationalNumberLengths` | libphonenumber `PhoneNumberMetadata.xml`, pinned to a tag. |
| `npm run data:all` | All of the above | Runs the three scripts in order. |

Each script replaces only its own field in `src/countriesData.ts`. A second run makes no change. Run `npm run data:check` for a dry run of all three that exits with code 1 on drift. (`npm run data:all -- --check` is not a dry run.)

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
