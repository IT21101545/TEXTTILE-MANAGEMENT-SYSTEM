package com.textile.management.config;

import com.textile.management.entity.Role;
import com.textile.management.repository.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;

@Configuration
public class DatabaseSeeder {

    @Bean
    public CommandLineRunner seedRoles(RoleRepository roleRepository) {
        return args -> {
            if (roleRepository.count() == 0) {
                Role admin = new Role();
                admin.setRoleName("Admin");
                admin.setDescription("Administrator role");
                admin.setCreatedAt(LocalDateTime.now());
                roleRepository.save(admin);

                Role owner = new Role();
                owner.setRoleName("Owner");
                owner.setDescription("System Owner");
                owner.setCreatedAt(LocalDateTime.now());
                roleRepository.save(owner);

                Role salesmanager = new Role();
                salesmanager.setRoleName("SalesManager");
                salesmanager.setDescription("Sales Manager role");
                salesmanager.setCreatedAt(LocalDateTime.now());
                roleRepository.save(salesmanager);

                Role staff = new Role();
                staff.setRoleName("Staff");
                staff.setDescription("Staff role");
                staff.setCreatedAt(LocalDateTime.now());
                roleRepository.save(staff);

                Role customer = new Role();
                customer.setRoleName("Customer");
                customer.setDescription("Default Customer role");
                customer.setCreatedAt(LocalDateTime.now());
                roleRepository.save(customer);

                System.out.println("Default roles (Admin, Owner, SalesManager, Staff, Customer) inserted successfully.");
            }
        };
    }
}
