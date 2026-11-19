package com.local.dashboard.dto.request;

import com.local.dashboard.enumz.Status;
import lombok.Data;
import lombok.NonNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class OSCCreateRequest {

    @NonNull
    private String title;

    private String description;

    @NonNull
    private BigDecimal targetAmount;

    private String imageUrl;

    private String status = Status.IN_PROGRESS.name();

    private LocalDateTime createdDate = LocalDateTime.now();

    private LocalDateTime completedDate;
}
