package com.nexorcrm.backend.service;

import com.nexorcrm.backend.entity.JobTask;
import com.nexorcrm.backend.entity.Job;
import com.nexorcrm.backend.repo.JobTaskRepository;
import com.nexorcrm.backend.repo.JobRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class JobTaskService {

    private final JobTaskRepository jobTaskRepository;
    private final JobRepository jobRepository;

    public JobTaskService(JobTaskRepository jobTaskRepository, JobRepository jobRepository) {
        this.jobTaskRepository = jobTaskRepository;
        this.jobRepository = jobRepository;
    }

    public List<JobTask> getTasksByJob(Long jobId) {
        return jobTaskRepository.findByJobId(jobId);
    }

    public JobTask updateTaskStatus(Long taskId, String status) {
        JobTask task = jobTaskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        task.setStatus(status);
        JobTask saved = jobTaskRepository.save(task);

        updateJobProgress(task.getJob().getId());
        return saved;
    }

    public JobTask assignOperator(Long taskId, Long userId) {
        JobTask task = jobTaskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        task.setAssignedUserId(userId);
        task.setStatus("IN_PROGRESS");
        return jobTaskRepository.save(task);
    }

    public JobTask submitProof(Long taskId, String proofFilePath) {
        JobTask task = jobTaskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        task.setProofFilePath(proofFilePath);
        task.setStatus("CUSTOMER_REVIEW");
        return jobTaskRepository.save(task);
    }

    private void updateJobProgress(Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));
        List<JobTask> tasks = jobTaskRepository.findByJobId(jobId);

        if (tasks.isEmpty()) return;

        long approvedCount = tasks.stream()
                .filter(t -> "APPROVED".equals(t.getStatus()))
                .count();

        double progress = (double) approvedCount / tasks.size() * 100.0;
        job.setOverallProgress(progress);
        jobRepository.save(job);
    }
}
