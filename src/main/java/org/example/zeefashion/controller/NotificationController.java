package org.example.zeefashion.controller;

import org.example.zeefashion.model.Notification;
import org.example.zeefashion.service.NotificationService;
import org.example.zeefashion.service.MaterialService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final MaterialService materialService;

    public NotificationController(NotificationService notificationService, MaterialService materialService) {
        this.notificationService = notificationService;
        this.materialService = materialService;
    }

    @GetMapping
    public List<Notification> allUnread() {
        notificationService.syncOutstandingAlerts(materialService.all());
        return notificationService.allUnread();
    }

    @GetMapping("/customer")
    public List<Notification> getCustomerNotifications(@RequestParam String email) {
        return notificationService.getCustomerNotifications(email);
    }

    @PostMapping("/{id}/read")
    public void markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
    }
}
