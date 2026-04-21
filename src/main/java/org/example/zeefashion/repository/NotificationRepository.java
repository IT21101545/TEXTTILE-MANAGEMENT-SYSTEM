package org.example.zeefashion.repository;

import org.example.zeefashion.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByIsReadFalseOrderByCreatedAtDesc();
    List<Notification> findByTargetEmailIsNullAndIsReadFalseOrderByCreatedAtDesc();
    List<Notification> findByTargetEmailAndIsReadFalseOrderByCreatedAtDesc(String targetEmail);
    boolean existsByMaterialCodeAndIsReadFalse(String materialCode);
}
