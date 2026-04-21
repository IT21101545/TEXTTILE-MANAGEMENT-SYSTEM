package com.textile.management.controller;

import com.textile.management.dto.DashboardStatsDto;
import com.textile.management.repository.CustomerRepository;
import com.textile.management.repository.OrderRepository;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class DashboardController {

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;

    public DashboardController(OrderRepository orderRepository, CustomerRepository customerRepository) {
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
    }

    @GetMapping("/stats")
    public DashboardStatsDto stats() {
        long totalOrders = orderRepository.count();
        long completed = orderRepository.countByStatus("Completed");
        long pending = orderRepository.countByStatus("Pending");
        long totalCustomers = customerRepository.count();
        return new DashboardStatsDto(totalOrders, completed, pending, totalCustomers);
    }
}
