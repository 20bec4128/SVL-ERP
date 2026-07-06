package com.nexorcrm.backend.dto;

import java.util.List;

public class RemoveBannedIpsRequest {
    private List<String> ipAddresses;

    public List<String> getIpAddresses() {
        return ipAddresses;
    }

    public void setIpAddresses(List<String> ipAddresses) {
        this.ipAddresses = ipAddresses;
    }
}
