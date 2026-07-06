package com.nexorcrm.backend.dto;

import java.util.List;

public class CheckDuplicatesRequest {

    private List<ContactItem> contacts;

    public List<ContactItem> getContacts() { return contacts; }
    public void setContacts(List<ContactItem> contacts) { this.contacts = contacts; }

    public static class ContactItem {
        private String mobile;
        private String email;

        public String getMobile() { return mobile; }
        public void setMobile(String mobile) { this.mobile = mobile; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }
}
