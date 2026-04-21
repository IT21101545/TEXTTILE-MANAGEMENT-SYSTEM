package org.example.zeefashion.controller;

import org.example.zeefashion.dto.Inventory.StockAdjustRequest;
import org.example.zeefashion.model.Product;
import org.example.zeefashion.service.ProductService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public List<Product> all() {
        return productService.all();
    }

    @GetMapping("/{id}")
    public Product one(@PathVariable Long id) {
        return productService.get(id);
    }

    @PostMapping
    public Product create(@RequestBody Product p) {
        return productService.create(p);
    }

    @PutMapping("/{id}")
    public Product update(@PathVariable Long id, @RequestBody Product p) {
        return productService.update(id, p);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        productService.delete(id);
    }

    @DeleteMapping("/clear")
    public void deleteAll() {
        productService.deleteAll();
    }

    // Stock adjust for finished products
    @PatchMapping("/{id}/stock")
    public Product adjustStock(@PathVariable Long id, @RequestBody StockAdjustRequest req) {
        return productService.adjustStock(id, req.getAction(), req.getQty(), req.getReason());
    }

    @PostMapping("/expose/{materialId}")
    public Product exposeMaterial(@PathVariable Long materialId) {
        return productService.exposeFromMaterial(materialId);
    }
}
