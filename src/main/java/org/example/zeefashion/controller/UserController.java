package org.example.zeefashion.controller;

import org.example.zeefashion.model.User;
import org.example.zeefashion.service.UserService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<User> all() {
        return userService.all();
    }

    @GetMapping("/{id}")
    public User one(@PathVariable String id) {
        return userService.get(id);
    }

    @PostMapping
    public User create(@RequestBody User user) {
        return userService.create(user);
    }

    @PutMapping("/{id}")
    public User update(@PathVariable String id, @RequestBody User user) {
        return userService.update(id, user);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        userService.delete(id);
    }

    // For "My Profile" style usage
    @GetMapping("/me")
    public User me(@RequestParam String userId) {
        return userService.get(userId);
    }

    @PutMapping("/me")
    public User updateMe(@RequestParam String userId, @RequestBody User user) {
        return userService.update(userId, user);
    }
}
