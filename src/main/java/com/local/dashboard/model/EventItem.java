package com.local.dashboard.model;

import lombok.Data;

@Data
public class EventItem {

    private String id;
    private String date;
    private String time;
    private String title;
    private String description;

    public EventItem() {
    }

    public EventItem(String id, String date, String time,
                     String title, String description) {
        this.id = id;
        this.date = date;
        this.time = time;
        this.title = title;
        this.description = description;
    }
}