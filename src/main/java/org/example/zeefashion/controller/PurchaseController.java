package org.example.zeefashion.controller;

import org.example.zeefashion.model.Purchase;
import org.example.zeefashion.service.PurchaseService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchases")
public class PurchaseController {

    private final PurchaseService purchaseService;

    public PurchaseController(PurchaseService purchaseService) {
        this.purchaseService = purchaseService;
    }

    @GetMapping
    public List<Purchase> all() {
        return purchaseService.all();
    }

    @GetMapping("/{id}")
    public Purchase one(@PathVariable Long id) {
        return purchaseService.get(id);
    }

    // Usually: when you create a purchase, material stock increases
    @PostMapping
    public Purchase create(@RequestBody Purchase purchase) {
        return purchaseService.create(purchase);
    }

    @PutMapping("/{id}")
    public Purchase update(@PathVariable Long id, @RequestBody Purchase purchase) {
        return purchaseService.update(id, purchase);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        purchaseService.delete(id);
    }
}