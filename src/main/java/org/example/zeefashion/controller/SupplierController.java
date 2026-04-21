package org.example.zeefashion.controller;

import org.example.zeefashion.model.Supplier;
import org.example.zeefashion.service.SupplierService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
public class SupplierController {

    private final SupplierService supplierService;

    public SupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    @GetMapping
    public List<Supplier> all() {
        return supplierService.all();
    }

    @GetMapping("/{id}")
    public Supplier one(@PathVariable Long id) {
        return supplierService.get(id);
    }

    @PostMapping
    public Supplier create(@RequestBody Supplier supplier) {
        return supplierService.create(supplier);
    }

    @PutMapping("/{id}")
    public Supplier update(@PathVariable Long id, @RequestBody Supplier supplier) {
        return supplierService.update(id, supplier);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        supplierService.delete(id);
    }

    @PostMapping("/reset-all")
    public void resetAll() {
        supplierService.deleteAll();
    }
}