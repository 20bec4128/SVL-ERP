package com.nexorcrm.backend.util;

import java.util.*;

public class PhoneValidationUtil {

    // Country phone length overrides map
    private static final Map<String, int[]> PHONE_LENGTH_OVERRIDES = new HashMap<>();

    static {
        // Initialize phone length overrides for specific countries
        PHONE_LENGTH_OVERRIDES.put("+91", new int[]{10});  // India
        PHONE_LENGTH_OVERRIDES.put("+1", new int[]{10});   // USA/Canada
        PHONE_LENGTH_OVERRIDES.put("+44", new int[]{10});  // UK
        PHONE_LENGTH_OVERRIDES.put("+86", new int[]{11});  // China
        PHONE_LENGTH_OVERRIDES.put("+81", new int[]{10, 11}); // Japan
        PHONE_LENGTH_OVERRIDES.put("+49", new int[]{10, 11}); // Germany
        PHONE_LENGTH_OVERRIDES.put("+33", new int[]{9});   // France
        PHONE_LENGTH_OVERRIDES.put("+39", new int[]{9, 10}); // Italy
        PHONE_LENGTH_OVERRIDES.put("+34", new int[]{9});   // Spain
        PHONE_LENGTH_OVERRIDES.put("+61", new int[]{9});   // Australia
        PHONE_LENGTH_OVERRIDES.put("+64", new int[]{8, 9}); // New Zealand
        PHONE_LENGTH_OVERRIDES.put("+55", new int[]{10, 11}); // Brazil
        PHONE_LENGTH_OVERRIDES.put("+92", new int[]{10});  // Pakistan
        PHONE_LENGTH_OVERRIDES.put("+62", new int[]{9, 10, 11}); // Indonesia
        PHONE_LENGTH_OVERRIDES.put("+60", new int[]{9, 10}); // Malaysia
        PHONE_LENGTH_OVERRIDES.put("+66", new int[]{9});   // Thailand
        PHONE_LENGTH_OVERRIDES.put("+84", new int[]{9, 10}); // Vietnam
        PHONE_LENGTH_OVERRIDES.put("+82", new int[]{9, 10}); // South Korea
        PHONE_LENGTH_OVERRIDES.put("+63", new int[]{10});  // Philippines
        PHONE_LENGTH_OVERRIDES.put("+65", new int[]{8});   // Singapore
    }

    private static final Map<String, Integer> DEFAULT_MAX_LENGTHS = new HashMap<>();

    static {
        // Default max lengths for countries (fallback)
        DEFAULT_MAX_LENGTHS.put("+91", 10);
        DEFAULT_MAX_LENGTHS.put("+1", 10);
        DEFAULT_MAX_LENGTHS.put("+44", 10);
        DEFAULT_MAX_LENGTHS.put("+86", 11);
        DEFAULT_MAX_LENGTHS.put("+81", 11);
        DEFAULT_MAX_LENGTHS.put("+49", 11);
        DEFAULT_MAX_LENGTHS.put("+33", 9);
        DEFAULT_MAX_LENGTHS.put("+39", 10);
        DEFAULT_MAX_LENGTHS.put("+34", 9);
        DEFAULT_MAX_LENGTHS.put("+61", 9);
        DEFAULT_MAX_LENGTHS.put("+64", 9);
        DEFAULT_MAX_LENGTHS.put("+55", 11);
        DEFAULT_MAX_LENGTHS.put("+992", 10);
        DEFAULT_MAX_LENGTHS.put("+62", 11);
        DEFAULT_MAX_LENGTHS.put("+60", 10);
        DEFAULT_MAX_LENGTHS.put("+66", 9);
        DEFAULT_MAX_LENGTHS.put("+84", 10);
        DEFAULT_MAX_LENGTHS.put("+82", 10);
        DEFAULT_MAX_LENGTHS.put("+63", 10);
        DEFAULT_MAX_LENGTHS.put("+65", 8);
    }

    /**
     * Ensures country code starts with "+"
     */
    public static String ensureCountryCodeValue(String value) {
        if (value == null || value.isBlank()) {
            return "+91"; // Default to India
        }
        return value.startsWith("+") ? value : "+" + value;
    }

    /**
     * Get allowed phone lengths for a country
     */
    public static int[] getCountryAllowedLengths(String countryCode) {
        String code = ensureCountryCodeValue(countryCode);
        return PHONE_LENGTH_OVERRIDES.getOrDefault(code, new int[]{});
    }

    /**
     * Get default max length for a country
     */
    public static int getCountryDisplayMaxLength(String countryCode) {
        String code = ensureCountryCodeValue(countryCode);
        return DEFAULT_MAX_LENGTHS.getOrDefault(code, 15);
    }

    /**
     * Sanitize phone number - remove non-digit characters and limit length
     */
    public static String sanitizePhoneDigits(String value, int maxLength) {
        if (value == null) return "";
        String digits = value.replaceAll("[^0-9]", "");
        return digits.length() > maxLength ? digits.substring(0, maxLength) : digits;
    }

    /**
     * Validate phone number against country requirements
     * @return error message if invalid, empty string if valid
     */
    public static String validatePhoneNumber(String phone, String countryCode) {
        String code = ensureCountryCodeValue(countryCode);
        String digits = phone == null ? "" : phone.replaceAll("[^0-9]", "");

        if (digits.isBlank()) {
            return "Mobile number is required";
        }

        int[] allowedLengths = getCountryAllowedLengths(code);

        if (allowedLengths.length > 0) {
            // Check if digit count matches one of the allowed lengths
            boolean matches = false;
            for (int len : allowedLengths) {
                if (digits.length() == len) {
                    matches = true;
                    break;
                }
            }
            if (!matches) {
                String lengthStr = allowedLengths.length == 1 ? String.valueOf(allowedLengths[0])
                        : Arrays.toString(allowedLengths).replaceAll("[\\[\\]]", "");
                return String.format("Mobile number must be %s digits for %s", lengthStr, code);
            }
            return "";
        }

        // Fallback: check if length matches expected max length
        int expectedLength = getCountryDisplayMaxLength(code);
        if (expectedLength > 0 && digits.length() != expectedLength) {
            return String.format("Mobile number must be %d digits for %s", expectedLength, code);
        }

        return "";
    }

    /**
     * Check if country code is valid (exists in common country codes)
     */
    public static boolean isValidCountryCode(String countryCode) {
        if (countryCode == null || countryCode.isBlank()) {
            return true; // Will default to +91
        }
        String code = ensureCountryCodeValue(countryCode);
        // Accept any country code that has a max length defined
        return DEFAULT_MAX_LENGTHS.containsKey(code) || code.matches("^\\+\\d{1,3}$");
    }
}
