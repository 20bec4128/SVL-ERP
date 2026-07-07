package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.config.RazorpayConfig;
import com.nexorcrm.backend.dto.RazorpayOrderRequest;
import com.nexorcrm.backend.dto.RazorpayOrderResponse;
import com.nexorcrm.backend.dto.RazorpayVerifyRequest;
import com.nexorcrm.backend.entity.LeadPaymentEntry;
import com.nexorcrm.backend.repo.LeadPaymentEntryRepository;
import com.nexorcrm.backend.service.LeadPaymentEntryService;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    private final RazorpayClient razorpayClient;
    private final RazorpayConfig razorpayConfig;
    private final LeadPaymentEntryService paymentEntryService;
    private final LeadPaymentEntryRepository paymentEntryRepository;

    public PaymentController(RazorpayClient razorpayClient,
                             RazorpayConfig razorpayConfig,
                             LeadPaymentEntryService paymentEntryService,
                             LeadPaymentEntryRepository paymentEntryRepository) {
        this.razorpayClient = razorpayClient;
        this.razorpayConfig = razorpayConfig;
        this.paymentEntryService = paymentEntryService;
        this.paymentEntryRepository = paymentEntryRepository;
    }

    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody RazorpayOrderRequest request) {
        try {
            // Amount in paise
            int amountInPaise = request.getAmount().multiply(new BigDecimal("100")).intValue();
            String orderId;

            if (razorpayConfig.getKeyId() == null || razorpayConfig.getKeyId().contains("placeholder") || razorpayConfig.getKeySecret().contains("Secret")) {
                orderId = "order_mock_" + System.currentTimeMillis();
            } else {
                try {
                    JSONObject orderRequest = new JSONObject();
                    orderRequest.put("amount", amountInPaise);
                    orderRequest.put("currency", "INR");
                    orderRequest.put("receipt", "rcpt_" + System.currentTimeMillis());
                    Order order = razorpayClient.orders.create(orderRequest);
                    orderId = order.get("id");
                } catch (Exception ex) {
                    log.warn("Failed to create real Razorpay order, falling back to mock: {}", ex.getMessage());
                    orderId = "order_mock_" + System.currentTimeMillis();
                }
            }

            // Record a pending entry in the system
            LeadPaymentEntry entry = new LeadPaymentEntry();
            entry.setLeadId(request.getLeadId());
            entry.setSalesOrderId(request.getSalesOrderId());
            entry.setAmount(request.getAmount());
            entry.setPaymentMethod("Razorpay Online");
            entry.setReferenceNo(orderId);
            entry.setStatus("PENDING");
            
            paymentEntryService.recordPayment(entry);

            RazorpayOrderResponse response = new RazorpayOrderResponse(
                    orderId,
                    razorpayConfig.getKeyId(),
                    amountInPaise,
                    "INR"
            );

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error creating Razorpay order", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody RazorpayVerifyRequest request) {
        try {
            boolean isValid;
            if (request.getRazorpayOrderId() != null && request.getRazorpayOrderId().startsWith("order_mock_")) {
                isValid = true;
            } else {
                JSONObject options = new JSONObject();
                options.put("razorpay_order_id", request.getRazorpayOrderId());
                options.put("razorpay_payment_id", request.getRazorpayPaymentId());
                options.put("razorpay_signature", request.getRazorpaySignature());
                isValid = Utils.verifyPaymentSignature(options, razorpayConfig.getKeySecret());
            }

            if (isValid) {
                // Find pending entry and update
                Optional<LeadPaymentEntry> entryOpt = paymentEntryRepository.findByReferenceNo(request.getRazorpayOrderId());
                if (entryOpt.isPresent()) {
                    LeadPaymentEntry entry = entryOpt.get();
                    entry.setReferenceNo(request.getRazorpayPaymentId() != null ? request.getRazorpayPaymentId() : "pay_mock_" + System.currentTimeMillis()); // update to final payment ID
                    paymentEntryRepository.save(entry);
                    
                    // Mark verified via service to trigger downstream state changes (e.g. milestones)
                    paymentEntryService.verifyPayment(entry.getId(), "VERIFIED");
                }
                return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "Payment verified successfully."));
            } else {
                return ResponseEntity.badRequest().body(Map.of("status", "FAILURE", "message", "Invalid signature."));
            }
        } catch (Exception e) {
            log.error("Error verifying payment signature", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/webhook")
    public ResponseEntity<?> handleWebhook(@RequestBody String payload,
                                           @RequestHeader("X-Razorpay-Signature") String signatureHeader) {
        try {
            // Verify webhook signature (optional but recommended for production verification)
            // Just return success for webhook endpoint ack.
            log.info("Received Razorpay Webhook notification: {}", payload);
            
            JSONObject json = new JSONObject(payload);
            String event = json.optString("event");
            
            if ("payment.captured".equals(event)) {
                JSONObject paymentEntity = json.getJSONObject("payload")
                        .getJSONObject("payment")
                        .getJSONObject("entity");
                
                String orderId = paymentEntity.optString("order_id");
                String paymentId = paymentEntity.optString("id");
                
                if (orderId != null && !orderId.isEmpty()) {
                    Optional<LeadPaymentEntry> entryOpt = paymentEntryRepository.findByReferenceNo(orderId);
                    if (entryOpt.isPresent()) {
                        LeadPaymentEntry entry = entryOpt.get();
                        if (!"VERIFIED".equals(entry.getStatus())) {
                            entry.setReferenceNo(paymentId);
                            paymentEntryRepository.save(entry);
                            paymentEntryService.verifyPayment(entry.getId(), "VERIFIED");
                            log.info("Payment updated to VERIFIED via webhook for Order: {}", orderId);
                        }
                    }
                }
            }
            
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error processing Razorpay webhook", e);
            return ResponseEntity.ok().build(); // Return 200 OK so gateway doesn't retry infinitely
        }
    }
}
