package org.example.zeefashion.service;

import org.example.zeefashion.model.Material;
import org.example.zeefashion.model.Purchase;
import org.example.zeefashion.model.Supplier;
import org.example.zeefashion.repository.MaterialRepository;
import org.example.zeefashion.repository.ProductRepository;
import org.example.zeefashion.repository.PurchaseRepository;
import org.example.zeefashion.repository.SupplierRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class PurchaseService {

    private final PurchaseRepository purchaseRepo;
    private final SupplierRepository supplierRepo;
    private final MaterialRepository materialRepo;
    private final ProductRepository productRepo;

    public PurchaseService(PurchaseRepository purchaseRepo, SupplierRepository supplierRepo, MaterialRepository materialRepo, ProductRepository productRepo) {
        this.purchaseRepo = purchaseRepo;
        this.supplierRepo = supplierRepo;
        this.materialRepo = materialRepo;
        this.productRepo = productRepo;
    }

    public List<Purchase> all() {
        return purchaseRepo.findAll();
    }

    public Purchase get(Long id) {
        return purchaseRepo.findById(id).orElseThrow(() -> new RuntimeException("Purchase not found"));
    }

    public Purchase create(Purchase p) {
        if (p.getQty() == null || p.getQty() <= 0) throw new RuntimeException("Qty must be > 0");
        if (p.getUnitPrice() == null || p.getUnitPrice().compareTo(BigDecimal.ZERO) <= 0)
            throw new RuntimeException("Unit price must be > 0");

        Supplier s = supplierRepo.findById(p.getSupplier().getId())
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        Material m = materialRepo.findById(p.getMaterial().getId())
                .orElseThrow(() -> new RuntimeException("Material not found"));

        p.setSupplier(s);
        p.setMaterial(m);

        Purchase saved = purchaseRepo.save(p);

        // increase supplier stock and total supplied audit (for workflow tracking)
        int currentSupStock = (m.getSupplierStock() != null) ? m.getSupplierStock() : 0;
        m.setSupplierStock(currentSupStock + p.getQty());
        
        int currentTotal = (m.getTotalSupplied() != null) ? m.getTotalSupplied() : 0;
        m.setTotalSupplied(currentTotal + p.getQty());
        materialRepo.save(m);

        // increase supplier total volume
        int supTotal = (s.getTotalSupplied() != null) ? s.getTotalSupplied() : 0;
        s.setTotalSupplied(supTotal + p.getQty());
        supplierRepo.save(s);

        return saved;
    }

    public Purchase update(Long id, Purchase payload) {
        // For simplicity: only allow editing price, qty (no stock reversal here)
        Purchase p = get(id);
        if (payload.getQty() != null && payload.getQty() > 0) p.setQty(payload.getQty());
        if (payload.getUnitPrice() != null) p.setUnitPrice(payload.getUnitPrice());
        if (payload.getInvoice() != null) p.setInvoice(payload.getInvoice());
        return purchaseRepo.save(p);
    }

    public void delete(Long id) {
        // For simplicity: no stock reversal when deleting purchases
        purchaseRepo.deleteById(id);
    }
}
