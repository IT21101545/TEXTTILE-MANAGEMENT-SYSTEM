package org.example.zeefashion.model;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false)
    private String name;

    private String category; // Shirt, Saree...
    private String sku;      // Unique SKU code
    private String supplier; // Supplier name
    private String unit;     // meter, piece, roll...
    private Integer lowThreshold = 5; // Alert threshold
    private String description;
    private String size;     // S/M/L or 32/34...
    private String color;

    @Column(nullable=false, precision=12, scale=2)
    private BigDecimal price;

    @Column(nullable=false)
    private Integer stockQty = 0;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String imageUrl; // optional for frontend
    private String updatedAt;
    private Long linkedMaterialId; // Raw material link

    public Product() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public String getSupplier() { return supplier; }
    public void setSupplier(String supplier) { this.supplier = supplier; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public Integer getLowThreshold() { return lowThreshold; }
    public void setLowThreshold(Integer lowThreshold) { this.lowThreshold = lowThreshold; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public Integer getStockQty() { return stockQty; }
    public void setStockQty(Integer stockQty) { this.stockQty = stockQty; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    public Long getLinkedMaterialId() { return linkedMaterialId; }
    public void setLinkedMaterialId(Long linkedMaterialId) { this.linkedMaterialId = linkedMaterialId; }
}