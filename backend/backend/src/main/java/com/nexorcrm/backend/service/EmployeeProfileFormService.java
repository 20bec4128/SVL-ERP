package com.nexorcrm.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.nexorcrm.backend.dto.*;
import com.nexorcrm.backend.entity.*;
import com.nexorcrm.backend.entity.EmailTemplateKey;
import com.nexorcrm.backend.repo.EmployeeDocumentRepository;
import com.nexorcrm.backend.repo.EmployeeProfileFieldVerificationRepository;
import com.nexorcrm.backend.repo.EmployeeProfileTokenRepository;
import com.nexorcrm.backend.repo.EmployeeRepository;
import com.nexorcrm.backend.repo.EmployeeSalaryRepository;
import com.nexorcrm.backend.repo.ProvidentFundRepository;
import com.nexorcrm.backend.entity.ProvidentFund;
import com.nexorcrm.backend.repo.HeadOfficeMasterRepository;
import com.nexorcrm.backend.repo.BranchMasterRepository;
import com.nexorcrm.backend.repo.DepartmentMasterRepository;
import com.nexorcrm.backend.repo.DesignationMasterRepository;
import com.nexorcrm.backend.entity.HeadOfficeMaster;
import com.nexorcrm.backend.entity.BranchMaster;
import com.nexorcrm.backend.entity.DepartmentMaster;
import com.nexorcrm.backend.entity.DesignationMaster;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;
import org.springframework.web.server.ResponseStatusException;

import com.nexorcrm.backend.repo.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.SecureRandom;
import java.time.format.DateTimeFormatter;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class EmployeeProfileFormService {

    private static final Logger logger = LoggerFactory.getLogger(EmployeeProfileFormService.class);

    private static final String HMAC_ALG = "HmacSHA256";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final Pattern HANDLEBARS_TOKEN_PATTERN = Pattern.compile("\\{\\{\\s*([A-Za-z0-9_\\s\\-\\.\\(\\)]+)\\s*\\}\\}");

    private static final Set<EmployeePublicFieldKey> EXCLUDED_PUBLIC_FIELDS = EnumSet.of(
            EmployeePublicFieldKey.INSTITUTION,
            EmployeePublicFieldKey.DEPARTMENT_NAME,
            EmployeePublicFieldKey.TEAM,
            EmployeePublicFieldKey.DESIGNATION,
            EmployeePublicFieldKey.STATUS,
            EmployeePublicFieldKey.HEAD_OFFICE_ID,
            EmployeePublicFieldKey.BRANCH_ID,
            EmployeePublicFieldKey.DEPARTMENT_MASTER_ID,
            EmployeePublicFieldKey.DESIGNATION_MASTER_ID
    );

    private final EmployeeRepository employeeRepository;
    private final EmployeeProfileTokenRepository tokenRepository;
    private final EmployeeProfileFieldVerificationRepository fieldVerificationRepository;
    private final EmployeeDocumentRepository documentRepository;
    private final HeadOfficeMasterRepository headOfficeMasterRepository;
    private final BranchMasterRepository branchMasterRepository;
    private final DepartmentMasterRepository departmentMasterRepository;
    private final DesignationMasterRepository designationMasterRepository;
    private final EmailNotificationService emailNotificationService;
    private final EmailTemplateService emailTemplateService;
    private final UploadStorageService uploadStorageService;
    private final EmployeeSalaryRepository employeeSalaryRepository;
    private final ProvidentFundRepository providentFundRepository;
    private final UserRepository userRepository;

    @Value("${app.employee-form.token-secret:${EMPLOYEE_FORM_TOKEN_SECRET:change-me}}")
    private String tokenSecret;

    @Value("${app.employee-form.token-ttl-days:${EMPLOYEE_FORM_TOKEN_TTL_DAYS:7}}")
    private int tokenTtlDays;

    @Value("${app.employee-form.public-base-url:${EMPLOYEE_FORM_PUBLIC_BASE_URL:http://localhost:5173/employee-form}}")
    private String publicBaseUrl;

    @Value("${app.mail.from-name:SVL}")
    private String mailFromName;

    @Value("${app.employee-form.required-fields:PHONE,DATE_OF_BIRTH,GENDER,CURRENT_ADDRESS,AADHAAR_NUMBER,PAN_NUMBER,BANK_ACCOUNT_HOLDER_NAME,BANK_ACCOUNT_NUMBER,BANK_IFSC,BANK_NAME_BRANCH}")
    private String requiredFieldsConfig;

    @Value("${app.employee-form.required-docs:PHOTO,RESUME}")
    private String requiredDocsConfig;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    public EmployeeProfileFormService(
            EmployeeRepository employeeRepository,
            EmployeeProfileTokenRepository tokenRepository,
            EmployeeProfileFieldVerificationRepository fieldVerificationRepository,
            EmployeeDocumentRepository documentRepository,
            HeadOfficeMasterRepository headOfficeMasterRepository,
            BranchMasterRepository branchMasterRepository,
            DepartmentMasterRepository departmentMasterRepository,
            DesignationMasterRepository designationMasterRepository,
            EmailNotificationService emailNotificationService,
            EmailTemplateService emailTemplateService,
            UploadStorageService uploadStorageService,
            EmployeeSalaryRepository employeeSalaryRepository,
            ProvidentFundRepository providentFundRepository,
            UserRepository userRepository
    ) {
        this.employeeRepository = employeeRepository;
        this.tokenRepository = tokenRepository;
        this.fieldVerificationRepository = fieldVerificationRepository;
        this.documentRepository = documentRepository;
        this.headOfficeMasterRepository = headOfficeMasterRepository;
        this.branchMasterRepository = branchMasterRepository;
        this.departmentMasterRepository = departmentMasterRepository;
        this.designationMasterRepository = designationMasterRepository;
        this.emailNotificationService = emailNotificationService;
        this.emailTemplateService = emailTemplateService;
        this.uploadStorageService = uploadStorageService;
        this.employeeSalaryRepository = employeeSalaryRepository;
        this.providentFundRepository = providentFundRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public EmployeeFormLinkResponse generateFormLink(Long employeeId, EmployeeTokenScope scope) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found"));

        LocalDateTime now = LocalDateTime.now();
        tokenRepository.revokeActiveTokens(employeeId, now);

        String token = generateToken();
        String tokenHash = hmacHash(tokenSecret, token);

        EmployeeProfileToken row = new EmployeeProfileToken();
        row.setEmployeeId(employeeId);
        row.setTokenHash(tokenHash);
        row.setScope(scope == null ? EmployeeTokenScope.MISSING_FIELDS : scope);
        row.setCreatedAt(now);
        row.setExpiresAt(now.plusDays(Math.max(1, tokenTtlDays)));
        tokenRepository.save(row);

        String publicUrl = buildPublicUrl(token);
        if (StringUtils.hasText(employee.getEmail())) {
            String subject = "Complete your employee profile";
            String body = "Please complete your profile using this secure link (valid for "
                    + Math.max(1, tokenTtlDays) + " days):\n\n" + publicUrl;
            emailNotificationService.notifyIfAllowed(employee.getEmail(), subject, body);
        }

        EmployeeFormLinkResponse res = new EmployeeFormLinkResponse();
        res.setEmployeeId(employeeId);
        res.setScope(row.getScope());
        res.setExpiresAt(row.getExpiresAt());
        res.setPublicUrl(publicUrl);
        return res;
    }

    /**
     * Generates a fresh public profile-completion link and emails it as part of the Offer Letter template.
     * Email is sent as plain text (template body is stored text).
     */
    @Transactional
    public EmployeeFormLinkResponse sendOfferLetterEmail(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found"));

        String recipientEmail = firstNonBlank(employee.getPersonalEmail(), employee.getEmail());
        if (!StringUtils.hasText(recipientEmail)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Employee personal email is missing");
        }

        // Always generate a fresh token when sending an offer letter from admin UI.
        // This avoids blocking retries and prevents "Offer letter already sent" errors.
        LocalDateTime now = LocalDateTime.now();
        tokenRepository.revokeActiveTokens(employeeId, now);

        String token = generateToken();
        String tokenHash = hmacHash(tokenSecret, token);

        EmployeeProfileToken row = new EmployeeProfileToken();
        row.setEmployeeId(employeeId);
        row.setTokenHash(tokenHash);
        row.setScope(EmployeeTokenScope.MISSING_FIELDS);
        row.setCreatedAt(now);
        row.setExpiresAt(now.plusDays(Math.max(1, tokenTtlDays)));
        tokenRepository.save(row);

        String publicUrl = buildPublicUrl(token);

        if (StringUtils.hasText(recipientEmail)) {
            var template = emailTemplateService.getOne(EmailTemplateKey.OFFER_LETTER_TEMPLATE.getKey());
            if (template != null && !template.isActive()) {
                logger.info("Email template {} is inactive. Skipping email to {}.", EmailTemplateKey.OFFER_LETTER_TEMPLATE.getKey(), recipientEmail);
                EmployeeFormLinkResponse res = new EmployeeFormLinkResponse();
                res.setPublicUrl(publicUrl);
                return res;
            }
            String subjectTemplate = template == null ? null : template.getSubject();
            String bodyTemplate = template == null ? null : template.getBody();

            // Never append the profile-completion link into the email subject.
            String subject = renderTemplateText(subjectTemplate, employee, publicUrl, row.getExpiresAt(), false);
            // Body may include the link (either via template placeholders or safety net append).
            String body = renderTemplateText(bodyTemplate, employee, publicUrl, row.getExpiresAt(), true);

            // Admin-triggered email: bypass cooldown.
            emailNotificationService.notifyNowIfEnabled(recipientEmail, subject, body);
        }

        EmployeeFormLinkResponse res = new EmployeeFormLinkResponse();
        res.setEmployeeId(employeeId);
        res.setScope(row.getScope());
        res.setExpiresAt(row.getExpiresAt());
        res.setPublicUrl(publicUrl);
        return res;
    }

    /**
     * Resends the offer letter email by revoking existing active tokens and generating a new link.
     */
    @Transactional
    public EmployeeFormLinkResponse resendOfferLetterEmail(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found"));

        String recipientEmail = firstNonBlank(employee.getPersonalEmail(), employee.getEmail());
        if (!StringUtils.hasText(recipientEmail)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Employee personal email is missing");
        }

        LocalDateTime now = LocalDateTime.now();
        tokenRepository.revokeActiveTokens(employeeId, now);

        String token = generateToken();
        String tokenHash = hmacHash(tokenSecret, token);

        EmployeeProfileToken row = new EmployeeProfileToken();
        row.setEmployeeId(employeeId);
        row.setTokenHash(tokenHash);
        row.setScope(EmployeeTokenScope.MISSING_FIELDS);
        row.setCreatedAt(now);
        row.setExpiresAt(now.plusDays(Math.max(1, tokenTtlDays)));
        tokenRepository.save(row);

        String publicUrl = buildPublicUrl(token);

        if (StringUtils.hasText(recipientEmail)) {
            var template = emailTemplateService.getOne(EmailTemplateKey.OFFER_LETTER_TEMPLATE.getKey());
            if (template != null && !template.isActive()) {
                logger.info("Email template {} is inactive. Skipping email to {}.", EmailTemplateKey.OFFER_LETTER_TEMPLATE.getKey(), recipientEmail);
                EmployeeFormLinkResponse res = new EmployeeFormLinkResponse();
                res.setPublicUrl(publicUrl);
                return res;
            }
            String subjectTemplate = template == null ? null : template.getSubject();
            String bodyTemplate = template == null ? null : template.getBody();

            // Never append the profile-completion link into the email subject.
            String subject = renderTemplateText(subjectTemplate, employee, publicUrl, row.getExpiresAt(), false);
            // Body may include the link (either via template placeholders or safety net append).
            String body = renderTemplateText(bodyTemplate, employee, publicUrl, row.getExpiresAt(), true);
            emailNotificationService.notifyNowIfEnabled(recipientEmail, subject, body);
        }

        EmployeeFormLinkResponse res = new EmployeeFormLinkResponse();
        res.setEmployeeId(employeeId);
        res.setScope(row.getScope());
        res.setExpiresAt(row.getExpiresAt());
        res.setPublicUrl(publicUrl);
        return res;
    }

    /**
     * Generates a fresh profile-completion link (MISSING_FIELDS scope) and emails it using PROFILE_COMPLETION_TEMPLATE.
     * The public page itself hides already-approved fields, so the employee only sees pending/rejected items.
     */
    @Transactional
    public EmployeeFormLinkResponse resendProfileCompletionMail(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found"));

        String recipientEmail = firstNonBlank(employee.getPersonalEmail(), employee.getEmail());
        if (!StringUtils.hasText(recipientEmail)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Employee personal email is missing");
        }

        LocalDateTime now = LocalDateTime.now();
        tokenRepository.revokeActiveTokens(employeeId, now);

        String token = generateToken();
        String tokenHash = hmacHash(tokenSecret, token);

        EmployeeProfileToken row = new EmployeeProfileToken();
        row.setEmployeeId(employeeId);
        row.setTokenHash(tokenHash);
        row.setScope(EmployeeTokenScope.MISSING_FIELDS);
        row.setCreatedAt(now);
        row.setExpiresAt(now.plusDays(Math.max(1, tokenTtlDays)));
        tokenRepository.save(row);

        String publicUrl = buildPublicUrl(token);

        var template = emailTemplateService.getOne(EmailTemplateKey.PROFILE_COMPLETION_TEMPLATE.getKey());
        if (template != null && !template.isActive()) {
            logger.info("Email template {} is inactive. Skipping email to {}.", EmailTemplateKey.PROFILE_COMPLETION_TEMPLATE.getKey(), recipientEmail);
            EmployeeFormLinkResponse res = new EmployeeFormLinkResponse();
            res.setPublicUrl(publicUrl);
            return res;
        }
        String subjectTemplate = template == null ? null : template.getSubject();
        String bodyTemplate = template == null ? null : template.getBody();

        String subject = renderTemplateText(subjectTemplate, employee, publicUrl, row.getExpiresAt(), false);
        String body = renderTemplateText(bodyTemplate, employee, publicUrl, row.getExpiresAt(), false);
        body = upsertProfileCompletionLinkSection(
                body,
                publicUrl,
                row.getExpiresAt() == null ? "" : row.getExpiresAt().toLocalDate().format(DateTimeFormatter.ISO_LOCAL_DATE)
        );
        emailNotificationService.notifyNowIfEnabled(recipientEmail, subject, body);

        EmployeeFormLinkResponse res = new EmployeeFormLinkResponse();
        res.setEmployeeId(employeeId);
        res.setScope(row.getScope());
        res.setExpiresAt(row.getExpiresAt());
        res.setPublicUrl(publicUrl);
        return res;
    }

    private static String upsertProfileCompletionLinkSection(String body, String publicUrl, String expiry) {
        String text = body == null ? "" : body;
        String url = publicUrl == null ? "" : publicUrl;
        String exp = expiry == null ? "" : expiry;

        String section = "Profile Completion Link: " + url
                + (StringUtils.hasText(exp) ? ("\nValid until: " + exp) : "");

        // If link section already exists, keep it as-is.
        if (StringUtils.hasText(url) && text.contains("Profile Completion Link:") && text.contains(url)) {
            return text;
        }

        // Remove old "Complete Your Profile" link line to avoid duplicates.
        text = text.replaceAll("(?m)^\\s*👉\\s*\\*\\*Complete Your Profile\\*\\*:\\s*.*\\R?", "");

        // Prefer inserting right after the common anchor line in templates.
        String anchor = "Please use the secure link below to complete your profile:";
        int idx = text.indexOf(anchor);
        if (idx >= 0) {
            int insertAt = idx + anchor.length();
            return text.substring(0, insertAt) + "\n\n" + section + text.substring(insertAt);
        }

        // Fallback: append to end.
        if (!text.endsWith("\n") && !text.isEmpty()) text = text + "\n";
        return text + "\n" + section;
    }

    private String renderOfferLetterText(String templateText, Employee employee, String profileCompletionUrl, LocalDateTime expiresAt) {
        return renderTemplateText(templateText, employee, profileCompletionUrl, expiresAt, true);
    }

    private String renderTemplateText(
            String templateText,
            Employee employee,
            String profileCompletionUrl,
            LocalDateTime expiresAt,
            boolean appendLinkIfMissing
    ) {
        String text = templateText == null ? "" : templateText;
        String employeeName = employee == null ? "" : String.valueOf(employee.getName() == null ? "" : employee.getName()).trim();
        String designation = employee == null ? "" : String.valueOf(employee.getDesignation() == null ? "" : employee.getDesignation()).trim();
        String companyName = StringUtils.hasText(mailFromName) ? mailFromName.trim() : "SVL";
        String expiry = expiresAt == null ? "" : expiresAt.toLocalDate().format(DateTimeFormatter.ISO_LOCAL_DATE);

        // Resolve org names for common template placeholders.
        String branchName = "";
        String deptName = "";
        if (employee != null) {
            branchName = employee.getBranchId() == null ? "" : branchMasterRepository.findById(employee.getBranchId())
                    .map(BranchMaster::getName).orElse("");
            deptName = employee.getDepartmentMasterId() == null ? "" : departmentMasterRepository.findById(employee.getDepartmentMasterId())
                    .map(DepartmentMaster::getName).orElse("");
        }

        Map<String, String> tokens = new HashMap<>();
        tokens.put("employee_name", employeeName);
        tokens.put("designation", designation);
        tokens.put("company_name", companyName);
        // Also support camelCase token variants.
        tokens.put("employeeName", employeeName);
        tokens.put("companyName", companyName);

        // Autofill HR Name and Contact Details of current user
        String hrName = "";
        String hrContact = "";
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && StringUtils.hasText(authentication.getName())) {
                String actorEmail = authentication.getName().trim();
                Optional<com.nexorcrm.backend.entity.User> userOpt = userRepository.findByEmailAndIsDeletedFalse(actorEmail);
                if (userOpt.isPresent()) {
                    com.nexorcrm.backend.entity.User userObj = userOpt.get();
                    hrName = (String.valueOf(userObj.getFirstName() == null ? "" : userObj.getFirstName()).trim() + " " +
                             String.valueOf(userObj.getLastName() == null ? "" : userObj.getLastName()).trim()).trim();
                    if (!StringUtils.hasText(hrName)) {
                        hrName = userObj.getUsername();
                    }
                    hrContact = userObj.getEmail();

                    // If linked to an employee record, prefer their contact details (e.g. phone)
                    if (userObj.getEmployeeId() != null) {
                        Optional<Employee> hrEmpOpt = employeeRepository.findById(userObj.getEmployeeId());
                        if (hrEmpOpt.isPresent()) {
                            Employee hrEmp = hrEmpOpt.get();
                            String phone = StringUtils.hasText(hrEmp.getPhone()) ? hrEmp.getPhone().trim() : "";
                            String emailVal = StringUtils.hasText(hrEmp.getPersonalEmail()) ? hrEmp.getPersonalEmail().trim() :
                                              (StringUtils.hasText(hrEmp.getEmail()) ? hrEmp.getEmail().trim() : "");
                            if (StringUtils.hasText(phone) && StringUtils.hasText(emailVal)) {
                                hrContact = emailVal + " | Phone: " + phone;
                            } else if (StringUtils.hasText(phone)) {
                                hrContact = "Phone: " + phone;
                            } else if (StringUtils.hasText(emailVal)) {
                                hrContact = emailVal;
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Failed to resolve current HR user details: ", e);
        }

        tokens.put("HR Name", hrName);
        tokens.put("hr_name", hrName);
        tokens.put("hrName", hrName);
        tokens.put("Contact Details", hrContact);
        tokens.put("contact_details", hrContact);
        tokens.put("contactDetails", hrContact);

        // Common bracket placeholders present in seeded templates.
        text = replaceBracket(text, "Profile Completion Link", profileCompletionUrl == null ? "" : profileCompletionUrl);
        text = replaceBracket(text, "Expiry Date", expiry);
        text = replaceBracket(text, "Department Name", deptName);
        text = replaceBracket(text, "Department", deptName);
        text = replaceBracket(text, "dept", deptName);
        text = replaceBracket(text, "Branch Name", branchName);
        text = replaceBracket(text, "Designation", designation);
        text = replaceBracket(text, "HR Name", hrName);
        text = replaceBracket(text, "Contact Details", hrContact);

        String empIdVal = "";
        if (employee != null) {
            if (StringUtils.hasText(employee.getEmployeeCode())) {
                empIdVal = employee.getEmployeeCode();
            } else if (StringUtils.hasText(employee.getEmployeeIdNumber())) {
                empIdVal = employee.getEmployeeIdNumber();
            } else if (employee.getId() != null) {
                empIdVal = String.format("Emp-%03d", employee.getId());
            }
        }
        text = replaceBracket(text, "Employee ID", empIdVal);
        text = replaceBracket(text, "Employee Code", empIdVal);
        text = replaceBracket(text, "Emp ID", empIdVal);
        text = replaceBracket(text, "Employee ID Number", empIdVal);

        java.math.BigDecimal basicVal = java.math.BigDecimal.ZERO;
        java.math.BigDecimal daVal = java.math.BigDecimal.ZERO;
        java.math.BigDecimal hraVal = java.math.BigDecimal.ZERO;
        java.math.BigDecimal conveyanceVal = java.math.BigDecimal.ZERO;
        java.math.BigDecimal employerPf = java.math.BigDecimal.ZERO;

        if (employee != null) {
            basicVal = employee.getBasic() != null ? employee.getBasic() : java.math.BigDecimal.ZERO;
            daVal = employee.getDa() != null ? employee.getDa() : java.math.BigDecimal.ZERO;
            hraVal = employee.getHra() != null ? employee.getHra() : java.math.BigDecimal.ZERO;
            conveyanceVal = employee.getConveyance() != null ? employee.getConveyance() : java.math.BigDecimal.ZERO;

            if (basicVal.compareTo(java.math.BigDecimal.ZERO) == 0 && employee.getId() != null) {
                Optional<EmployeeSalary> salaryOpt = employeeSalaryRepository.findByEmployeeIdAndDeletedFalse(employee.getId());
                if (salaryOpt.isPresent()) {
                    EmployeeSalary es = salaryOpt.get();
                    basicVal = es.getBasic() != null ? es.getBasic() : java.math.BigDecimal.ZERO;
                    daVal = es.getDa() != null ? es.getDa() : java.math.BigDecimal.ZERO;
                    hraVal = es.getHra() != null ? es.getHra() : java.math.BigDecimal.ZERO;
                    conveyanceVal = es.getConveyance() != null ? es.getConveyance() : java.math.BigDecimal.ZERO;
                }
            }

            if (employee.getId() != null) {
                employerPf = providentFundRepository.findByEmployeeIdAndDeletedFalse(employee.getId())
                        .filter(pf -> "Approved".equalsIgnoreCase(pf.getStatus()))
                        .map(ProvidentFund::getOrganizationShareAmount)
                        .orElse(java.math.BigDecimal.ZERO);
            }
        }

        java.math.BigDecimal monthlyGross = basicVal.add(daVal).add(hraVal).add(conveyanceVal);
        java.math.BigDecimal monthlyCtc = monthlyGross.add(employerPf);
        java.math.BigDecimal annualCtc = monthlyCtc.multiply(new java.math.BigDecimal("12"));

        if (annualCtc.compareTo(java.math.BigDecimal.ZERO) == 0 && employee != null) {
            java.math.BigDecimal netSal = employee.getNetSalary();
            if ((netSal == null || netSal.compareTo(java.math.BigDecimal.ZERO) == 0) && employee.getId() != null) {
                netSal = employeeSalaryRepository.findByEmployeeIdAndDeletedFalse(employee.getId())
                        .map(com.nexorcrm.backend.entity.EmployeeSalary::getNetSalary)
                        .orElse(null);
            }
            if (netSal != null) {
                annualCtc = netSal.multiply(new java.math.BigDecimal("12"));
            }
        }

        String amountVal = annualCtc.stripTrailingZeros().toPlainString();
        tokens.put("CTC", amountVal);
        tokens.put("ctc", amountVal);
        tokens.put("Amount", amountVal);
        tokens.put("amount", amountVal);

        text = replaceBracket(text, "Amount", amountVal);
        text = replaceBracket(text, "CTC", amountVal);
        text = replaceBracket(text, "ctc", amountVal);
        text = replaceBracket(text, "Salary", amountVal);
        text = replaceBracket(text, "Annual CTC", amountVal);

        // Replace hardcoded numbers or bracket placeholders following "CTC" (like "CTC : ₹ per annum" or "CTC : ₹[Amount] per annum")
        String ctcRegex = "(?i)(CTC\\s*:\\s*(?:₹|Rs\\.?|INR)?\\s*)(?:\\[\\s*Amount\\s*\\]|[\\d,]+(?:\\.\\d+)?|(?=\\s*per\\s+annum))";
        text = text.replaceAll(ctcRegex, "$1" + amountVal);

        // Replace {{tokens}} last so templates that contain bracket placeholders inside tokens still work.
        text = renderHandlebarsTokens(text, tokens);

        // Safety net: only for email bodies (never for subjects).
        if (appendLinkIfMissing && StringUtils.hasText(profileCompletionUrl) && !text.contains(profileCompletionUrl)) {
            String linkStr = "\n\nProfile Completion Link: " + profileCompletionUrl
                    + (StringUtils.hasText(expiry) ? ("\nValid until: " + expiry) : "");

            int insertIndex = -1;
            String lowerText = text.toLowerCase();
            String[] markers = {
                "complete your profile",
                "profile completion"
            };

            for (String marker : markers) {
                int idx = lowerText.indexOf(marker);
                if (idx != -1) {
                    int lineEnd = text.indexOf("\n", idx);
                    if (lineEnd != -1) {
                        insertIndex = lineEnd;
                    } else {
                        insertIndex = text.length();
                    }
                    break;
                }
            }

            if (insertIndex != -1) {
                text = text.substring(0, insertIndex) + linkStr + text.substring(insertIndex);
            } else {
                text = text + linkStr;
            }
        }
        return text;
    }

    private static String firstNonBlank(String a, String b) {
        if (StringUtils.hasText(a)) return a.trim();
        if (StringUtils.hasText(b)) return b.trim();
        return "";
    }

    private static String replaceBracket(String text, String label, String value) {
        if (text == null) return "";
        String v = value == null ? "" : value;
        String regex = "[\\{\\[]+\\s*" + Pattern.quote(label) + "\\s*[\\}\\]]+";
        return text.replaceAll("(?i)" + regex, Matcher.quoteReplacement(v));
    }

    private static String renderHandlebarsTokens(String template, Map<String, String> values) {
        if (template == null || template.isEmpty()) return "";
        if (values == null || values.isEmpty()) return template;

        Matcher m = HANDLEBARS_TOKEN_PATTERN.matcher(template);
        StringBuffer out = new StringBuffer(template.length());
        while (m.find()) {
            String key = m.group(1).trim();
            String replacement = values.getOrDefault(key, "");
            m.appendReplacement(out, Matcher.quoteReplacement(replacement == null ? "" : replacement));
        }
        m.appendTail(out);
        return out.toString();
    }

    @Transactional(readOnly = true)
    public PublicEmployeeFormResponse getPublicForm(String token) {
        TokenContext ctx = requireValidToken(token);
        Employee employee = employeeRepository.findById(ctx.employeeId())
                .orElseThrow(() -> new EntityNotFoundException("Employee not found"));

        Map<String, EmployeeProfileFieldVerification> verifications = fieldVerificationRepository.findByEmployeeId(employee.getId())
                .stream()
                .collect(Collectors.toMap(EmployeeProfileFieldVerification::getFieldKey, v -> v, (a, b) -> a));

        List<EmployeeDocument> docs = documentRepository.findByEmployeeId(employee.getId());
        Map<EmployeeDocumentType, List<EmployeeDocument>> docsByType = docs.stream()
                .collect(Collectors.groupingBy(EmployeeDocument::getDocType));

        PublicEmployeeFormResponse res = new PublicEmployeeFormResponse();
        res.setEmployeeId(employee.getId());
        res.setName(employee.getName());
        res.setEmailMasked(maskEmail(employee.getEmail()));
        res.setPhoneMasked(maskPhone(employee.getPhone()));
        res.setScope(ctx.scope());
        res.setExpiresAt(ctx.expiresAt());

        if (ctx.scope() == EmployeeTokenScope.REJECTED_FIELDS) {
            for (EmployeePublicFieldKey fk : rejectedScalarKeys(verifications)) {
                res.getFields().add(toPublicFieldDto(employee, fk, verifications.get(fk.getKey())));
            }
            for (EmployeeDocumentType dt : rejectedUploadTypes(docsByType)) {
                res.getUploads().add(toPublicUploadDto(employee, dt, docsByType.getOrDefault(dt, List.of())));
            }
        } else {
            for (EmployeePublicFieldKey fk : EmployeePublicFieldKey.values()) {
                if (EXCLUDED_PUBLIC_FIELDS.contains(fk)) continue;
                res.getFields().add(toPublicFieldDto(employee, fk, verifications.get(fk.getKey())));
            }
            for (EmployeeDocumentType dt : EmployeeDocumentType.values()) {
                res.getUploads().add(toPublicUploadDto(employee, dt, docsByType.getOrDefault(dt, List.of())));
            }
        }

        // Always include read-only org/master names for context
        addOrgNameFields(res, employee);

        return res;
    }

    private void addOrgNameFields(PublicEmployeeFormResponse res, Employee employee) {
        if (res == null || employee == null) return;
        String headOfficeName = employee.getHeadOfficeId() == null ? "" : headOfficeMasterRepository.findById(employee.getHeadOfficeId())
                .map(HeadOfficeMaster::getName).orElse("");
        String branchName = employee.getBranchId() == null ? "" : branchMasterRepository.findById(employee.getBranchId())
                .map(BranchMaster::getName).orElse("");
        String deptName = employee.getDepartmentMasterId() == null ? "" : departmentMasterRepository.findById(employee.getDepartmentMasterId())
                .map(DepartmentMaster::getName).orElse("");
        String desigName = employee.getDesignationMasterId() == null ? "" : designationMasterRepository.findById(employee.getDesignationMasterId())
                .map(DesignationMaster::getName).orElse("");

        // Put org fields at top (insert in front)
        List<PublicEmployeeFormFieldDto> out = new ArrayList<>();
        out.add(readOnlyTextField("HEAD_OFFICE_NAME", "Head Office", headOfficeName));
        out.add(readOnlyTextField("BRANCH_NAME", "Branch", branchName));
        out.add(readOnlyTextField("DEPARTMENT_MASTER_NAME", "Department", deptName));
        out.add(readOnlyTextField("DESIGNATION_MASTER_NAME", "Designation", desigName));
        out.addAll(res.getFields());
        res.setFields(out);
    }

    private static PublicEmployeeFormFieldDto readOnlyTextField(String key, String label, String value) {
        PublicEmployeeFormFieldDto dto = new PublicEmployeeFormFieldDto();
        dto.setFieldKey(key);
        dto.setLabel(label);
        dto.setInputType(EmployeePublicFieldInputType.TEXT);
        dto.setEditable(false);
        dto.setCurrentValue(value == null ? "" : value);
        dto.setStatus(null);
        dto.setRemarks(null);
        return dto;
    }

    @Transactional
    public Map<String, Object> submitPublicForm(String token, MultipartHttpServletRequest request) {
        TokenContext ctx = requireValidToken(token);
        Employee employee = employeeRepository.findById(ctx.employeeId())
                .orElseThrow(() -> new EntityNotFoundException("Employee not found"));

        ApplyResult result = applySubmittedFieldsAndDocs(employee, request);
        if (result.changedAny) {
            employee.setProfileStatus(EmployeeProfileStatus.PENDING_VERIFICATION);
            employee.setProfileStatusUpdatedAt(LocalDateTime.now());
            employeeRepository.save(employee);
        }

        ctx.row().setUsedAt(LocalDateTime.now());
        tokenRepository.save(ctx.row());

        return Map.of(
                "employeeId", employee.getId(),
                "profileStatus", employee.getProfileStatus().name()
        );
    }

    @Transactional(readOnly = true)
    public EmployeeVerificationResponse getVerification(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found"));

        Map<String, EmployeeProfileFieldVerification> verifications = fieldVerificationRepository.findByEmployeeId(employeeId)
                .stream()
                .collect(Collectors.toMap(EmployeeProfileFieldVerification::getFieldKey, v -> v, (a, b) -> a));

        EmployeeVerificationResponse res = new EmployeeVerificationResponse();
        res.setEmployeeId(employeeId);
        res.setProfileStatus(employee.getProfileStatus());
        boolean everGenerated = tokenRepository.existsByEmployeeId(employeeId);
        res.setProfileLinkEverGenerated(everGenerated);
        // Backward-compatible field for older frontend builds.
        res.setProfileCompletionMailSent(everGenerated);

        for (EmployeePublicFieldKey fk : EmployeePublicFieldKey.values()) {
            if (EXCLUDED_PUBLIC_FIELDS.contains(fk)) continue;
            EmployeeProfileFieldVerification v = verifications.get(fk.getKey());
            EmployeeVerificationFieldDto dto = new EmployeeVerificationFieldDto();
            dto.setFieldKey(fk.getKey());
            dto.setValuePreview(fk.getValue(employee));
            dto.setStatus(v == null ? null : v.getStatus());
            dto.setRemarks(v == null ? null : v.getRemarks());
            dto.setUpdatedAt(v == null ? null : v.getUpdatedAt());
            res.getFields().add(dto);
        }

        List<EmployeeDocument> docs = documentRepository.findByEmployeeId(employeeId);
        docs.sort(Comparator.comparing(EmployeeDocument::getUploadedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed());
        for (EmployeeDocument d : docs) {
            EmployeeVerificationDocumentDto dto = new EmployeeVerificationDocumentDto();
            dto.setId(d.getId());
            dto.setDocType(d.getDocType());
            dto.setFileUrl("/api/employees/" + employeeId + "/documents/" + d.getId() + "/file");
            dto.setOriginalFilename(d.getOriginalFilename());
            dto.setStatus(d.getStatus());
            dto.setRemarks(d.getRemarks());
            dto.setUploadedAt(d.getUploadedAt());
            res.getDocuments().add(dto);
        }

        // Add placeholder entries for configured required documents that are not uploaded
        List<EmployeeDocumentType> requiredDocs = parseDocCsv(requiredDocsConfig);
        for (EmployeeDocumentType dt : requiredDocs) {
            boolean exists;
            if (dt == EmployeeDocumentType.PHOTO) {
                exists = docs.stream().anyMatch(d -> d.getDocType() == EmployeeDocumentType.PHOTO || d.getDocType() == EmployeeDocumentType.CANDIDATE_PHOTO);
            } else {
                exists = docs.stream().anyMatch(d -> d.getDocType() == dt);
            }
            if (!exists) {
                EmployeeVerificationDocumentDto dto = new EmployeeVerificationDocumentDto();
                dto.setId(null);
                dto.setDocType(dt);
                dto.setFileUrl(null);
                dto.setOriginalFilename("Not Uploaded");
                dto.setStatus(null);
                dto.setRemarks("Missing required document");
                dto.setUploadedAt(null);
                res.getDocuments().add(dto);
            }
        }

        return res;
    }

    @Transactional(readOnly = true)
    public ResponseEntity<Resource> getDocumentFile(Long employeeId, Long documentId) {
        EmployeeDocument doc = documentRepository.findById(documentId)
                .filter(d -> Objects.equals(d.getEmployeeId(), employeeId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));

        Path resolvedPath = resolveEmployeeDocumentPath(doc.getFilePath());
        Resource resource = new FileSystemResource(resolvedPath.toFile());
        if (!resource.exists() || !resource.isReadable()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Document file not found");
        }

        String filename = StringUtils.hasText(doc.getOriginalFilename())
                ? doc.getOriginalFilename().replace("\"", "")
                : resolvedPath.getFileName().toString().replace("\"", "");

        MediaType mediaType = parseMediaType(doc.getContentType())
                .or(() -> MediaTypeFactory.getMediaType(filename))
                .or(() -> MediaTypeFactory.getMediaType(resolvedPath.getFileName().toString()))
                .orElse(MediaType.APPLICATION_OCTET_STREAM);

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header("Content-Disposition", "inline; filename=\"" + filename + "\"")
                .body(resource);
    }

    @Transactional
    public EmployeeVerificationResponse verify(Long employeeId, VerifyEmployeeFieldsRequest request) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found"));

        LocalDateTime now = LocalDateTime.now();

        if (request != null && request.getFieldDecisions() != null) {
            for (FieldDecisionDto decision : request.getFieldDecisions()) {
                if (!StringUtils.hasText(decision.getFieldKey())) {
                    continue;
                }
                EmployeePublicFieldKey fk = EmployeePublicFieldKey.fromKey(decision.getFieldKey());
                if (fk == null) {
                    continue;
                }

                EmployeeProfileFieldVerification row = fieldVerificationRepository
                        .findFirstByEmployeeIdAndFieldKey(employeeId, fk.getKey())
                        .orElseGet(() -> {
                            EmployeeProfileFieldVerification v = new EmployeeProfileFieldVerification();
                            v.setEmployeeId(employeeId);
                            v.setFieldKey(fk.getKey());
                            v.setStatus(VerificationStatus.PENDING);
                            return v;
                        });

                VerificationStatus status = parseDecisionStatus(decision.getDecision());
                row.setStatus(status);
                row.setRemarks(status == VerificationStatus.REJECTED ? trimToNull(decision.getRemarks()) : null);
                row.setUpdatedAt(now);
                fieldVerificationRepository.save(row);
            }
        }

        if (request != null && request.getDocumentDecisions() != null) {
            for (DocumentDecisionDto decision : request.getDocumentDecisions()) {
                if (decision.getDocumentId() == null) {
                    continue;
                }
                EmployeeDocument doc = documentRepository.findById(decision.getDocumentId())
                        .orElseThrow(() -> new EntityNotFoundException("Document not found"));
                if (!Objects.equals(doc.getEmployeeId(), employeeId)) {
                    throw new EntityNotFoundException("Document not found");
                }

                VerificationStatus status = parseDecisionStatus(decision.getDecision());
                doc.setStatus(status);
                doc.setRemarks(status == VerificationStatus.REJECTED ? trimToNull(decision.getRemarks()) : null);
                doc.setVerifiedAt(now);
                documentRepository.save(doc);
            }
        }

        recomputeEmployeeProfileStatus(employee);
        employeeRepository.save(employee);
        return getVerification(employeeId);
    }

    @Transactional
    public EmployeeFormLinkResponse resendRejectedLink(Long employeeId) {
        EmployeeVerificationResponse verification = getVerification(employeeId);

        boolean anyRejectedField = verification.getFields().stream().anyMatch(f -> f.getStatus() == VerificationStatus.REJECTED);
        boolean anyRejectedDoc = verification.getDocuments().stream().anyMatch(d -> d.getStatus() == VerificationStatus.REJECTED);
        if (!anyRejectedField && !anyRejectedDoc) {
            throw new IllegalStateException("No rejected fields");
        }

        return generateFormLink(employeeId, EmployeeTokenScope.REJECTED_FIELDS);
    }

    private ApplyResult applySubmittedFieldsAndDocs(Employee employee, MultipartHttpServletRequest request) {
        if (request == null) {
            return new ApplyResult(false);
        }

        boolean changed = false;
        LocalDateTime now = LocalDateTime.now();

        Map<String, String[]> params = request.getParameterMap();
        for (Map.Entry<String, String[]> entry : params.entrySet()) {
            String name = entry.getKey();
            if (name == null || !name.startsWith("field_")) continue;
            String key = name.substring("field_".length());
            EmployeePublicFieldKey fk = EmployeePublicFieldKey.fromKey(key);
            if (fk == null) continue;
            if (EXCLUDED_PUBLIC_FIELDS.contains(fk)) continue;
            if (!fk.isEditable()) continue;

            String value = (entry.getValue() != null && entry.getValue().length > 0) ? entry.getValue()[0] : null;
            if (!StringUtils.hasText(value)) continue;

            fk.applyValue(employee, value);
            upsertPendingVerification(employee.getId(), fk.getKey(), now);
            changed = true;
        }

        var fileMap = request.getMultiFileMap();
        if (fileMap != null) {
            for (String partName : fileMap.keySet()) {
                if (partName == null || !partName.startsWith("doc_")) continue;
                String typeKey = partName.substring("doc_".length());
                EmployeeDocumentType dt;
                try {
                    dt = EmployeeDocumentType.valueOf(typeKey.trim().toUpperCase(Locale.ROOT));
                } catch (Exception ex) {
                    continue;
                }
                List<MultipartFile> files = fileMap.get(partName);
                if (files == null) continue;
                for (MultipartFile file : files) {
                    if (file == null || file.isEmpty()) continue;
                    String relativePath = uploadStorageService.storeEmployeePublicFormUpload(
                            employee.getId(),
                            dt.name().toLowerCase(Locale.ROOT),
                            file
                    );
                    EmployeeDocument doc = new EmployeeDocument();
                    doc.setEmployeeId(employee.getId());
                    doc.setDocType(dt);
                    doc.setFilePath(relativePath);
                    doc.setOriginalFilename(file.getOriginalFilename());
                    doc.setContentType(file.getContentType());
                    doc.setSizeBytes(file.getSize());
                    doc.setStatus(VerificationStatus.PENDING);
                    doc.setRemarks(null);
                    doc.setUploadedAt(LocalDateTime.now());
                    documentRepository.save(doc);

                    applyLegacyEmployeePath(employee, dt, relativePath);
                    changed = true;
                }
            }
        }

        if (changed) {
            employeeRepository.save(employee);
        }

        return new ApplyResult(changed);
    }

    private record ApplyResult(boolean changedAny) {}

    private void upsertPendingVerification(Long employeeId, String key, LocalDateTime now) {
        EmployeeProfileFieldVerification row = fieldVerificationRepository
                .findFirstByEmployeeIdAndFieldKey(employeeId, key)
                .orElseGet(() -> {
                    EmployeeProfileFieldVerification v = new EmployeeProfileFieldVerification();
                    v.setEmployeeId(employeeId);
                    v.setFieldKey(key);
                    return v;
                });
        row.setStatus(VerificationStatus.PENDING);
        row.setRemarks(null);
        row.setUpdatedAt(now);
        fieldVerificationRepository.save(row);
    }

    private void applyLegacyEmployeePath(Employee employee, EmployeeDocumentType dt, String relativePath) {
        if (employee == null || dt == null) return;
        switch (dt) {
            case PHOTO, CANDIDATE_PHOTO -> employee.setCandidatePhotoPath(relativePath);
            case AADHAAR_CARD -> employee.setAadharCardPath(relativePath);
            case PAN_CARD -> employee.setPanCardPath(relativePath);
            case BANK_PASSBOOK -> employee.setBankPassbookPath(relativePath);
            case EXPERIENCE_CERTIFICATE -> employee.setExperienceCertificatePath(relativePath);
            case CERTIFICATE -> employee.setCertificatePath(relativePath);
            case GRADUATION_CERTIFICATE -> employee.setGraduationCertificatePath(relativePath);
            case GRADUATION_MARKSHEET -> employee.setGraduationMarksheetPath(relativePath);
            case HSC_MARKSHEET -> employee.setHscMarksheetPath(relativePath);
            case SSLC_MARKSHEET -> employee.setSslcMarksheetPath(relativePath);
            case COMMUNITY_CERTIFICATE -> employee.setCommunityCertificatePath(relativePath);
            default -> {
            }
        }
    }

    private void recomputeEmployeeProfileStatus(Employee employee) {
        Map<String, EmployeeProfileFieldVerification> verifications = fieldVerificationRepository.findByEmployeeId(employee.getId())
                .stream()
                .collect(Collectors.toMap(EmployeeProfileFieldVerification::getFieldKey, v -> v, (a, b) -> a));

        List<EmployeeDocument> docs = documentRepository.findByEmployeeId(employee.getId());
        Map<EmployeeDocumentType, List<EmployeeDocument>> docsByType = docs.stream().collect(Collectors.groupingBy(EmployeeDocument::getDocType));

        List<String> requiredFields = parseCsv(requiredFieldsConfig);
        List<EmployeeDocumentType> requiredDocs = parseDocCsv(requiredDocsConfig);

        boolean allScalarApproved = requiredFields.stream()
                .allMatch(k -> verifications.get(k) != null && verifications.get(k).getStatus() == VerificationStatus.APPROVED);

        boolean allDocsApproved = requiredDocs.stream().allMatch(dt -> isRequiredDocApproved(employee, dt, docsByType));

        EmployeeProfileStatus newStatus = (allScalarApproved && allDocsApproved)
                ? EmployeeProfileStatus.VERIFIED
                : EmployeeProfileStatus.PENDING_VERIFICATION;

        if (employee.getProfileStatus() != newStatus) {
            employee.setProfileStatus(newStatus);
            employee.setProfileStatusUpdatedAt(LocalDateTime.now());
        }
    }

    private boolean latestApproved(List<EmployeeDocument> docs) {
        return docs.stream()
                .max(Comparator.comparing(EmployeeDocument::getUploadedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(d -> d.getStatus() == VerificationStatus.APPROVED)
                .orElse(false);
    }

    private boolean anyApproved(List<EmployeeDocument> docs) {
        return docs.stream().anyMatch(d -> d.getStatus() == VerificationStatus.APPROVED);
    }

    private boolean isRequiredDocApproved(
            Employee employee,
            EmployeeDocumentType docType,
            Map<EmployeeDocumentType, List<EmployeeDocument>> docsByType
    ) {
        if (docType == EmployeeDocumentType.CERTIFICATE) {
            return anyApproved(certificateFamilyDocs(docsByType)) || hasLegacyCertificatePath(employee);
        }
        if (docType == EmployeeDocumentType.PHOTO) {
            return latestApproved(photoFamilyDocs(docsByType)) || StringUtils.hasText(employee.getCandidatePhotoPath());
        }
        return latestApproved(docsByType.getOrDefault(docType, List.of()));
    }

    private boolean hasLegacyCertificatePath(Employee employee) {
        return employee != null && (
                StringUtils.hasText(employee.getExperienceCertificatePath())
                        || StringUtils.hasText(employee.getCertificatePath())
                        || StringUtils.hasText(employee.getGraduationCertificatePath())
                        || StringUtils.hasText(employee.getGraduationMarksheetPath())
                        || StringUtils.hasText(employee.getHscMarksheetPath())
                        || StringUtils.hasText(employee.getSslcMarksheetPath())
                        || StringUtils.hasText(employee.getCommunityCertificatePath())
        );
    }

    private Set<EmployeePublicFieldKey> rejectedScalarKeys(Map<String, EmployeeProfileFieldVerification> verifications) {
        return verifications.values().stream()
                .filter(v -> v.getStatus() == VerificationStatus.REJECTED)
                .map(v -> EmployeePublicFieldKey.fromKey(v.getFieldKey()))
                .filter(Objects::nonNull)
                .filter(fk -> !EXCLUDED_PUBLIC_FIELDS.contains(fk))
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private Set<EmployeeDocumentType> rejectedUploadTypes(Map<EmployeeDocumentType, List<EmployeeDocument>> docsByType) {
        Set<EmployeeDocumentType> rejected = new LinkedHashSet<>();
        for (EmployeeDocumentType t : docsByType.keySet()) {
            if (t == EmployeeDocumentType.CERTIFICATE) {
                List<EmployeeDocument> docs = certificateFamilyDocs(docsByType);
                if (docs.stream().anyMatch(d -> d.getStatus() == VerificationStatus.REJECTED)) {
                    rejected.add(t);
                }
            } else {
                List<EmployeeDocument> docs = docsByType.getOrDefault(t, List.of());
                Optional<EmployeeDocument> latest = docs.stream()
                        .max(Comparator.comparing(EmployeeDocument::getUploadedAt, Comparator.nullsLast(Comparator.naturalOrder())));
                if (latest.isPresent() && latest.get().getStatus() == VerificationStatus.REJECTED) {
                    rejected.add(t);
                }
            }
        }
        return rejected;
    }

    private PublicEmployeeFormFieldDto toPublicFieldDto(Employee employee, EmployeePublicFieldKey fk, EmployeeProfileFieldVerification v) {
        PublicEmployeeFormFieldDto dto = new PublicEmployeeFormFieldDto();
        dto.setFieldKey(fk.getKey());
        dto.setLabel(fk.getLabel());
        dto.setInputType(fk.getInputType());
        dto.setEditable(fk.isEditable());
        dto.setCurrentValue(fk.getValue(employee));
        dto.setStatus(v == null ? null : v.getStatus());
        dto.setRemarks(v == null ? null : v.getRemarks());
        return dto;
    }

    private PublicEmployeeFormUploadDto toPublicUploadDto(Employee employee, EmployeeDocumentType dt, List<EmployeeDocument> docs) {
        PublicEmployeeFormUploadDto dto = new PublicEmployeeFormUploadDto();
        dto.setDocType(dt);
        dto.setLabel(prettyDocLabel(dt));
        UploadStatus status = currentUploadStatus(docs, dt);
        if (status.status() == null && dt == EmployeeDocumentType.CERTIFICATE && hasLegacyCertificatePath(employee)) {
            status = new UploadStatus(VerificationStatus.APPROVED, null);
        }
        dto.setStatus(status.status());
        dto.setRemarks(status.remarks());
        return dto;
    }

    private UploadStatus currentUploadStatus(List<EmployeeDocument> docs, EmployeeDocumentType type) {
        if (docs == null || docs.isEmpty()) {
            return new UploadStatus(null, null);
        }
        if (type == EmployeeDocumentType.CERTIFICATE) {
            EmployeeDocument rejected = docs.stream().filter(d -> d.getStatus() == VerificationStatus.REJECTED)
                    .max(Comparator.comparing(EmployeeDocument::getUploadedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                    .orElse(null);
            if (rejected != null) {
                return new UploadStatus(VerificationStatus.REJECTED, rejected.getRemarks());
            }
            EmployeeDocument pending = docs.stream().filter(d -> d.getStatus() == VerificationStatus.PENDING)
                    .max(Comparator.comparing(EmployeeDocument::getUploadedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                    .orElse(null);
            if (pending != null) {
                return new UploadStatus(VerificationStatus.PENDING, pending.getRemarks());
            }
            EmployeeDocument approved = docs.stream().filter(d -> d.getStatus() == VerificationStatus.APPROVED)
                    .max(Comparator.comparing(EmployeeDocument::getUploadedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                    .orElse(null);
            if (approved != null) {
                return new UploadStatus(VerificationStatus.APPROVED, approved.getRemarks());
            }
            return new UploadStatus(null, null);
        }

        EmployeeDocument latest = docs.stream()
                .max(Comparator.comparing(EmployeeDocument::getUploadedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .orElse(null);
        if (latest == null) {
            return new UploadStatus(null, null);
        }
        return new UploadStatus(latest.getStatus(), latest.getRemarks());
    }

    private record UploadStatus(VerificationStatus status, String remarks) {}

    private List<EmployeeDocument> certificateFamilyDocs(Map<EmployeeDocumentType, List<EmployeeDocument>> docsByType) {
        List<EmployeeDocument> docs = new ArrayList<>();
        for (EmployeeDocumentType type : List.of(
                EmployeeDocumentType.CERTIFICATE,
                EmployeeDocumentType.EXPERIENCE_CERTIFICATE,
                EmployeeDocumentType.GRADUATION_CERTIFICATE,
                EmployeeDocumentType.GRADUATION_MARKSHEET,
                EmployeeDocumentType.HSC_MARKSHEET,
                EmployeeDocumentType.SSLC_MARKSHEET,
                EmployeeDocumentType.COMMUNITY_CERTIFICATE
        )) {
            docs.addAll(docsByType.getOrDefault(type, List.of()));
        }
        return docs;
    }

    private List<EmployeeDocument> photoFamilyDocs(Map<EmployeeDocumentType, List<EmployeeDocument>> docsByType) {
        List<EmployeeDocument> docs = new ArrayList<>();
        for (EmployeeDocumentType type : List.of(
                EmployeeDocumentType.PHOTO,
                EmployeeDocumentType.CANDIDATE_PHOTO
        )) {
            docs.addAll(docsByType.getOrDefault(type, List.of()));
        }
        return docs;
    }

    private static String prettyDocLabel(EmployeeDocumentType dt) {
        return switch (dt) {
            case PHOTO -> "Photo";
            case RESUME -> "Resume";
            case CERTIFICATE -> "Certificate";
            case CANDIDATE_PHOTO -> "Candidate Photo";
            case AADHAAR_CARD -> "Aadhaar Card";
            case PAN_CARD -> "PAN Card";
            case BANK_PASSBOOK -> "Bank Passbook";
            case EXPERIENCE_CERTIFICATE -> "Experience Certificate";
            case GRADUATION_CERTIFICATE -> "Graduation Certificate";
            case GRADUATION_MARKSHEET -> "Graduation Marksheet";
            case HSC_MARKSHEET -> "HSC Marksheet";
            case SSLC_MARKSHEET -> "SSLC Marksheet";
            case COMMUNITY_CERTIFICATE -> "Community Certificate";
        };
    }

    private TokenContext requireValidToken(String token) {
        if (!StringUtils.hasText(token)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Invalid token");
        }
        String hash = hmacHash(tokenSecret, token.trim());
        EmployeeProfileToken row = tokenRepository.findFirstByTokenHash(hash)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invalid token"));

        LocalDateTime now = LocalDateTime.now();
        if (row.getRevokedAt() != null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Invalid token");
        }
        if (row.getExpiresAt() == null || !row.getExpiresAt().isAfter(now)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Invalid token");
        }

        return new TokenContext(row.getEmployeeId(), row.getScope(), row.getExpiresAt(), row);
    }

    private record TokenContext(Long employeeId, EmployeeTokenScope scope, LocalDateTime expiresAt, EmployeeProfileToken row) {}

    private String buildPublicUrl(String token) {
        String base = String.valueOf(publicBaseUrl == null ? "" : publicBaseUrl).trim();
        if (base.endsWith("/")) {
            return base + token;
        }
        return base + "/" + token;
    }

    private static String generateToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String hmacHash(String secret, String token) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALG);
            mac.init(new SecretKeySpec(String.valueOf(secret).getBytes(StandardCharsets.UTF_8), HMAC_ALG));
            byte[] digest = mac.doFinal(String.valueOf(token).getBytes(StandardCharsets.UTF_8));
            return bytesToHex(digest);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to hash token", e);
        }
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private static String normalizeUploadPath(String filePath) {
        String p = String.valueOf(filePath == null ? "" : filePath).replace("\\", "/");
        return p.replaceFirst("^/+", "");
    }

    private Path resolveEmployeeDocumentPath(String filePath) {
        if (!StringUtils.hasText(filePath)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Document file not found");
        }

        Path uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
        String raw = filePath.trim().replace("\\", "/");
        String normalized = raw;
        if (normalized.contains("/uploads/")) {
            normalized = normalized.substring(normalized.indexOf("/uploads/") + "/uploads/".length());
        }
        normalized = normalized.replaceFirst("^uploads/", "").replaceFirst("^/+", "");

        Path resolvedPath;
        Path rawPath = Paths.get(raw);
        if (rawPath.isAbsolute()) {
            resolvedPath = rawPath.toAbsolutePath().normalize();
        } else {
            resolvedPath = uploadRoot.resolve(normalized).normalize();
        }

        if (!resolvedPath.startsWith(uploadRoot) || !Files.isRegularFile(resolvedPath) || !Files.isReadable(resolvedPath)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Document file not found");
        }

        return resolvedPath;
    }

    private static Optional<MediaType> parseMediaType(String contentType) {
        if (!StringUtils.hasText(contentType)) {
            return Optional.empty();
        }
        try {
            return Optional.of(MediaType.parseMediaType(contentType));
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    private static String maskEmail(String email) {
        if (!StringUtils.hasText(email)) {
            return null;
        }
        String e = email.trim();
        int at = e.indexOf('@');
        if (at <= 1) {
            return "***" + (at >= 0 ? e.substring(at) : "");
        }
        String domain = at >= 0 ? e.substring(at) : "";
        return e.charAt(0) + "***" + domain;
    }

    private static String maskPhone(String phone) {
        if (!StringUtils.hasText(phone)) {
            return null;
        }
        String p = phone.replaceAll("\\s+", "");
        if (p.length() <= 4) {
            return "****";
        }
        return "****" + p.substring(p.length() - 4);
    }

    private static VerificationStatus parseDecisionStatus(String decision) {
        String d = String.valueOf(decision == null ? "" : decision).trim().toUpperCase(Locale.ROOT);
        return d.equals("APPROVE") || d.equals("APPROVED") ? VerificationStatus.APPROVED : VerificationStatus.REJECTED;
    }

    private static List<String> parseCsv(String csv) {
        if (!StringUtils.hasText(csv)) return List.of();
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .map(s -> s.toUpperCase(Locale.ROOT))
                .toList();
    }

    private static List<EmployeeDocumentType> parseDocCsv(String csv) {
        List<String> keys = parseCsv(csv);
        List<EmployeeDocumentType> out = new ArrayList<>();
        for (String k : keys) {
            try {
                out.add(EmployeeDocumentType.valueOf(k));
            } catch (Exception ignored) {
            }
        }
        return out;
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
