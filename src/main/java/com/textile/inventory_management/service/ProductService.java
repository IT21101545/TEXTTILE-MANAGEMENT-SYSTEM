package com.textile.inventory_management.service;

import com.textile.inventory_management.dto.CreateProductRequest;
import com.textile.inventory_management.dto.ProductDto;
import com.textile.inventory_management.dto.UpdateProductRequest;
import com.textile.inventory_management.repository.StoredProceduresRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {
    private final StoredProceduresRepository repo;

    public ProductService(StoredProceduresRepository repo) { this.repo = repo; }
    public List<ProductDto> getAll() { return repo.getAllProducts(); }
    public ProductDto getById(int id) { return repo.getProductById(id); }
    public List<ProductDto> search(String term) { return repo.searchProducts(term); }
    public ProductDto create(CreateProductRequest req) { return repo.getProductById(repo.createProduct(req)); }
    public ProductDto update(int id, UpdateProductRequest req) { return repo.updateProduct(id, req); }
    public void delete(int id) { repo.deleteProduct(id); }
}
