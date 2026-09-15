import * as countryCodes from "../src/index";
import type { CountryData, CountryScalarProperty } from "../src/index";

/**
 * Dataset-wide invariants.
 *
 * The rest of the suite is example-based ("Zimbabwe uses ZWG", "Jamaica dials
 * +1"). Example tests pin bugs that someone already found; they cannot find the
 * next one. This file asserts properties that must hold for *every* record, so
 * a bad bulk edit fails at PR time instead of at `npm publish`.
 *
 * ## The ratchet contract
 *
 * Several of these invariants are violated by the dataset today. Rather than
 * weaken the assertion, each violated invariant carries a named `KNOWN_GAPS`
 * allowlist, and the test asserts the allowlist is **exactly** the set of
 * violators — not a superset. That means:
 *
 *   - a new violator fails the test (no regressions), and
 *   - fixing a country without deleting it from the allowlist *also* fails
 *     (the ledger cannot silently rot).
 *
 * So the lists can only ever shrink, and every entry carries its own inline
 * justification — why the gap exists and why it's still open — so the ledger
 * is readable without any external document.
 *
 * ## Reference data
 *
 * Every ISO list below is inlined. No network access at test time, no new
 * dependencies. Sources:
 *   - ISO 3166-1 alpha-2/alpha-3 ... https://www.iso.org/iso-3166-country-codes.html
 *   - ISO 4217 active codes ........ https://www.six-group.com/en/products-services/financial-information/data-standards.html
 *   - ISO 639-1 language codes ..... https://www.loc.gov/standards/iso639-2/php/code_list.php
 *   - ITU-T E.164 country codes .... https://en.wikipedia.org/wiki/List_of_country_calling_codes
 */

const all: CountryData[] = countryCodes.all();

// `all()` returns a fresh array since v3.1.1, but the country objects inside
// it are still the shared dataset, so nothing in this file may mutate them.
const sorted = (values: readonly string[]): string[] => [...values].sort();

/** Ratchet: the allowlist must be exactly the violators, never a superset. */
const expectExactly = (
  violators: readonly string[],
  allowlist: readonly string[]
): void => {
  expect(sorted(violators)).toEqual(sorted(allowlist));
};

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

/** The 249 officially assigned ISO 3166-1 alpha-2 codes and their alpha-3. */
const ISO_3166_1 = `
  AD:AND AE:ARE AF:AFG AG:ATG AI:AIA AL:ALB AM:ARM AO:AGO AQ:ATA
  AR:ARG AS:ASM AT:AUT AU:AUS AW:ABW AX:ALA AZ:AZE BA:BIH BB:BRB
  BD:BGD BE:BEL BF:BFA BG:BGR BH:BHR BI:BDI BJ:BEN BL:BLM BM:BMU
  BN:BRN BO:BOL BQ:BES BR:BRA BS:BHS BT:BTN BV:BVT BW:BWA BY:BLR
  BZ:BLZ CA:CAN CC:CCK CD:COD CF:CAF CG:COG CH:CHE CI:CIV CK:COK
  CL:CHL CM:CMR CN:CHN CO:COL CR:CRI CU:CUB CV:CPV CW:CUW CX:CXR
  CY:CYP CZ:CZE DE:DEU DJ:DJI DK:DNK DM:DMA DO:DOM DZ:DZA EC:ECU
  EE:EST EG:EGY EH:ESH ER:ERI ES:ESP ET:ETH FI:FIN FJ:FJI FK:FLK
  FM:FSM FO:FRO FR:FRA GA:GAB GB:GBR GD:GRD GE:GEO GF:GUF GG:GGY
  GH:GHA GI:GIB GL:GRL GM:GMB GN:GIN GP:GLP GQ:GNQ GR:GRC GS:SGS
  GT:GTM GU:GUM GW:GNB GY:GUY HK:HKG HM:HMD HN:HND HR:HRV HT:HTI
  HU:HUN ID:IDN IE:IRL IL:ISR IM:IMN IN:IND IO:IOT IQ:IRQ IR:IRN
  IS:ISL IT:ITA JE:JEY JM:JAM JO:JOR JP:JPN KE:KEN KG:KGZ KH:KHM
  KI:KIR KM:COM KN:KNA KP:PRK KR:KOR KW:KWT KY:CYM KZ:KAZ LA:LAO
  LB:LBN LC:LCA LI:LIE LK:LKA LR:LBR LS:LSO LT:LTU LU:LUX LV:LVA
  LY:LBY MA:MAR MC:MCO MD:MDA ME:MNE MF:MAF MG:MDG MH:MHL MK:MKD
  ML:MLI MM:MMR MN:MNG MO:MAC MP:MNP MQ:MTQ MR:MRT MS:MSR MT:MLT
  MU:MUS MV:MDV MW:MWI MX:MEX MY:MYS MZ:MOZ NA:NAM NC:NCL NE:NER
  NF:NFK NG:NGA NI:NIC NL:NLD NO:NOR NP:NPL NR:NRU NU:NIU NZ:NZL
  OM:OMN PA:PAN PE:PER PF:PYF PG:PNG PH:PHL PK:PAK PL:POL PM:SPM
  PN:PCN PR:PRI PS:PSE PT:PRT PW:PLW PY:PRY QA:QAT RE:REU RO:ROU
  RS:SRB RU:RUS RW:RWA SA:SAU SB:SLB SC:SYC SD:SDN SE:SWE SG:SGP
  SH:SHN SI:SVN SJ:SJM SK:SVK SL:SLE SM:SMR SN:SEN SO:SOM SR:SUR
  SS:SSD ST:STP SV:SLV SX:SXM SY:SYR SZ:SWZ TC:TCA TD:TCD TF:ATF
  TG:TGO TH:THA TJ:TJK TK:TKL TL:TLS TM:TKM TN:TUN TO:TON TR:TUR
  TT:TTO TV:TUV TW:TWN TZ:TZA UA:UKR UG:UGA UM:UMI US:USA UY:URY
  UZ:UZB VA:VAT VC:VCT VE:VEN VG:VGB VI:VIR VN:VNM VU:VUT WF:WLF
  WS:WSM YE:YEM YT:MYT ZA:ZAF ZM:ZMB ZW:ZWE
`
  .trim()
  .split(/\s+/)
  .reduce((map, pair) => {
    const [alpha2, alpha3] = pair.split(":");
    map.set(alpha2, alpha3);
    return map;
  }, new Map<string, string>());

/**
 * Codes the dataset carries that ISO 3166-1 does not assign. `XK` is the
 * user-assigned code for Kosovo, used by the EU, the IMF and the World Bank;
 * `XKX` is the matching de-facto alpha-3. Anything else appearing here — a
 * deleted code such as `AN`, `CS` or `YU`, or a typo — fails the completeness
 * test below, which is what makes that test subsume "no deleted codes".
 */
const NON_ISO_ENTRIES = new Map<string, string>([["XK", "XKX"]]);

/** Active ISO 4217 codes (no withdrawal date), including fund and metal codes. */
const ISO_4217_ACTIVE = new Set(
  `AED AFN ALL AMD AOA ARS AUD AWG AZN BAM BBD BDT BHD BIF BMD BND
   BOB BOV BRL BSD BTN BWP BYN BZD CAD CDF CHE CHF CHW CLF CLP CNY
   COP COU CRC CUP CVE CZK DJF DKK DOP DZD EGP ERN ETB EUR FJD FKP
   GBP GEL GHS GIP GMD GNF GTQ GYD HKD HNL HTG HUF IDR ILS INR IQD
   IRR ISK JMD JOD JPY KES KGS KHR KMF KPW KRW KWD KYD KZT LAK LBP
   LKR LRD LSL LYD MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR MWK MXN
   MXV MYR MZN NAD NGN NIO NOK NPR NZD OMR PAB PEN PGK PHP PKR PLN
   PYG QAR RON RSD RUB RWF SAR SBD SCR SDG SEK SGD SHP SLE SOS SRD
   SSP STN SVC SYP SZL THB TJS TMT TND TOP TRY TTD TWD TZS UAH UGX
   USD USN UYI UYU UYW UZS VED VES VND VUV WST XAD XAF XAG XAU XBA
   XBB XBC XBD XCD XCG XDR XOF XPD XPF XPT XSU XTS XUA XXX YER ZAR
   ZMW ZWG`
    .trim()
    .split(/\s+/)
);

/**
 * Active ISO 4217 codes that are not a country's circulating money: precious
 * metals, bond market units, IMF special drawing rights, testing/none
 * placeholders, and the fund codes that shadow a real currency (`BOV` for
 * `BOB`, `CLF` for `CLP`, `USN` for `USD`, …). No country's `currencyCode`
 * should ever be one of these.
 */
const NON_CIRCULATING_ISO_4217 = new Set(
  `BOV CHE CHW CLF COU MXV USN UYI UYW
   XAD XAG XAU XBA XBB XBC XBD XDR XPD XPT XSU XTS XUA XXX`
    .trim()
    .split(/\s+/)
);

/** The 183 ISO 639-1 two-letter language codes. */
const ISO_639_1 = new Set(
  `aa ab ae af ak am an ar as av ay az ba be bg bi bm bn bo br bs ca ce ch co cr
   cs cu cv cy da de dv dz ee el en eo es et eu fa ff fi fj fo fr fy ga gd gl gn
   gu gv ha he hi ho hr ht hu hy hz ia id ie ig ii ik io is it iu ja jv ka kg ki
   kj kk kl km kn ko kr ks ku kv kw ky la lb lg li ln lo lt lu lv mg mh mi mk ml
   mn mr ms mt my na nb nd ne ng nl nn no nr nv ny oc oj om or os pa pi pl ps pt
   qu rm rn ro ru rw sa sc sd se sg si sk sl sm sn so sq sr ss st su sv sw ta te
   tg th ti tk tl tn to tr ts tt tw ty ug uk ur uz ve vi vo wa wo xh yi yo za zh
   zu`
    .trim()
    .split(/\s+/)
);

/**
 * ITU-T E.164 country codes in use by this dataset, each verified against the
 * ITU assignment list. Membership here is what enforces "no embedded area
 * code": Jamaica's pre-v3.0.0 `876`, Cayman's `345`, Sint Maarten's `721` and
 * the old `61891` Cocos value are NPAs/subscriber prefixes, not E.164 country
 * codes, so they are absent from this set and would fail (issue #52).
 *
 * Limitation: this cannot catch an NPA that *happens* to also be a real country
 * code — Barbados' `246` collides with British Indian Ocean Territory's genuine
 * `+246` (issue #28). That specific ownership question is asserted directly in
 * tests/callingCodes.test.ts.
 *
 * Adding a country that dials a code not in this list is a deliberate act and
 * must add it here.
 */
const ASSIGNED_E164_COUNTRY_CODES = new Set(
  `1 7 20 27 30 31 32 33 34 36 39 40 41 43 44 45 46 47 48 49
   51 52 53 54 55 56 57 58 60 61 62 63 64 65 66 81 82 84 86 90
   91 92 93 94 95 98
   211 212 213 216 218 220 221 222 223 224 225 226 227 228 229 230
   231 232 233 234 235 236 237 238 239 240 241 242 243 244 245 246
   248 249 250 251 252 253 254 255 256 257 258 260 261 262 263 264
   265 266 267 268 269 290 291 297 298 299
   350 351 352 353 354 355 356 357 358 359 370 371 372 373 374 375
   376 377 378 380 381 382 383 385 386 387 389
   420 421 423
   500 501 502 503 504 505 506 507 508 509 590 591 592 593 594 595
   596 597 598 599
   670 672 673 674 675 676 677 678 679 680 681 682 683 685 686 687
   688 689 690 691 692
   850 852 853 855 856 880 886
   960 961 962 963 964 965 966 967 968 970 971 972 973 974 975 976
   977 992 993 994 995 996 998`
    .trim()
    .split(/\s+/)
);

/**
 * The regional classification the README documents (ITU / Wikimedia "List of
 * countries by regional classification").
 */
const REGION_TAXONOMY = new Set([
  "Africa",
  "Arab States",
  "Asia & Pacific",
  "Europe",
  "North America",
  "South/Latin America",
]);

/**
 * Every field the package documents as always populated.
 *
 * `tinType` and `tinName` are deliberately absent: 188 of 250 records leave
 * them empty, which the README treats as "this country has no VAT/TIN scheme
 * recorded" rather than as missing data. `altCodes` and `areaCodes` are absent
 * because they are arrays, not strings.
 */
const REQUIRED_STRING_FIELDS: readonly CountryScalarProperty[] = [
  "countryNameEn",
  "countryNameLocal",
  "countryCode",
  "countryCodeAlpha3",
  "currencyCode",
  "currencyNameEn",
  "officialLanguageCode",
  "officialLanguageNameEn",
  "officialLanguageNameLocal",
  "countryCallingCode",
  "region",
  "flag",
];

// ---------------------------------------------------------------------------
// KNOWN_GAPS — the defect ledger. These lists may only shrink.
// ---------------------------------------------------------------------------

/**
 * Required string fields that are empty today, per field.
 *
 * A field absent from this object must be populated for all 250 countries.
 */
const KNOWN_GAPS_EMPTY_FIELD: Partial<
  Record<CountryScalarProperty, readonly string[]>
> = {
  // ISO 4217 assigns nothing to these territories: the register records
  // "No universal currency" for both. GS is still an inconsistency (every
  // other uninhabited dependency carries the administering power's currency:
  // BV→NOK, HM→AUD, TF→EUR, IO→USD) but there is no clean way to say "GBP by
  // convention" without inventing a value, so it stays.
  currencyCode: ["AQ", "GS"],

  // No currency at all (see `currencyCode` above), so no name either.
  currencyNameEn: ["AQ", "GS"],
};

/**
 * Countries whose `officialLanguageCode` is a legitimate ISO 639-3 code because
 * the language has no ISO 639-1 equivalent. The README documents this fallback
 * ("usually from ISO 639-1, or ISO 639-3 otherwise"), so this is **not** a
 * defect ledger — it is an expected-exceptions list and it may grow.
 */
const ISO_639_3_FALLBACKS: Readonly<Record<string, string>> = {
  ME: "cnr", // Montenegrin
  NU: "niu", // Niuean
  TK: "tkl", // Tokelauan
};

/**
 * `officialLanguageCode` values that are not ISO 639 codes at all, or that
 * ignore an existing ISO 639-1 code. Empty today; a BCP 47 tag such as
 * `zh-hans` (ISO 639-1 plus an ISO 15924 script subtag) or an ISO 639-3 code
 * that shadows an existing 639-1 code (`srp` for `sr`) would land here.
 */
const KNOWN_GAPS_LANGUAGE_CODE: Readonly<Record<string, string>> = {};

/**
 * Countries whose `region` is outside the documented taxonomy (the README's
 * six-value ITU / Wikimedia classification, see `REGION_TAXONOMY` above).
 * Empty today; the value is pinned as well as the country, so renaming a bad
 * region to another bad region also fails.
 */
const KNOWN_GAPS_REGION: Readonly<Record<string, string>> = {};

/**
 * Currency codes that map to more than one `currencyNameEn`, and the exact
 * set of names each one is split across. Empty today.
 *
 * Unlike `KNOWN_GAPS_REGION` this is keyed by currency code rather than
 * country code, since the split is a property of the code, not of any one
 * record — the ledger pins the set of names so fixing one side without the
 * other still fails.
 */
const KNOWN_GAPS_CURRENCY_NAME_SPLIT: Readonly<Record<string, readonly string[]>> = {};

/**
 * `officialLanguageNameEn` written in a non-Latin script, i.e. the local
 * name landed in the English field. Empty today.
 */
const KNOWN_GAPS_NON_LATIN_LANGUAGE_NAME: readonly string[] = [];

// ---------------------------------------------------------------------------

describe("code uniqueness", () => {
  // altCodes uniqueness and non-shadowing are already asserted in
  // tests/altCodes.test.ts ("altCodes never shadow another country's official
  // codes", "no alternative code is claimed by two countries") — not repeated.

  test("countryCode is unique", () => {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    all.forEach((c) => {
      if (seen.has(c.countryCode)) duplicates.push(c.countryCode);
      seen.add(c.countryCode);
    });
    expect(duplicates).toEqual([]);
    expect(seen.size).toBe(all.length);
  });

  test("countryCodeAlpha3 is unique", () => {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    all.forEach((c) => {
      if (seen.has(c.countryCodeAlpha3)) duplicates.push(c.countryCodeAlpha3);
      seen.add(c.countryCodeAlpha3);
    });
    expect(duplicates).toEqual([]);
    expect(seen.size).toBe(all.length);
  });

  test("countryCode is two uppercase ASCII letters", () => {
    const offenders = all
      .filter((c) => !/^[A-Z]{2}$/.test(c.countryCode))
      .map((c) => c.countryCode);
    expect(offenders).toEqual([]);
  });

  test("countryCodeAlpha3 is three uppercase ASCII letters", () => {
    const offenders = all
      .filter((c) => !/^[A-Z]{3}$/.test(c.countryCodeAlpha3))
      .map((c) => `${c.countryCode}=${c.countryCodeAlpha3}`);
    expect(offenders).toEqual([]);
  });
});

describe("ISO 3166-1 completeness", () => {
  test("every officially assigned alpha-2 code is present", () => {
    const present = new Set(all.map((c) => c.countryCode));
    const missing: string[] = [];
    ISO_3166_1.forEach((_alpha3, alpha2) => {
      if (!present.has(alpha2)) missing.push(alpha2);
    });
    expect(sorted(missing)).toEqual([]);
    expect(ISO_3166_1.size).toBe(249);
  });

  /**
   * This is also the "no deleted codes" check: any alpha-2 that ISO has removed
   * (AN, CS, YU, DD, ZR, TP, BU, YD, NT, …) is by definition not in ISO_3166_1
   * and not in NON_ISO_ENTRIES, so it shows up here. tests/withdrawnCountries
   * covers the same ground code-by-code for the nine best-known deletions.
   */
  test("the dataset carries no code beyond ISO 3166-1 and the declared exceptions", () => {
    const unexpected = all
      .filter(
        (c) => !ISO_3166_1.has(c.countryCode) && !NON_ISO_ENTRIES.has(c.countryCode)
      )
      .map((c) => c.countryCode);
    expect(sorted(unexpected)).toEqual([]);
  });

  test("the non-ISO exceptions are exactly the ones declared", () => {
    const actual = all
      .filter((c) => !ISO_3166_1.has(c.countryCode))
      .map((c) => c.countryCode);
    expect(sorted(actual)).toEqual(sorted(Array.from(NON_ISO_ENTRIES.keys())));
  });

  test("the dataset holds exactly 249 ISO codes plus the exceptions", () => {
    expect(all.length).toBe(ISO_3166_1.size + NON_ISO_ENTRIES.size);
  });

  test("every alpha-2 maps to its ISO 3166-1 alpha-3", () => {
    const mismatches = all
      .filter((c) => {
        const expected =
          ISO_3166_1.get(c.countryCode) ?? NON_ISO_ENTRIES.get(c.countryCode);
        return expected !== c.countryCodeAlpha3;
      })
      .map(
        (c) =>
          `${c.countryCode}: dataset=${c.countryCodeAlpha3} expected=${
            ISO_3166_1.get(c.countryCode) ?? NON_ISO_ENTRIES.get(c.countryCode)
          }`
      );
    expect(mismatches).toEqual([]);
  });
});

describe("flag emoji", () => {
  /** The regional-indicator pair for an alpha-2 code, computed not hardcoded. */
  const flagFor = (alpha2: string): string =>
    String.fromCodePoint(
      ...alpha2.split("").map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65)
    );

  test("flag is the regional-indicator pair derived from countryCode", () => {
    const mismatches = all
      .filter((c) => c.flag !== flagFor(c.countryCode))
      .map((c) => `${c.countryCode}: flag=${c.flag} expected=${flagFor(c.countryCode)}`);
    expect(mismatches).toEqual([]);
  });

  test("flag is exactly two regional indicator symbols", () => {
    const offenders = all
      .filter((c) => Array.from(c.flag).length !== 2)
      .map((c) => c.countryCode);
    expect(offenders).toEqual([]);
  });

  test("no two countries share a flag", () => {
    expect(new Set(all.map((c) => c.flag)).size).toBe(all.length);
  });
});

describe("required string fields are populated", () => {
  REQUIRED_STRING_FIELDS.forEach((field) => {
    const allowlist = KNOWN_GAPS_EMPTY_FIELD[field] ?? [];

    test(`${field} is non-empty except for ${allowlist.length} known gap(s)`, () => {
      const violators = all
        .filter((c) => c[field].trim() === "")
        .map((c) => c.countryCode);
      expectExactly(violators, allowlist);
    });
  });

  test("no string field carries leading or trailing whitespace", () => {
    // Unlike the emptiness checks above, this loop also covers `tinType` and
    // `tinName` even though they're excluded from REQUIRED_STRING_FIELDS.
    // Being empty is legitimate for them (no VAT/TIN scheme recorded); having
    // stray whitespace never is, so it's still worth asserting here.
    const WHITESPACE_CHECKED_FIELDS: readonly CountryScalarProperty[] = [
      ...REQUIRED_STRING_FIELDS,
      "tinType",
      "tinName",
    ];
    const offenders: string[] = [];
    all.forEach((c) =>
      WHITESPACE_CHECKED_FIELDS.forEach((field) => {
        if (c[field] !== c[field].trim())
          offenders.push(`${c.countryCode}.${field}`);
      })
    );
    expect(offenders).toEqual([]);
  });
});

describe("currencyCode is valid ISO 4217", () => {
  test("every non-empty currencyCode is an active ISO 4217 code", () => {
    const offenders = all
      .filter((c) => c.currencyCode !== "" && !ISO_4217_ACTIVE.has(c.currencyCode))
      .map((c) => `${c.countryCode}=${c.currencyCode}`);
    expect(offenders).toEqual([]);
  });

  test("no country uses a fund, metal or placeholder code", () => {
    const offenders = all
      .filter((c) => NON_CIRCULATING_ISO_4217.has(c.currencyCode))
      .map((c) => `${c.countryCode}=${c.currencyCode}`);
    expect(offenders).toEqual([]);
  });

  test("currencyCode is three uppercase letters when present", () => {
    const offenders = all
      .filter((c) => c.currencyCode !== "" && !/^[A-Z]{3}$/.test(c.currencyCode))
      .map((c) => `${c.countryCode}=${c.currencyCode}`);
    expect(offenders).toEqual([]);
  });

  const namesByCurrencyCode = (): Map<string, Set<string>> => {
    const namesByCode = new Map<string, Set<string>>();
    all.forEach((c) => {
      if (c.currencyCode === "") return;
      const names = namesByCode.get(c.currencyCode) ?? new Set<string>();
      names.add(c.currencyNameEn);
      namesByCode.set(c.currencyCode, names);
    });
    return namesByCode;
  };

  test("a currency code maps to exactly one currency name, except the known gaps", () => {
    const namesByCode = namesByCurrencyCode();
    const split: string[] = [];
    namesByCode.forEach((names, code) => {
      if (names.size > 1) split.push(code);
    });
    expectExactly(split, Object.keys(KNOWN_GAPS_CURRENCY_NAME_SPLIT));
  });

  test("the split currency names are exactly the ones recorded", () => {
    const namesByCode = namesByCurrencyCode();
    Object.entries(KNOWN_GAPS_CURRENCY_NAME_SPLIT).forEach(([code, expectedNames]) => {
      const actualNames = Array.from(namesByCode.get(code) ?? new Set<string>());
      expect(sorted(actualNames)).toEqual(sorted(expectedNames));
    });
  });
});

describe("officialLanguageCode is a valid ISO 639 code", () => {
  test("every language code is ISO 639-1, a declared 639-3 fallback, or a known gap", () => {
    const offenders = all
      .filter(
        (c) =>
          !ISO_639_1.has(c.officialLanguageCode) &&
          ISO_639_3_FALLBACKS[c.countryCode] !== c.officialLanguageCode &&
          KNOWN_GAPS_LANGUAGE_CODE[c.countryCode] !== c.officialLanguageCode
      )
      .map((c) => `${c.countryCode}="${c.officialLanguageCode}"`);
    expect(offenders).toEqual([]);
  });

  test("the ISO 639-3 fallbacks are exactly the ones declared", () => {
    const actual = all
      .filter((c) => !ISO_639_1.has(c.officialLanguageCode))
      .filter((c) => ISO_639_3_FALLBACKS[c.countryCode] === c.officialLanguageCode)
      .map((c) => c.countryCode);
    expectExactly(actual, Object.keys(ISO_639_3_FALLBACKS));
  });

  test("the non-ISO-639 language codes are exactly the known gaps", () => {
    const actual: Record<string, string> = {};
    all.forEach((c) => {
      if (ISO_639_1.has(c.officialLanguageCode)) return;
      if (ISO_639_3_FALLBACKS[c.countryCode] === c.officialLanguageCode) return;
      actual[c.countryCode] = c.officialLanguageCode;
    });
    expect(actual).toEqual(KNOWN_GAPS_LANGUAGE_CODE);
  });

  test("officialLanguageNameEn is written in Latin script", () => {
    const violators = all
      .filter((c) => /[^ -ɏ\s]/.test(c.officialLanguageNameEn))
      .map((c) => c.countryCode);
    expectExactly(violators, KNOWN_GAPS_NON_LATIN_LANGUAGE_NAME);
  });
});

describe("countryCallingCode is an ITU-T E.164 country code", () => {
  test("is digits only — no '+', no spaces, no leading zero", () => {
    const offenders = all
      .filter((c) => !/^[1-9][0-9]{0,2}$/.test(c.countryCallingCode))
      .map((c) => `${c.countryCode}="${c.countryCallingCode}"`);
    expect(offenders).toEqual([]);
  });

  /**
   * The "no embedded area code" invariant: a national NPA such as Jamaica's
   * 876 (issue #52) is not an E.164 country code, so it cannot be a member of
   * the assigned set. See the constant's docblock for the one case this shape
   * of check cannot catch.
   */
  test("every calling code is an assigned E.164 country code", () => {
    const offenders = all
      .filter((c) => !ASSIGNED_E164_COUNTRY_CODES.has(c.countryCallingCode))
      .map((c) => `${c.countryCode}="${c.countryCallingCode}"`);
    expect(offenders).toEqual([]);
  });

  test("areaCodes hold digit strings only and never repeat the calling code", () => {
    const offenders: string[] = [];
    all.forEach((c) =>
      c.areaCodes.forEach((area) => {
        if (!/^[0-9]+$/.test(area)) offenders.push(`${c.countryCode}:"${area}"`);
        if (area === c.countryCallingCode)
          offenders.push(`${c.countryCode}: areaCode repeats callingCode`);
      })
    );
    expect(offenders).toEqual([]);
  });
});

describe("region taxonomy", () => {
  test("every region is a member of the documented taxonomy, except the known gaps", () => {
    const violators = all
      .filter((c) => !REGION_TAXONOMY.has(c.region))
      .map((c) => c.countryCode);
    expectExactly(violators, Object.keys(KNOWN_GAPS_REGION));
  });

  test("the off-taxonomy region values are exactly the ones recorded", () => {
    const actual: Record<string, string> = {};
    all.forEach((c) => {
      if (!REGION_TAXONOMY.has(c.region)) actual[c.countryCode] = c.region;
    });
    expect(actual).toEqual(KNOWN_GAPS_REGION);
  });

  test("no region is left as Unknown or empty", () => {
    const offenders = all
      .filter((c) => c.region.trim() === "" || c.region === "Unknown")
      .map((c) => c.countryCode);
    expect(offenders).toEqual([]);
  });
});
