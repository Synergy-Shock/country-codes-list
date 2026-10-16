/**
 * Appends `value` to the array stored under `key`, creating it on first use.
 *
 * Group keys come from data, so they can be "constructor", "toString" or
 * "__proto__". A plain `obj[key]` read would find Object.prototype members
 * for those, and a plain assignment to "__proto__" would swap the prototype
 * instead of adding a key. This checks own properties only and defines new
 * groups as ordinary own, enumerable properties, so the result stays a normal
 * object (`hasOwnProperty`, `JSON.stringify` and spread all keep working).
 */
export function pushToGroup<V>(
  groups: Record<string, V[]>,
  key: string,
  value: V
): void {
  if (!Object.prototype.hasOwnProperty.call(groups, key)) {
    Object.defineProperty(groups, key, {
      value: [],
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }
  groups[key].push(value);
}

/**
 * Groups an array by a specified key.
 * @param array - The array to group.
 * @param key - The key to group the array by.
 * @returns An object where each key is a unique value from the array, and each value is an array of items from the original array that match the key.
 */
export default function groupBy<T>(
  array: T[],
  key: keyof T
): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  array.forEach((item) => pushToGroup(result, String(item[key]), item));
  return result;
}
