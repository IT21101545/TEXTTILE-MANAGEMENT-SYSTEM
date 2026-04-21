package org.example.zeefashion.repository;

import org.example.zeefashion.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByStatus(String status);
    List<Order> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to);
}