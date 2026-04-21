package org.example.zeefashion.service;

import org.example.zeefashion.model.Material;
import org.example.zeefashion.model.Supplier;
import org.example.zeefashion.repository.MaterialRepository;
import org.example.zeefashion.repository.SupplierRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.util.List;

@Service
public class SupplierService {
    @PersistenceContext
    private EntityManager entityManager;

    private final SupplierRepository supplierRepo;
    private final MaterialRepository materialRepo;

    public SupplierService(SupplierRepository supplierRepo, MaterialRepository materialRepo) {
        this.supplierRepo = supplierRepo;
        this.materialRepo = materialRepo;
    }

    public List<Supplier> all() {
        return supplierRepo.findAll();
    }

    public Supplier get(Long id) {
        return supplierRepo.findById(id).orElseThrow(() -> new RuntimeException("Supplier not found"));
    }

    public Supplier create(Supplier s) {
        return supplierRepo.save(s);
    }

    public Supplier update(Long id, Supplier payload) {
        Supplier s = get(id);
        if (payload.getName() != null) s.setName(payload.getName());
        if (payload.getContact() != null) s.setContact(payload.getContact());
        if (payload.getEmail() != null) s.setEmail(payload.getEmail());
        if (payload.getAddress() != null) s.setAddress(payload.getAddress());
        if (payload.getMaterialType() != null) s.setMaterialType(payload.getMaterialType());
        if (payload.getStatus() != null) s.setStatus(payload.getStatus());
        
        // Handle material links if provided in the payload
        if (payload.getSuppliedMaterials() != null) {
            s.setSuppliedMaterials(payload.getSuppliedMaterials());
        }
        
        return supplierRepo.save(s);
    }

    public void delete(Long id) {
        supplierRepo.deleteById(id);
    }

    @Transactional
    public void deleteAll() {
        entityManager.createNativeQuery("SET FOREIGN_KEY_CHECKS = 0").executeUpdate();
        entityManager.createNativeQuery("TRUNCATE TABLE purchases").executeUpdate();
        entityManager.createNativeQuery("TRUNCATE TABLE materials").executeUpdate();
        entityManager.createNativeQuery("TRUNCATE TABLE suppliers").executeUpdate();
        entityManager.createNativeQuery("SET FOREIGN_KEY_CHECKS = 1").executeUpdate();
    }
}