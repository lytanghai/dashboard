package com.local.dashboard.model;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class LibraryItem {

    private String id;
    private List<String> alias;
    private String title;
    private String category;
    private String description;
    private List<String> tags;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}