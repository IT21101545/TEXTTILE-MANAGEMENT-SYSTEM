package org.example.zeefashion.controller;

import org.example.zeefashion.model.Feedback;
import org.example.zeefashion.service.FeedbackService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @GetMapping
    public List<Feedback> all() {
        return feedbackService.all();
    }

    @GetMapping("/product/{productId}")
    public List<Feedback> getByProduct(@PathVariable Long productId) {
        return feedbackService.getByProductId(productId);
    }

    @PostMapping
    public Feedback create(@RequestBody Feedback feedback) {
        return feedbackService.create(feedback);
    }

    @PutMapping("/{id}")
    public Feedback update(@PathVariable Long id, @RequestBody Feedback feedback) {
        return feedbackService.update(id, feedback);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        feedbackService.delete(id);
    }

    // optional: mark feedback resolved
    @PatchMapping("/{id}/resolve")
    public Feedback resolve(@PathVariable Long id, @RequestParam boolean resolved) {
        return feedbackService.setResolved(id, resolved);
    }
}