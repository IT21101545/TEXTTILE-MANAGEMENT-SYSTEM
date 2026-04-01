package com.textile.inventory_management.controller;

import com.textile.inventory_management.dto.LowStockAlertDto;
import com.textile.inventory_management.service.AlertsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
public class AlertsController {
    private final AlertsService service;
    public AlertsController(AlertsService service) { this.service = service; }

    @GetMapping("/low-stock")
    public List<LowStockAlertDto> lowStock() { return service.getLowStockAlerts(); }
}
