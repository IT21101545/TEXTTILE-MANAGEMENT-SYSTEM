package com.textile.management.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserDto {
    private Integer userId;
    private String fullName;
    private String email;
    private String phone;
    private String address;
    private String roleName;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;
    private Boolean isActive;
}