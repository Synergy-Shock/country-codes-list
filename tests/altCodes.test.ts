import * as countryCodes from "../src/index";

const all = countryCodes.all();

describe("altCodes data", () => {
  test("UK is an alternative code for the United Kingdom (issue #16)", () => {
    const gb = countryCodes.findOne("countryCode", "GB");
    expect(gb!.altCodes).toEqual(["UK"]);
    // GB stays the official ISO 3166-1 alpha-2 code.
    expect(gb!.countryCode).toBe("GB");
    expect(gb!.countryCodeAlpha3).toBe("GBR");
  });

  test("EL is an alternative code for Greece", () => {
    const gr = countryCodes.findOne("countryCode", "GR");
    expect(gr!.altCodes).toEqual(["EL"]);
    expect(gr!.countryCode).toBe("GR");
  });

  test("altCodes never shadow another country's official codes", () => {
    const official = new Set(
      all.flatMap((c) => [c.countryCode, c.countryCodeAlpha3])
    );
    const shadowing = all
      .flatMap((c) => (c.altCodes ?? []).map((alt) => ({ alt, of: c.countryCode })))
      .filter(({ alt }) => official.has(alt));
    expect(shadowing).toEqual([]);
  });

  test("no alternative code is claimed by two countries", () => {
    const seen = new Map<string, string>();
    const collisions: string[] = [];
    all.forEach((c) =>
      (c.altCodes ?? []).forEach((alt) => {
        const previous = seen.get(alt);
        if (previous) collisions.push(`${alt}: ${previous} and ${c.countryCode}`);
        else seen.set(alt, c.countryCode);
      })
    );
    expect(collisions).toEqual([]);
  });

  test("altCodes are uppercase two-letter strings", () => {
    const offenders = all
      .flatMap((c) => c.altCodes ?? [])
      .filter((alt) => !/^[A-Z]{2}$/.test(alt));
    expect(offenders).toEqual([]);
  });
});

describe("altCodes admission policy (issue #38)", () => {
  // The rule for adding a 2-letter code to a country's `altCodes`. There is no
  // separate architecture doc for this — the six rules (P1–P6) are stated in
  // full below so the policy is self-contained and reviewable in this file.
  // The trigger was a request to add D&B WorldBase codes, 50% of which are
  // another country's live ISO code — this policy keeps that class out for
  // good.
  //
  //   P1 (manual review gate) — Provenance: a proposed altCode must cite a
  //     publicly documented standard or convention (e.g. ISO 3166-1, an EU
  //     regulation), not a proprietary vendor scheme like D&B WorldBase. Not
  //     automated — checked by a reviewer when the code is proposed.
  //   P2 (automated below) — No altCode may shadow another country's official
  //     ISO 3166-1 alpha-2 or alpha-3 code. Enforced by "altCodes never
  //     shadow another country's official codes" in the `altCodes data`
  //     describe block above.
  //   P3 (automated below) — No altCode may be claimed by more than one
  //     country. Enforced by "no alternative code is claimed by two
  //     countries" in the `altCodes data` describe block above.
  //   P4 (automated below) — No altCode may sit in the ISO 3166-1
  //     user-assigned range (AA, QM–QZ, XA–XZ, ZZ), except for named,
  //     individually-approved EU conventions.
  //   P5 (automated below) — No altCode may reuse a formally retired or
  //     withdrawn ISO 3166-1 alpha-2 code, whether it was withdrawn by
  //     renaming the same entity or by reassignment to a different one.
  //   P6 (manual review gate) — Maintainer ratification: a new altCode is not
  //     merged until a maintainer has explicitly signed off on it in the
  //     PR/issue, even after P1–P5 pass. Not automated.

  const altCodes = all.flatMap((c) => c.altCodes ?? []);

  // P4 — the ISO 3166-1 user-assigned series (ISO 3166-1 §8.1.3): AA, QM–QZ,
  // XA–XZ, ZZ. These "are not universal ... not compatible between different
  // entities", so they must never resolve to a specific country.
  const USER_ASSIGNED = /^(AA|Q[M-Z]|X[A-Z]|ZZ)$/;

  // The only codes allowed to sit in that range: published EU VAT/customs
  // conventions, admitted by name here (proposed in this PR; pending explicit
  // maintainer ratification per P6). This set exists so that adding one does
  // not trip P4.
  //   EL — European Commission VAT prefix for Greece. Already carried on GR
  //        (see "EL is an alternative code for Greece" above and
  //        src/countriesData.ts).
  //   XI — European Commission VAT/customs code for Northern Ireland. Not yet
  //        added to any country's altCodes; listed so that adding it later
  //        does not trip P4.
  // EL is not in XA–XZ so it never actually reaches this test, but it is
  // listed to keep the exception's rationale in one place.
  const POLICY_EXCEPTED_USER_ASSIGNED = new Set(["EL", "XI"]);

  // P5 — ISO 3166-1 alpha-2 codes no longer assigned to any current country.
  // Most were formally withdrawn; SU remains exceptionally reserved rather
  // than withdrawn. Either way, none may be reintroduced as an altCode —
  // whether by renaming the same entity (e.g. BU: Burma → Myanmar, 1989) or
  // by reassignment to a different one (e.g. CS: Czechoslovakia until 1993,
  // reused for Serbia and Montenegro 2003–2006). Reusing one would silently
  // corrupt legacy-data migrations, and no other test here would catch it.
  const RETIRED_ISO_CODES = [
    "AN", "BU", "CS", "DD", "NT", "SU", "TP", "YD", "YU", "ZR",
  ];

  test("P4 — no altCode sits in the ISO user-assigned range, except named EU conventions", () => {
    const offenders = altCodes.filter(
      (alt) => USER_ASSIGNED.test(alt) && !POLICY_EXCEPTED_USER_ASSIGNED.has(alt)
    );
    expect(offenders).toEqual([]);
  });

  test("P5 — no altCode reuses a formally retired/withdrawn ISO code", () => {
    const offenders = altCodes.filter((alt) => RETIRED_ISO_CODES.includes(alt));
    expect(offenders).toEqual([]);
  });

  test("user-assigned, pseudo and unknown region codes do not resolve to a country", () => {
    // The concrete codes behind issue #38: XA/XB are CLDR pseudo-locale
    // regions; XM/QO/AA/QZ/ZZ are user-assigned; none denotes a country.
    // XI is deliberately absent — it is admissible by policy and may resolve
    // once it is actually added to GB's altCodes.
    ["XA", "XB", "XM", "QO", "AA", "QZ", "ZZ"].forEach((code) => {
      expect(countryCodes.findOneByCode(code)).toBeUndefined();
    });
  });

  test("the WorldBase codes that collide with a live ISO alpha-2 are never admitted as an altCode", () => {
    // A sample of D&B WorldBase codes whose letters are another country's
    // official ISO alpha-2 (the code key below is the live ISO owner; the
    // value is the country WorldBase actually means by that same string).
    // This asserts the data itself, not resolution order: `findOneByCode`
    // already checks official codes before altCodes (see "official codes
    // take precedence over alternative codes" below and "altCodes never
    // shadow another country's official codes" above), so a resolution-based
    // assertion here could never fail even if one of these codes were
    // literally added to some country's `altCodes`. Checking the data
    // directly is what actually catches that mistake.
    const worldbaseCollisions: Record<string, string> = {
      SA: "ZA", // WorldBase South Africa vs ISO Saudi Arabia
      ZA: "ZM", // WorldBase Zambia vs ISO South Africa
      GB: "GM", // WorldBase Gambia vs ISO United Kingdom
      BG: "BZ", // WorldBase Belize vs ISO Bulgaria
    };
    Object.keys(worldbaseCollisions).forEach((worldbaseCode) => {
      const offenders = all.filter((c) =>
        (c.altCodes ?? []).includes(worldbaseCode)
      );
      expect(offenders).toEqual([]);
    });
  });
});

describe("findOneByCode", () => {
  test("resolves UK to the United Kingdom", () => {
    expect(countryCodes.findOneByCode("UK")?.countryCode).toBe("GB");
    expect(countryCodes.findOneByCode("UK")?.countryNameEn).toBe(
      "United Kingdom"
    );
  });

  test("resolves EL to Greece", () => {
    expect(countryCodes.findOneByCode("EL")?.countryCode).toBe("GR");
  });

  test("resolves official alpha-2 and alpha-3 codes", () => {
    expect(countryCodes.findOneByCode("GB")?.countryNameEn).toBe(
      "United Kingdom"
    );
    expect(countryCodes.findOneByCode("GBR")?.countryNameEn).toBe(
      "United Kingdom"
    );
    expect(countryCodes.findOneByCode("AF")?.countryNameEn).toBe("Afghanistan");
    expect(countryCodes.findOneByCode("AFG")?.countryNameEn).toBe(
      "Afghanistan"
    );
  });

  test("is case-insensitive and tolerates surrounding whitespace", () => {
    ["uk", "Uk", " UK ", "gb", "gbr"].forEach((input) => {
      expect(countryCodes.findOneByCode(input)?.countryCode).toBe("GB");
    });
  });

  test("returns undefined for unknown or empty input", () => {
    expect(countryCodes.findOneByCode("ZZ")).toBeUndefined();
    expect(countryCodes.findOneByCode("")).toBeUndefined();
    expect(countryCodes.findOneByCode("   ")).toBeUndefined();
    // Defensive: JS callers can pass anything.
    expect(countryCodes.findOneByCode(undefined as any)).toBeUndefined();
    expect(countryCodes.findOneByCode(null as any)).toBeUndefined();
  });

  test("Unicode case mapping cannot forge a valid code", () => {
    // "ß".toUpperCase() === "SS" and "ı".toUpperCase() === "I", so uppercasing
    // before validating would resolve these to South Sudan and BIOT.
    expect("ß".toUpperCase()).toBe("SS"); // documents why the guard exists
    expect(countryCodes.findOneByCode("ß")).toBeUndefined();
    expect(countryCodes.findOneByCode("ſs")).toBeUndefined();
    expect(countryCodes.findOneByCode("ıo")).toBeUndefined();
    expect(countryCodes.findOneByCode("İO")).toBeUndefined();
    // The real codes those inputs tried to impersonate still resolve.
    expect(countryCodes.findOneByCode("SS")?.countryCode).toBe("SS");
    expect(countryCodes.findOneByCode("IO")?.countryCode).toBe("IO");
  });

  test("rejects anything that is not a 2- or 3-letter ASCII code", () => {
    ["G", "GBRA", "G1", "G-B", "G B", "42", "🇬🇧", "G_B"].forEach((input) => {
      expect(countryCodes.findOneByCode(input)).toBeUndefined();
    });
    // Surrounding whitespace is still trimmed, not rejected.
    expect(countryCodes.findOneByCode("\tGB \n")?.countryCode).toBe("GB");
  });

  test("resolves every official code in the dataset", () => {
    const unresolved = all.filter(
      (c) =>
        countryCodes.findOneByCode(c.countryCode)?.countryCode !==
          c.countryCode ||
        countryCodes.findOneByCode(c.countryCodeAlpha3)?.countryCode !==
          c.countryCode
    );
    expect(unresolved.map((c) => c.countryCode)).toEqual([]);
  });

  test("official codes take precedence over alternative codes", () => {
    // Every altCode resolves to its owner, and no official code is diverted.
    all.forEach((country) =>
      (country.altCodes ?? []).forEach((alt) =>
        expect(countryCodes.findOneByCode(alt)?.countryCode).toBe(
          country.countryCode
        )
      )
    );
  });
});

describe("findOne is unchanged", () => {
  test("still matches the official code exactly and ignores altCodes", () => {
    expect(countryCodes.findOne("countryCode", "UK")).toBeUndefined();
    expect(countryCodes.findOne("countryCode", "gb")).toBeUndefined();
    expect(countryCodes.findOne("countryCode", "GB")?.countryNameEn).toBe(
      "United Kingdom"
    );
  });
});

describe("array-valued properties are not accepted as lookup keys", () => {
  // These are compile-time assertions: if any of these calls ever type-checks,
  // ts-jest fails `npm test` with "Unused '@ts-expect-error' directive".
  // (`npm run build` cannot catch it — tsconfig's `include` is `src/**/*`, so
  // tsc never sees this file.)
  test("filter, findOne and customList reject the array-valued fields", () => {
    // @ts-expect-error altCodes holds an array, so === can never match
    expect(countryCodes.filter("altCodes", "UK")).toEqual([]);
    // @ts-expect-error same for findOne
    expect(countryCodes.findOne("altCodes", "UK")).toBeUndefined();
    // @ts-expect-error areaCodes has the same problem
    expect(countryCodes.findOne("areaCodes", "876")).toBeUndefined();
    // @ts-expect-error nationalNumberLengths holds numbers, not a string value
    expect(countryCodes.findOne("nationalNumberLengths", "10")).toBeUndefined();
    // @ts-expect-error same for filter — number[] is not a CountryScalarProperty
    expect(countryCodes.filter("nationalNumberLengths", "10")).toEqual([]);
    // @ts-expect-error keying a list on an array field collapses countries
    expect(countryCodes.customList("altCodes", "{countryCode}")).toBeDefined();
  });

  test("scalar properties still work", () => {
    expect(countryCodes.filter("countryCode", "GB")).toHaveLength(1);
    expect(countryCodes.findOne("currencyCode", "GBP")).toBeDefined();
    expect(
      Object.keys(countryCodes.customList("countryCode", "{countryNameEn}"))
    ).toContain("GB");
  });
});
