package com.nexorcrm.backend.dto;

public class DashboardStatResponse {
    private Long id;
    private String iconBg;
    private String icon;
    private String title;
    private String value;
    private String trendClass;
    private String trendIcon;
    private String trend;
    private String link;
    private String linkLabel;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getIconBg() {
        return iconBg;
    }

    public void setIconBg(String iconBg) {
        this.iconBg = iconBg;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getTrendClass() {
        return trendClass;
    }

    public void setTrendClass(String trendClass) {
        this.trendClass = trendClass;
    }

    public String getTrendIcon() {
        return trendIcon;
    }

    public void setTrendIcon(String trendIcon) {
        this.trendIcon = trendIcon;
    }

    public String getTrend() {
        return trend;
    }

    public void setTrend(String trend) {
        this.trend = trend;
    }

    public String getLink() {
        return link;
    }

    public void setLink(String link) {
        this.link = link;
    }

    public String getLinkLabel() {
        return linkLabel;
    }

    public void setLinkLabel(String linkLabel) {
        this.linkLabel = linkLabel;
    }
}
