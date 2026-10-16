import groupBy, { pushToGroup } from "./utils/groupBy";
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

/**
 * Countries whose `countryProperty` matches `value` exactly.
 *
 * Returns a fresh array each call, but the country objects inside it are live
 * references into the shared dataset — they are not copied; treat them as
 * read-only.
 */
export function filter(
  countryProperty: CountryScalarProperty,
  value: string
): CountryData[] {
  return countriesData.filter(
    (countryData: CountryData) => countryData[countryProperty] === value
  );
}

/**
 * The first country whose `countryProperty` matches `value` exactly, in
 * dataset order.
 *
 * Returns a live reference into the shared dataset — the country object is
 * not copied; treat it as read-only.
 */
export function findOne(
  countryProperty: CountryScalarProperty,
  value: string
): CountryData | undefined {
  return countriesData.find(
    (countryData: CountryData) => countryData[countryProperty] === value
  );
}

/**
 * Resolves any 2- or 3-letter country code, or ISO 3166-1 numeric code, to its
 * country, case-insensitively.
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
 * A string of exactly three ASCII digits is looked up as an ISO 3166-1
 * numeric code instead (`"840"` -> US). Leading zeros are significant:
 * `"004"` resolves, `"4"` does not.
 *
 * Returns a live reference into the shared dataset — the country object is
 * not copied; treat it as read-only.
 *
 * @example
 * findOneByCode("UK")?.countryCode; // -> "GB"
 * findOneByCode("gbr")?.countryCode; // -> "GB"
 * findOneByCode("840")?.countryCode; // -> "US"
 */
export function findOneByCode(code: string): CountryData | undefined {
  if (typeof code !== "string") return undefined;
  const trimmed = code.trim();
  if (/^[0-9]{3}$/.test(trimmed)) {
    return countriesData.find(
      (countryData: CountryData) => countryData.countryCodeNumeric === trimmed
    );
  }
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

/**
 * Renders every country into an object shaped like `fields`, one output key
 * per template.
 *
 * `sortBy` sorts by a key of the **output** object (`"name"`, `"value"`, …)
 * after rendering. `sortDataBy` sorts by a dataset property
 * (`"countryNameEn"`, …) before rendering. Both use a locale-aware,
 * accent-sensitive collator.
 */
type CustomArrayOptions<F> = {
  sortBy?: keyof F;
  sortDataBy?: CountryScalarProperty;
  filter?: (cd: CountryData) => boolean;
};

const DEFAULT_ARRAY_FIELDS = {
  name: "{countryNameEn} ({countryCode})",
  value: "{countryCode}",
};

// Without `fields` the output is always { name, value }, so that overload
// takes no type parameter: `customArray<{ foo: string }>()` cannot claim a
// shape the call does not produce, and `sortBy` is checked against
// "name" | "value".
export function customArray(
  fields?: undefined,
  options?: CustomArrayOptions<typeof DEFAULT_ARRAY_FIELDS>
): Record<"name" | "value", string>[];
export function customArray<F extends Record<string, string>>(
  fields: F,
  options?: CustomArrayOptions<F>
): Record<keyof F, string>[];
// For callers that forward an optional `fields` argument of the default shape.
export function customArray(
  fields: typeof DEFAULT_ARRAY_FIELDS | undefined,
  options?: CustomArrayOptions<typeof DEFAULT_ARRAY_FIELDS>
): Record<"name" | "value", string>[];
export function customArray<F extends Record<string, string>>(
  fields: F = DEFAULT_ARRAY_FIELDS as Record<string, string> as F,
  { sortBy, sortDataBy, filter: filterFunc }: CustomArrayOptions<F> = {}
): Record<keyof F, string>[] {
  const finalCollection: Record<keyof F, string>[] = [];
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
    const collectionObject = {} as Record<keyof F, string>;
    for (const field in fields) {
      collectionObject[field] = supplant(fields[field], countryData);
    }
    finalCollection.push(collectionObject);
  });

  // Sort when `sortBy` is a rendered key. Not template truthiness: an empty
  // template ("") is still a key, while Object.prototype names are not.
  if (
    sortBy !== undefined &&
    finalCollection.length > 0 &&
    Object.prototype.hasOwnProperty.call(finalCollection[0], sortBy)
  ) {
    const collator = new Intl.Collator([], { sensitivity: "accent" });
    finalCollection.sort((a, b) => collator.compare(a[sortBy], b[sortBy]));
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
    pushToGroup(
      finalObject,
      String(countryData[key]),
      supplant(label, countryData)
    );
  });

  return finalObject;
}
