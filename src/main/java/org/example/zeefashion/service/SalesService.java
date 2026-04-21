package org.example.zeefashion.service;

import org.example.zeefashion.model.Order;
import org.example.zeefashion.repository.OrderRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class SalesService {

    private final OrderRepository orderRepo;

    public SalesService(OrderRepository orderRepo) {
        this.orderRepo = orderRepo;
    }

    public Map<String, Object> summary() {
        List<Order> confirmed = orderRepo.findByStatus("CONFIRMED");

        BigDecimal totalSales = confirmed.stream()
                .map(o -> o.getTotal() == null ? BigDecimal.ZERO : o.getTotal())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long orderCount = confirmed.size();

        Map<String, Object> m = new HashMap<>();
        m.put("confirmedOrders", orderCount);
        m.put("totalSales", totalSales);
        return m;
    }

    public List<Order> transactions() {
        // show confirmed orders as transactions
        return orderRepo.findByStatus("CONFIRMED");
    }
}