package org.example.zeefashion.service;

import org.example.zeefashion.model.Feedback;
import org.example.zeefashion.repository.FeedbackRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FeedbackService {

    private final FeedbackRepository feedbackRepo;
    private final NotificationService notificationService;

    public FeedbackService(FeedbackRepository feedbackRepo, NotificationService notificationService) {
        this.feedbackRepo = feedbackRepo;
        this.notificationService = notificationService;
    }

    public List<Feedback> all() {
        return feedbackRepo.findAll();
    }

    public Feedback get(Long id) {
        return feedbackRepo.findById(id).orElseThrow(() -> new RuntimeException("Feedback not found"));
    }

    public List<Feedback> getByProductId(Long productId) {
        return feedbackRepo.findByProductId(productId);
    }

    public Feedback create(Feedback f) {
        if (f.getReview() == null || f.getReview().isBlank()) {
            throw new RuntimeException("Feedback review message required");
        }
        return feedbackRepo.save(f);
    }

    public Feedback update(Long id, Feedback payload) {
        Feedback f = get(id);
        boolean wasReplied = (f.getReply() != null);
        
        if (payload.getCustomer() != null) f.setCustomer(payload.getCustomer());
        if (payload.getEmail() != null) f.setEmail(payload.getEmail());
        if (payload.getReview() != null) f.setReview(payload.getReview());
        if (payload.getRating() != null) f.setRating(payload.getRating());
        if (payload.getStatus() != null) f.setStatus(payload.getStatus());
        if (payload.getReply() != null) f.setReply(payload.getReply());
        if (payload.getResolved() != null) f.setResolved(payload.getResolved());

        boolean isRepliedNow = (f.getReply() != null);
        if (!wasReplied && isRepliedNow && f.getEmail() != null) {
            notificationService.createCustomerNotification(
                f.getEmail(),
                "Staff replied to your review: \"" + f.getReview() + "\"",
                "FEEDBACK_REPLY"
            );
        }
        
        return feedbackRepo.save(f);
    }

    public void delete(Long id) {
        feedbackRepo.deleteById(id);
    }

    public Feedback setResolved(Long id, boolean resolved) {
        Feedback f = get(id);
        f.setResolved(resolved);
        return feedbackRepo.save(f);
    }
}