package org.example.zeefashion.controller;

import org.example.zeefashion.dto.Cart.PaymentRequest;
import org.example.zeefashion.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    // Returns: {success:true/false, message:"..."}
    @PostMapping("/pay")
    public Map<String, Object> pay(@Valid @RequestBody PaymentRequest req) {
        return paymentService.pay(req);
    }
}