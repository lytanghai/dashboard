package com.local.dashboard.dto.request;

import com.local.dashboard.enumz.Category;
import com.local.dashboard.enumz.Currency;
import com.local.dashboard.enumz.Type;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class FinanceRecordReqDto {

    private int no;

    private Category category;

    private Type type;

    private String remark;

    private BigDecimal amount;

    private Currency currency;

    private String date;
}
