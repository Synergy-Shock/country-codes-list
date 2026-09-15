# country-codes-list

Module with list of codes per country, including country codes, currency codes, and more.

> [!WARNING]
> Release v3.0.0 introduces breaking changes: `countryCallingCode` no longer folds in national area codes, `areaCodes` is now a required `string[]`, and several functions narrow their key parameter to string-valued properties. See the [v2 → v3 migration guide](#migration-guide-v2x-to-v30).
>
> Release v2.0.0 introduced breaking changes with full TypeScript support and automated testing/publishing.

> [!NOTE]
> v3.1.1 fixes a bug where the public API could mutate the shared dataset. `all()` now returns a fresh array on every call (so `all() === all()` is no longer `true`), and sorting or mutating that array — or the one from `customArray({ sortDataBy })` — no longer reorders or corrupts the data seen by `filter`, `findOne`, `customList` and every other consumer. If your code relied on reference equality between calls to `all()`, compare contents instead.

## Features

- 2 digit country code (ISO 3166-1 alpha-2): Obtained from [Wikipedia](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)
- 3 digit country code (ISO 3166-1 alpha-3): Obtained from [Wikipedia](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3)
- Numeric country code (`countryCodeNumeric`, ISO 3166-1 numeric): three digits with leading zeros kept (`"004"` for Afghanistan, `"840"` for the United States), empty only for Kosovo (`XK`), which has no ISO assignment. Resolve one with [`findOneByCode("840")`](#api-details--findonebycode-method)
- Alternative country codes (`altCodes`): non-primary 2-letter codes that still identify a country in the wild — `UK` for the United Kingdom (whose ISO code is `GB`) and `EL` for Greece (whose ISO code is `GR`). Resolve any of them with [`findOneByCode`](#api-details--findonebycode-method)
- Country Name: Each name in english and in the local country language
- Currency Code (ISO 4217): Obtained from [Wikipedia](https://en.wikipedia.org/wiki/ISO_4217)
- Currency Name (ISO 4217): Obtained from [Wikipedia](https://en.wikipedia.org/wiki/ISO_4217)
- Currency Numeric (`currencyNumeric`, ISO 4217 numeric): three digits (`"840"` for USD, `"978"` for EUR), empty when the country has no currency. From the ISO 4217 maintenance agency's [List One](https://www.six-group.com/en/products-services/financial-information/data-standards.html)
- Currency Decimals (`currencyDecimals`, ISO 4217 minor units): `2` for most currencies, `0` for JPY or XOF, `3` for BHD or KWD; `null` when there is no currency. Same source as above
- Currency Symbol (`currencySymbol`): the CLDR English narrow symbol — `"$"`, `"€"`, `"£"`, `"R$"`, `"₹"` — from Node's built-in ICU. Narrow means **not disambiguated**: USD, CAD and AUD all render as `"$"`. Falls back to the ISO code when CLDR has no symbol (`"CHF"`, `"ZWG"`); empty when there is no currency
- TIN Code (Taxpayer Identification Number, also known as VAT in some countries): Obtained from [Wikipedia](https://en.wikipedia.org/wiki/VAT_identification_number)
- TIN Name: Obtained from [Wikipedia](https://en.wikipedia.org/wiki/VAT_identification_number)
- Official language code (usually from ISO 639-1, or ISO 639-3 otherwise)): Obtained from [Open Street Map](https://wiki.openstreetmap.org/wiki/Nominatim/Country_Codes). Returns only the first official language code per country
- Official language name: Each name in english and in the local country language
- Country Calling Code: The phone calling code for the country. Obtained from [Wikipedia](https://en.wikipedia.org/wiki/List_of_country_calling_codes#Alphabetical_listing_by_country_or_region). This is the ITU-T E.164 country code only (1-3 digits, no `+`, no spaces) — national area codes are never folded into it.
- Area Codes: The national area codes that follow the calling code, as `string[]`. **Partially populated** — an empty array means "not recorded", not "this country has no area codes". Every member of the [North American Numbering Plan](https://en.wikipedia.org/wiki/North_American_Numbering_Plan) carries its area code (Jamaica `["876", "658"]`, Barbados `["246"]`, …), so `+1` is fully disambiguated except for the US, whose hundreds of area codes are out of scope here (Canada's are populated, a pre-existing exception). Other shared calling codes are **not** disambiguated: AU and CX both use `61`, AX and FI both use `358`, and GB, GG, IM and JE all use `44`, each with an empty array.
- National Number Lengths: The possible lengths of the national significant number — every digit after the calling code, area code included — as a sorted `number[]`. Derived from Google's [libphonenumber](https://github.com/google/libphonenumber) `PhoneNumberMetadata.xml` (Apache-2.0), covering fixed-line and mobile ranges only; toll-free, premium-rate, VoIP, pager and UAN numbers are excluded. It is a **set, not a range** — the Netherlands is `[9, 11]` and South Korea is `[5, 6, 8, 9, 10]` — so validate with `includes`, never with a min/max comparison. **Partially populated** — seven uninhabited territories (`AQ`, `BV`, `GS`, `HM`, `PN`, `TF`, `UM`) carry an empty array, meaning "not recorded". See [`nationalNumberLengths`](#api-details--nationalnumberlengths)
- Region: The Regional Classifications are from the [International Telecommunications Union](http://www.itu.int/ITU-D/ict/definitions/regions/index.html). Seen [here](https://meta.wikimedia.org/wiki/List_of_countries_by_regional_classification)

## Installation

Install the package via npm:

```bash
npm install --save country-codes-list
```

## Build & Test

To compile the package, run:

```bash
npm run build
```

The compiled output will be in the `dist/` folder.

To run tests:

```bash
npm test
```

# Installation

## Install the NPM module

```bash
    npm install --save country-codes-list
```

## Migration Guide (v1.x to v2.0)

### Breaking Changes

1. **TypeScript Types**: If you were using types:

   ```typescript
   // Old (v1.x)
   import { CountryProperty } from "country-codes-list";
   const prop: CountryProperty = CountryProperty.countryCode;

   // New (v2.0)
   import type { CountryProperty } from "country-codes-list";
   const prop: CountryProperty = "countryCode";
   ```

2. **Module Imports**: Now supports both CommonJS and ES modules:

   ```javascript
   // CommonJS (still works)
   const countryCodes = require("country-codes-list");

   // ES Modules (new)
   import * as countryCodes from "country-codes-list";
   ```

3. **Stricter Types**: Some functions now have stricter type checking:
   ```typescript
   // This now requires valid country property keys
   countryCodes.filter("invalidKey", "value"); // TypeScript error
   ```

## Migration Guide (v2.x to v3.0)

### Breaking Changes

1. **`countryCallingCode` is now the ITU-T E.164 country code only** — national area codes are no longer folded in. Several countries changed value, most notably the [NANP](https://en.wikipedia.org/wiki/North_American_Numbering_Plan) members that used to carry their area code:

   ```js
   // Old (v2.x)
   countryCodes.findOne("countryCode", "JM").countryCallingCode; // '876'

   // New (v3.0)
   countryCodes.findOne("countryCode", "JM").countryCallingCode; // '1'
   countryCodes.findOne("countryCode", "JM").areaCodes; // ['876', '658']
   ```

   If you relied on the old value to dial a full number, concatenate the calling code with an area code: `` `+${cc}${areaCodes[0]}` ``.

2. **`areaCodes` is now a required `string[]`** (previously an optional `any[]`). It is **partially populated** — an empty array means "not recorded", not "no area codes". Every NANP member is populated; other shared calling codes (`44`, `358`, `61`) are not yet.

3. **Key parameters narrowed to `CountryScalarProperty`.** `filter`, `findOne`, `customList`, `customGroupedList` and `customArray`'s `sortDataBy` no longer accept array-valued properties (`altCodes`, `areaCodes`). This was already broken at runtime; it is now a compile-time error:

   ```typescript
   // Old (v2.x): type-checked but returned garbage at runtime
   countryCodes.customList("altCodes", "{countryCode}");

   // New (v3.0): TypeScript error
   // To look up by an alternative code, use findOneByCode instead:
   countryCodes.findOneByCode("UK").countryCode; // 'GB'
   ```

## Usage

This package can be used in both CommonJS (JavaScript) and TypeScript environments.

### CommonJS

```js
const countryCodes = require("country-codes-list");

const myCountryCodesObject = countryCodes.customList(
  "countryCode",
  "[{countryCode}] {countryNameEn}: +{countryCallingCode}"
);

console.log(myCountryCodesObject);
```

### TypeScript

```ts
import * as countryCodes from "country-codes-list";

const myCountryCodesObject = countryCodes.customList(
  "countryCode",
  "[{countryCode}] {countryNameEn}: +{countryCallingCode}"
);
console.log(myCountryCodesObject);
```

### API Details – findOneByCode Method

Resolves a 2- or 3-letter country code to a country, case-insensitively, matching the official ISO 3166-1 alpha-2 and alpha-3 codes **and** the alternative codes in `altCodes`.

Use it when the code comes from somewhere you don't control — a browser or OS locale, an EU VAT number, an upstream API, a legacy database — where `UK` shows up as often as `GB`:

```js
const countryCodes = require("country-codes-list");

countryCodes.findOneByCode("UK").countryCode; // 'GB'
countryCodes.findOneByCode("gbr").countryCode; // 'GB'
countryCodes.findOneByCode("EL").countryCode; // 'GR'
countryCodes.findOneByCode("ZZ"); // undefined
```

It also resolves ISO 3166-1 **numeric** codes — a string of exactly three ASCII digits, leading zeros included, as they appear in `countryCodeNumeric`:

```js
countryCodes.findOneByCode("840").countryCode; // 'US'
countryCodes.findOneByCode("004").countryCode; // 'AF'
countryCodes.findOneByCode("4"); // undefined — must be zero-padded
```

Input is trimmed and must be 2 or 3 ASCII letters (or 3 ASCII digits for a numeric code); anything else returns `undefined`. The validation happens *before* uppercasing on purpose — Unicode case mapping turns `"ß"` into `"SS"` and `"ı"` into `"I"`, so validating afterwards would let junk input resolve to real countries.

Note that `altCodes`, `areaCodes` and `nationalNumberLengths` hold arrays, so they can't be used as lookup or list keys. `filter`, `findOne` and `customList` accept only string-valued properties (the exported `CountryScalarProperty` type); reach for `findOneByCode` to search `altCodes`.

`UK` is [exceptionally reserved](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2#Exceptional_reservations) in ISO 3166-1 at the United Kingdom's request; `EL` is the European Commission's code for Greece. Neither replaces the official code — `findOne("countryCode", "UK")` still returns `undefined`, and `countryCode` remains `GB`/`GR`.

### API Details – nationalNumberLengths

`nationalNumberLengths` answers "how many digits should this phone number have?" without pulling in a full phone-number library. It holds the possible lengths of the **national significant number** — the digits that follow the E.164 calling code:

```js
const countryCodes = require("country-codes-list");

const gb = countryCodes.findOneByCode("GB");
gb.nationalNumberLengths; // [9, 10]
gb.nationalNumberLengths.includes("2079460958".length); // true
```

Two things are easy to get wrong:

- **The area code is counted, the trunk prefix is not.** Great Britain's `020 7946 0958` is dialled domestically with a leading `0`, but the national significant number is `2079460958` — ten digits, area code included. Strip the trunk prefix before comparing.
- **It is a set, not a range.** Numbering plans have holes. The Netherlands is `[9, 11]`, so a 10-digit Dutch number is invalid even though it sits between the two:

```js
const nl = countryCodes.findOneByCode("NL").nationalNumberLengths; // [9, 11]

nl.includes(10); // false — correct
10 >= Math.min(...nl) && 10 <= Math.max(...nl); // true — wrong
```

The values are keyed by country rather than by calling code because countries sharing a calling code genuinely differ: on `+44`, Great Britain is `[9, 10]` while Guernsey, the Isle of Man and Jersey are all `[10]`.

Scope: fixed-line and mobile ranges only. A toll-free or premium-rate number (a UK `0800`, say) is not guaranteed to match. Germany is the widest plan at `[5 … 15]`, because direct-dial-in extensions are appended to the subscriber number.

Being array-valued, it is not a usable `customList` placeholder — `{nationalNumberLengths}` is left in the output verbatim. Read it off `all()`, `findOne` or `findOneByCode` instead.

### API Details – customList Method

- The first parameter is the key used for the returned object's property.
- The second parameter is a string with placeholders (in `{placeholder}` format) replaced by corresponding country properties.

The available placeholders are:

- `countryNameEn`
- `countryNameLocal`
- `countryCode`
- `countryCodeAlpha3`
- `currencyCode`
- `currencyNameEn`
- `tinType`
- `tinName`
- `officialLanguageCode`
- `officialLanguageNameEn`
- `officialLanguageNameLocal`
- `countryCallingCode`
- `region`
- `flag`
- `countryCodeNumeric`
- `currencyNumeric`
- `currencyDecimals` (a number; left verbatim for the three records where it is `null`)
- `currencySymbol`

`altCodes`, `areaCodes` and `nationalNumberLengths` hold arrays and are **not** substitutable — `{nationalNumberLengths}` is left in the output verbatim. They are also rejected as the list key, which is a compile-time error in TypeScript (see `CountryScalarProperty`).

> [!IMPORTANT]
> The key must be **unique** across countries. `countryCode` and `countryCodeAlpha3` are; `countryCallingCode`, `currencyCode`, `region` and `officialLanguageCode` are not. Keying on a non-unique property makes countries overwrite each other and only the last one survives — use [`customGroupedList`](#api-details--customgroupedlist-method) instead.

#### Example

```js
const countryCodes = require("country-codes-list");

const myCountryCodesObject = countryCodes.customList(
  "countryCode",
  "[{countryCode}] {countryNameEn}: +{countryCallingCode}"
);
```

This will return an object like this one:

```js
{
    'AD': '[AD] Andorra: +376',
    'AE': '[AE] United Arab Emirates: +971',
    'AF': '[AF] Afghanistan: +93',
    'AG': '[AG] Antigua and Barbuda: +1',
    'AI': '[AI] Anguilla: +1',
    'AL': '[AL] Albania: +355',
    'AM': '[AM] Armenia: +374',
    'AO': '[AO] Angola: +244',
    'AQ': '[AQ] Antarctica: +',
    'AR': '[AR] Argentina: +54',
    'AS': '[AS] American Samoa: +1',
    'AT': '[AT] Austria: +43',
    'AU': '[AU] Australia: +61',
    'AW': '[AW] Aruba: +297',
    ...
}

```

### API Details – customGroupedList Method

Same signature as `customList`, but each key maps to an **array** of every matching country instead of just the last one. Use it whenever several countries share the key — the United States, Canada and the Caribbean all answer to `+1`, and the whole euro zone shares `EUR`.

```js
const countryCodes = require("country-codes-list");

// customList: one country per calling code — the other 25 are lost
countryCodes.customList("countryCallingCode", "{countryCode}")["1"];
// => 'UM'

// customGroupedList: all of them
countryCodes.customGroupedList("countryCallingCode", "{countryCode}")["1"];
// => ['AG', 'AI', 'AS', 'BB', 'BM', 'CA', 'DM', 'GD', 'GU', 'JM', 'KN', 'LC',
//     'MS', 'PR', 'SX', 'TT', 'US', 'VC', 'VG', 'VI', 'DO', 'BS', 'KY', 'MP',
//     'TC', 'UM']
```

It takes the same third `{ filter }` option:

```js
countryCodes.customGroupedList("region", "{countryNameEn}", {
  filter: (country) => country.currencyCode === "EUR",
});
```

This will return an object like this one — keyed by region, with an array of country names per group:

```js
{
    'Europe': ['Andorra', 'Austria', 'Åland Islands', 'Belgium', ...],
    'South/Latin America': ['Saint Barthélemy', 'French Guiana', 'Guadeloupe', ...],
    'North America': ['Saint Pierre and Miquelon'],
    'Asia & Pacific': ['Réunion'],
    'Africa': ['Mayotte'],
    'Indian Ocean': ['French Southern and Antarctic Lands'],
}
```

Keys that no country matched are simply absent, so the return type is `Partial<Record<string, string[]>>` — check before use:

```js
const byRegion = countryCodes.customGroupedList("region", "{countryCode}", {
  filter: (country) => country.countryCode === "AR",
});
byRegion["Europe"]; // undefined — no European country passed the filter
byRegion["Europe"]?.length ?? 0; // 0
```

## Data exports (JSON / CSV / CDN)

The package also ships the whole dataset as plain files, for anything that isn't JavaScript — spreadsheets, Python, a SQL loader, a `<script>`-free web page:

- `dist/countries.json` — the full array returned by `all()`, pretty-printed
- `dist/countries.csv` — one row per country; the header lists every field, array fields (`altCodes`, `areaCodes`, `nationalNumberLengths`) are joined with `|`, `null` is an empty cell, and cells are quoted per RFC 4180

Both are on jsDelivr, pinned to the major version:

```
https://cdn.jsdelivr.net/npm/country-codes-list@3/dist/countries.json
https://cdn.jsdelivr.net/npm/country-codes-list@3/dist/countries.csv
```

```js
const countries = await fetch(
  "https://cdn.jsdelivr.net/npm/country-codes-list@3/dist/countries.json"
).then((r) => r.json());
```

Both files are written by `npm run build`, so they always match the compiled dataset. The generated fields themselves (`countryCodeNumeric`, `currencyNumeric`, `currencyDecimals`, `currencySymbol`, `nationalNumberLengths`) are produced by the scripts under `scripts/` — `npm run data:all` regenerates them from their sources.
