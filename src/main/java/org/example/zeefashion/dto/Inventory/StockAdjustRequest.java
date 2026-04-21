package org.example.zeefashion.dto.Inventory;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class StockAdjustRequest {

    @NotBlank
    private String action; // ADD or REMOVE

    @NotNull
    @Min(1)
    private Integer qty;

    private String reason;

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public Integer getQty() { return qty; }
    public void setQty(Integer qty) { this.qty = qty; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}