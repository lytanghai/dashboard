package com.local.dashboard.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class FinanceResponseDto {

    private List<String> header;

    private List<Record> records;
}
