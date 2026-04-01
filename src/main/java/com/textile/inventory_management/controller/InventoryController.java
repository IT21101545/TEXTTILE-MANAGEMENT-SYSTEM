package com.textile.inventory_management.controller;

import com.textile.inventory_management.dto.InventoryValueDto;
import com.textile.inventory_management.dto.ProductDto;
import com.textile.inventory_management.dto.StockAdjustRequest;
import com.textile.inventory_management.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class InventoryController {
    private final InventoryService service;
    public InventoryController(InventoryService service) { this.service = service; }

    @PostMapping("/products/{id}/add-stock")
    public ProductDto addStock(@PathVariable int id, @Valid @RequestBody StockAdjustRequest req) { return service.addStock(id, req); }

    @PostMapping("/products/{id}/remove-stock")
    public ProductDto removeStock(@PathVariable int id, @Valid @RequestBody StockAdjustRequest req) { return service.removeStock(id, req); }

    @GetMapping("/inventory/value")
    public InventoryValueDto inventoryValue() { return service.getInventoryValue(); }
}
