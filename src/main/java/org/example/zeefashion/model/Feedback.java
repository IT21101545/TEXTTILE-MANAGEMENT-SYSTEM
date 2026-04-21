package org.example.zeefashion.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "feedback")
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String customer;
    private String email;
    private String orderId;
    private Long productId;

    @Column(nullable=false, length = 1000)
    private String review;

    private Integer rating; // 1-5 (optional)
    private String status = "PENDING";
    private String date;
    private String reply;

    private Boolean resolved = false;

    private LocalDateTime createdAt;

    public Feedback() {}

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.resolved == null) this.resolved = false;
        if (this.status == null) this.status = "PENDING";
        if (this.date == null) this.date = java.time.LocalDate.now().toString();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCustomer() { return customer; }
    public void setCustomer(String customer) { this.customer = customer; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getReview() { return review; }
    public void setReview(String review) { this.review = review; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getReply() { return reply; }
    public void setReply(String reply) { this.reply = reply; }

    public Boolean getResolved() { return resolved; }
    public void setResolved(Boolean resolved) { this.resolved = resolved; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}