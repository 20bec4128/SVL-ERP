package com.nexorcrm.backend.dto;

public class PriceListCountResponse {
    private Long id;
    private String name;
    private long totalCount;

    public PriceListCountResponse() {}

    public PriceListCountResponse(Long id, String name, long totalCount) {
        this.id = id;
        this.name = name;
        this.totalCount = totalCount;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public long getTotalCount() {
        return totalCount;
    }

    public void setTotalCount(long totalCount) {
        this.totalCount = totalCount;
    }
}
