package com.local.dashboard.dto.response;

import com.local.dashboard.enumz.Category;
import com.local.dashboard.enumz.Currency;
import com.local.dashboard.enumz.Type;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class Record {

    private String no;

    private String date;

    private BigDecimal amount;

    private Currency currency;

    private Category category;

    private Type type;

    private String remark;

}
