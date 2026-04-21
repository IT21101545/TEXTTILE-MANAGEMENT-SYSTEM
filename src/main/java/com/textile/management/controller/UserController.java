package com.textile.management.controller;

import com.textile.management.dto.*;
import com.textile.management.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class UserController {
    @Autowired
    private UserService userService;

    // Public endpoints
    @PostMapping("/auth/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody UserRegistrationRequest request) {
        try {
            UserDto user = userService.registerUser(request);
            return new ResponseEntity<>(user, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            LoginResponse response = userService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
        }
    }

    @PostMapping("/auth/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String token) {
        if (token != null && token.startsWith("Bearer ")) {
            userService.logout(token.substring(7));
        }
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    // User profile
    @GetMapping("/users/profile")
    public ResponseEntity<?> getCurrentUserProfile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        UserDto user = userService.getUserByEmail(email);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/users/profile")
    public ResponseEntity<?> updateCurrentUserProfile(@Valid @RequestBody UserUpdateRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        UserDto currentUser = userService.getUserByEmail(email);
        UserDto updated = userService.updateUserProfile(currentUser.getUserId(), request, email);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/users/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        UserDto currentUser = userService.getUserByEmail(email);
        userService.changePassword(currentUser.getUserId(), request, email);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    @PostMapping("/users/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody PasswordResetRequest request) {
        userService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(Map.of("message", "Password reset link sent to your email"));
    }

    @PostMapping("/users/reset-password/{token}")
    public ResponseEntity<?> resetPassword(@PathVariable String token, @RequestParam String newPassword) {
        userService.resetPassword(token, newPassword);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }

    // Admin endpoints
    @GetMapping("/users")
    @PreAuthorize("hasRole('Admin') or hasRole('Owner')")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/users/{userId}")
    @PreAuthorize("hasRole('Admin') or hasRole('Owner')")
    public ResponseEntity<?> getUserById(@PathVariable Integer userId) {
        try {
            UserDto user = userService.getUserById(userId);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/users")
    @PreAuthorize("hasRole('Admin') or hasRole('Owner')")
    public ResponseEntity<?> createUser(@Valid @RequestBody UserRegistrationRequest request) {
        try {
            UserDto user = userService.createUser(request);
            return new ResponseEntity<>(user, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/users/{userId}")
    @PreAuthorize("hasRole('Admin') or hasRole('Owner')")
    public ResponseEntity<?> updateUser(@PathVariable Integer userId, @Valid @RequestBody UserUpdateRequest request) {
        try {
            UserDto updated = userService.updateUser(userId, request);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/users/{userId}")
    @PreAuthorize("hasRole('Admin') or hasRole('Owner')")
    public ResponseEntity<?> deleteUser(@PathVariable Integer userId) {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            userService.deleteUser(userId, email);
            return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/users/{userId}/deactivate")
    @PreAuthorize("hasRole('Admin') or hasRole('Owner')")
    public ResponseEntity<?> deactivateUser(@PathVariable Integer userId) {
        userService.deactivateUser(userId);
        return ResponseEntity.ok(Map.of("message", "User deactivated"));
    }

    @PatchMapping("/users/{userId}/activate")
    @PreAuthorize("hasRole('Admin') or hasRole('Owner')")
    public ResponseEntity<?> activateUser(@PathVariable Integer userId) {
        userService.activateUser(userId);
        return ResponseEntity.ok(Map.of("message", "User activated"));
    }
}