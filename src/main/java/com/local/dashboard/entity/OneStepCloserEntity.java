package com.local.dashboard.entity;

import com.local.dashboard.enumz.Status;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "one_step_closer")
@Getter
@Setter
public class OneStepCloserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title")
    private String title;

    @Column(name = "description")
    private String description;

    @Column(name = "current_amount")
    private BigDecimal currentAmount;

    @Column(name = "target_amount")
    private BigDecimal targetAmount;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "status")
    private String status = Status.IN_PROGRESS.name();

    @Column(name = "created_date", nullable = false)
    private LocalDateTime createdDate = LocalDateTime.now();

    @Column(name = "completed_date")
    private LocalDateTime completedDate;
}
