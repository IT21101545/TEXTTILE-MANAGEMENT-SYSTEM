package com.textile.management;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class TextileManagementSystemApplication {
    public static void main(String[] args) {
        SpringApplication.run(TextileManagementSystemApplication.class, args);
        System.out.println("========================================");
        System.out.println("Application Started Successfully!");
        System.out.println("========================================");
    }
}