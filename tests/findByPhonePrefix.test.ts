import { findByPhonePrefix, filter } from "../src/index";

const codes = (input: string) =>
  findByPhonePrefix(input).map((c) => c.countryCode);

describe("findByPhonePrefix", () => {
  test.each([
    ["+1 876 555 0100", ["JM"]],
    ["+1658", ["JM"]],
    ["001876", ["JM"]],
    ["1 (876) 555", ["JM"]],
    ["+1 (212) 555-0100", ["US", "UM"]],
    ["+1 416", ["CA"]],
    ["+44 20 7946 0958", ["GG", "IM", "JE", "GB"]],
    ["+7 495", ["KZ", "RU"]],
    ["+5999 123", ["CW"]],
    ["+5997", ["BQ"]],
    ["+599", ["BQ", "CW"]],
    ["+5995", ["BQ", "CW"]],
    ["+61 2", ["AU"]],
    ["+47 79", ["SJ"]],
    ["+47 22", ["BV", "NO"]],
    ["+54 9 11", ["AR"]],
    ["0054 11", ["AR"]],
  ])("%s -> %j", (input, expected) => {
    expect(codes(input)).toEqual(expected);
  });

  test("+1 alone or an unfinished area code returns the whole NANP group", () => {
    const nanp = filter("countryCallingCode", "1").map((c) => c.countryCode);
    expect(codes("+1")).toEqual(nanp);
    expect(codes("+1 8")).toEqual(nanp);
    expect(nanp).toHaveLength(26);
  });

  test.each(["", "   ", "abc", "+", "0", "011 1 876", "+0", "+999"])(
    "%j -> []",
    (input) => {
      expect(findByPhonePrefix(input)).toEqual([]);
    }
  );

  test("non-string input returns []", () => {
    expect(findByPhonePrefix(undefined as unknown as string)).toEqual([]);
  });

  test("returns a fresh array each call", () => {
    const a = findByPhonePrefix("+44");
    a.pop();
    expect(findByPhonePrefix("+44")).toHaveLength(4);
  });
});
