package org.example.zeefashion.controller;

import org.example.zeefashion.service.SalesService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/sales")
public class SalesController {

    private final SalesService salesService;

    public SalesController(SalesService salesService) {
        this.salesService = salesService;
    }

    // KPI summary for sales dashboard
    @GetMapping("/summary")
    public Map<String, Object> summary() {
        return salesService.summary();
    }

    // List of paid orders / transactions
    @GetMapping("/transactions")
    public Object transactions() {
        return salesService.transactions();
    }
}