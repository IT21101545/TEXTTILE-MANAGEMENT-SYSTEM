package org.example.zeefashion.repository;

import org.example.zeefashion.model.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    List<Supplier> findBySuppliedMaterials_Id(Long materialId);
}