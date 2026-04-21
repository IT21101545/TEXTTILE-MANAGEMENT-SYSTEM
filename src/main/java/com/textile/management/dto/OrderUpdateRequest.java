package com.textile.management.dto;

import java.math.BigDecimal;

public record OrderUpdateRequest(
        String status,
        BigDecimal totalAmount
) {
}
