import * as countryCodes from "../src/index";

const all = countryCodes.all();

describe("customGroupedList", () => {
  test("keeps every country, unlike customList (issue #24)", () => {
    const flat = countryCodes.customList("countryCallingCode", "{countryCode}");
    const grouped = countryCodes.customGroupedList(
      "countryCallingCode",
      "{countryCode}"
    );

    // Same set of keys...
    expect(Object.keys(grouped).sort()).toEqual(Object.keys(flat).sort());

    // ...but customList holds one country per key while the grouped list is
    // lossless: the group sizes add up to the full dataset.
    const total = Object.values(grouped).reduce((n, g) => n + g!.length, 0);
    expect(Object.keys(flat).length).toBeLessThan(all.length);
    expect(total).toBe(all.length);
  });

  test("every country appears in exactly one group, in dataset order", () => {
    const grouped = countryCodes.customGroupedList(
      "countryCallingCode",
      "{countryCode}"
    );
    const seen = Object.values(grouped).flat();
    expect(seen.sort()).toEqual(all.map((c) => c.countryCode).sort());

    const nanp = grouped["1"];
    expect(nanp).toEqual(
      all.filter((c) => c.countryCallingCode === "1").map((c) => c.countryCode)
    );
  });

  test("the +1 group holds several countries, not one", () => {
    const grouped = countryCodes.customGroupedList(
      "countryCallingCode",
      "{countryCode}"
    );
    // The exact membership depends on the dataset; what issue #24 needs is that
    // sharing a calling code no longer silently drops countries.
    expect(grouped["1"]!.length).toBeGreaterThan(1);
    expect(grouped["1"]).toEqual(expect.arrayContaining(["US", "CA", "DO"]));
  });

  test("no group is ever empty", () => {
    const grouped = countryCodes.customGroupedList("region", "{countryCode}");
    const empty = Object.entries(grouped).filter(([, g]) => g!.length === 0);
    expect(empty).toEqual([]);
  });

  test("renders the label template for each member", () => {
    const grouped = countryCodes.customGroupedList(
      "countryCode",
      "[{countryCode}] {countryNameEn}"
    );
    expect(grouped["AD"]).toEqual(["[AD] Andorra"]);
    expect(grouped["AF"]).toEqual(["[AF] Afghanistan"]);
  });

  test("a unique key yields single-element groups", () => {
    const grouped = countryCodes.customGroupedList(
      "countryCode",
      "{countryNameEn}"
    );
    const oversized = Object.entries(grouped)
      .filter(([, g]) => g!.length !== 1)
      .map(([k]) => k);
    expect(oversized).toEqual([]);
    expect(Object.keys(grouped).length).toBe(all.length);
  });

  test("honours the filter option", () => {
    const grouped = countryCodes.customGroupedList(
      "region",
      "{countryCode}",
      { filter: (c) => ["AR", "BR", "FR", "DE"].includes(c.countryCode) }
    );
    // Members keep dataset order (DE precedes FR in countriesData).
    expect(grouped).toEqual({
      "South/Latin America": ["AR", "BR"],
      Europe: ["DE", "FR"],
    });
  });

  test("a key that matched no country is absent, not an empty array", () => {
    const grouped = countryCodes.customGroupedList("region", "{countryCode}", {
      filter: (c) => c.countryCode === "AR",
    });
    expect(grouped["South/Latin America"]).toEqual(["AR"]);
    // The return type is Partial<Record<...>>, so this is `undefined` and the
    // compiler forces callers to handle it rather than crashing on `.length`.
    expect(grouped["Europe"]).toBeUndefined();
    expect(grouped["Europe"]?.length ?? 0).toBe(0);
    expect(Object.keys(grouped)).toEqual(["South/Latin America"]);
  });

  test("groups by currency, so the euro zone is not collapsed to one country", () => {
    const grouped = countryCodes.customGroupedList(
      "currencyCode",
      "{countryCode}"
    );
    expect(grouped["EUR"]).toEqual(expect.arrayContaining(["FR", "DE", "ES"]));
    expect(grouped["EUR"]!.length).toBeGreaterThan(3);
    // A currency used by exactly one country still gets an array.
    expect(grouped["JPY"]).toEqual(["JP"]);
  });

  test("defaults to grouping by countryCallingCode", () => {
    const grouped = countryCodes.customGroupedList();
    expect(grouped["54"]).toEqual(["Argentina (AR)"]);
  });
});

describe("array-valued properties are rejected as group keys", () => {
  test("customGroupedList accepts only scalar properties", () => {
    // @ts-expect-error areaCodes holds an array; String([...]) is not a key
    expect(countryCodes.customGroupedList("areaCodes", "{countryCode}")).toBeDefined();
    // @ts-expect-error same for altCodes — use findOneByCode to search those
    expect(countryCodes.customGroupedList("altCodes", "{countryCode}")).toBeDefined();
  });

  test("scalar properties still group correctly", () => {
    const byCurrency = countryCodes.customGroupedList(
      "currencyCode",
      "{countryCode}"
    );
    expect(byCurrency["JPY"]).toEqual(["JP"]);
  });
});
