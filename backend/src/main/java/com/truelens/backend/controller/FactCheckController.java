package com.truelens.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.truelens.backend.dto.FactCheckResponse;
import com.truelens.backend.service.FactCheckService;

@RestController
@RequestMapping("/api/fact-check")
public class FactCheckController {

    private final FactCheckService service;

    public FactCheckController(FactCheckService service) {
        this.service = service;
    }

    @GetMapping
    public FactCheckResponse verify(@RequestParam String title) {
        return service.verifyNews(title);
    }
}