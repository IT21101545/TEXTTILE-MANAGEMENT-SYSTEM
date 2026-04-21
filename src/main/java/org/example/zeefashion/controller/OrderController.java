package org.example.zeefashion.controller;

import org.example.zeefashion.dto.Cart.CreateOrderRequest;
import org.example.zeefashion.dto.Order.UpdateOrderStatusRequest;
import org.example.zeefashion.model.Order;
import org.example.zeefashion.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    // Create order from cart + customer info + payment method (COD/BANK)
    @PostMapping
    public Map<String, Object> create(@Valid @RequestBody CreateOrderRequest req) {
        return orderService.createOrder(req);
    }

    @GetMapping
    public List<Order> all() {
        return orderService.all();
    }

    @GetMapping("/{id}")
    public Order one(@PathVariable Long id) {
        return orderService.get(id);
    }

    // Upload bank slip for BANK method
    @PostMapping(value = "/{id}/payment-slip", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> uploadSlip(@PathVariable Long id,
                                          @RequestPart("file") MultipartFile file) throws Exception {
        File dir = new File(uploadDir);
        if (!dir.exists()) dir.mkdirs();

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "slip.jpg";
        String sanitizedName = originalName.replaceAll("[^a-zA-Z0-9.-]", "_");
        
        String safeName = "order_" + id + "_" + System.currentTimeMillis() + "_" + sanitizedName;
        File target = new File(dir, safeName);
        Files.write(target.toPath(), file.getBytes());

        // Save relative path for web access instead of absolute system path
        orderService.attachSlip(id, "uploads/" + safeName);

        return Map.of(
                "ok", true,
                "message", "Slip uploaded. Waiting for verification.",
                "filePath", "/uploads/" + safeName
        );
    }

    // Admin verifies bank slip (approve/reject)
    @PatchMapping("/{id}/verify-slip")
    public Map<String, Object> verifySlip(@PathVariable Long id, @RequestParam boolean approved) {
        orderService.verifySlip(id, approved);
        return Map.of("ok", true, "approved", approved);
    }

    @PutMapping("/{id}/status")
    public Map<String, Object> updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateOrderStatusRequest req) {
        orderService.updateStatus(id, req);
        return Map.of("ok", true, "status", req.getStatus());
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        orderService.delete(id);
    }
}