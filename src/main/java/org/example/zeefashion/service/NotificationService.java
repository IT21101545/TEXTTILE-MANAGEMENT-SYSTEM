package org.example.zeefashion.service;

import org.example.zeefashion.model.Material;
import org.example.zeefashion.model.Notification;
import org.example.zeefashion.model.Supplier;
import org.example.zeefashion.repository.NotificationRepository;
import org.example.zeefashion.repository.SupplierRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepo;
    private final SupplierRepository supplierRepo;

    public NotificationService(NotificationRepository notificationRepo, SupplierRepository supplierRepo) {
        this.notificationRepo = notificationRepo;
        this.supplierRepo = supplierRepo;
    }

    public List<Notification> allUnread() {
        return notificationRepo.findByTargetEmailIsNullAndIsReadFalseOrderByCreatedAtDesc();
    }

    public List<Notification> getCustomerNotifications(String email) {
        return notificationRepo.findByTargetEmailAndIsReadFalseOrderByCreatedAtDesc(email);
    }

    public void createCustomerNotification(String email, String message, String type) {
        Notification n = new Notification(email, message, type);
        notificationRepo.save(n);
    }

    public void markAsRead(Long id) {
        notificationRepo.findById(id).ifPresent(n -> {
            n.setRead(true);
            notificationRepo.save(n);
        });
    }

    public void createForLowStock(Material material) {
        // Prevent duplicate notifications if one already exists
        if (notificationRepo.existsByMaterialCodeAndIsReadFalse(material.getCode())) {
            return;
        }

        // Find all suppliers for this material
        List<Supplier> suppliers = supplierRepo.findBySuppliedMaterials_Id(material.getId());
        
        if (suppliers.isEmpty()) {
            // General Administrative Notification if no supplier is linked
            String msg = "Action Required: Low Inventory Stock for " + material.getName() + " (" + material.getCode() + ") - No supplier linked!";
            Notification n = new Notification(
                msg,
                material.getCode(),
                null,
                "ADMIN",
                "N/A"
            );
            notificationRepo.save(n);
            return;
        }

        for (Supplier s : suppliers) {
            String msg = "Action Required: Low Inventory Stock for " + material.getName() + " (" + material.getCode() + ")";
            Notification n = new Notification(
                msg,
                material.getCode(),
                s.getId(),
                s.getName(),
                s.getEmail()
            );
            notificationRepo.save(n);
        }
    }

    public void syncOutstandingAlerts(List<Material> materials) {
        for (Material m : materials) {
            int threshold = (m.getLowThreshold() != null) ? m.getLowThreshold() : 10;
            if (m.getStockQty() <= threshold) {
                createForLowStock(m);
            }
        }
    }
}
