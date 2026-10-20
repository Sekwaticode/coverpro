// South African provinces. Profiles keep `country` as the ISO code "ZA" (the
// backend expects a country code) and carry the province alongside the town.
export const SOUTH_AFRICA_CODE = "ZA";

export const provinces = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
] as const;

export type Province = (typeof provinces)[number];

export const isProvince = (value: unknown): value is Province =>
  typeof value === "string" && (provinces as readonly string[]).includes(value);

/** Splits a stored "Town, Province" city value into its parts. */
export function splitTownProvince(value: string | null | undefined) {
  const text = (value ?? "").trim();
  const index = text.lastIndexOf(",");
  if (index !== -1) {
    const province = text.slice(index + 1).trim();
    if (isProvince(province)) {
      return { town: text.slice(0, index).trim(), province };
    }
  }
  return isProvince(text)
    ? { town: "", province: text }
    : { town: text, province: "" as const };
}

export const joinTownProvince = (town: string, province: string) =>
  [town.trim(), province.trim()].filter(Boolean).join(", ");
