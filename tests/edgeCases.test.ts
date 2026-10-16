import * as countryCodes from "../src/index";
import supplant from "../src/utils/supplant";

// ts-jest type-checks this file: an unused @ts-expect-error fails the suite.
describe("customArray types", () => {
  test("omitted fields infer { name, value } and check sortBy", () => {
    const rows = countryCodes.customArray(undefined, { sortBy: "name" });
    const name: string = rows[0].name;
    expect(typeof name).toBe("string");
    // @ts-expect-error -- not a key of { name, value }
    countryCodes.customArray(undefined, { sortBy: "nmae" });
    // @ts-expect-error -- rows only have name and value
    rows[0].doesNotExist;
    // @ts-expect-error -- a type argument cannot change the default shape
    countryCodes.customArray<{ foo: string }>();
  });

  test("explicit fields keep their own keys", () => {
    const rows = countryCodes.customArray({ label: "{countryCode}" });
    expect(Object.keys(rows[0])).toEqual(["label"]);
    // @ts-expect-error -- name is not a key of { label }
    rows[0].name;
  });

  test("an optional fields argument of the default shape still compiles", () => {
    const wrap = (fields?: { name: string; value: string }) =>
      countryCodes.customArray(fields, { sortBy: "name" });
    expect(wrap()[0].name).toBe("Afghanistan (AF)");
    expect(wrap({ name: "{countryCode}", value: "" })[0].name).toBe("AD");
  });

  test("inherited enumerable templates render and sort", () => {
    const fields = Object.create({ name: "{countryNameEn}" });
    expect(countryCodes.customArray(fields, { sortBy: "name" })[0].name).toBe(
      "Afghanistan"
    );
  });

  test("sortBy on an empty template keeps order; inherited names are ignored", () => {
    const unsorted = countryCodes.customArray({ code: "{countryCode}" });
    const byEmpty = countryCodes.customArray(
      { empty: "", code: "{countryCode}" },
      { sortBy: "empty" }
    );
    expect(byEmpty.map((r) => r.code)).toEqual(unsorted.map((r) => r.code));
    const viaInherited = countryCodes.customArray(
      { code: "{countryCode}" },
      { sortBy: "toString" as "code" }
    );
    expect(viaInherited).toEqual(unsorted);
  });
});

describe("groupBy with prototype-named keys", () => {
  test.each(["constructor", "toString", "__proto__", "hasOwnProperty"])(
    "groups %s as a plain key",
    (k) => {
      const items = [{ key: k }, { key: k }, { key: "x" }];
      const groups = countryCodes.utils.groupBy(items, "key");
      expect(Object.keys(groups)).toEqual([k, "x"]);
      expect(groups[k]).toHaveLength(2);
      expect(Object.getPrototypeOf(groups)).toBe(Object.prototype);
      expect(Object.prototype.hasOwnProperty.call(groups, "x")).toBe(true);
      expect(JSON.parse(JSON.stringify(groups))[k]).toHaveLength(2);
    }
  );
});

describe("supplant", () => {
  test("null renders as an empty string", () => {
    const list = countryCodes.customList("countryCode", "[{currencyDecimals}]");
    expect(list["AQ"]).toBe("[]");
    expect(list["JP"]).toBe("[0]");
  });

  test("unknown names, undefined and arrays stay as written", () => {
    expect(supplant("{nope} {u} {arr}", { u: undefined, arr: ["a"] })).toBe(
      "{nope} {u} {arr}"
    );
  });
});
