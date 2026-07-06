package com.nexorcrm.backend.validation;

import com.nexorcrm.backend.util.PhoneValidationUtil;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PhoneNumberValidator implements ConstraintValidator<ValidPhoneNumber, String> {

    @Override
    public void initialize(ValidPhoneNumber constraintAnnotation) {
        // Initialization if needed
    }

    @Override
    public boolean isValid(String phone, ConstraintValidatorContext context) {
        // If phone is null or empty, it's optional - use @NotBlank if required
        if (phone == null || phone.isBlank()) {
            return true;
        }

        // For field-level validation, we'll use default country code
        // The actual validation with country code should be done at service layer
        // where we have access to both country code and phone
        String countryCode = "+91"; // Default to India
        
        // Validate phone number
        String errorMessage = PhoneValidationUtil.validatePhoneNumber(phone, countryCode);

        if (!errorMessage.isEmpty()) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(errorMessage)
                    .addConstraintViolation();
            return false;
        }

        return true;
    }
}

