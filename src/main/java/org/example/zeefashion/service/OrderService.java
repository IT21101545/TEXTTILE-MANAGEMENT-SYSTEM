package org.example.zeefashion.service;

import org.example.zeefashion.dto.Cart.CreateOrderRequest;
import org.example.zeefashion.dto.Cart.OrderItemRequest;
import org.example.zeefashion.dto.Order.UpdateOrderStatusRequest;
import org.example.zeefashion.model.*;
import org.example.zeefashion.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
public class OrderService {

    private final OrderRepository orderRepo;
    private final OrderItemRepository itemRepo;
    private final ProductRepository productRepo;
    private final OrderStatusHistoryRepository historyRepo;
    private final MaterialRepository materialRepo;
    private final NotificationService notificationService;

    public OrderService(OrderRepository orderRepo, OrderItemRepository itemRepo, 
                        ProductRepository productRepo, OrderStatusHistoryRepository historyRepo,
                        MaterialRepository materialRepo, NotificationService notificationService) {
        this.orderRepo = orderRepo;
        this.itemRepo = itemRepo;
        this.productRepo = productRepo;
        this.historyRepo = historyRepo;
        this.materialRepo = materialRepo;
        this.notificationService = notificationService;
    }

    public Map<String, Object> createOrder(CreateOrderRequest req) {
        if (req.getItems() == null || req.getItems().isEmpty()) {
            throw new RuntimeException("Order items cannot be empty");
        }

        Order order = new Order();
        order.setCustomerName(req.getCustomerName());
        order.setCustomerPhone(req.getCustomerPhone());
        order.setCustomerAddress(req.getCustomerAddress());
        order.setCustomerEmail(req.getCustomerEmail());
        order.setPaymentMethod(req.getPaymentMethod());

        // COD => confirmed immediately
        if ("COD".equalsIgnoreCase(req.getPaymentMethod())) {
            order.setStatus("CONFIRMED");
        } else if ("BANK".equalsIgnoreCase(req.getPaymentMethod())) {
            order.setStatus("PENDING"); // wait slip verify
        } else {
            throw new RuntimeException("Invalid payment method (use COD or BANK)");
        }

        BigDecimal total = BigDecimal.ZERO;

        // Save order first to get ID
        Order savedOrder = orderRepo.save(order);

        for (OrderItemRequest it : req.getItems()) {
            Product p = productRepo.findById(it.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + it.getProductId()));

            if (p.getStockQty() < it.getQuantity()) {
                throw new RuntimeException("Not enough stock for: " + p.getName());
            }

            BigDecimal unit = p.getPrice();
            BigDecimal line = unit.multiply(BigDecimal.valueOf(it.getQuantity()));

            OrderItem oi = new OrderItem();
            oi.setOrder(savedOrder);
            oi.setProduct(p);
            oi.setQuantity(it.getQuantity());
            oi.setUnitPrice(unit);
            oi.setLineTotal(line);

            itemRepo.save(oi);
            savedOrder.getItems().add(oi);

            total = total.add(line);

            // reduce stock immediately for COD orders
            if ("CONFIRMED".equalsIgnoreCase(savedOrder.getStatus())) {
                p.setStockQty(p.getStockQty() - it.getQuantity());
                productRepo.save(p);
                syncMaterialShopStock(p, -it.getQuantity());
            }
        }

        savedOrder.setTotal(total);
        orderRepo.save(savedOrder);

        // Record initial status
        historyRepo.save(new OrderStatusHistory(savedOrder, savedOrder.getStatus(), "Order created via " + savedOrder.getPaymentMethod()));

        return Map.of(
                "orderId", savedOrder.getId(),
                "id", savedOrder.getId(),
                "status", savedOrder.getStatus(),
                "total", savedOrder.getTotal(),
                "totalAmount", savedOrder.getTotal(),
                "paymentMethod", savedOrder.getPaymentMethod());
    }

    public void attachSlip(Long orderId, String slipPath) {
        Order o = get(orderId);
        o.setSlipPath(slipPath);
        o.setSlipVerified(false);
        o.setStatus("PENDING");
        orderRepo.save(o);
    }

    public void verifySlip(Long orderId, boolean approved) {
        Order o = get(orderId);

        if (o.getSlipPath() == null || o.getSlipPath().isBlank()) {
            throw new RuntimeException("No slip uploaded for this order");
        }

        o.setSlipVerified(approved);

        if (approved) {
            o.setStatus("CONFIRMED");

            // deduct stock now (BANK approval)
            List<OrderItem> items = itemRepo.findByOrderId(orderId);
            for (OrderItem item : items) {
                Product p = productRepo.findById(item.getProduct().getId())
                        .orElseThrow(() -> new RuntimeException("Product not found"));
                int newQty = p.getStockQty() - item.getQuantity();
                if (newQty < 0)
                    throw new RuntimeException("Not enough stock to confirm order");
                p.setStockQty(newQty);
                productRepo.save(p);
                syncMaterialShopStock(p, -item.getQuantity());
            }

        } else {
            o.setStatus("FAILED");
        }

        orderRepo.save(o);
        historyRepo.save(new OrderStatusHistory(o, o.getStatus(), approved ? "Payment slip approved" : "Payment slip rejected"));

        if (o.getCustomerEmail() != null) {
            String msg = approved ? 
                "Great news! Your payment slip for Order #" + o.getId() + " was approved. Your order is now CONFIRMED." : 
                "Attention: Your payment slip for Order #" + o.getId() + " was rejected. Please contact support.";
            notificationService.createCustomerNotification(o.getCustomerEmail(), msg, "ORDER_STATUS");
        }
    }

    @Transactional
    public void updateStatus(Long orderId, UpdateOrderStatusRequest req) {
        Order o = get(orderId);
        String oldStatus = o.getStatus();
        String newStatus = req.getStatus().toUpperCase();

        if (oldStatus.equals(newStatus)) return;

        // Inventory Adjustment Logic:
        // If moving TO CANCELLED/FAILED FROM a state where stock was already deducted (CONFIRMED, PROCESSING, SHIPPED, DELIVERED)
        List<String> deductedStatuses = List.of("CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED");
        List<String> restoreStatuses = List.of("CANCELLED", "FAILED");

        if (deductedStatuses.contains(oldStatus) && restoreStatuses.contains(newStatus)) {
            // Restore stock
            for (OrderItem item : o.getItems()) {
                Product p = item.getProduct();
                p.setStockQty(p.getStockQty() + item.getQuantity());
                productRepo.save(p);
                syncMaterialShopStock(p, item.getQuantity());
            }
        } 
        // Note: If moving FROM PENDING TO CONFIRMED, stock is deducted in verifySlip or was already done in create (COD).
        else if ("PENDING".equals(oldStatus) && deductedStatuses.contains(newStatus)) {
              for (OrderItem item : o.getItems()) {
                Product p = item.getProduct();
                int newQty = p.getStockQty() - item.getQuantity();
                if (newQty < 0) throw new RuntimeException("Not enough stock to confirm order: " + p.getName());
                p.setStockQty(newQty);
                productRepo.save(p);
                syncMaterialShopStock(p, -item.getQuantity());
            }
        }

        o.setStatus(newStatus);
        orderRepo.save(o);

        historyRepo.save(new OrderStatusHistory(o, newStatus, req.getComment()));

        if (o.getCustomerEmail() != null) {
            String msg = "Your Order #" + o.getId() + " status has been updated to " + newStatus + ".";
            if (req.getComment() != null && !req.getComment().isBlank()) {
                msg += " Note: " + req.getComment();
            }
            notificationService.createCustomerNotification(o.getCustomerEmail(), msg, "ORDER_STATUS");
        }
    }

    public List<Order> all() {
        return orderRepo.findAll();
    }

    public Order get(Long id) {
        return orderRepo.findById(id).orElseThrow(() -> new RuntimeException("Order not found"));
    }

    private void syncMaterialShopStock(Product p, int delta) {
        if (p.getLinkedMaterialId() != null) {
            materialRepo.findById(p.getLinkedMaterialId()).ifPresent(m -> {
                int currentShop = (m.getShopStock() != null) ? m.getShopStock() : 0;
                m.setShopStock(currentShop + delta);
                materialRepo.save(m);
            });
        }
    }

    public void delete(Long id) {
        orderRepo.deleteById(id);
    }
}
