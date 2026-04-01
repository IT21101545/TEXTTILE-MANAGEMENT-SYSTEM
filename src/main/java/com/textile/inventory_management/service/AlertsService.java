package com.textile.inventory_management.service;

import com.textile.inventory_management.dto.LowStockAlertDto;
import com.textile.inventory_management.repository.StoredProceduresRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AlertsService {
    private final StoredProceduresRepository repo;
    public AlertsService(StoredProceduresRepository repo) { this.repo = repo; }
    public List<LowStockAlertDto> getLowStockAlerts() { return repo.getLowStockAlerts(); }
}
