package com.textile.management.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record OrderCreateRequest(
        @NotNull Integer customerID,
        @NotBlank String productDescription,
        @NotNull @Min(1) Integer quantity,
        @NotNull @DecimalMin(value = "0.0", inclusive = true) BigDecimal totalAmount,
        @NotBlank String status,
        LocalDate orderDate,
        LocalDate deliveryDate,
        String notes
) {
}
