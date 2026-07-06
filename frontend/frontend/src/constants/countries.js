import { COUNTRY_CODES } from "./countryCodes";

const uniqueCountryNames = Array.from(
  new Set(
    COUNTRY_CODES.map((entry) => entry?.name?.trim()).filter(Boolean),
  ),
).sort((a, b) => a.localeCompare(b));

export const COUNTRY_OPTIONS = uniqueCountryNames;
export const DEFAULT_COUNTRY_OF_REGISTRATION = "India";
