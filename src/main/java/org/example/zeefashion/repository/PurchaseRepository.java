package org.example.zeefashion.repository;

import org.example.zeefashion.model.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface PurchaseRepository extends JpaRepository<Purchase, Long> {
    List<Purchase> findByPurchasedAtBetween(LocalDateTime from, LocalDateTime to);
}