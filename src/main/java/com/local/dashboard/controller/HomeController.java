package com.local.dashboard.controller;

import com.local.dashboard.model.LibraryItem;
import com.local.dashboard.service.DevDashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@Controller
public class HomeController {

    @Autowired
    private DevDashboardService devDashboardService;

    // Main project hub
    @GetMapping("/")
    public String home() {
        return "home";
    }

    @GetMapping("/dev_dashboard")
    public String dashboard(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            Model model) {


        List<LibraryItem> items =  devDashboardService.readLibraryTitle();

        model.addAttribute("items", items);
        model.addAttribute("keyword", keyword);
        model.addAttribute("category", category);

        return "dev_dashboard";
    }

}
