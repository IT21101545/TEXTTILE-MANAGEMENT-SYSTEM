package org.example.zeefashion.service;

import org.example.zeefashion.model.Material;
import org.example.zeefashion.model.Product;
import org.example.zeefashion.repository.MaterialRepository;
import org.example.zeefashion.repository.OrderItemRepository;
import org.example.zeefashion.repository.OrderRepository;
import org.example.zeefashion.repository.ProductRepository;
import org.example.zeefashion.repository.FeedbackRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.math.BigDecimal;
import java.util.Arrays;

import java.util.List;

@Service
@Transactional
public class ProductService {

    private final ProductRepository productRepo;
    private final OrderRepository orderRepo;
    private final OrderItemRepository orderItemRepo;
    private final MaterialRepository materialRepo;
    private final FeedbackRepository feedbackRepo;

    @PersistenceContext
    private EntityManager entityManager;

    public ProductService(ProductRepository productRepo, OrderRepository orderRepo, OrderItemRepository orderItemRepo, MaterialRepository materialRepo, FeedbackRepository feedbackRepo) {
        this.productRepo = productRepo;
        this.orderRepo = orderRepo;
        this.orderItemRepo = orderItemRepo;
        this.materialRepo = materialRepo;
        this.feedbackRepo = feedbackRepo;
    }

    public List<Product> all() {
        return productRepo.findAll();
    }

    public Product get(Long id) {
        return productRepo.findById(id).orElseThrow(() -> new RuntimeException("Product not found"));
    }

    public Product create(Product p) {
        if (p.getStockQty() == null) p.setStockQty(0);
        if (p.getUpdatedAt() == null) p.setUpdatedAt(nowStr());
        return productRepo.save(p);
    }

    public Product update(Long id, Product payload) {
        Product p = get(id);
        if (payload.getName() != null) p.setName(payload.getName());
        if (payload.getCategory() != null) p.setCategory(payload.getCategory());
        if (payload.getSku() != null) p.setSku(payload.getSku());
        if (payload.getSupplier() != null) p.setSupplier(payload.getSupplier());
        if (payload.getUnit() != null) p.setUnit(payload.getUnit());
        if (payload.getLowThreshold() != null) p.setLowThreshold(payload.getLowThreshold());
        if (payload.getDescription() != null) p.setDescription(payload.getDescription());
        if (payload.getSize() != null) p.setSize(payload.getSize());
        if (payload.getColor() != null) p.setColor(payload.getColor());
        if (payload.getPrice() != null) p.setPrice(payload.getPrice());
        if (payload.getImageUrl() != null) p.setImageUrl(payload.getImageUrl());
        if (payload.getStockQty() != null) p.setStockQty(payload.getStockQty());
        
        p.setUpdatedAt(nowStr());
        return productRepo.save(p);
    }

    @Transactional
    public void delete(Long id) {
        // Clear children first
        feedbackRepo.deleteByProductId(id);
        orderItemRepo.deleteByProductId(id);
        productRepo.deleteById(id);
    }

    @Transactional
    public void deleteAll() {
        // Clear everything in order to avoid FK issues
        feedbackRepo.deleteAll();
        orderItemRepo.deleteAll();
        orderRepo.deleteAll();
        productRepo.deleteAll();

        // RESET ALL MATERIAL LINKS
        entityManager.createNativeQuery("UPDATE materials SET linked_product_id = NULL").executeUpdate();
    }

    public Product adjustStock(Long id, String action, int qty, String reason) {
        Product p = get(id);
        if (qty <= 0) throw new RuntimeException("Qty must be > 0");

        if ("ADD".equalsIgnoreCase(action)) {
            p.setStockQty(p.getStockQty() + qty);
        } else if ("REMOVE".equalsIgnoreCase(action)) {
            int newQty = p.getStockQty() - qty;
            if (newQty < 0) throw new RuntimeException("Not enough product stock");
            p.setStockQty(newQty);
        } else {
            throw new RuntimeException("Invalid action. Use ADD or REMOVE");
        }

        p.setUpdatedAt(nowStr());
        return productRepo.save(p);
    }

    public Product exposeFromMaterial(Long materialId) {
        Material m = materialRepo.findById(materialId)
                .orElseThrow(() -> new RuntimeException("Material not found"));

        Product p;
        if (m.getLinkedProductId() != null) {
            try {
                p = get(m.getLinkedProductId());
            } catch (Exception e) {
                // Link is broken (product deleted), proceed to create new one
                p = new Product();
                m.setLinkedProductId(null);
            }
        } else {
            p = new Product();
        }

        // Sync Metadata from Material to Product
        p.setName(m.getName());
        p.setSku(m.getCode());
        p.setUnit(m.getUnit());
        p.setPrice(m.getPrice() != null ? m.getPrice() : java.math.BigDecimal.ZERO);
        p.setImageUrl(m.getImageUrl());
        p.setLinkedMaterialId(m.getId());
        p.setUpdatedAt(nowStr());

        // Default category if new
        if (p.getCategory() == null) p.setCategory("Uncategorized");
        
        // Stock handling:
        // When first exposing, stock is 0. 
        // Subsequent syncs PRESERVE the existing product stock.
        if (p.getStockQty() == null) p.setStockQty(0);

        Product saved = productRepo.save(p);

        m.setLinkedProductId(saved.getId());
        materialRepo.save(m);

        return saved;
    }

    private String nowStr() {
        return java.time.LocalDateTime.now()
                .format(java.time.format.DateTimeFormatter.ofPattern("M/d/yyyy HH:mm:ss"));
    }
}
