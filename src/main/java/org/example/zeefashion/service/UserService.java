package org.example.zeefashion.service;

import org.example.zeefashion.model.User;
import org.example.zeefashion.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepo;

    public UserService(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    public List<User> all() {
        return userRepo.findAll();
    }

    public User get(String id) {
        return userRepo.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User create(User u) {
        if (u.getId() == null || u.getId().isBlank()) {
            User lastUser = userRepo.findTopByOrderByIdDesc();
            long nextId = 100001;
            if (lastUser != null && lastUser.getId() != null && lastUser.getId().startsWith("U-")) {
                try {
                    nextId = Long.parseLong(lastUser.getId().substring(2)) + 1;
                } catch (NumberFormatException ignored) {}
            }
            u.setId("U-" + nextId);
        }
        return userRepo.save(u);
    }

    public User update(String id, User payload) {
        User u = get(id);
        if (payload.getName() != null) u.setName(payload.getName());
        if (payload.getPhone() != null) u.setPhone(payload.getPhone());
        if (payload.getRole() != null) u.setRole(payload.getRole());
        if (payload.getEmail() != null) u.setEmail(payload.getEmail());
        if (payload.getPassword() != null) u.setPassword(payload.getPassword());
        if (payload.getStatus() != null) u.setStatus(payload.getStatus());
        return userRepo.save(u);
    }

    public void delete(String id) {
        userRepo.deleteById(id);
    }
}