export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function normalizedSearch(value: string) {
  return value.trim().toLocaleLowerCase().replaceAll(/\s+/g, "");
}
