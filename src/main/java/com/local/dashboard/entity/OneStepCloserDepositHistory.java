package com.local.dashboard.entity;

import com.local.dashboard.enumz.Currency;
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
@Table(name = "one_step_closer_deposit_history")
@Getter
@Setter
public class OneStepCloserDepositHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "osc_id")
    private Long oscId;

    @Column(name = "deposit_amount")
    private BigDecimal amount;

    @Column(name = "created_date")
    private LocalDateTime depositDate;

}
