package com.nexorcrm.backend.dto;

public class RazorpayOrderResponse {
    private String orderId;
    private String keyId;
    private int amount; // in paise
    private String currency;

    public RazorpayOrderResponse(String orderId, String keyId, int amount, String currency) {
        this.orderId = orderId;
        this.keyId = keyId;
        this.amount = amount;
        this.currency = currency;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getKeyId() {
        return keyId;
    }

    public void setKeyId(String keyId) {
        this.keyId = keyId;
    }

    public int getAmount() {
        return amount;
    }

    public void setAmount(int amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }
}
