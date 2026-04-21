package org.example.zeefashion.service;

import org.example.zeefashion.dto.auth.RegisterRequest;
import org.example.zeefashion.model.User;
import org.example.zeefashion.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class AuthService {

    private final UserRepository userRepo;

    // simple in-memory id generator (OK for student project)
    private static final AtomicLong SEQ = new AtomicLong(100000);

    public AuthService(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    public Map<String, Object> register(RegisterRequest req) {
        if (userRepo.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User u = new User();
        u.setId("U-" + SEQ.incrementAndGet());
        u.setName(req.getName());
        u.setEmail(req.getEmail());
        u.setPassword(req.getPassword()); // later hash
        u.setRole(req.getRole());
        userRepo.save(u);

        return Map.of(
                "ok", true,
                "userId", u.getId(),
                "role", u.getRole()
        );
    }

    public Map<String, Object> login(String email, String password) {
        User u = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!u.getPassword().equals(password)) {
            throw new RuntimeException("Invalid email or password");
        }

        if ("DISABLED".equals(u.getStatus())) {
            throw new RuntimeException("Account is disabled. Please contact administrator.");
        }

        return Map.of(
                "ok", true,
                "userId", u.getId(),
                "name", u.getName(),
                "role", u.getRole()
        );
    }

    public void forgotPassword(String email) {
        // For demo: do nothing (later integrate email)
        userRepo.findByEmail(email).orElseThrow(() -> new RuntimeException("Email not found"));
    }
}
