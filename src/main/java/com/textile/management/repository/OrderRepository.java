package com.textile.management.repository;

import com.textile.management.entity.CustomerOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<CustomerOrder, Long> {

    List<CustomerOrder> findAllByOrderByOrderDateDesc();

    long countByCustomerID(Integer customerID);

    long countByStatus(String status);

    @Query("SELECT SUM(o.totalAmount) FROM CustomerOrder o WHERE o.customerID = :customerID")
    BigDecimal sumTotalByCustomerID(@Param("customerID") Integer customerID);
}
