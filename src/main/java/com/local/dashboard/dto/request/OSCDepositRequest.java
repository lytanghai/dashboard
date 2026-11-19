package com.local.dashboard.dto.request;

import com.local.dashboard.enumz.Currency;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class OSCDepositRequest {

    private Long oscId;

    private BigDecimal amount;

    private Currency currency;

    private LocalDateTime dateTime = LocalDateTime.now();
}
