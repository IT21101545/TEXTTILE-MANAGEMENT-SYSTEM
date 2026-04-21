package com.textile.management.servise;

import com.textile.management.dto.CustomerViewDto;
import com.textile.management.entity.Customer;
import com.textile.management.repository.CustomerRepository;
import com.textile.management.repository.OrderRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;

    public CustomerService(CustomerRepository customerRepository, OrderRepository orderRepository) {
        this.customerRepository = customerRepository;
        this.orderRepository = orderRepository;
    }

    public List<CustomerViewDto> getAllCustomersForView() {
        return customerRepository.findAll().stream()
                .map(this::toViewDto)
                .toList();
    }

    public Customer getCustomerById(Integer id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));
    }

    public CustomerViewDto getCustomerViewById(Integer id) {
        return toViewDto(getCustomerById(id));
    }

    @Transactional
    public Customer createCustomer(Customer customer) {
        if (customer.getCreatedAt() == null) {
            customer.setCreatedAt(LocalDateTime.now());
        }
        return customerRepository.save(customer);
    }

    @Transactional
    public Customer updateCustomer(Integer id, Customer updated) {
        Customer existing = customerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));
        if (updated.getFullName() != null) {
            existing.setFullName(updated.getFullName());
        }
        if (updated.getPhone() != null) {
            existing.setPhone(updated.getPhone());
        }
        if (updated.getEmail() != null) {
            existing.setEmail(updated.getEmail());
        }
        if (updated.getAddress() != null) {
            existing.setAddress(updated.getAddress());
        }
        if (updated.getCity() != null) {
            existing.setCity(updated.getCity());
        }
        if (updated.getPasswordHash() != null) {
            existing.setPasswordHash(updated.getPasswordHash());
        }
        return customerRepository.save(existing);
    }

    @Transactional
    public void deleteCustomer(Integer id) {
        if (!customerRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found");
        }
        if (orderRepository.countByCustomerID(id) > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot delete customer with existing orders");
        }
        customerRepository.deleteById(id);
    }

    private CustomerViewDto toViewDto(Customer c) {
        long orders = orderRepository.countByCustomerID(c.getCustomerID());
        BigDecimal sum = orderRepository.sumTotalByCustomerID(c.getCustomerID());
        long spend = sum == null ? 0L : sum.setScale(0, RoundingMode.HALF_UP).longValue();
        return new CustomerViewDto(
                c.getCustomerID(),
                c.getFullName(),
                c.getEmail(),
                c.getPhone(),
                c.getCity(),
                c.getAddress(),
                orders,
                spend
        );
    }
}
