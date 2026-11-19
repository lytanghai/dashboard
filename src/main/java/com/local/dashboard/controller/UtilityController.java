package com.local.dashboard.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class UtilityController {

    @GetMapping("/utility")
    public String home() {
        return "utility";
    }

    @GetMapping("/tools/{tool}")
    public String tool(@PathVariable String tool, Model model) {
        String title = switch (tool) {
            case "json-to-dto" -> "JSON to Java DTO";
            case "json-compare" -> "JSON Comparator";
            case "json-formatter" -> "JSON Formatter";
            case "sql-formatter" -> "SQL Formatter";
            case "base64" -> "Base64 Converter";
            case "timestamp" -> "Timestamp Converter";
            default -> null;
        };

        if (title == null) {
            return "redirect:/";
        }

        model.addAttribute("toolTitle", title);
        model.addAttribute("toolKey", tool);
        return "tools/placeholder";
    }

}
