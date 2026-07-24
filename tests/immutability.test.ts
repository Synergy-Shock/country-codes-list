import * as countryCodes from "../src/index";

/**
 * The dataset is module state shared by every export. No public function may
 * reorder or resize it, and no value handed to a consumer may be a live
 * reference to it — otherwise one call silently changes what every later call
 * returns, for the whole process.
 */
describe("the shared dataset survives the public API", () => {
  test("customArray with sortDataBy leaves the dataset order untouched", () => {
    const before = countryCodes.all().map((country) => country.countryCode);

    countryCodes.customArray(
      { name: "{countryNameEn}", value: "{countryCode}" },
      { sortDataBy: "countryNameLocal" }
    );

    expect(countryCodes.all().map((country) => country.countryCode)).toEqual(
      before
    );
  });

  test("customArray with sortDataBy keeps customGroupedList's documented dataset order", () => {
    const before = countryCodes.customGroupedList(
      "countryCallingCode",
      "{countryCode}"
    )["1"];

    countryCodes.customArray(
      { name: "{countryNameEn}", value: "{countryCode}" },
      { sortDataBy: "countryNameEn" }
    );

    expect(
      countryCodes.customGroupedList("countryCallingCode", "{countryCode}")["1"]
    ).toEqual(before);
  });

  test("customArray still sorts its own output when sortDataBy is given", () => {
    const result = countryCodes.customArray(
      { name: "{countryNameEn}", value: "{countryCode}" },
      { sortDataBy: "countryNameEn" }
    );

    const names = result.map((entry) => entry.name);
    const collator = new Intl.Collator([], { sensitivity: "accent" });
    expect(names).toEqual([...names].sort(collator.compare));
  });

  test("sortDataBy composes with filter without touching the dataset", () => {
    const before = countryCodes.all().map((country) => country.countryCode);

    const result = countryCodes.customArray(
      { value: "{countryCode}" },
      {
        filter: (country) => country.countryCallingCode === "1",
        sortDataBy: "countryNameEn",
      }
    );

    expect(result.length).toBeGreaterThan(1);
    expect(countryCodes.all().map((country) => country.countryCode)).toEqual(
      before
    );
  });

  test("all() hands out a copy, so a consumer cannot corrupt the dataset", () => {
    const pristine = countryCodes.all().map((country) => country.countryCode);

    const handed = countryCodes.all();
    handed.push(handed[0]);
    handed.reverse();

    expect(countryCodes.all().map((country) => country.countryCode)).toEqual(
      pristine
    );
  });
});
