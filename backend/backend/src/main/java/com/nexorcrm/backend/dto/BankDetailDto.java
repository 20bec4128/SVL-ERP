package com.nexorcrm.backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;

public class BankDetailDto {

    private String bankAccountHolderName;
    private String bankName;
    private String bankAccountNumber;
    private String bankIfscCode;
    private String bankBranchName;
    private String bankAccountType;
    private String upiId;
    @JsonAlias({"upiNo", "upi_number"})
    private String upiNumber;
    private String upiQrImage;

    public String getBankAccountHolderName() { return bankAccountHolderName; }
    public void setBankAccountHolderName(String bankAccountHolderName) { this.bankAccountHolderName = bankAccountHolderName; }
    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }
    public String getBankAccountNumber() { return bankAccountNumber; }
    public void setBankAccountNumber(String bankAccountNumber) { this.bankAccountNumber = bankAccountNumber; }
    public String getBankIfscCode() { return bankIfscCode; }
    public void setBankIfscCode(String bankIfscCode) { this.bankIfscCode = bankIfscCode; }
    public String getBankBranchName() { return bankBranchName; }
    public void setBankBranchName(String bankBranchName) { this.bankBranchName = bankBranchName; }
    public String getBankAccountType() { return bankAccountType; }
    public void setBankAccountType(String bankAccountType) { this.bankAccountType = bankAccountType; }
    public String getUpiId() { return upiId; }
    public void setUpiId(String upiId) { this.upiId = upiId; }
    public String getUpiNumber() { return upiNumber; }
    public void setUpiNumber(String upiNumber) { this.upiNumber = upiNumber; }
    public String getUpiQrImage() { return upiQrImage; }
    public void setUpiQrImage(String upiQrImage) { this.upiQrImage = upiQrImage; }
}
