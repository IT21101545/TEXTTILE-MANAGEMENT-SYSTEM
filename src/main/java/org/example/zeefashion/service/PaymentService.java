package org.example.zeefashion.service;

import org.example.zeefashion.dto.Cart.PaymentRequest;
import org.example.zeefashion.model.Order;
import org.example.zeefashion.repository.OrderRepository;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class PaymentService {

    private final OrderRepository orderRepo;

    public PaymentService(OrderRepository orderRepo) {
        this.orderRepo = orderRepo;
    }

    // Simple simulation:
    // CARD success if last digit of card number is even
    public Map<String, Object> pay(PaymentRequest req) {
        Order o = orderRepo.findById(req.getOrderId())
                .orElseThrow(() -> new RuntimeException("Order not found"));

        boolean success;

        if ("COD".equalsIgnoreCase(req.getMethod())) {
            success = true;
        } else if ("CARD".equalsIgnoreCase(req.getMethod())) {
            success = isCardSuccess(req.getCardNumber());
        } else {
            throw new RuntimeException("Invalid method (use CARD or COD)");
        }

        if (success) {
            o.setStatus("CONFIRMED");
            orderRepo.save(o);
            return Map.of("success", true, "message", "Payment success. Order confirmed.", "orderId", o.getId());
        } else {
            o.setStatus("FAILED");
            orderRepo.save(o);
            return Map.of("success", false, "message", "Payment failed. Your order is not confirmed.", "orderId", o.getId());
        }
    }

    private boolean isCardSuccess(String cardNumber) {
        if (cardNumber == null) return false;
        String digits = cardNumber.replaceAll("\\s", "");
        if (digits.length() < 12) return false;

        char last = digits.charAt(digits.length() - 1);
        if (!Character.isDigit(last)) return false;

        int d = last - '0';
        return d % 2 == 0;
    }
}
