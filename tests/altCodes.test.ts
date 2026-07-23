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
