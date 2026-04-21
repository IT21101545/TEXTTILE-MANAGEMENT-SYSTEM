package com.textile.management.dto;

public record DashboardStatsDto(
        long totalOrders,
        long completedOrders,
        long pendingOrders,
        long totalCustomers
) {
}
