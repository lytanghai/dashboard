package com.local.dashboard.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class OscResponse {

    private Long id;

    private String title;

    private String description;

    @JsonProperty("current_amount")
    private BigDecimal currentAmount;

    @JsonProperty("target_amount")
    private BigDecimal targetAmount;

    @JsonProperty("image_url")
    private String imageUrl;

    private String status;

    @JsonProperty("created_date")
    private LocalDateTime createdDate;

    @JsonProperty("completed_date")
    private LocalDateTime completedDate;
}
