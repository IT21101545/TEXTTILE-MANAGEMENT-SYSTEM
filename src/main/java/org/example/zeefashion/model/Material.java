package org.example.zeefashion.model;

import jakarta.persistence.*;
import java.math.BigDecimal;


@Entity
@Table(name = "materials")
public class Material {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name; // cotton, thread, buttons...

    private String unit; // meters, kg, pcs...

    @Column(nullable = false)
    private Integer stockQty = 0;

    private Integer lowThreshold = 10;
    @Column(nullable = false, unique = true)
    private String code;
    private String description;
    private Long linkedProductId; // Shop item link
    
    // 3-Tier Stock Buckets
    private Integer supplierStock = 0;
    private Integer shopStock = 0;
    
    // Visibility in Inventory Dashboard
    private Boolean exposedInInventory = false;
    
    // Product Sync Data
    @Column(precision = 12, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String imageUrl;

    // Lifetime Tracking Stats
    private Integer totalSupplied = 0;

    private Integer totalTransferred = 0;

    public Material() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public Integer getStockQty() { return stockQty; }
    public void setStockQty(Integer stockQty) { this.stockQty = stockQty; }

    public Integer getLowThreshold() { return lowThreshold; }
    public void setLowThreshold(Integer lowThreshold) { this.lowThreshold = lowThreshold; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Long getLinkedProductId() { return linkedProductId; }
    public void setLinkedProductId(Long linkedProductId) { this.linkedProductId = linkedProductId; }

    public Integer getTotalSupplied() { return totalSupplied; }
    public void setTotalSupplied(Integer totalSupplied) { this.totalSupplied = totalSupplied; }

    public Integer getTotalTransferred() { return totalTransferred; }
    public void setTotalTransferred(Integer totalTransferred) { this.totalTransferred = totalTransferred; }

    public Integer getSupplierStock() { return supplierStock; }
    public void setSupplierStock(Integer supplierStock) { this.supplierStock = supplierStock; }

    public Integer getShopStock() { return shopStock; }
    public void setShopStock(Integer shopStock) { this.shopStock = shopStock; }

    public Boolean isExposedInInventory() { return exposedInInventory; }
    public void setExposedInInventory(Boolean exposedInInventory) { this.exposedInInventory = exposedInInventory; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}