import { getCountries, getCountryCallingCode } from "libphonenumber-js";
import metadata from "libphonenumber-js/metadata.min.json";

const metadataCountries = metadata?.countries || {};
const countryNameFormatter =
  typeof Intl !== "undefined" && Intl.DisplayNames
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

export const COUNTRY_CODE_OPTIONS = getCountries()
  .map((country) => {
    const callingCode = getCountryCallingCode(country);
    const entry = metadataCountries[country];
    const possibleLengths = Array.isArray(entry?.[3]) ? entry[3].filter(Number.isInteger) : [];
    const maxLength = possibleLengths.length ? Math.max(...possibleLengths) : 15;
    const displayName = countryNameFormatter?.of(country) || country;
    return {
      country,
      value: `+${callingCode}`,
      callingCode: String(callingCode),
      maxLength,
      label: `${displayName} (+${callingCode})`,
    };
  })
  .sort((a, b) => {
    const diff = Number(a.callingCode) - Number(b.callingCode);
    if (diff !== 0) return diff;
    return a.label.localeCompare(b.label);
  });

export const defaultCountryOption = COUNTRY_CODE_OPTIONS.find((opt) => opt.value === "+91") || COUNTRY_CODE_OPTIONS[0] || {
  value: "+91",
  maxLength: 10,
  label: "India (+91)",
};

export const ensureCountryCodeValue = (value) => {
  if (!value) return defaultCountryOption.value;
  return value.startsWith("+") ? value : `+${value}`;
};

export const getCountryOptionByValue = (value) =>
  COUNTRY_CODE_OPTIONS.find((opt) => opt.value === ensureCountryCodeValue(value)) || defaultCountryOption;

const PHONE_LENGTH_OVERRIDES = {
  "+93": [9],
  "+355": [9],
  "+213": [9],
  "+376": [6],
  "+244": [9],
  "+54": [10],
  "+374": [8],
  "+61": [9],
  "+43": [10],
  "+994": [9],
  "+973": [8],
  "+880": [10],
  "+375": [9],
  "+32": [9],
  "+501": [7],
  "+229": [8],
  "+975": [8],
  "+591": [8],
  "+387": [8],
  "+267": [8],
  "+55": [10, 11],
  "+673": [7],
  "+359": [9],
  "+226": [8],
  "+257": [8],
  "+855": [8, 9],
  "+237": [9],
  "+56": [9],
  "+86": [11],
  "+57": [10],
  "+506": [8],
  "+385": [9],
  "+53": [8],
  "+357": [8],
  "+420": [9],
  "+45": [8],
  "+593": [9],
  "+20": [10],
  "+503": [8],
  "+372": [7, 8],
  "+251": [9],
  "+358": [9],
  "+33": [9],
  "+995": [9],
  "+49": [10, 11],
  "+233": [9],
  "+30": [10],
  "+502": [8],
  "+509": [8],
  "+504": [8],
  "+852": [8],
  "+36": [9],
  "+354": [7],
  "+91": [10],
  "+62": [9, 10, 11],
  "+98": [10],
  "+964": [10],
  "+353": [9],
  "+972": [9],
  "+39": [9, 10],
  "+81": [10, 11],
  "+962": [9],
  "+7": [10],
  "+254": [9],
  "+965": [8],
  "+996": [9],
  "+856": [8, 9],
  "+371": [8],
  "+961": [8],
  "+218": [9],
  "+370": [8],
  "+352": [9],
  "+853": [8],
  "+261": [9],
  "+265": [9],
  "+60": [9, 10],
  "+960": [7],
  "+223": [8],
  "+356": [8],
  "+230": [8],
  "+52": [10],
  "+373": [8],
  "+976": [8],
  "+212": [9],
  "+258": [9],
  "+95": [8, 9, 10],
  "+264": [9],
  "+977": [10],
  "+31": [9],
  "+64": [8, 9],
  "+505": [8],
  "+234": [10],
  "+850": [10],
  "+47": [8],
  "+968": [8],
  "+92": [10],
  "+507": [8],
  "+595": [9],
  "+51": [9],
  "+63": [10],
  "+48": [9],
  "+351": [9],
  "+974": [8],
  "+40": [9],
  "+250": [9],
  "+966": [9],
  "+221": [9],
  "+381": [8, 9],
  "+65": [8],
  "+421": [9],
  "+386": [8],
  "+27": [9],
  "+82": [9, 10],
  "+34": [9],
  "+94": [9],
  "+249": [9],
  "+46": [9],
  "+41": [9],
  "+963": [9],
  "+886": [9],
  "+255": [9],
  "+66": [9],
  "+216": [8],
  "+90": [10],
  "+256": [9],
  "+380": [9],
  "+971": [9],
  "+44": [10],
  "+598": [8],
  "+998": [9],
  "+58": [10],
  "+84": [9, 10],
  "+967": [9],
  "+260": [9],
  "+263": [9],
};

export const getCountryAllowedLengths = (countryCode) =>
  PHONE_LENGTH_OVERRIDES[ensureCountryCodeValue(countryCode)] || [];

export const sanitizePhoneDigits = (value, maxLength, lengths = []) => {
  const digits = (value || "").replace(/\D/g, "");
  const limit =
    lengths.length > 0
      ? Math.max(...lengths)
      : maxLength || 15;
  return digits.slice(0, limit);
};

export const getCountryDisplayMaxLength = (countryCode) => {
  const lengths = getCountryAllowedLengths(countryCode);
  if (lengths.length === 0) {
    const option = getCountryOptionByValue(countryCode);
    return option?.maxLength || 0;
  }
  return lengths[0];
};

export const validatePhoneNumber = (phone, countryCode) => {
  const option = getCountryOptionByValue(countryCode);
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) {
    return "Mobile number is required";
  }
  const override = getCountryAllowedLengths(countryCode);
  if (override.length) {
    if (!override.includes(digits.length)) {
      return `Mobile number must be ${override.join(" or ")} digits for ${option.label}`;
    }
    return "";
  }
  const required = option?.maxLength && option.maxLength > 0 ? option.maxLength : digits.length;
  if (required && digits.length !== required) {
    return `Mobile number must be ${required} digits for ${option.label}`;
  }
  return "";
};
