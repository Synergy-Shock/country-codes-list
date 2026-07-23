import * as countryCodes from "../src/index";

describe("country-codes-list", () => {
  test("all returns a non-empty array", () => {
    const data = countryCodes.all();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  test("filter returns correct countries", () => {
    const result = countryCodes.filter("countryCode", "AD");
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].countryNameEn).toBe("Andorra");
  });

  test("findOne returns a country by 2 digit ISO 3166-1 alpha-2", () => {
    const result = countryCodes.findOne("countryCode", "AF");
    expect(result).toBeDefined();
    if (result) {
      expect(result.countryNameEn).toBe("Afghanistan");
    }
  });

  test("findOne returns a country by 3 digit ISO 3166-1 alpha-3", () => {
    const result = countryCodes.findOne("countryCodeAlpha3", "AFG");
    expect(result).toBeDefined();
    if (result) {
      expect(result.countryNameEn).toBe("Afghanistan");
    }
  });

  test("Curaçao and Sint Maarten use the Caribbean guilder (XCG)", () => {
    expect(countryCodes.findOne("countryCode", "CW")?.currencyCode).toBe("XCG");
    expect(countryCodes.findOne("countryCode", "SX")?.currencyCode).toBe("XCG");
  });

  test("customArray returns mapped array with correct placeholders", () => {
    const fields = {
      customName: "{countryNameEn}",
      customCode: "{countryCode}",
    };
    const result = countryCodes.customArray(fields);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("customName");
    expect(result[0]).toHaveProperty("customCode");
  });

  test("Cuba uses the Cuban peso (CUP)", () => {
    expect(countryCodes.findOne("countryCode", "CU")?.currencyCode).toBe("CUP");
  });

  test("customList returns object with countryCode as key", () => {
    const list = countryCodes.customList("countryCode", "{countryNameEn}");
    expect(Object.keys(list).length).toBeGreaterThan(0);
    expect(list["AD"]).toBeDefined();
  });

  test("Sierra Leone uses the redenominated leone (SLE)", () => {
    expect(countryCodes.findOne("countryCode", "SL")?.currencyCode).toBe("SLE");
  });

  test("currency codes are valid ISO 4217 for Bolivia and Belarus", () => {
    expect(countryCodes.findOne("countryCode", "BO")?.currencyCode).toBe("BOB");
    expect(countryCodes.findOne("countryCode", "BY")?.currencyCode).toBe("BYN");
  });

  test("Croatia and Bulgaria use the euro", () => {
    expect(countryCodes.findOne("countryCode", "HR")?.currencyCode).toBe("EUR");
    expect(countryCodes.findOne("countryCode", "BG")?.currencyCode).toBe("EUR");
  });

  test("all countriesData are valid", () => {
    const data = countryCodes.all();
    const shape = {
      countryNameEn: expect.any(String),
      countryNameLocal: expect.any(String),
      countryCode: expect.any(String),
      currencyCode: expect.any(String),
      currencyNameEn: expect.any(String),
      tinType: expect.any(String),
      tinName: expect.any(String),
      officialLanguageCode: expect.any(String),
      officialLanguageNameEn: expect.any(String),
      officialLanguageNameLocal: expect.any(String),
      countryCallingCode: expect.any(String),
      region: expect.any(String),
      flag: expect.any(String),
    };
    data.forEach((country) => {
      expect(country).toMatchObject(shape);
    });
  });
});
