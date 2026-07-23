import * as countryCodes from "../src/index";
import type { CountryData } from "../src/index";

const all = countryCodes.all();
const byCode = (code: string): CountryData => {
  const country = countryCodes.findOne("countryCode", code);
  if (!country) throw new Error(`fixture missing: ${code}`);
  return country;
};

/**
 * NANP members outside the US and Canada. Each is reachable on +1 and is
 * distinguished only by its area code (NPA).
 * https://en.wikipedia.org/wiki/North_American_Numbering_Plan
 */
const NANP_TERRITORIES: Record<string, string[]> = {
  AG: ["268"],
  AI: ["264"],
  AS: ["684"],
  BB: ["246"],
  BM: ["441"],
  BS: ["242"],
  DM: ["767"],
  DO: ["809", "829", "849"],
  GD: ["473"],
  GU: ["671"],
  JM: ["876", "658"],
  KN: ["869"],
  KY: ["345"],
  LC: ["758"],
  MP: ["670"],
  MS: ["664"],
  PR: ["787", "939"],
  SX: ["721"],
  TC: ["649"],
  TT: ["868"],
  VC: ["784"],
  VG: ["284"],
  VI: ["340"],
};

describe("countryCallingCode", () => {
  test("is always digits only, with no spaces or '+' prefix", () => {
    const offenders = all
      .filter((c) => !/^\d+$/.test(c.countryCallingCode))
      .map((c) => `${c.countryCode}="${c.countryCallingCode}"`);
    expect(offenders).toEqual([]);
  });

  test("is never longer than 3 digits (ITU-T E.164 country codes are 1-3 digits)", () => {
    const offenders = all
      .filter((c) => c.countryCallingCode.length > 3)
      .map((c) => `${c.countryCode}="${c.countryCallingCode}"`);
    expect(offenders).toEqual([]);
  });
});

describe("areaCodes", () => {
  test("is present on every country", () => {
    const missing = all
      .filter((c) => !Array.isArray(c.areaCodes))
      .map((c) => c.countryCode);
    expect(missing).toEqual([]);
  });

  test("contains only digit strings", () => {
    const offenders = all
      .filter((c) => c.areaCodes.some((a) => !/^\d+$/.test(a)))
      .map((c) => c.countryCode);
    expect(offenders).toEqual([]);
  });

  test("never repeats a callingCode+areaCode pair across countries", () => {
    const owner = new Map<string, string>();
    const collisions: string[] = [];
    all.forEach((c) =>
      c.areaCodes.forEach((area) => {
        const key = `${c.countryCallingCode}-${area}`;
        const previous = owner.get(key);
        if (previous) collisions.push(`+${key} claimed by ${previous} and ${c.countryCode}`);
        else owner.set(key, c.countryCode);
      })
    );
    expect(collisions).toEqual([]);
  });
});

describe("NANP members (issue #52)", () => {
  test.each(Object.entries(NANP_TERRITORIES))(
    "%s dials +1 and carries its NPA in areaCodes",
    (code, areaCodes) => {
      const country = byCode(code);
      expect(country.countryCallingCode).toBe("1");
      expect(country.areaCodes).toEqual(areaCodes);
    }
  );

  test("the US and Canada also dial +1", () => {
    expect(byCode("US").countryCallingCode).toBe("1");
    expect(byCode("CA").countryCallingCode).toBe("1");
  });

  test("Jamaica exposes both of its area codes", () => {
    // 658 was added as an overlay for 876 in 2018.
    expect(byCode("JM").areaCodes).toEqual(["876", "658"]);
  });

  test("a rendered calling code is dialable as +1", () => {
    const list = countryCodes.customList(
      "countryCode",
      "+{countryCallingCode}"
    );
    expect(list["JM"]).toBe("+1");
    expect(list["DM"]).toBe("+1");
    expect(list["TT"]).toBe("+1");
  });
});

describe("non-NANP countries that embedded an area code", () => {
  test("Cocos (Keeling) Islands dial +61 (Australia)", () => {
    expect(byCode("CC").countryCallingCode).toBe("61");
    expect(byCode("CC").areaCodes).toEqual(["891"]);
  });

  test("Svalbard and Jan Mayen dial +47 (Norway)", () => {
    expect(byCode("SJ").countryCallingCode).toBe("47");
    expect(byCode("SJ").areaCodes).toEqual(["79"]);
  });

  test("the +599 islands share the calling code and differ by area code", () => {
    expect(byCode("CW").countryCallingCode).toBe("599");
    expect(byCode("CW").areaCodes).toEqual(["9"]);
    expect(byCode("BQ").countryCallingCode).toBe("599");
    // Bonaire 7, Saba 4, Sint Eustatius 3.
    expect(byCode("BQ").areaCodes).toEqual(["7", "4", "3"]);
  });
});

describe("regression: +246 belongs to British Indian Ocean Territory (issue #28)", () => {
  test("only BIOT claims calling code 246", () => {
    const claimants = all
      .filter((c) => c.countryCallingCode === "246")
      .map((c) => c.countryCode);
    expect(claimants).toEqual(["IO"]);
  });

  test("Barbados keeps 246 as an area code under +1", () => {
    expect(byCode("BB").countryCallingCode).toBe("1");
    expect(byCode("BB").areaCodes).toEqual(["246"]);
  });
});
