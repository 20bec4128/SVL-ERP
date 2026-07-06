package com.nexorcrm.backend.dto;

import com.nexorcrm.backend.entity.ServiceType;

import java.util.ArrayList;
import java.util.List;

public class ServiceTypeTreeResponse extends ServiceTypeResponse {

    private List<ServiceTypeTreeResponse> children = new ArrayList<>();

    public ServiceTypeTreeResponse(ServiceType serviceType) {
        super(serviceType);
    }

    public List<ServiceTypeTreeResponse> getChildren() {
        return children;
    }

    public void setChildren(List<ServiceTypeTreeResponse> children) {
        this.children = children;
    }
}
