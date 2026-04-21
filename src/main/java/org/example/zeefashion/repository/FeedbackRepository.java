package org.example.zeefashion.repository;

import org.example.zeefashion.model.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByResolved(Boolean resolved);
    List<Feedback> findByProductId(Long productId);
    void deleteByProductId(Long productId);
}