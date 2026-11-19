package com.local.dashboard.controller;

import com.local.dashboard.dto.request.OSCCreateRequest;
import com.local.dashboard.dto.request.OSCDepositRequest;
import com.local.dashboard.dto.request.OscListFilterRequest;
import com.local.dashboard.dto.response.OscResponse;
import com.local.dashboard.dto.response.ResponseBuilderUtils;
import com.local.dashboard.service.OneStepCloserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

@Controller
@RequestMapping("/osc")
@RequiredArgsConstructor
public class OneStepCloserController {

    private final OneStepCloserService oneStepCloserService;

    // Thymeleaf dashboard
    @GetMapping("/home")
    public String financeDashboard(Model model) throws IOException {

        OscListFilterRequest req = new OscListFilterRequest();

        ResponseBuilderUtils<OscResponse>  response = oneStepCloserService.list(req);

        model.addAttribute("response", response);

        return "osc";
    }

    @PostMapping(
            value = "/get",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<Map<String, Object>> list(@RequestBody OscListFilterRequest req) {

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("code", "200");
        response.put("message", "SUCCESS");
        response.put("data", oneStepCloserService.list(req).data());

        return ResponseEntity.ok(response);

    }

    @PostMapping(value = "/create",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> createNewOsc(@RequestBody OSCCreateRequest request) {

        oneStepCloserService.createNewOSC(request);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("response", "SUCCESS");
        response.put("status", "COMPLETED");

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(response);
    }

    @PostMapping(value = "/deposit",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> deposit(@RequestBody OSCDepositRequest request) {

        Map<String, Object> response = new LinkedHashMap<>();

        response.put("response", "SUCCESS");
        response.put("status", "COMPLETED");
        response.put("data", oneStepCloserService.deposit(request));

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(response);

    }

}
