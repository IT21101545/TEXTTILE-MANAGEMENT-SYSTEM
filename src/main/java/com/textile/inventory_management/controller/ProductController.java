package com.textile.inventory_management.controller;

import com.textile.inventory_management.dto.CreateProductRequest;
import com.textile.inventory_management.dto.ProductDto;
import com.textile.inventory_management.dto.UpdateProductRequest;
import com.textile.inventory_management.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductService service;
    public ProductController(ProductService service) { this.service = service; }

    @GetMapping public List<ProductDto> getAll() { return service.getAll(); }
    @GetMapping("/search") public List<ProductDto> search(@RequestParam(name = "q", defaultValue = "") String q) { return service.search(q); }
    @GetMapping("/{id}") public ProductDto getById(@PathVariable int id) {
        ProductDto p = service.getById(id);
        if (p == null) throw new ResourceNotFoundException("Product not found");
        return p;
    }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public ProductDto create(@Valid @RequestBody CreateProductRequest req) { return service.create(req); }
    @PutMapping("/{id}") public ProductDto update(@PathVariable int id, @Valid @RequestBody UpdateProductRequest req) {
        ProductDto p = service.update(id, req);
        if (p == null) throw new ResourceNotFoundException("Product not found");
        return p;
    }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable int id) { service.delete(id); }
}
