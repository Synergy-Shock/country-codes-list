/**
 * Replaces placeholders in a string with values from an object.
 * @param template - The string containing placeholders.
 * @param data - The object containing key-value pairs for replacement.
 * @returns The string with placeholders replaced by values.
 */
export default function supplant(
  template: string,
  data: Record<string, unknown>
): string {
  return template.replace(
    /{([^{}]*)}/g,
    (match: string, key: string): string => {
      const value = data[key];
      return typeof value === "string" || typeof value === "number"
        ? value.toString()
        : match;
    }
  );
}
