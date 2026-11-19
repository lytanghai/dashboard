package com.local.dashboard.controller;

import com.local.dashboard.dto.request.FinanceRecordReqDto;
import com.local.dashboard.dto.response.FinanceResponseDto;
import com.local.dashboard.enumz.Category;
import com.local.dashboard.enumz.Currency;
import com.local.dashboard.enumz.Type;
import com.local.dashboard.service.FinanceService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.YearMonth;

@Controller
@RequestMapping("/finance")
@AllArgsConstructor
public class FinanceController {

    private final FinanceService financeService;

    // Thymeleaf dashboard
    @GetMapping("/home")
    public String financeDashboard(Model model) throws IOException {

        YearMonth currentMonth = YearMonth.now();

        FinanceResponseDto response =
                financeService.queryCsvRecords(currentMonth.toString());

        model.addAttribute("categories", Category.values());
        model.addAttribute("types", Type.values());
        model.addAttribute("currencies", Currency.values());

        model.addAttribute("financeResponse", response);
        model.addAttribute("currentMonthValue", currentMonth.toString());

        return "finance";
    }

    // Query monthly CSV records
    @GetMapping("/query")
    @ResponseBody
    public FinanceResponseDto query(
            @RequestParam(required = false) String month) throws IOException {

        YearMonth selectedMonth = (month == null || month.isBlank())
                ? YearMonth.now()
                : YearMonth.parse(month);

        return financeService.queryCsvRecords(selectedMonth.toString());
    }

    // Create
    @PostMapping("/create")
    @ResponseBody
    public void create(
            @RequestBody FinanceRecordReqDto financeRecordReqDto,
            @RequestParam(required = false) String month)
            throws IOException {

        financeService.createNewRecord(financeRecordReqDto, month);
    }

    // Update
    @PostMapping("/update")
    @ResponseBody
    public void update(
            @RequestBody FinanceRecordReqDto financeRecordReqDto,
            @RequestParam(required = false) String month)
            throws IOException {

        financeService.updateRecord(financeRecordReqDto, month);
    }

    // Delete
    @PostMapping("/delete/{no}")
    @ResponseBody
    public void delete(@PathVariable("no") int no,
                       @RequestParam(required = false) String month) throws IOException {

        financeService.deleteRecord(no, month);
    }
}
