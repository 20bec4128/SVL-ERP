package com.nexorcrm.backend.config;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RazorpayConfig {

    @Value("${razorpay.key.id:rzp_test_placeholderKey}")
    private String keyId;

    @Value("${razorpay.key.secret:placeholderSecret}")
    private String keySecret;

    @Bean
    public RazorpayClient razorpayClient() throws RazorpayException {
        // If credentials are placeholders, return a client but print a warning.
        // It won't fail startup, but will fail actual API calls unless updated.
        return new RazorpayClient(keyId, keySecret);
    }

    public String getKeyId() {
        return keyId;
    }

    public String getKeySecret() {
        return keySecret;
    }
}
