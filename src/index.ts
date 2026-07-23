import groupBy from "./utils/groupBy";
import supplant from "./utils/supplant";
import countriesData, {
  CountryData,
  CountryProperty,
  CountryScalarProperty,
} from "./countriesData";

export type { CountryData, CountryProperty, CountryScalarProperty };

export const utils = {
  groupBy,
};

/**
 * Every country in the dataset, in dataset order.
 *
 * Returns a fresh array each call, so reordering or resizing it is safe — the
 * dataset is module state shared by every export, and handing out a live
 * reference let one consumer's `sort()` or `push()` change what every later
 * call returned. The country objects themselves are still shared: treat them
 * as read-only.
 */
export function all(): CountryData[] {
  return [...countriesData];
}

export function filter(
  countryProperty: CountryScalarProperty,
  value: string
): CountryData[] {
  return countriesData.filter(
    (countryData: CountryData) => countryData[countryProperty] === value
  );
}

export function findOne(
  countryProperty: CountryScalarProperty,
  value: string
): CountryData | undefined {
  return countriesData.find(
    (countryData: CountryData) => countryData[countryProperty] === value
  );
}

/**
 * Resolves any 2- or 3-letter country code to its country, case-insensitively.
 *
 * Unlike {@link findOne}, this looks beyond the primary ISO 3166-1 alpha-2
 * value: it matches `countryCode`, `countryCodeAlpha3` and `altCodes`, so codes
 * that arrive from outside your control still resolve. `UK` is the common one —
 * it is exceptionally reserved for the United Kingdom, whose ISO code is `GB`,
 * and it turns up in browser locales, EU VAT numbers and legacy databases.
 *
 * Official codes always win: no country's `altCodes` may shadow another
 * country's `countryCode` or `countryCodeAlpha3`.
 *
 * @example
 * findOneByCode("UK")?.countryCode; // -> "GB"
 * findOneByCode("gbr")?.countryCode; // -> "GB"
 */
export function findOneByCode(code: string): CountryData | undefined {
  if (typeof code !== "string") return undefined;
  const trimmed = code.trim();
  // Validate before uppercasing: Unicode case mapping can turn invalid input
  // into a real code ("ß" and "ſs" uppercase to "SS", "ı" to "I"), which would
  // otherwise resolve to South Sudan and friends.
  if (!/^[A-Za-z]{2,3}$/.test(trimmed)) return undefined;
  const normalized = trimmed.toUpperCase();

  return (
    countriesData.find(
      (countryData: CountryData) =>
        countryData.countryCode === normalized ||
        countryData.countryCodeAlpha3 === normalized
    ) ??
    countriesData.find((countryData: CountryData) =>
      countryData.altCodes?.includes(normalized)
    )
  );
}

export function customArray(
  fields: Record<string, string> = {
    name: "{countryNameEn} ({countryCode})",
    value: "{countryCode}",
  },
  {
    sortBy,
    sortDataBy,
    filter: filterFunc,
  }: {
    sortBy?: CountryProperty;
    sortDataBy?: CountryScalarProperty;
    filter?: (cd: CountryData) => boolean;
  } = {}
) {
  const finalCollection: Record<string, string>[] = [];
  let data: CountryData[] = countriesData;
  if (typeof filterFunc === "function") {
    data = data.filter(filterFunc);
  }

  if (sortDataBy) {
    const collator = new Intl.Collator([], { sensitivity: "accent" });
    // Copy before sorting: without a `filter`, `data` still aliases
    // `countriesData`, and an in-place sort would permanently reorder the
    // dataset for `all`, `customList` and `customGroupedList` too.
    data = [...data].sort((a: CountryData, b: CountryData) =>
      collator.compare(a[sortDataBy] as string, b[sortDataBy] as string)
    );
  }

  data.forEach((countryData: CountryData) => {
    const collectionObject: Record<string, string> = {};
    for (const field in fields) {
      collectionObject[field] = supplant(fields[field], countryData);
    }
    finalCollection.push(collectionObject);
  });

  if (sortBy && fields[sortBy as string]) {
    const collator = new Intl.Collator([], { sensitivity: "accent" });
    finalCollection.sort((a, b) =>
      collator.compare(a[sortBy as string], b[sortBy as string])
    );
  }

  return finalCollection;
}

/**
 * Builds an object keyed by `key`, with each value rendered from `label`.
 *
 * `key` must be unique across the dataset, otherwise entries overwrite each
 * other and only the last one survives. `countryCode` and `countryCodeAlpha3`
 * are unique; `countryCallingCode`, `currencyCode` and `region` are not — use
 * {@link customGroupedList} for those.
 */
export function customList(
  key: CountryScalarProperty = "countryCode",
  label: string = "{countryNameEn} ({countryCode})",
  { filter: filterFunc }: { filter?: (cd: CountryData) => boolean } = {}
) {
  const finalObject: Record<string, string> = {};
  let data: CountryData[] = countriesData;
  if (typeof filterFunc === "function") {
    data = data.filter(filterFunc);
  }
  data.forEach((countryData: CountryData) => {
    const value = supplant(label, countryData);
    finalObject[String(countryData[key])] = value;
  });

  return finalObject;
}

/**
 * Same as {@link customList}, but every key maps to an array of all matching
 * countries instead of just the last one. Use this for keys that several
 * countries share — `countryCallingCode` (the US, Canada and the Caribbean all
 * answer to `"1"`), `currencyCode` (the euro zone), `region`,
 * `officialLanguageCode`.
 *
 * Groups keep dataset order and are never empty, but keys that matched no
 * country are absent altogether — hence `Partial`. This matters most with
 * `filter`, which can exclude a group entirely.
 *
 * @example
 * customGroupedList("countryCallingCode", "{countryCode}")["1"];
 * // -> ["AG", "AI", "AS", "BB", "BM", "CA", ...] — 26 NANP countries
 */
export function customGroupedList(
  key: CountryScalarProperty = "countryCallingCode",
  label: string = "{countryNameEn} ({countryCode})",
  { filter: filterFunc }: { filter?: (cd: CountryData) => boolean } = {}
): Partial<Record<string, string[]>> {
  const finalObject: Record<string, string[]> = {};
  let data: CountryData[] = countriesData;
  if (typeof filterFunc === "function") {
    data = data.filter(filterFunc);
  }
  data.forEach((countryData: CountryData) => {
    const groupKey = String(countryData[key]);
    if (!finalObject[groupKey]) {
      finalObject[groupKey] = [];
    }
    finalObject[groupKey].push(supplant(label, countryData));
  });

  return finalObject;
}
