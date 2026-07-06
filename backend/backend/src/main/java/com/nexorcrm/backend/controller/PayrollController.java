package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.PayrollRunRequest;
import com.nexorcrm.backend.dto.PayslipResponse;
import com.nexorcrm.backend.service.PayrollService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payroll")
public class PayrollController {

    private final PayrollService payrollService;

    public PayrollController(PayrollService payrollService) {
        this.payrollService = payrollService;
    }

    @PostMapping("/run")
    public List<PayslipResponse> runPayroll(@Valid @RequestBody PayrollRunRequest request) {
        return payrollService.runPayroll(request);
    }

    @GetMapping("/payslips")
    public List<PayslipResponse> getPayslipsForMonth(@RequestParam String month) {
        return payrollService.getPayslipsForMonth(month);
    }

    @PostMapping("/send-payslips")
    public ResponseEntity<Map<String, String>> sendPayslips(@Valid @RequestBody PayrollRunRequest request) {
        payrollService.sendPayslips(request);
        return ResponseEntity.ok(Map.of("message", "Bulk email dispatch triggered successfully"));
    }

    @PostMapping("/payslips/{id}/send")
    public ResponseEntity<Map<String, String>> sendPayslipById(@PathVariable Long id) {
        payrollService.sendPayslipById(id);
        return ResponseEntity.ok(Map.of("message", "Payslip email sent successfully"));
    }

    @GetMapping("/payslips/{id}/pdf")
    public ResponseEntity<byte[]> downloadPayslipPdf(@PathVariable Long id) {
        byte[] pdfBytes = payrollService.getPayslipPdfBytes(id);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "payslip_" + id + ".pdf");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }
}
