package com.nexorcrm.backend.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class PromotionScheduler {

    private final PromotionService promotionService;

    public PromotionScheduler(PromotionService promotionService) {
        this.promotionService = promotionService;
    }

    @Scheduled(cron = "0 0 0 * * *", zone = "Asia/Kolkata")
    public void applyDailyPromotions() {
        promotionService.applyDuePromotions();
    }
}
