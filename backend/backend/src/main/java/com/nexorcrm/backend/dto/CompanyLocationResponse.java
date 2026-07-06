package com.nexorcrm.backend.dto;

public class CompanyLocationResponse {

    private Long id;
    private String name;
    private Double latitude;
    private Double longitude;
    private Integer radiusMeters;
    private Boolean active;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public Integer getRadiusMeters() { return radiusMeters; }
    public void setRadiusMeters(Integer radiusMeters) { this.radiusMeters = radiusMeters; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
