package org.example.zeefashion.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String message;
    private String materialCode;
    private Long supplierId;
    private String supplierName;
    private String supplierEmail;
    
    private String targetEmail; // For customer notifications
    private String type;        // ORDER_STATUS, FEEDBACK_REPLY, etc.
    
    private LocalDateTime createdAt = LocalDateTime.now();
    private boolean isRead = false;

    public Notification() {}

    public Notification(String message, String materialCode, Long supplierId, String supplierName, String supplierEmail) {
        this.message = message;
        this.materialCode = materialCode;
        this.supplierId = supplierId;
        this.supplierName = supplierName;
        this.supplierEmail = supplierEmail;
    }

    public Notification(String targetEmail, String message, String type) {
        this.targetEmail = targetEmail;
        this.message = message;
        this.type = type;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getMaterialCode() { return materialCode; }
    public void setMaterialCode(String materialCode) { this.materialCode = materialCode; }

    public Long getSupplierId() { return supplierId; }
    public void setSupplierId(Long supplierId) { this.supplierId = supplierId; }

    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }

    public String getSupplierEmail() { return supplierEmail; }
    public void setSupplierEmail(String supplierEmail) { this.supplierEmail = supplierEmail; }

    public String getTargetEmail() { return targetEmail; }
    public void setTargetEmail(String targetEmail) { this.targetEmail = targetEmail; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }
}
