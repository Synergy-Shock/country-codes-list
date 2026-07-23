import * as countryCodes from "../src/index";

const all = countryCodes.all();

/**
 * ISO 3166-1 alpha-2 codes that have been formally deleted from the standard,
 * with the entities that replaced them. None of these should appear in the
 * dataset — consumers rendering a country picker must not be able to select a
 * state that no longer exists.
 * https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2#Deleted_codes
 */
const DELETED_ALPHA2: Record<string, string> = {
  AN: "Netherlands Antilles, dissolved 2010-10-10",
  CS: "Serbia and Montenegro, dissolved 2006",
  YU: "Yugoslavia",
  DD: "East Germany",
  ZR: "Zaire, now CD",
  TP: "East Timor, now TL",
  BU: "Burma, now MM",
  YD: "South Yemen",
  NT: "Neutral Zone",
};

describe("Netherlands Antilles (issue #34)", () => {
  test("AN is not in the dataset", () => {
    expect(countryCodes.findOne("countryCode", "AN")).toBeUndefined();
    expect(countryCodes.filter("countryCode", "AN")).toEqual([]);
  });

  test("the ANT alpha-3 code is not in the dataset", () => {
    expect(countryCodes.findOne("countryCodeAlpha3", "ANT")).toBeUndefined();
  });

  test("no entry is named Netherlands Antilles", () => {
    const named = all.filter((c) =>
      c.countryNameEn.toLowerCase().includes("netherlands antilles")
    );
    expect(named).toEqual([]);
  });

  test("AN cannot appear as a key in a generated list", () => {
    const list = countryCodes.customList("countryCode", "{countryNameEn}");
    expect(list).not.toHaveProperty("AN");
  });

  test.each([
    ["CW", "Curaçao", "CUW"],
    ["SX", "Sint Maarten (Dutch part)", "SXM"],
    ["BQ", "Bonaire, Sint Eustatius and Saba", "BES"],
  ])("its successor %s is present and complete", (code, nameEn, alpha3) => {
    const country = countryCodes.findOne("countryCode", code);
    expect(country).toBeDefined();
    expect(country!.countryNameEn).toBe(nameEn);
    expect(country!.countryCodeAlpha3).toBe(alpha3);
    // Aruba (AW) left the Antilles in 1986 and was always listed separately.
    expect(countryCodes.findOne("countryCode", "AW")).toBeDefined();
  });

  test("the successors are no longer classified as region Unknown", () => {
    const unknown = all
      .filter((c) => c.region === "Unknown")
      .map((c) => c.countryCode);
    expect(unknown).toEqual([]);
  });

  test("the successors are classified as Caribbean, not Europe", () => {
    ["CW", "SX", "BQ"].forEach((code) => {
      expect(countryCodes.findOne("countryCode", code)!.region).toBe(
        "South/Latin America"
      );
    });
  });
});

describe("deleted ISO 3166-1 codes", () => {
  test.each(Object.entries(DELETED_ALPHA2))(
    "%s is absent (%s)",
    (code) => {
      expect(countryCodes.findOne("countryCode", code)).toBeUndefined();
    }
  );
});
