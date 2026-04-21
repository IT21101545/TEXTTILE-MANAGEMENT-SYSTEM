package com.textile.management.servise;

import com.textile.management.dto.OrderCreateRequest;
import com.textile.management.dto.OrderUpdateRequest;
import com.textile.management.dto.OrderViewDto;
import com.textile.management.entity.Customer;
import com.textile.management.entity.CustomerOrder;
import com.textile.management.repository.CustomerRepository;
import com.textile.management.repository.OrderRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;

    public OrderService(OrderRepository orderRepository, CustomerRepository customerRepository) {
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
    }

    public List<OrderViewDto> getAllOrders() {
        return orderRepository.findAllByOrderByOrderDateDesc().stream()
                .map(this::toViewDto)
                .toList();
    }

    public OrderViewDto getOrderById(Long id) {
        CustomerOrder o = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        return toViewDto(o);
    }

    @Transactional
    public OrderViewDto createOrder(OrderCreateRequest req) {
        customerRepository.findById(req.customerID())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));

        CustomerOrder o = new CustomerOrder();
        o.setCustomerID(req.customerID());
        o.setProductDescription(req.productDescription());
        o.setQuantity(req.quantity());
        o.setTotalAmount(req.totalAmount());
        o.setStatus(req.status());
        o.setOrderDate(req.orderDate() != null ? req.orderDate() : LocalDate.now());
        o.setDeliveryDate(req.deliveryDate());
        o.setNotes(req.notes());

        CustomerOrder saved = orderRepository.save(o);
        return toViewDto(saved);
    }

    @Transactional
    public OrderViewDto updateOrder(Long id, OrderUpdateRequest req) {
        CustomerOrder o = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if (req.status() != null && !req.status().isBlank()) {
            o.setStatus(req.status());
        }
        if (req.totalAmount() != null) {
            o.setTotalAmount(req.totalAmount());
        }
        return toViewDto(orderRepository.save(o));
    }

    @Transactional
    public void deleteOrder(Long id) {
        if (!orderRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found");
        }
        orderRepository.deleteById(id);
    }

    private OrderViewDto toViewDto(CustomerOrder o) {
        Customer c = customerRepository.findById(o.getCustomerID()).orElse(null);
        String name = c != null ? c.getFullName() : "—";
        String phone = c != null && c.getPhone() != null ? c.getPhone() : "";
        String dateStr = o.getOrderDate() != null ? o.getOrderDate().toString() : "";
        String displayId = "ORD-" + String.format("%06d", o.getOrderID());
        return new OrderViewDto(
                o.getOrderID(),
                displayId,
                name,
                phone,
                o.getProductDescription() != null ? o.getProductDescription() : "",
                o.getQuantity() != null ? o.getQuantity() : 0,
                o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO,
                o.getStatus() != null ? o.getStatus() : "",
                dateStr
        );
    }
}
