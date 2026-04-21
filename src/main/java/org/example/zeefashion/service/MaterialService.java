package org.example.zeefashion.service;

import org.example.zeefashion.model.Material;
import org.example.zeefashion.model.Product;
import org.example.zeefashion.repository.MaterialRepository;
import org.example.zeefashion.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class MaterialService {

    private final MaterialRepository materialRepo;
    private final ProductRepository productRepo;
    private final NotificationService notificationService;

    public MaterialService(MaterialRepository materialRepo, ProductRepository productRepo, NotificationService notificationService) {
        this.materialRepo = materialRepo;
        this.productRepo = productRepo;
        this.notificationService = notificationService;
    }

    public List<Material> all() {
        return materialRepo.findAll();
    }

    public Material get(Long id) {
        return materialRepo.findById(id).orElseThrow(() -> new RuntimeException("Material not found"));
    }

    public Material create(Material m) {
        // Enforce Unique Code check manually for safety
        if (materialRepo.findByCode(m.getCode()).isPresent()) {
            throw new RuntimeException("Material Code already exists: " + m.getCode());
        }

        // If supplierStock is not explicitly provided, map Initial Stock field (stockQty) to Supplier pool
        if (m.getSupplierStock() == null || m.getSupplierStock() == 0) {
            int initial = (m.getStockQty() != null) ? m.getStockQty() : 0;
            m.setSupplierStock(initial);
        }
        m.setStockQty(0); // For new materials, inventory starts empty until moved
        if (m.getPrice() == null) m.setPrice(java.math.BigDecimal.ZERO);
        return materialRepo.save(m);
    }


    public Material update(Long id, Material payload) {
        Material m = get(id);
        
        // Block code updates if it causes a duplicate
        if (payload.getCode() != null && !payload.getCode().equals(m.getCode())) {
            if (materialRepo.findByCode(payload.getCode()).isPresent()) {
                throw new RuntimeException("Code already in use by another material");
            }
            m.setCode(payload.getCode());
        }

        if (payload.getName() != null) m.setName(payload.getName());
        if (payload.getUnit() != null) m.setUnit(payload.getUnit());
        if (payload.getDescription() != null) m.setDescription(payload.getDescription());
        if (payload.getPrice() != null) m.setPrice(payload.getPrice());
        if (payload.getImageUrl() != null) m.setImageUrl(payload.getImageUrl());
        
        // Sync 'Initial Stock' ONLY IF IT IS A SEED UPDATE
        if (payload.getStockQty() != null && (m.getSupplierStock() == null || m.getSupplierStock() == 0)) {
            m.setSupplierStock(payload.getStockQty());
        }
        
        m.setExposedInInventory(payload.isExposedInInventory());

        // AUTO-SYNC WITH STOREFRONT PRODUCT
        if (m.getLinkedProductId() != null) {
            Product prod = productRepo.findById(m.getLinkedProductId()).orElse(null);
            if (prod != null) {
                prod.setName(m.getName());
                prod.setSku(m.getCode());
                prod.setPrice(m.getPrice());
                prod.setImageUrl(m.getImageUrl());
                prod.setDescription(m.getDescription());
                prod.setUnit(m.getUnit());
                productRepo.save(prod);
            }
        }

        return materialRepo.save(m);
    }


    public void delete(Long id) {
        materialRepo.deleteById(id);
    }

    public Material adjustStock(Long id, String action, int qty, String reason) {
        Material m = get(id);
        if (qty <= 0) throw new RuntimeException("Qty must be > 0");

        if ("ADD".equalsIgnoreCase(action)) {
            m.setSupplierStock((m.getSupplierStock() != null ? m.getSupplierStock() : 0) + qty);
        } else if ("REMOVE".equalsIgnoreCase(action)) {
            int newQty = (m.getSupplierStock() != null ? m.getSupplierStock() : 0) - qty;
            if (newQty < 0) throw new RuntimeException("Not enough Supplier stock available for reduction");
            m.setSupplierStock(newQty);
        } else {
            throw new RuntimeException("Invalid action. Use ADD or REMOVE");
        }

        return materialRepo.save(m);
    }

    @Transactional
    public Material transferToInventory(Long id, int qty) {
        Material m = get(id);
        if (qty <= 0) throw new RuntimeException("Quantity must be > 0");
        if (m.getSupplierStock() < qty) throw new RuntimeException("Not enough Supplier stock available");

        m.setSupplierStock(m.getSupplierStock() - qty);
        m.setStockQty(m.getStockQty() + qty);
        return materialRepo.save(m);
    }

    @Transactional
    public Material transferToShop(Long id, int qty) {
        Material m = get(id);
        if (qty <= 0) throw new RuntimeException("Quantity must be > 0");
        if (m.getStockQty() < qty) throw new RuntimeException("Not enough Inventory stock available");

        m.setStockQty(m.getStockQty() - qty);
        m.setShopStock(m.getShopStock() + qty);

        // SYNC WITH STOREFRONT PRODUCT
        if (m.getLinkedProductId() != null) {
            Product prod = productRepo.findById(m.getLinkedProductId()).orElse(null);
            if (prod != null) {
                if (prod.getStockQty() == null) prod.setStockQty(0);
                prod.setStockQty(prod.getStockQty() + qty);
                // Sync Metadata
                prod.setPrice(m.getPrice());
                prod.setImageUrl(m.getImageUrl());
                prod.setName(m.getName());
                prod.setSku(m.getCode());
                productRepo.save(prod);
            }
        }
        
        // Audit transfer stat
        int currentTransferred = (m.getTotalTransferred() != null) ? m.getTotalTransferred() : 0;
        m.setTotalTransferred(currentTransferred + qty);
        
        Material saved = materialRepo.save(m);

        // Notify if below threshold
        if (saved.getStockQty() <= (saved.getLowThreshold() != null ? saved.getLowThreshold() : 10)) {
            notificationService.createForLowStock(saved);
        }

        return saved;
    }

    @Transactional
    public Material transferToProduct(Long materialId, int qty) {
        Material m = get(materialId);
        if (qty <= 0) throw new RuntimeException("Quantity must be greater than zero");
        if (m.getLinkedProductId() == null) throw new RuntimeException("Material is not linked to any shop product");

        Product prod = productRepo.findById(m.getLinkedProductId())
                .orElseThrow(() -> new RuntimeException("Linked product not found"));

        // Transfer from Inventory Stage to Product (Linear Workflow)
        if (m.getStockQty() < qty) throw new RuntimeException("Not enough Inventory stock available (Has: " + m.getStockQty() + ")");
        m.setStockQty(m.getStockQty() - qty);
        int currentTransferred = (m.getTotalTransferred() != null) ? m.getTotalTransferred() : 0;
        m.setTotalTransferred(currentTransferred + qty);
        prod.setStockQty(prod.getStockQty() + qty);
        
        // Robust Sync: Ensure metadata is always fresh in storefront
        prod.setPrice(m.getPrice() != null ? m.getPrice() : java.math.BigDecimal.ZERO);
        prod.setImageUrl(m.getImageUrl());
        prod.setName(m.getName());
        prod.setSku(m.getCode());
        prod.setDescription(m.getDescription());
        prod.setUnit(m.getUnit());

        productRepo.save(prod);
        Material saved = materialRepo.save(m);
        
        // Notify if below threshold
        if (saved.getStockQty() <= (saved.getLowThreshold() != null ? saved.getLowThreshold() : 10)) {
            notificationService.createForLowStock(saved);
        }

        return saved;
    }

    @Transactional
    public Material toggleExposed(Long id, boolean state) {
        Material m = get(id);
        m.setExposedInInventory(state);
        return materialRepo.save(m);
    }
}
