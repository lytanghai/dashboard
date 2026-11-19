package com.local.dashboard.dto.request;

import lombok.Data;

@Data
public class OscListFilterRequest {
    private Long id;

    private String status;

    private String title;

    private String description;

    private String sortBy = "createdDate";

    private String sortDirection = "DESC";

    private Integer page = 0;

    private Integer size = 10;

}
