package com.nexorcrm.backend.service;

import com.nexorcrm.backend.entity.LeadPaymentEntry;
import com.nexorcrm.backend.entity.SalesOrder;
import com.nexorcrm.backend.entity.Lead;
import com.nexorcrm.backend.entity.Job;
import com.nexorcrm.backend.entity.JobTask;
import com.nexorcrm.backend.repo.LeadPaymentEntryRepository;
import com.nexorcrm.backend.repo.SalesOrderRepository;
import com.nexorcrm.backend.repo.LeadRepository;
import com.nexorcrm.backend.repo.JobRepository;
import com.nexorcrm.backend.repo.JobTaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class LeadPaymentEntryService {

    private final LeadPaymentEntryRepository paymentEntryRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final LeadRepository leadRepository;
    private final JobRepository jobRepository;
    private final JobTaskRepository jobTaskRepository;

    public LeadPaymentEntryService(
            LeadPaymentEntryRepository paymentEntryRepository,
            SalesOrderRepository salesOrderRepository,
            LeadRepository leadRepository,
            JobRepository jobRepository,
            JobTaskRepository jobTaskRepository) {
        this.paymentEntryRepository = paymentEntryRepository;
        this.salesOrderRepository = salesOrderRepository;
        this.leadRepository = leadRepository;
        this.jobRepository = jobRepository;
        this.jobTaskRepository = jobTaskRepository;
    }

    public LeadPaymentEntry recordPayment(LeadPaymentEntry entry) {
        entry.setStatus("PENDING");
        LeadPaymentEntry saved = paymentEntryRepository.save(entry);

        if (entry.getSalesOrderId() != null) {
            verifyAndProcessMilestones(entry.getSalesOrderId());
        }

        return saved;
    }

    public List<LeadPaymentEntry> getPaymentsBySalesOrder(Long salesOrderId) {
        return paymentEntryRepository.findBySalesOrderId(salesOrderId);
    }

    public List<LeadPaymentEntry> getPaymentsByLead(Long leadId) {
        return paymentEntryRepository.findByLeadId(leadId);
    }

    public LeadPaymentEntry verifyPayment(Long entryId, String status) {
        LeadPaymentEntry entry = paymentEntryRepository.findById(entryId)
                .orElseThrow(() -> new RuntimeException("Payment entry not found"));
        entry.setStatus(status);
        LeadPaymentEntry saved = paymentEntryRepository.save(entry);

        if ("VERIFIED".equals(status) && entry.getSalesOrderId() != null) {
            updateSalesOrderPaidAmount(entry.getSalesOrderId());
            verifyAndProcessMilestones(entry.getSalesOrderId());
        }

        return saved;
    }

    private void updateSalesOrderPaidAmount(Long salesOrderId) {
        SalesOrder so = salesOrderRepository.findById(salesOrderId)
                .orElseThrow(() -> new RuntimeException("Sales order not found"));
        
        List<LeadPaymentEntry> verifiedPayments = paymentEntryRepository.findBySalesOrderId(salesOrderId);
        BigDecimal totalPaid = verifiedPayments.stream()
                .filter(p -> "VERIFIED".equals(p.getStatus()))
                .map(LeadPaymentEntry::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        so.setPaidAmount(totalPaid);
        
        if (totalPaid.compareTo(so.getTotalAmount()) >= 0) {
            so.setStatus("COMPLETED");
        } else if (totalPaid.compareTo(BigDecimal.ZERO) > 0) {
            so.setStatus("IN_PRODUCTION");
        }
        
        salesOrderRepository.save(so);
    }

    private void verifyAndProcessMilestones(Long salesOrderId) {
        SalesOrder so = salesOrderRepository.findById(salesOrderId)
                .orElseThrow(() -> new RuntimeException("Sales order not found"));

        // 50% advance check to create Job & Tasks
        BigDecimal totalPaid = so.getPaidAmount();
        BigDecimal advanceThreshold = so.getTotalAmount().multiply(new BigDecimal("0.5"));

        if (totalPaid.compareTo(advanceThreshold) >= 0) {
            Optional<Job> existingJob = jobRepository.findBySalesOrderId(salesOrderId);
            if (!existingJob.isPresent()) {
                Job job = new Job();
                job.setSalesOrderId(salesOrderId);
                job.setJobNumber("JOB-" + System.currentTimeMillis());
                job.setOverallProgress(0.0);
                Job savedJob = jobRepository.save(job);

                // Spawn Design Task automatically
                JobTask design = new JobTask();
                design.setJob(savedJob);
                design.setDepartment("DESIGN");
                design.setStatus("PENDING");
                jobTaskRepository.save(design);

                // Spawn Printing Task
                JobTask printing = new JobTask();
                printing.setJob(savedJob);
                printing.setDepartment("PRINTING");
                printing.setStatus("PENDING");
                jobTaskRepository.save(printing);

                so.setStatus("IN_DESIGN");
                salesOrderRepository.save(so);
            }
        }
    }
}
