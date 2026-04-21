package com.textile.management.dto;

public record CustomerViewDto(
        Integer customerID,
        String fullName,
        String email,
        String phone,
        String city,
        String address,
        long orderCount,
        long totalSpend
) {
}
