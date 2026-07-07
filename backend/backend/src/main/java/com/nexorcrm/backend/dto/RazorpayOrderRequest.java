package com.nexorcrm.backend.dto;

import java.math.BigDecimal;

public class RazorpayOrderRequest {
    private BigDecimal amount; // Amount in INR
    private Long leadId;
    private Long salesOrderId;

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public Long getLeadId() {
        return leadId;
    }

    public void setLeadId(Long leadId) {
        this.leadId = leadId;
    }

    public Long getSalesOrderId() {
        return salesOrderId;
    }

    public void setSalesOrderId(Long salesOrderId) {
        this.salesOrderId = salesOrderId;
    }
}
