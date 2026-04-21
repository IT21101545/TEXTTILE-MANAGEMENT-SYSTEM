package com.textile.management.dto;

import java.math.BigDecimal;

public record OrderViewDto(
        Long id,
        String displayId,
        String customer,
        String phone,
        String items,
        Integer qty,
        BigDecimal total,
        String status,
        String date
) {
}
