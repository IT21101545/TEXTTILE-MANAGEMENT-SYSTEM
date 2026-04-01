package com.textile.inventory_management.dto;

import java.math.BigDecimal;

public class InventoryValueDto {
    private Integer totalProducts;
    private Integer totalItems;
    private BigDecimal totalInventoryValue;
    private BigDecimal potentialProfit;

    public Integer getTotalProducts() { return totalProducts; }
    public void setTotalProducts(Integer totalProducts) { this.totalProducts = totalProducts; }
    public Integer getTotalItems() { return totalItems; }
    public void setTotalItems(Integer totalItems) { this.totalItems = totalItems; }
    public BigDecimal getTotalInventoryValue() { return totalInventoryValue; }
    public void setTotalInventoryValue(BigDecimal totalInventoryValue) { this.totalInventoryValue = totalInventoryValue; }
    public BigDecimal getPotentialProfit() { return potentialProfit; }
    public void setPotentialProfit(BigDecimal potentialProfit) { this.potentialProfit = potentialProfit; }
}
