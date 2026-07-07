package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.entity.LeadPaymentEntry;
import com.nexorcrm.backend.entity.SalesOrder;
import com.nexorcrm.backend.entity.Job;
import com.nexorcrm.backend.entity.JobTask;
import com.nexorcrm.backend.service.LeadPaymentEntryService;
import com.nexorcrm.backend.service.JobTaskService;
import com.nexorcrm.backend.repo.SalesOrderRepository;
import com.nexorcrm.backend.repo.JobRepository;
import com.nexorcrm.backend.repo.UserRepository;
import com.nexorcrm.backend.repo.CustomerRepository;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/erp")
public class ErpWorkflowController {

    private final SalesOrderRepository salesOrderRepository;
    private final LeadPaymentEntryService paymentEntryService;
    private final JobRepository jobRepository;
    private final JobTaskService jobTaskService;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;

    public ErpWorkflowController(
            SalesOrderRepository salesOrderRepository,
            LeadPaymentEntryService paymentEntryService,
            JobRepository jobRepository,
            JobTaskService jobTaskService,
            UserRepository userRepository,
            CustomerRepository customerRepository) {
        this.salesOrderRepository = salesOrderRepository;
        this.paymentEntryService = paymentEntryService;
        this.jobRepository = jobRepository;
        this.jobTaskService = jobTaskService;
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
    }

    // --- SALES ORDERS ---
    @GetMapping("/sales-orders")
    public List<SalesOrder> getSalesOrders(Authentication authentication) {
        if (authentication == null) {
            return List.of();
        }
        String principal = authentication.getName();
        com.nexorcrm.backend.entity.User user = userRepository.findByEmailIgnoreCaseAndIsDeletedFalse(principal)
                .orElseGet(() -> userRepository.findByUsernameAndIsDeletedFalse(principal).orElse(null));

        if (user != null && user.getRole() == com.nexorcrm.backend.entity.Role.CUSTOMER) {
            return customerRepository.findByEmailAddress(user.getEmail())
                    .map(cust -> salesOrderRepository.findByLeadId(cust.getSourceLeadId()))
                    .orElse(List.of());
        }
        return salesOrderRepository.findAll();
    }

    @GetMapping("/sales-orders/{id}")
    public ResponseEntity<SalesOrder> getSalesOrderById(@PathVariable Long id) {
        return salesOrderRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // --- PAYMENTS ---
    @PostMapping("/payments")
    public ResponseEntity<LeadPaymentEntry> recordPayment(@RequestBody LeadPaymentEntry entry) {
        return ResponseEntity.ok(paymentEntryService.recordPayment(entry));
    }

    @GetMapping("/payments/sales-order/{id}")
    public List<LeadPaymentEntry> getPaymentsBySalesOrder(@PathVariable Long id) {
        return paymentEntryService.getPaymentsBySalesOrder(id);
    }

    @PatchMapping("/payments/{id}/verify")
    public ResponseEntity<LeadPaymentEntry> verifyPayment(@PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(paymentEntryService.verifyPayment(id, status));
    }

    // --- JOBS & PROJECT TASKS ---
    @GetMapping("/jobs/sales-order/{soId}")
    public ResponseEntity<Job> getJobBySalesOrder(@PathVariable Long soId) {
        return jobRepository.findBySalesOrderId(soId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/job-tasks/{jobId}")
    public List<JobTask> getJobTasks(@PathVariable Long jobId) {
        return jobTaskService.getTasksByJob(jobId);
    }

    @PatchMapping("/job-tasks/{id}/status")
    public ResponseEntity<JobTask> updateTaskStatus(@PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(jobTaskService.updateTaskStatus(id, status));
    }

    @PatchMapping("/job-tasks/{id}/assign")
    public ResponseEntity<JobTask> assignOperator(@PathVariable Long id, @RequestParam Long userId) {
        return ResponseEntity.ok(jobTaskService.assignOperator(id, userId));
    }

    @PatchMapping("/job-tasks/{id}/proof")
    public ResponseEntity<JobTask> submitProof(@PathVariable Long id, @RequestParam String file) {
        return ResponseEntity.ok(jobTaskService.submitProof(id, file));
    }
}
