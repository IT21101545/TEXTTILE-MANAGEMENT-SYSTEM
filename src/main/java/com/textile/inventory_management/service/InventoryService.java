package com.textile.inventory_management.service;

import com.textile.inventory_management.dto.InventoryValueDto;
import com.textile.inventory_management.dto.ProductDto;
import com.textile.inventory_management.dto.StockAdjustRequest;
import com.textile.inventory_management.repository.StoredProceduresRepository;
import org.springframework.stereotype.Service;

@Service
public class InventoryService {
    private final StoredProceduresRepository repo;

    public InventoryService(StoredProceduresRepository repo) { this.repo = repo; }
    public ProductDto addStock(int productId, StockAdjustRequest req) { repo.addStock(productId, req); return repo.getProductById(productId); }
    public ProductDto removeStock(int productId, StockAdjustRequest req) { repo.removeStock(productId, req); return repo.getProductById(productId); }
    public InventoryValueDto getInventoryValue() { return repo.getInventoryValue(); }
}
