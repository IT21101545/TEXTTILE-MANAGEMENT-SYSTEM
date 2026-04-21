package org.example.zeefashion.controller;

import org.example.zeefashion.dto.Material.MaterialStockAdjustRequest;
import org.example.zeefashion.model.Material;
import org.example.zeefashion.service.MaterialService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/materials")
public class MaterialController {

    private final MaterialService materialService;

    public MaterialController(MaterialService materialService) {
        this.materialService = materialService;
    }

    @GetMapping
    public List<Material> all() {
        return materialService.all();
    }

    @GetMapping("/{id}")
    public Material one(@PathVariable Long id) {
        return materialService.get(id);
    }

    @PostMapping
    public Material create(@RequestBody Material m) {
        return materialService.create(m);
    }

    @PutMapping("/{id}")
    public Material update(@PathVariable Long id, @RequestBody Material m) {
        return materialService.update(id, m);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        materialService.delete(id);
    }

    // Stock + / - for raw materials
    @PatchMapping("/{id}/stock")
    public Material adjustStock(@PathVariable Long id, @RequestBody MaterialStockAdjustRequest req) {
        return materialService.adjustStock(id, req.getAction(), req.getQty(), req.getReason());
    }

    @PostMapping("/{id}/transfer")
    public Material transferToProduct(@PathVariable Long id, @RequestBody java.util.Map<String, Integer> payload) {
        int qty = payload.getOrDefault("qty", 0);
        return materialService.transferToProduct(id, qty);
    }

    @PostMapping("/{id}/transfer-to-inventory")
    public Material transferToInventory(@PathVariable Long id, @RequestBody java.util.Map<String, Integer> payload) {
        int qty = payload.getOrDefault("qty", 0);
        return materialService.transferToInventory(id, qty);
    }

    @PostMapping("/{id}/transfer-to-shop")
    public Material transferToShop(@PathVariable Long id, @RequestBody java.util.Map<String, Integer> payload) {
        int qty = payload.getOrDefault("qty", 0);
        return materialService.transferToShop(id, qty);
    }

    @PostMapping("/{id}/expose")
    public Material toggleExposed(@PathVariable Long id, @RequestBody java.util.Map<String, Boolean> payload) {
        boolean state = payload.getOrDefault("exposed", false);
        return materialService.toggleExposed(id, state);
    }
}
