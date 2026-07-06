package com.nexorcrm.backend.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.BaseFont;
import com.nexorcrm.backend.dto.PayrollRunRequest;
import com.nexorcrm.backend.dto.PayslipResponse;
import com.nexorcrm.backend.entity.*;
import com.nexorcrm.backend.repo.*;
import jakarta.mail.internet.MimeMessage;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.List;

@Service
@Transactional
public class PayrollService {

    private static final Logger log = LoggerFactory.getLogger(PayrollService.class);

    private final EmployeeRepository employeeRepository;
    private final EmployeeSalaryRepository employeeSalaryRepository;
    private final PayslipRepository payslipRepository;
    private final AttendanceRepository attendanceRepository;
    private final LeaveRepository leaveRepository;
    private final UserRepository userRepository;
    private final PayrollOvertimeRepository overtimeRepository;
    private final MailSettingsService mailSettingsService;
    private final JavaMailSender defaultMailSender;
    private final PayslipService payslipService;
    private final EmailTemplateRepository emailTemplateRepository;
    private final PayslipTemplateRepository payslipTemplateRepository;

    public PayrollService(EmployeeRepository employeeRepository,
                          EmployeeSalaryRepository employeeSalaryRepository,
                          PayslipRepository payslipRepository,
                          AttendanceRepository attendanceRepository,
                          LeaveRepository leaveRepository,
                          UserRepository userRepository,
                          PayrollOvertimeRepository overtimeRepository,
                          MailSettingsService mailSettingsService,
                          JavaMailSender defaultMailSender,
                          PayslipService payslipService,
                          EmailTemplateRepository emailTemplateRepository,
                          PayslipTemplateRepository payslipTemplateRepository) {
        this.employeeRepository = employeeRepository;
        this.employeeSalaryRepository = employeeSalaryRepository;
        this.payslipRepository = payslipRepository;
        this.attendanceRepository = attendanceRepository;
        this.leaveRepository = leaveRepository;
        this.userRepository = userRepository;
        this.overtimeRepository = overtimeRepository;
        this.mailSettingsService = mailSettingsService;
        this.defaultMailSender = defaultMailSender;
        this.payslipService = payslipService;
        this.emailTemplateRepository = emailTemplateRepository;
        this.payslipTemplateRepository = payslipTemplateRepository;
    }

    public List<PayslipResponse> runPayroll(PayrollRunRequest request) {
        String monthStr = request.getMonth();
        LocalDate[] range = parseMonthRange(monthStr);
        LocalDate startDate = range[0];
        LocalDate endDate = range[1];

        List<PayrollOvertime> overtimes = overtimeRepository.findByDeletedFalseOrderByNameAsc();
        BigDecimal normalHoursRate = null;
        BigDecimal overtimeRate = null;
        for (PayrollOvertime ot : overtimes) {
            String name = ot.getName().toLowerCase();
            if (name.contains("normal") || name.contains("regular")) {
                normalHoursRate = ot.getRate();
            } else if (name.contains("overtime") || name.contains("ot")) {
                overtimeRate = ot.getRate();
            }
        }
        // If not matched by specific names, try to assign default fallbacks from the list
        if (overtimeRate == null && !overtimes.isEmpty()) {
            overtimeRate = overtimes.get(0).getRate();
        }

        List<Employee> employees = employeeRepository.findByDeletedFalseOrderByIdDesc();
        List<PayslipResponse> responses = new ArrayList<>();

        for (Employee emp : employees) {
            Optional<EmployeeSalary> salaryOpt = employeeSalaryRepository.findByEmployeeIdAndDeletedFalse(emp.getId());
            if (salaryOpt.isEmpty()) {
                continue; // Skip if no salary structure
            }
            EmployeeSalary sal = salaryOpt.get();

            // 1. Calculate Overtime
            BigDecimal overtimeAmount = BigDecimal.ZERO;
            Optional<User> userOpt = userRepository.findByEmployeeIdAndIsDeletedFalse(emp.getId());
            if (userOpt.isPresent()) {
                int totalOtMinutes = attendanceRepository.sumOvertimeMinutesByUserBetween(userOpt.get().getId(), startDate, endDate);
                if (totalOtMinutes > 0) {
                    BigDecimal otHours = BigDecimal.valueOf(totalOtMinutes).divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
                    
                    BigDecimal otHourlyRate = BigDecimal.ZERO;
                    BigDecimal basic = sal.getBasic() != null ? sal.getBasic() : BigDecimal.ZERO;

                    if (overtimeRate != null) {
                        if (normalHoursRate != null) {
                            BigDecimal multiplier;
                            if (overtimeRate.compareTo(BigDecimal.valueOf(10)) > 0) {
                                multiplier = overtimeRate.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
                            } else {
                                multiplier = overtimeRate;
                            }
                            otHourlyRate = normalHoursRate.multiply(multiplier);
                        } else {
                            otHourlyRate = overtimeRate;
                        }
                    } else {
                        // Dynamic OT Hourly Rate fallback: (Basic / 240) * 1.5
                        BigDecimal regularHourlyRate = basic.divide(BigDecimal.valueOf(240), 4, RoundingMode.HALF_UP);
                        otHourlyRate = regularHourlyRate.multiply(BigDecimal.valueOf(1.5));
                    }
                    
                    overtimeAmount = otHours.multiply(otHourlyRate).setScale(2, RoundingMode.HALF_UP);
                }
            }

            // 2. Calculate Leave Deductions (LOP)
            BigDecimal leaveDeductionAmount = BigDecimal.ZERO;
            List<Leave> leaves = leaveRepository.findByEmployeeIdAndDeletedFalseOrderByFromDateDesc(emp.getId());
            BigDecimal totalLopDays = BigDecimal.ZERO;
            for (Leave leave : leaves) {
                if ("APPROVED".equalsIgnoreCase(leave.getStatus())) {
                    LocalDate lStart = leave.getFromDate();
                    LocalDate lEnd = leave.getToDate();
                    if (lStart.isBefore(endDate.plusDays(1)) && lEnd.isAfter(startDate.minusDays(1))) {
                        LocalDate overlapStart = lStart.isBefore(startDate) ? startDate : lStart;
                        LocalDate overlapEnd = lEnd.isAfter(endDate) ? endDate : lEnd;
                        long overlapDays = ChronoUnit.DAYS.between(overlapStart, overlapEnd) + 1;
                        String type = leave.getLeaveType() != null ? leave.getLeaveType().toLowerCase() : "";
                        if (type.contains("lop") || type.contains("unpaid") || type.contains("loss of pay")) {
                            BigDecimal days = leave.getNoOfDays() != null ? leave.getNoOfDays() : BigDecimal.ZERO;
                            long totalLeaveDays = ChronoUnit.DAYS.between(lStart, lEnd) + 1;
                            if (totalLeaveDays > 0) {
                                double prop = (double) overlapDays / totalLeaveDays;
                                totalLopDays = totalLopDays.add(days.multiply(BigDecimal.valueOf(prop)));
                            }
                        }
                    }
                }
            }

            if (totalLopDays.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal basic = sal.getBasic() != null ? sal.getBasic() : BigDecimal.ZERO;
                BigDecimal dailyRate = basic.divide(BigDecimal.valueOf(30), 2, RoundingMode.HALF_UP);
                leaveDeductionAmount = dailyRate.multiply(totalLopDays).setScale(2, RoundingMode.HALF_UP);
            }

            // 3. Compute Net Salary
            BigDecimal basic = sal.getBasic() != null ? sal.getBasic() : BigDecimal.ZERO;
            BigDecimal da = sal.getDa() != null ? sal.getDa() : BigDecimal.ZERO;
            BigDecimal hra = sal.getHra() != null ? sal.getHra() : BigDecimal.ZERO;
            BigDecimal conveyance = sal.getConveyance() != null ? sal.getConveyance() : BigDecimal.ZERO;

            BigDecimal grossSalary = basic.add(da).add(hra).add(conveyance).add(overtimeAmount);

            BigDecimal pf = sal.getPf() != null ? sal.getPf() : BigDecimal.ZERO;
            BigDecimal esi = sal.getEsi() != null ? sal.getEsi() : BigDecimal.ZERO;
            BigDecimal tds = sal.getTds() != null ? sal.getTds() : BigDecimal.ZERO;

            BigDecimal totalDeductions = pf.add(esi).add(tds).add(leaveDeductionAmount);
            BigDecimal netSalary = grossSalary.subtract(totalDeductions);
            if (netSalary.compareTo(BigDecimal.ZERO) < 0) {
                netSalary = BigDecimal.ZERO;
            }

            // Check if payslip already exists for this employee + month to avoid duplicates
            // We find any existing non-deleted payslip and update it, or create a new one
            List<Payslip> existingList = payslipRepository.findByMonthAndDeletedFalseOrderByIdDesc(monthStr);
            Payslip p = existingList.stream()
                    .filter(x -> x.getEmployee().getId().equals(emp.getId()))
                    .findFirst()
                    .orElse(new Payslip());

            p.setEmployee(emp);
            p.setEmployeeSalary(sal);
            p.setMonth(monthStr);
            p.setBasic(basic);
            p.setDa(da);
            p.setHra(hra);
            p.setConveyance(conveyance);
            p.setOvertime(overtimeAmount);
            p.setPf(pf);
            p.setEsi(esi);
            p.setTds(tds);
            p.setLeaveDeduction(leaveDeductionAmount);
            p.setNetSalary(netSalary);
            p.setStatus("Generated");
            p.setGeneratedAt(LocalDateTime.now());

            Payslip saved = payslipRepository.save(p);
            responses.add(payslipService.toResponse(saved));
        }

        return responses;
    }

    public List<PayslipResponse> getPayslipsForMonth(String month) {
        return payslipRepository.findByMonthAndDeletedFalseOrderByIdDesc(month)
                .stream().map(payslipService::toResponse).toList();
    }

    public void sendPayslips(PayrollRunRequest request) {
        List<Payslip> payslips = payslipRepository.findByMonthAndDeletedFalseOrderByIdDesc(request.getMonth());
        for (Payslip p : payslips) {
            try {
                sendIndividualPayslipEmail(p);
            } catch (Exception e) {
                log.error("Failed to send payslip email for employee ID: {}", p.getEmployee().getId(), e);
            }
        }
    }

    public void sendPayslipById(Long id) {
        Payslip p = payslipRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Payslip not found"));
        if (Boolean.TRUE.equals(p.getDeleted())) {
            throw new EntityNotFoundException("Payslip not found");
        }
        try {
            sendIndividualPayslipEmail(p);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        }
    }

    private void sendIndividualPayslipEmail(Payslip p) throws Exception {
        Employee emp = p.getEmployee();
        String recipientEmail = emp.getEmail() != null && !emp.getEmail().isBlank()
                ? emp.getEmail()
                : (emp.getOfficialEmail() != null && !emp.getOfficialEmail().isBlank()
                ? emp.getOfficialEmail()
                : emp.getPersonalEmail());

        if (!StringUtils.hasText(recipientEmail)) {
            log.warn("Skipping email for employee {} due to missing email address.", emp.getName());
            return;
        }

        MailSettingsService.ResolvedMailSettings mailSettings = mailSettingsService.resolve();
        boolean mailEnabled = mailSettings != null ? mailSettings.enabled : false; // fallback or configured

        if (mailSettings == null || !mailEnabled) {
            log.warn("Mail is disabled or settings not configured. Cannot send email to {}.", recipientEmail);
            return;
        }

        JavaMailSender sender = buildSender(mailSettings);
        MimeMessage message = sender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setTo(recipientEmail.trim().toLowerCase());
        
        String fromAddress = mailSettings.fromAddress;
        String fromName = mailSettings.fromName;
        if (StringUtils.hasText(fromAddress)) {
            helper.setFrom(StringUtils.hasText(fromName) ? String.format("%s <%s>", fromName, fromAddress) : fromAddress);
        }

        if (StringUtils.hasText(mailSettings.cc)) {
            helper.setCc(splitEmails(mailSettings.cc));
        }
        if (StringUtils.hasText(mailSettings.bcc)) {
            helper.setBcc(splitEmails(mailSettings.bcc));
        }

        String subject = String.format("Payslip for %s", p.getMonth());
        String body = String.format(
                "Dear %s,\n\n" +
                "We hope you are doing well.\n\n" +
                "Your payslip for the month of %s has been generated and is attached to this email for your reference.\n\n" +
                "Please review the attached document for complete details regarding your earnings, deductions, and net salary.\n\n" +
                "Payslip Details\n\n" +
                "Employee Name: %s\n" +
                "Employee ID: %s\n" +
                "Pay Period: %s\n\n" +
                "If you have any questions regarding your salary or payroll calculations, please contact the HR Department.\n\n" +
                "Thank you.\n\n" +
                "Best Regards,\n" +
                "HR Department\n" +
                "SVL Packaging Printing",
                emp.getName(),
                p.getMonth(),
                emp.getName(),
                emp.getEmployeeCode() != null ? emp.getEmployeeCode() : "N/A",
                p.getMonth()
        );

        Optional<EmailTemplate> templateOpt = emailTemplateRepository.findByTemplateKey("PAYSLIP_EMAIL_TEMPLATE");
        if (templateOpt.isPresent()) {
            EmailTemplate template = templateOpt.get();
            if (!template.isActive()) {
                log.warn("Skipping payslip email dispatch for employee {} because Payslip Email Template is inactive.", emp.getName());
                return;
            }
            if (StringUtils.hasText(template.getSubject())) {
                subject = template.getSubject()
                        .replace("{{month}}", p.getMonth())
                        .replace("{{employee_name}}", emp.getName())
                        .replace("{{employee_code}}", emp.getEmployeeCode() != null ? emp.getEmployeeCode() : "N/A");
            }
            if (StringUtils.hasText(template.getBody())) {
                body = template.getBody()
                        .replace("{{month}}", p.getMonth())
                        .replace("{{employee_name}}", emp.getName())
                        .replace("{{employee_code}}", emp.getEmployeeCode() != null ? emp.getEmployeeCode() : "N/A");
            }
        }

        helper.setSubject(subject);
        helper.setText(body);

        byte[] pdfBytes = generatePayslipPdf(p);
        helper.addAttachment(String.format("Payslip_%s_%s.pdf", p.getMonth().replace(" ", "_"), emp.getName().replace(" ", "_")),
                new org.springframework.core.io.ByteArrayResource(pdfBytes));

        try {
            sender.send(message);
        } catch (MailAuthenticationException ex) {
            log.warn("SMTP authentication failed using stored mail settings for employee {}. Retrying with application mail sender.", emp.getName());
            defaultMailSender.send(message);
        }

        p.setStatus("Sent");
        payslipRepository.save(p);
        log.info("Successfully sent payslip email to {} for {}", recipientEmail, p.getMonth());
    }

    public byte[] getPayslipPdfBytes(Long id) {
        Payslip p = payslipRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Payslip not found"));
        if (Boolean.TRUE.equals(p.getDeleted())) {
            throw new EntityNotFoundException("Payslip not found");
        }
        try {
            return generatePayslipPdf(p);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF: " + e.getMessage(), e);
        }
    }

    public byte[] generatePayslipPdf(Payslip p) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        
        PayslipTemplate template = payslipTemplateRepository.findTopByOrderByIdAsc().orElse(null);
        float topBannerHeight = 0f;
        if (template != null && template.getTopImageBase64() != null && !template.getTopImageBase64().trim().isEmpty()) {
            try {
                byte[] decoded = decodeBase64Image(template.getTopImageBase64());
                if (decoded != null) {
                    Image img = Image.getInstance(decoded);
                    float imgWidth = img.getWidth();
                    float imgHeight = img.getHeight();
                    float ratio = imgWidth / imgHeight;
                    float pdfWidth = PageSize.A4.getWidth();
                    topBannerHeight = pdfWidth / ratio;
                }
            } catch (Exception e) {
                log.warn("Failed to pre-calculate banner height: {}", e.getMessage());
            }
        }

        // Set top margin to place content exactly 2mm below top banner
        float topMargin = 25f;
        if (topBannerHeight > 0) {
            topMargin = topBannerHeight + (2f * 2.83465f);
        }

        Document doc = new Document(PageSize.A4, 25, 25, topMargin, 25);
        PdfWriter writer = PdfWriter.getInstance(doc, baos);
        doc.open();

        Font companyTitleFont = FontFactory.getFont(FontFactory.HELVETICA, 16, Font.NORMAL, new java.awt.Color(11, 44, 88));
        Font companyDetailFont = FontFactory.getFont(FontFactory.HELVETICA, 8, Font.NORMAL, java.awt.Color.DARK_GRAY);
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA, 18, Font.NORMAL, new java.awt.Color(11, 44, 88));
        Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA, 11, Font.NORMAL, new java.awt.Color(0, 126, 51));
        Font headingFont = FontFactory.getFont(FontFactory.HELVETICA, 9, Font.NORMAL, java.awt.Color.WHITE);
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 8, Font.NORMAL, java.awt.Color.BLACK);
        Font boldFont = FontFactory.getFont(FontFactory.HELVETICA, 8, Font.NORMAL, java.awt.Color.BLACK);
        Font netSalaryFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Font.BOLD, java.awt.Color.WHITE);
        Font netSalaryLabelFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Font.NORMAL, java.awt.Color.WHITE);
        Font wordFont = FontFactory.getFont(FontFactory.HELVETICA, 9, Font.NORMAL, java.awt.Color.BLACK);

        String addr = (template != null && template.getAddress() != null) ? template.getAddress() : "";
        String p1 = (template != null && template.getPhone1() != null) ? template.getPhone1() : "";
        String p2 = (template != null && template.getPhone2() != null) ? template.getPhone2() : "";
        String mail = (template != null && template.getEmail() != null) ? template.getEmail() : "";
        String web = (template != null && template.getWebsite() != null) ? template.getWebsite() : "";
        String gst = (template != null && template.getGstin() != null) ? template.getGstin() : "";
        String udyam = (template != null && template.getUdyamNumber() != null) ? template.getUdyamNumber() : "";

        // 1. Top Image Banner (drawn edge-to-edge)
        if (topBannerHeight > 0) {
            try {
                byte[] decoded = decodeBase64Image(template.getTopImageBase64());
                if (decoded != null) {
                    Image img = Image.getInstance(decoded);
                    img.scaleAbsolute(PageSize.A4.getWidth(), topBannerHeight);
                    img.setAbsolutePosition(0f, PageSize.A4.getHeight() - topBannerHeight);
                    doc.add(img);
                }

                // Draw dynamic text and circular icons overlaying the banner image (same way as quotation)
                PdfContentByte cb = writer.getDirectContent();
                BaseFont bfBold = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
                float pageHeight = PageSize.A4.getHeight();
                float scale = 2.83465f; // 1 mm = 2.83465 points

                // Address circle & text & location pin icon
                if (!addr.isEmpty()) {
                    float cx = 31f * scale;
                    float cy = pageHeight - (34f * scale);
                    cb.saveState();
                    cb.setColorFill(new java.awt.Color(30, 30, 30));
                    cb.circle(cx, cy, 1.8f * scale);
                    cb.fill();
                    // Location pin icon inside
                    cb.setColorFill(new java.awt.Color(255, 255, 255));
                    cb.circle(cx, cy + 0.4f * scale, 0.6f * scale);
                    cb.fill();
                    cb.moveTo(cx - 0.6f * scale, cy + 0.4f * scale);
                    cb.lineTo(cx + 0.6f * scale, cy + 0.4f * scale);
                    cb.lineTo(cx, cy - 1.1f * scale);
                    cb.closePath();
                    cb.fill();
                    cb.setColorFill(new java.awt.Color(30, 30, 30));
                    cb.circle(cx, cy + 0.4f * scale, 0.25f * scale);
                    cb.fill();
                    cb.restoreState();

                    cb.beginText();
                    cb.setFontAndSize(bfBold, 7.5f);
                    cb.setColorFill(new java.awt.Color(30, 30, 30));
                    cb.showTextAligned(Element.ALIGN_LEFT, addr, 35f * scale, pageHeight - (35f * scale), 0);
                    cb.endText();
                }

                // Phone 1 circle & text & phone icon
                if (!p1.isEmpty()) {
                    float cx = 31f * scale;
                    float cy = pageHeight - (40f * scale);
                    cb.saveState();
                    cb.setColorFill(new java.awt.Color(30, 30, 30));
                    cb.circle(cx, cy, 1.8f * scale);
                    cb.fill();
                    // Phone icon
                    cb.setColorFill(new java.awt.Color(255, 255, 255));
                    cb.setColorStroke(new java.awt.Color(255, 255, 255));
                    cb.setLineWidth(0.4f * scale);
                    cb.circle(cx - 0.6f * scale, cy + 0.3f * scale, 0.45f * scale);
                    cb.circle(cx + 0.6f * scale, cy - 0.3f * scale, 0.45f * scale);
                    cb.fill();
                    cb.moveTo(cx - 0.6f * scale, cy + 0.3f * scale);
                    cb.lineTo(cx + 0.6f * scale, cy - 0.3f * scale);
                    cb.stroke();
                    cb.restoreState();

                    cb.beginText();
                    cb.setFontAndSize(bfBold, 7.5f);
                    cb.setColorFill(new java.awt.Color(30, 30, 30));
                    cb.showTextAligned(Element.ALIGN_LEFT, "Ph: " + p1, 35f * scale, pageHeight - (41f * scale), 0);
                    cb.endText();
                }

                // Email circle & text & envelope icon
                if (!mail.isEmpty()) {
                    float cx = 86f * scale;
                    float cy = pageHeight - (40f * scale);
                    cb.saveState();
                    cb.setColorFill(new java.awt.Color(30, 30, 30));
                    cb.circle(cx, cy, 1.8f * scale);
                    cb.fill();
                    // Envelope
                    cb.setColorFill(new java.awt.Color(255, 255, 255));
                    cb.rectangle(cx - 1.1f * scale, cy - 0.8f * scale, 2.2f * scale, 1.6f * scale);
                    cb.fill();
                    cb.setColorStroke(new java.awt.Color(30, 30, 30));
                    cb.setLineWidth(0.2f * scale);
                    cb.moveTo(cx - 1.1f * scale, cy + 0.8f * scale);
                    cb.lineTo(cx, cy + 0.1f * scale);
                    cb.moveTo(cx + 1.1f * scale, cy + 0.8f * scale);
                    cb.lineTo(cx, cy + 0.1f * scale);
                    cb.stroke();
                    cb.restoreState();

                    cb.beginText();
                    cb.setFontAndSize(bfBold, 7.5f);
                    cb.setColorFill(new java.awt.Color(30, 30, 30));
                    cb.showTextAligned(Element.ALIGN_LEFT, mail, 90f * scale, pageHeight - (41f * scale), 0);
                    cb.endText();
                }

                // GSTIN circle & text & GST text
                if (!gst.isEmpty()) {
                    float cx = 146f * scale;
                    float cy = pageHeight - (40f * scale);
                    cb.saveState();
                    cb.setColorFill(new java.awt.Color(30, 30, 30));
                    cb.circle(cx, cy, 1.8f * scale);
                    cb.fill();
                    cb.restoreState();

                    cb.beginText();
                    cb.setFontAndSize(bfBold, 3.5f);
                    cb.setColorFill(new java.awt.Color(255, 255, 255));
                    cb.showTextAligned(Element.ALIGN_CENTER, "GST", cx, cy - 1.1f, 0);
                    cb.endText();

                    cb.beginText();
                    cb.setFontAndSize(bfBold, 7.5f);
                    cb.setColorFill(new java.awt.Color(30, 30, 30));
                    cb.showTextAligned(Element.ALIGN_LEFT, "GSTIN: " + gst, 150f * scale, pageHeight - (41f * scale), 0);
                    cb.endText();
                }

                // Phone 2 circle & text & landline icon
                if (!p2.isEmpty()) {
                    float cx = 31f * scale;
                    float cy = pageHeight - (46f * scale);
                    cb.saveState();
                    cb.setColorFill(new java.awt.Color(30, 30, 30));
                    cb.circle(cx, cy, 1.8f * scale);
                    cb.fill();
                    // Landline icon (drawn same way as phone 1)
                    cb.setColorFill(new java.awt.Color(255, 255, 255));
                    cb.setColorStroke(new java.awt.Color(255, 255, 255));
                    cb.setLineWidth(0.4f * scale);
                    cb.circle(cx - 0.6f * scale, cy + 0.3f * scale, 0.45f * scale);
                    cb.circle(cx + 0.6f * scale, cy - 0.3f * scale, 0.45f * scale);
                    cb.fill();
                    cb.moveTo(cx - 0.6f * scale, cy + 0.3f * scale);
                    cb.lineTo(cx + 0.6f * scale, cy - 0.3f * scale);
                    cb.stroke();
                    cb.restoreState();

                    cb.beginText();
                    cb.setFontAndSize(bfBold, 7.5f);
                    cb.setColorFill(new java.awt.Color(30, 30, 30));
                    cb.showTextAligned(Element.ALIGN_LEFT, "Ph: " + p2, 35f * scale, pageHeight - (47f * scale), 0);
                    cb.endText();
                }

                // Website circle & text & globe icon
                if (!web.isEmpty()) {
                    float cx = 86f * scale;
                    float cy = pageHeight - (46f * scale);
                    cb.saveState();
                    cb.setColorFill(new java.awt.Color(30, 30, 30));
                    cb.circle(cx, cy, 1.8f * scale);
                    cb.fill();
                    // Globe
                    cb.setColorStroke(new java.awt.Color(255, 255, 255));
                    cb.setLineWidth(0.2f * scale);
                    cb.circle(cx, cy, 1.1f * scale);
                    cb.stroke();
                    cb.moveTo(cx - 1.1f * scale, cy);
                    cb.lineTo(cx + 1.1f * scale, cy);
                    cb.moveTo(cx, cy - 1.1f * scale);
                    cb.lineTo(cx, cy + 1.1f * scale);
                    cb.stroke();
                    cb.restoreState();

                    cb.beginText();
                    cb.setFontAndSize(bfBold, 7.5f);
                    cb.setColorFill(new java.awt.Color(30, 30, 30));
                    cb.showTextAligned(Element.ALIGN_LEFT, web, 90f * scale, pageHeight - (47f * scale), 0);
                    cb.endText();
                }

                // UDYAM circle & text & UDY text
                if (!udyam.isEmpty()) {
                    float cx = 146f * scale;
                    float cy = pageHeight - (46f * scale);
                    cb.saveState();
                    cb.setColorFill(new java.awt.Color(30, 30, 30));
                    cb.circle(cx, cy, 1.8f * scale);
                    cb.fill();
                    cb.restoreState();

                    cb.beginText();
                    cb.setFontAndSize(bfBold, 3.2f);
                    cb.setColorFill(new java.awt.Color(255, 255, 255));
                    cb.showTextAligned(Element.ALIGN_CENTER, "UDY", cx, cy - 1.1f, 0);
                    cb.endText();

                    cb.beginText();
                    cb.setFontAndSize(bfBold, 7.5f);
                    cb.setColorFill(new java.awt.Color(30, 30, 30));
                    cb.showTextAligned(Element.ALIGN_LEFT, "UDYAM: " + udyam, 150f * scale, pageHeight - (47f * scale), 0);
                    cb.endText();
                }

            } catch (Exception e) {
                log.warn("Failed to load top banner image: {}", e.getMessage());
            }
        }

        // If top banner is NOT present, draw fallback company logo/details block (separator and margins handle flow)
        if (topBannerHeight <= 0) {
            // Space
            Paragraph spacer = new Paragraph(" ");
            spacer.setSpacingAfter(2f);
            doc.add(spacer);

            // 2. Logo and Company Details header
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{30, 70});

            PdfPCell logoCell = new PdfPCell();
            logoCell.setBorder(Rectangle.NO_BORDER);
            logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);

            if (template != null && template.getLogoBase64() != null && !template.getLogoBase64().trim().isEmpty()) {
                try {
                    byte[] decoded = decodeBase64Image(template.getLogoBase64());
                    if (decoded != null) {
                        Image img = Image.getInstance(decoded);
                        img.scaleToFit(156f, 45f);
                        logoCell.addElement(img);
                    }
                } catch (Exception e) {
                    log.warn("Failed to load logo: {}", e.getMessage());
                }
            }
            headerTable.addCell(logoCell);

            PdfPCell detailCell = new PdfPCell();
            detailCell.setBorder(Rectangle.NO_BORDER);
            detailCell.setVerticalAlignment(Element.ALIGN_MIDDLE);

            String compName = (template != null && template.getCompanyName() != null) ? template.getCompanyName() : "SVL PACKAGING PRINTERS";
            String compTag = (template != null && template.getCompanyTagline() != null) ? template.getCompanyTagline() : "";
            
            Font customCompanyTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Font.BOLD, new java.awt.Color(11, 44, 88));
            Paragraph pName = new Paragraph(compName, customCompanyTitleFont);
            detailCell.addElement(pName);
            if (!compTag.isEmpty()) {
                detailCell.addElement(new Paragraph(compTag, companyDetailFont));
            }

            StringBuilder contactLine = new StringBuilder();
            if (!addr.isEmpty()) {
                contactLine.append(addr).append("\n");
            }
            
            boolean hasPhone = false;
            if (!p1.isEmpty()) {
                contactLine.append("Phone: ").append(p1);
                hasPhone = true;
            }
            if (!p2.isEmpty()) {
                if (hasPhone) contactLine.append(" | ");
                contactLine.append(p2);
                hasPhone = true;
            }
            if (!mail.isEmpty()) {
                if (hasPhone) contactLine.append(" | ");
                contactLine.append("Email: ").append(mail);
            }
            
            boolean hasSecondLine = false;
            if (!web.isEmpty()) {
                contactLine.append("\nWeb: ").append(web);
                hasSecondLine = true;
            }
            if (!gst.isEmpty()) {
                if (hasSecondLine) {
                    contactLine.append(" | ");
                } else {
                    contactLine.append("\n");
                    hasSecondLine = true;
                }
                contactLine.append("GSTIN: ").append(gst);
            }
            if (!udyam.isEmpty()) {
                if (hasSecondLine) {
                    contactLine.append(" | ");
                } else {
                    contactLine.append("\n");
                }
                contactLine.append("UDYAM: ").append(udyam);
            }

            detailCell.addElement(new Paragraph(contactLine.toString(), companyDetailFont));
            headerTable.addCell(detailCell);

            doc.add(headerTable);

            // Separator line
            PdfPTable hr = new PdfPTable(1);
            hr.setWidthPercentage(100);
            PdfPCell hrCell = new PdfPCell();
            hrCell.setBorder(Rectangle.BOTTOM);
            hrCell.setBorderWidth(1f);
            hrCell.setBorderColor(new java.awt.Color(200, 200, 200));
            hrCell.setFixedHeight(2f);
            hr.addCell(hrCell);
            doc.add(hr);

            Paragraph spacer2 = new Paragraph(" ");
            spacer2.setSpacingAfter(4);
            doc.add(spacer2);
        }

        // Format Date & Payslip No
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd-MM-yyyy");
        String payslipNo = formatPayslipNo(p);
        String payslipDate = (p.getGeneratedAt() != null ? p.getGeneratedAt() : LocalDateTime.now()).format(dtf);

        // 3. Title section (PAYSLIP centered)
        PdfPTable titleTable = new PdfPTable(1);
        titleTable.setWidthPercentage(100);

        PdfPCell titleCell = new PdfPCell();
        titleCell.setBorder(Rectangle.NO_BORDER);
        titleCell.setHorizontalAlignment(Element.ALIGN_CENTER);

        Paragraph payslipTitle = new Paragraph("PAYSLIP", titleFont);
        payslipTitle.setAlignment(Element.ALIGN_CENTER);
        titleCell.addElement(payslipTitle);

        Paragraph monthTitle = new Paragraph(p.getMonth().toUpperCase(), subTitleFont);
        monthTitle.setAlignment(Element.ALIGN_CENTER);
        titleCell.addElement(monthTitle);

        titleTable.addCell(titleCell);
        doc.add(titleTable);

        Paragraph spacer3 = new Paragraph(" ");
        spacer3.setSpacingAfter(3);
        doc.add(spacer3);

        // 4. Employee Information & Payroll Information split block (3 columns with a 1px equivalent gap)
        PdfPTable infoContainer = new PdfPTable(3);
        infoContainer.setWidthPercentage(100);
        infoContainer.setWidths(new float[]{49.9f, 0.2f, 49.9f});

        // Left Block: Employee Information
        PdfPCell empInfoContainerCell = new PdfPCell();
        empInfoContainerCell.setBorder(Rectangle.BOX);
        empInfoContainerCell.setBorderWidth(1f);
        empInfoContainerCell.setBorderColor(new java.awt.Color(11, 44, 88));
        empInfoContainerCell.setPadding(0);

        PdfPTable empInfoTable = new PdfPTable(2);
        empInfoTable.setWidthPercentage(100);
        empInfoTable.setWidths(new float[]{40, 60});

        PdfPCell empTableHeader = new PdfPCell(new Phrase("  EMPLOYEE INFORMATION", headingFont));
        empTableHeader.setBackgroundColor(new java.awt.Color(11, 44, 88));
        empTableHeader.setColspan(2);
        empTableHeader.setPadding(5);
        empTableHeader.setBorder(Rectangle.NO_BORDER);
        empInfoTable.addCell(empTableHeader);

        Employee emp = p.getEmployee();
        addMetaCell(empInfoTable, "Employee ID", ": " + (emp.getEmployeeCode() != null ? emp.getEmployeeCode() : "N/A"), boldFont, normalFont);
        addMetaCell(empInfoTable, "Employee Name", ": " + emp.getName(), boldFont, normalFont);
        addMetaCell(empInfoTable, "Designation", ": " + (emp.getDesignation() != null ? emp.getDesignation() : "N/A"), boldFont, normalFont);
        addMetaCell(empInfoTable, "Department", ": " + (emp.getDepartmentName() != null ? emp.getDepartmentName() : "N/A"), boldFont, normalFont);
        addMetaCell(empInfoTable, "PAN Number", ": " + (emp.getPanCardNo() != null ? emp.getPanCardNo() : "N/A"), boldFont, normalFont);
        addMetaCell(empInfoTable, "Bank Name", ": " + (emp.getBankAndBranch() != null ? emp.getBankAndBranch() : "N/A"), boldFont, normalFont);
        addMetaCell(empInfoTable, "Bank A/C No", ": " + (emp.getBankAccountNumber() != null ? emp.getBankAccountNumber() : "N/A"), boldFont, normalFont);
        addMetaCell(empInfoTable, "IFSC Code", ": " + (emp.getIfscCode() != null ? emp.getIfscCode() : "N/A"), boldFont, normalFont);
        addMetaCell(empInfoTable, "UAN / PF No", ": " + (emp.getPfUan() != null ? emp.getPfUan() : "N/A"), boldFont, normalFont);
        addMetaCell(empInfoTable, "ESI No", ": " + (emp.getEsiNo() != null ? emp.getEsiNo() : "N/A"), boldFont, normalFont);

        empInfoContainerCell.addElement(empInfoTable);
        infoContainer.addCell(empInfoContainerCell);

        // Gap Cell (1px)
        PdfPCell gapCell1 = new PdfPCell();
        gapCell1.setBorder(Rectangle.NO_BORDER);
        infoContainer.addCell(gapCell1);

        // Right Block: Payroll Information
        PdfPCell payrollInfoContainerCell = new PdfPCell();
        payrollInfoContainerCell.setBorder(Rectangle.BOX);
        payrollInfoContainerCell.setBorderWidth(1f);
        payrollInfoContainerCell.setBorderColor(new java.awt.Color(11, 44, 88));
        payrollInfoContainerCell.setPadding(0);

        PdfPTable payrollInfoTable = new PdfPTable(2);
        payrollInfoTable.setWidthPercentage(100);
        payrollInfoTable.setWidths(new float[]{45, 55});

        PdfPCell payrollTableHeader = new PdfPCell(new Phrase("  PAYROLL INFORMATION", headingFont));
        payrollTableHeader.setBackgroundColor(new java.awt.Color(11, 44, 88));
        payrollTableHeader.setColspan(2);
        payrollTableHeader.setPadding(5);
        payrollTableHeader.setBorder(Rectangle.NO_BORDER);
        payrollInfoTable.addCell(payrollTableHeader);

        // Optional values from attendance or defaults
        Integer totalDays = 30;
        try {
            LocalDate[] range = parseMonthRange(p.getMonth());
            totalDays = (int) ChronoUnit.DAYS.between(range[0], range[1]) + 1;
        } catch (Exception e) {}

        // Moved Payslip No and Date into Payroll Information box
        addMetaCell(payrollInfoTable, "Payslip No", ": " + payslipNo, boldFont, normalFont);
        addMetaCell(payrollInfoTable, "Pay Period", ": " + p.getMonth(), boldFont, normalFont);
        addMetaCell(payrollInfoTable, "Pay Date", ": " + payslipDate, boldFont, normalFont);
        addMetaCell(payrollInfoTable, "Total Working Days", ": " + totalDays, boldFont, normalFont);
        addMetaCell(payrollInfoTable, "Present Days", ": " + (totalDays - (p.getLeaveDeduction().compareTo(BigDecimal.ZERO) > 0 ? 1 : 0)), boldFont, normalFont);
        addMetaCell(payrollInfoTable, "Weekly Offs", ": 4", boldFont, normalFont);
        addMetaCell(payrollInfoTable, "Paid Leave", ": 0", boldFont, normalFont);
        addMetaCell(payrollInfoTable, "LOP Days", ": " + (p.getLeaveDeduction().compareTo(BigDecimal.ZERO) > 0 ? "As per deduction" : "0"), boldFont, normalFont);
        addMetaCell(payrollInfoTable, "Payment Mode", ": Bank Transfer", boldFont, normalFont);
        // 1 filler to match Employee Info table height (10 rows total)
        addMetaCell(payrollInfoTable, " ", " ", boldFont, normalFont);

        payrollInfoContainerCell.addElement(payrollInfoTable);
        infoContainer.addCell(payrollInfoContainerCell);

        doc.add(infoContainer);

        Paragraph spacer4 = new Paragraph(" ");
        spacer4.setSpacingAfter(4);
        doc.add(spacer4);

        // 5. Earnings & Deductions Tables (3 columns with a 1px equivalent gap)
        PdfPTable breakdownTable = new PdfPTable(3);
        breakdownTable.setWidthPercentage(100);
        breakdownTable.setWidths(new float[]{49.9f, 0.2f, 49.9f});

        // Earnings (Left)
        PdfPCell leftCell = new PdfPCell();
        leftCell.setBorder(Rectangle.BOX);
        leftCell.setBorderWidth(1f);
        leftCell.setBorderColor(new java.awt.Color(0, 126, 51));
        leftCell.setPadding(0);

        PdfPTable earningsTable = new PdfPTable(2);
        earningsTable.setWidthPercentage(100);
        earningsTable.setWidths(new float[]{65, 35});

        PdfPCell eHeader = new PdfPCell(new Phrase("EARNINGS", headingFont));
        eHeader.setBackgroundColor(new java.awt.Color(0, 126, 51)); // Green
        eHeader.setColspan(2);
        eHeader.setPadding(5);
        eHeader.setHorizontalAlignment(Element.ALIGN_CENTER);
        eHeader.setBorder(Rectangle.NO_BORDER);
        earningsTable.addCell(eHeader);

        addBreakdownRow(earningsTable, "Basic Pay", p.getBasic(), normalFont);
        addBreakdownRow(earningsTable, "House Rent Allowance (HRA)", p.getHra(), normalFont);
        addBreakdownRow(earningsTable, "Conveyance Allowance", p.getConveyance(), normalFont);
        addBreakdownRow(earningsTable, "Medical Allowance", p.getDa().multiply(BigDecimal.valueOf(0.2)).setScale(2, RoundingMode.HALF_UP), normalFont); // DA breakdown
        addBreakdownRow(earningsTable, "Special Allowance / Other", p.getDa().multiply(BigDecimal.valueOf(0.8)).setScale(2, RoundingMode.HALF_UP), normalFont);
        addBreakdownRow(earningsTable, "Overtime", p.getOvertime(), normalFont);

        BigDecimal totalEarnings = p.getBasic().add(p.getDa()).add(p.getHra()).add(p.getConveyance()).add(p.getOvertime());
        addBreakdownRowBold(earningsTable, "TOTAL EARNINGS", totalEarnings, boldFont);

        leftCell.addElement(earningsTable);
        breakdownTable.addCell(leftCell);

        // Gap Cell (1px)
        PdfPCell gapCell2 = new PdfPCell();
        gapCell2.setBorder(Rectangle.NO_BORDER);
        breakdownTable.addCell(gapCell2);

        // Deductions (Right)
        PdfPCell rightCell = new PdfPCell();
        rightCell.setBorder(Rectangle.BOX);
        rightCell.setBorderWidth(1f);
        rightCell.setBorderColor(new java.awt.Color(204, 0, 0));
        rightCell.setPadding(0);

        PdfPTable deductionsTable = new PdfPTable(2);
        deductionsTable.setWidthPercentage(100);
        deductionsTable.setWidths(new float[]{65, 35});

        PdfPCell dHeader = new PdfPCell(new Phrase("DEDUCTIONS", headingFont));
        dHeader.setBackgroundColor(new java.awt.Color(204, 0, 0)); // Red
        dHeader.setColspan(2);
        dHeader.setPadding(5);
        dHeader.setHorizontalAlignment(Element.ALIGN_CENTER);
        dHeader.setBorder(Rectangle.NO_BORDER);
        deductionsTable.addCell(dHeader);

        addBreakdownRow(deductionsTable, "Provident Fund (PF)", p.getPf(), normalFont);
        addBreakdownRow(deductionsTable, "ESI", p.getEsi(), normalFont);
        addBreakdownRow(deductionsTable, "Professional Tax / Tax", p.getTds().multiply(BigDecimal.valueOf(0.3)).setScale(2, RoundingMode.HALF_UP), normalFont);
        addBreakdownRow(deductionsTable, "Income Tax (TDS)", p.getTds().multiply(BigDecimal.valueOf(0.7)).setScale(2, RoundingMode.HALF_UP), normalFont);
        addBreakdownRow(deductionsTable, "LOP Deduction", p.getLeaveDeduction(), normalFont);
        addBreakdownRow(deductionsTable, "Other Deduction", BigDecimal.ZERO, normalFont);

        BigDecimal totalDeductions = p.getPf().add(p.getEsi()).add(p.getTds()).add(p.getLeaveDeduction());
        addBreakdownRowBold(deductionsTable, "TOTAL DEDUCTIONS", totalDeductions, boldFont);

        rightCell.addElement(deductionsTable);
        breakdownTable.addCell(rightCell);

        doc.add(breakdownTable);

        Paragraph spacer5 = new Paragraph(" ");
        spacer5.setSpacingAfter(4);
        doc.add(spacer5);

        // 6. Salary Summary (Green highlight for NET SALARY - 3 columns with a 1px equivalent gap)
        PdfPTable summaryContainer = new PdfPTable(3);
        summaryContainer.setWidthPercentage(100);
        summaryContainer.setWidths(new float[]{59.9f, 0.2f, 39.9f});

        PdfPCell summaryLeftCell = new PdfPCell();
        summaryLeftCell.setBorder(Rectangle.BOX);
        summaryLeftCell.setBorderColor(new java.awt.Color(11, 44, 88));
        summaryLeftCell.setPadding(8);

        // Amount in Words moved inside the left side of that box
        String amountInWords = convertToWords(p.getNetSalary().intValue()) + " Only";
        Paragraph wordPara = new Paragraph();
        wordPara.add(new Chunk("Amount in Words:\n", boldFont));
        wordPara.add(new Chunk(amountInWords, normalFont));
        summaryLeftCell.addElement(wordPara);

        summaryContainer.addCell(summaryLeftCell);

        // Gap Cell (1px)
        PdfPCell gapCell3 = new PdfPCell();
        gapCell3.setBorder(Rectangle.NO_BORDER);
        summaryContainer.addCell(gapCell3);

        PdfPCell summaryRightCell = new PdfPCell();
        summaryRightCell.setBackgroundColor(new java.awt.Color(0, 126, 51)); // Green highlight
        summaryRightCell.setBorder(Rectangle.BOX);
        summaryRightCell.setBorderColor(new java.awt.Color(0, 100, 30));
        summaryRightCell.setPadding(10);
        summaryRightCell.setVerticalAlignment(Element.ALIGN_MIDDLE);

        Paragraph netLabel = new Paragraph("NET SALARY", netSalaryLabelFont);
        netLabel.setAlignment(Element.ALIGN_CENTER);
        summaryRightCell.addElement(netLabel);

        Paragraph netVal = new Paragraph("Rs. " + p.getNetSalary().setScale(2, RoundingMode.HALF_UP).toString(), netSalaryFont);
        netVal.setAlignment(Element.ALIGN_CENTER);
        summaryRightCell.addElement(netVal);

        summaryRightCell.setBorderWidth(1f);
        summaryLeftCell.setBorderWidth(1f);

        summaryContainer.addCell(summaryRightCell);
        doc.add(summaryContainer);

        // Small spacer before signatures
        Paragraph spacerBeforeSign = new Paragraph(" ");
        spacerBeforeSign.setSpacingAfter(20);
        doc.add(spacerBeforeSign);

        // 7. Authorised Signature footer
        PdfPTable signTable = new PdfPTable(2);
        signTable.setWidthPercentage(100);
        signTable.setWidths(new float[]{65, 35});

        // Left cell: Empty spacer cell
        PdfPCell cLeft = new PdfPCell();
        cLeft.setBorder(Rectangle.NO_BORDER);
        signTable.addCell(cLeft);

        // Right cell: Authorised Signature Box
        PdfPCell cSign = new PdfPCell();
        cSign.setBorder(Rectangle.BOX);
        cSign.setBorderColor(new java.awt.Color(220, 220, 220));
        cSign.setPadding(8);

        // Header inside box
        String companyNameText = (template != null && template.getCompanyName() != null) ? template.getCompanyName() : "SVL";
        Paragraph companyFor = new Paragraph("For " + companyNameText, boldFont);
        companyFor.setAlignment(Element.ALIGN_CENTER);
        cSign.addElement(companyFor);

        // Add signature image if available
        if (template != null && template.getSignatureBase64() != null && !template.getSignatureBase64().trim().isEmpty()) {
            try {
                byte[] decoded = decodeBase64Image(template.getSignatureBase64());
                if (decoded != null) {
                    Image img = Image.getInstance(decoded);
                    img.setAlignment(Element.ALIGN_CENTER);
                    img.scaleToFit(110f, 40f);
                    cSign.addElement(img);
                } else {
                    // Fallback space if decoding returns null
                    Paragraph emptySpace = new Paragraph("\n\n");
                    cSign.addElement(emptySpace);
                }
            } catch (Exception e) {
                log.error("Failed to load signature image in payslip PDF: {}", e.getMessage(), e);
                System.err.println("Failed to load signature image in payslip PDF: " + e.getMessage());
                e.printStackTrace();
                // If it fails, add empty paragraph for space
                Paragraph emptySpace = new Paragraph("\n\n");
                cSign.addElement(emptySpace);
            }
        } else {
            // Spacer for manual signature
            Paragraph emptySpace = new Paragraph("\n\n\n");
            cSign.addElement(emptySpace);
        }

        // Bottom label
        Paragraph authText = new Paragraph("Authorised Signature", normalFont);
        authText.setAlignment(Element.ALIGN_CENTER);
        cSign.addElement(authText);

        signTable.addCell(cSign);
        doc.add(signTable);

        // Computer generated note & Time generated
        String generatedTime = (p.getGeneratedAt() != null ? p.getGeneratedAt() : LocalDateTime.now()).format(DateTimeFormatter.ofPattern("dd-MMM-yyyy hh:mm a"));
        PdfPTable noteTable = new PdfPTable(2);
        noteTable.setWidthPercentage(100);
        noteTable.setSpacingBefore(10);
        noteTable.setWidths(new float[]{60, 40});

        PdfPCell noteLeft = new PdfPCell(new Phrase("Note: This is a computer generated payslip and does not require any signature.", companyDetailFont));
        noteLeft.setBorder(Rectangle.NO_BORDER);
        noteTable.addCell(noteLeft);

        PdfPCell noteRight = new PdfPCell(new Phrase("Generated on " + generatedTime, companyDetailFont));
        noteRight.setBorder(Rectangle.NO_BORDER);
        noteRight.setHorizontalAlignment(Element.ALIGN_RIGHT);
        noteTable.addCell(noteRight);
        doc.add(noteTable);

        // 8. Bottom Image Banner
        if (template != null && template.getBottomImageBase64() != null && !template.getBottomImageBase64().trim().isEmpty()) {
            try {
                byte[] decoded = decodeBase64Image(template.getBottomImageBase64());
                if (decoded != null) {
                    Image img = Image.getInstance(decoded);
                    float pageWidth = PageSize.A4.getWidth();
                    float scale = 2.83465f;
                    // Matches quotation format: half page width (middle to right), 20mm height at bottom right
                    img.scaleAbsolute(pageWidth * 0.5f, 20f * scale);
                    img.setAbsolutePosition(pageWidth * 0.5f, 0f);
                    doc.add(img);
                }
            } catch (Exception e) {
                log.warn("Failed to load bottom banner image: {}", e.getMessage());
            }
        }

        doc.close();
        return baos.toByteArray();
    }

    private String formatPayslipNo(Payslip p) {
        String m = p.getMonth();
        try {
            String[] parts = m.split(" ");
            if (parts.length == 2) {
                String year = parts[1];
                String monthName = parts[0].toLowerCase();
                String monthNum = "01";
                if (monthName.startsWith("jan")) monthNum = "01";
                else if (monthName.startsWith("feb")) monthNum = "02";
                else if (monthName.startsWith("mar")) monthNum = "03";
                else if (monthName.startsWith("apr")) monthNum = "04";
                else if (monthName.startsWith("may")) monthNum = "05";
                else if (monthName.startsWith("jun")) monthNum = "06";
                else if (monthName.startsWith("jul")) monthNum = "07";
                else if (monthName.startsWith("aug")) monthNum = "08";
                else if (monthName.startsWith("sep")) monthNum = "09";
                else if (monthName.startsWith("oct")) monthNum = "10";
                else if (monthName.startsWith("nov")) monthNum = "11";
                else if (monthName.startsWith("dec")) monthNum = "12";
                return "PS/" + year + "/" + monthNum + "/" + String.format("%04d", p.getId());
            }
        } catch (Exception e) {}
        return "PS/" + String.format("%04d", p.getId());
    }

    private void addMetaCellNoBorder(PdfPTable table, String label, String value, Font labelFont, Font valFont) {
        PdfPCell c1 = new PdfPCell(new Phrase(label, labelFont));
        c1.setBorder(Rectangle.NO_BORDER);
        c1.setPadding(1);
        table.addCell(c1);

        PdfPCell c2 = new PdfPCell(new Phrase(value, valFont));
        c2.setBorder(Rectangle.NO_BORDER);
        c2.setPadding(1);
        table.addCell(c2);
    }

    private void addSummaryRow(PdfPTable table, String label, BigDecimal amount, Font font) {
        PdfPCell c1 = new PdfPCell(new Phrase(label, font));
        c1.setBorder(Rectangle.NO_BORDER);
        c1.setPadding(3);
        table.addCell(c1);

        PdfPCell c2 = new PdfPCell(new Phrase("Rs. " + amount.setScale(2, RoundingMode.HALF_UP).toString(), font));
        c2.setBorder(Rectangle.NO_BORDER);
        c2.setHorizontalAlignment(Element.ALIGN_RIGHT);
        c2.setPadding(3);
        table.addCell(c2);
    }

    private void addMetaCell(PdfPTable table, String label, String value, Font labelFont, Font valFont) {
        PdfPCell c1 = new PdfPCell(new Phrase(label, labelFont));
        c1.setBorder(Rectangle.NO_BORDER);
        c1.setPadding(3);
        table.addCell(c1);

        PdfPCell c2 = new PdfPCell(new Phrase(value, valFont));
        c2.setBorder(Rectangle.NO_BORDER);
        c2.setPadding(3);
        table.addCell(c2);
    }

    private void addBreakdownRow(PdfPTable table, String item, BigDecimal amount, Font font) {
        PdfPCell cellItem = new PdfPCell(new Phrase(item, font));
        cellItem.setPadding(5);
        table.addCell(cellItem);

        String amtStr = amount.compareTo(BigDecimal.ZERO) == 0 ? "-" : amount.setScale(2, RoundingMode.HALF_UP).toString();
        PdfPCell cellAmt = new PdfPCell(new Phrase(amtStr, font));
        cellAmt.setHorizontalAlignment(Element.ALIGN_RIGHT);
        cellAmt.setPadding(5);
        table.addCell(cellAmt);
    }

    private void addBreakdownRowBold(PdfPTable table, String item, BigDecimal amount, Font font) {
        PdfPCell cellItem = new PdfPCell(new Phrase(item, font));
        cellItem.setPadding(6);
        cellItem.setBackgroundColor(new java.awt.Color(245, 245, 245));
        table.addCell(cellItem);

        PdfPCell cellAmt = new PdfPCell(new Phrase(amount.setScale(2, RoundingMode.HALF_UP).toString(), font));
        cellAmt.setHorizontalAlignment(Element.ALIGN_RIGHT);
        cellAmt.setPadding(6);
        cellAmt.setBackgroundColor(new java.awt.Color(245, 245, 245));
        table.addCell(cellAmt);
    }

    private LocalDate[] parseMonthRange(String monthStr) {
        try {
            String[] parts = monthStr.split(" ");
            String monthName = parts[0];
            int year = Integer.parseInt(parts[1]);

            int monthNum = 1;
            for (int i = 1; i <= 12; i++) {
                String mName = java.time.Month.of(i).getDisplayName(TextStyle.FULL, Locale.ENGLISH);
                String mShort = java.time.Month.of(i).getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
                if (mName.equalsIgnoreCase(monthName) || mShort.equalsIgnoreCase(monthName)) {
                    monthNum = i;
                    break;
                }
            }

            LocalDate start = LocalDate.of(year, monthNum, 1);
            LocalDate end = start.with(TemporalAdjusters.lastDayOfMonth());
            return new LocalDate[]{start, end};
        } catch (Exception e) {
            // Default fallback: current month
            LocalDate start = LocalDate.now().withDayOfMonth(1);
            LocalDate end = start.with(TemporalAdjusters.lastDayOfMonth());
            return new LocalDate[]{start, end};
        }
    }

    private static String[] splitEmails(String value) {
        if (!StringUtils.hasText(value)) return new String[0];
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .toArray(String[]::new);
    }

    private JavaMailSender buildSender(MailSettingsService.ResolvedMailSettings settings) {
        JavaMailSenderImpl impl = new JavaMailSenderImpl();
        if (StringUtils.hasText(settings.host)) {
            impl.setHost(settings.host);
        }
        impl.setPort(settings.port > 0 ? settings.port : 587);
        if (StringUtils.hasText(settings.username)) {
            impl.setUsername(settings.username);
        }
        if (StringUtils.hasText(settings.password)) {
            impl.setPassword(settings.password);
        }
        Properties props = impl.getJavaMailProperties();
        props.put("mail.smtp.auth", String.valueOf(settings.smtpAuth));
        props.put("mail.smtp.starttls.enable", String.valueOf(settings.starttls));
        return impl;
    }

    private static final String[] units = {
            "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
            "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    };

    private static final String[] tens = {
            "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    };

    private String convertToWords(int number) {
        if (number == 0) {
            return "Zero";
        }
        if (number < 0) {
            return "Minus " + convertToWords(Math.abs(number));
        }
        String words = "";
        if ((number / 10000000) > 0) {
            words += convertToWords(number / 10000000) + " Crore ";
            number %= 10000000;
        }
        if ((number / 100000) > 0) {
            words += convertToWords(number / 100000) + " Lakh ";
            number %= 100000;
        }
        if ((number / 1000) > 0) {
            words += convertToWords(number / 1000) + " Thousand ";
            number %= 1000;
        }
        if ((number / 100) > 0) {
            words += convertToWords(number / 100) + " Hundred ";
            number %= 100;
        }
        if (number > 0) {
            if (!words.isEmpty()) {
                words += "and ";
            }
            if (number < 20) {
                words += units[number];
            } else {
                words += tens[number / 10];
                if ((number % 10) > 0) {
                    words += "-" + units[number % 10];
                }
            }
        }
        return words.trim();
    }

    private byte[] decodeBase64Image(String base64Str) {
        if (base64Str == null) return null;
        String cleaned = base64Str.trim();
        cleaned = cleaned.replaceAll("^data:[^,]+,", "");
        cleaned = cleaned.replaceAll("\\s", "");
        try {
            byte[] decoded = Base64.getMimeDecoder().decode(cleaned);
            try {
                java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(decoded);
                java.awt.image.BufferedImage bufImg = javax.imageio.ImageIO.read(bais);
                if (bufImg != null) {
                    java.io.ByteArrayOutputStream baosPng = new java.io.ByteArrayOutputStream();
                    javax.imageio.ImageIO.write(bufImg, "png", baosPng);
                    return baosPng.toByteArray();
                }
            } catch (Exception e) {
                // Ignore conversion errors and use original decoded bytes
            }
            return decoded;
        } catch (Exception e) {
            log.error("Failed to decode base64 string: {}", e.getMessage());
            return null;
        }
    }
}
