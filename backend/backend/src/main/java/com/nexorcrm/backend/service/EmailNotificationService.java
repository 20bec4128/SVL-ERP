package com.nexorcrm.backend.service;

import com.nexorcrm.backend.entity.EmailNotificationLog;
import com.nexorcrm.backend.repo.EmailNotificationLogRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import jakarta.mail.internet.MimeMessage;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Properties;
import java.util.Optional;

@Service
public class EmailNotificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificationService.class);
    private final JavaMailSender mailSender;
    private final EmailNotificationLogRepository logRepository;
    private final MailSettingsService mailSettingsService;

    @Value("${app.mail.enabled:false}")
    private boolean enabled;

    @Value("${app.mail.from-address:}")
    private String fromAddress;

    @Value("${app.mail.from-name:SVL}")
    private String fromName;

    @Value("${app.mail.cooldown-minutes:60}")
    private long cooldownMinutes;

    public EmailNotificationService(JavaMailSender mailSender,
                                    EmailNotificationLogRepository logRepository,
                                    MailSettingsService mailSettingsService) {
        this.mailSender = mailSender;
        this.logRepository = logRepository;
        this.mailSettingsService = mailSettingsService;
    }

    public boolean isMailEnabled() {
        MailSettingsService.ResolvedMailSettings db = mailSettingsService.resolve();
        if (db != null) {
            return db.enabled;
        }
        return enabled;
    }

    public void sendTestEmail(String toAddress) {
        sendEmailInternal(toAddress, "Test Email", "This is a test email from SVL ERP.", true);
    }

    @Async
    public void notifyIfAllowed(String recipientEmail, String subject, String body) {
        if (!isMailEnabled()) {
            log.warn("Email notifications disabled (app.mail.enabled=false). Skipping email to {}.", recipientEmail);
            return;
        }
        if (!StringUtils.hasText(recipientEmail)) {
            log.warn("Email notification skipped: empty recipient.");
            return;
        }

        String normalized = recipientEmail.trim().toLowerCase();
        LocalDateTime now = LocalDateTime.now();

        Optional<EmailNotificationLog> existing = logRepository.findTopByRecipientEmailOrderByLastSentAtDesc(normalized);
        if (existing.isPresent()) {
            Duration diff = Duration.between(existing.get().getLastSentAt(), now);
            if (diff.toMinutes() < cooldownMinutes) {
                log.info("Email notification skipped for {} due to cooldown ({} min).", normalized, cooldownMinutes);
                return;
            }
        }

        try {
            sendEmailInternal(normalized, subject, body, false);

            EmailNotificationLog logRow = existing.orElseGet(EmailNotificationLog::new);
            logRow.setRecipientEmail(normalized);
            logRow.setLastSentAt(now);
            logRepository.save(logRow);
            log.info("Email notification sent to {}.", normalized);
        } catch (Exception ex) {
            log.error("Email notification failed for {}.", normalized, ex);
        }
    }

    /**
     * Sends an email immediately when mail is enabled, skipping cooldown checks.
     * Useful for admin-triggered onboarding emails (e.g., offer letter).
     */
    @Async
    public void notifyNowIfEnabled(String recipientEmail, String subject, String body) {
        if (!isMailEnabled()) {
            log.warn("Email notifications disabled (app.mail.enabled=false). Skipping email to {}.", recipientEmail);
            return;
        }
        if (!StringUtils.hasText(recipientEmail)) {
            log.warn("Email notification skipped: empty recipient.");
            return;
        }

        String normalized = recipientEmail.trim().toLowerCase();
        LocalDateTime now = LocalDateTime.now();
        Optional<EmailNotificationLog> existing = logRepository.findTopByRecipientEmailOrderByLastSentAtDesc(normalized);

        try {
            sendEmailInternal(normalized, subject, body, false);

            EmailNotificationLog logRow = existing.orElseGet(EmailNotificationLog::new);
            logRow.setRecipientEmail(normalized);
            logRow.setLastSentAt(now);
            logRepository.save(logRow);
            log.info("Email notification sent to {}.", normalized);
        } catch (Exception ex) {
            log.error("Email notification failed for {}.", normalized, ex);
        }
    }

    private void sendEmailInternal(String normalizedRecipientEmail, String subject, String body, boolean bypassEnabledCheck) {
        if (!bypassEnabledCheck && !isMailEnabled()) {
            return;
        }

        MailSettingsService.ResolvedMailSettings db = mailSettingsService.resolve();
        JavaMailSender sender = db != null ? buildSender(db) : mailSender;
        String resolvedFromAddress = db != null && StringUtils.hasText(db.fromAddress) ? db.fromAddress : fromAddress;
        String resolvedFromName = db != null && StringUtils.hasText(db.fromName) ? db.fromName : fromName;
        String resolvedCc = db != null ? db.cc : null;
        String resolvedBcc = db != null ? db.bcc : null;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(normalizedRecipientEmail);
        String[] ccList = splitEmails(resolvedCc);
        if (ccList.length > 0) message.setCc(ccList);
        String[] bccList = splitEmails(resolvedBcc);
        if (bccList.length > 0) message.setBcc(bccList);
        if (StringUtils.hasText(resolvedFromAddress)) {
            message.setFrom(StringUtils.hasText(resolvedFromName)
                    ? String.format("%s <%s>", resolvedFromName, resolvedFromAddress)
                    : resolvedFromAddress);
        }
        message.setSubject(subject);
        message.setText(body);
        try {
            sender.send(new SimpleMailMessage(message));
        } catch (MailAuthenticationException ex) {
            if (db == null) {
                throw ex;
            }

            log.warn("SMTP authentication failed using stored mail settings for {}. Retrying with application mail sender.", normalizedRecipientEmail);
            mailSender.send(new SimpleMailMessage(message));
        }
    }

    private static String[] splitEmails(String value) {
        if (!StringUtils.hasText(value)) return new String[0];
        return java.util.Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .toArray(String[]::new);
    }

    private static JavaMailSender buildSender(MailSettingsService.ResolvedMailSettings settings) {
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
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", String.valueOf(settings.smtpAuth));
        props.put("mail.smtp.starttls.enable", String.valueOf(settings.starttls));
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.ssl.trust", "*");
        return impl;
    }

    @Async
    public void notifyNowWithAttachmentIfEnabled(String recipientEmail, String subject, String body, String attachmentName, byte[] attachmentBytes) {
        if (!isMailEnabled()) {
            log.warn("Email notifications disabled. Skipping email with attachment to {}.", recipientEmail);
            return;
        }
        if (!StringUtils.hasText(recipientEmail)) {
            log.warn("Email notification skipped: empty recipient.");
            return;
        }

        String normalized = recipientEmail.trim().toLowerCase();
        MailSettingsService.ResolvedMailSettings db = mailSettingsService.resolve();
        JavaMailSender sender = db != null ? buildSender(db) : mailSender;
        String resolvedFromAddress = db != null && StringUtils.hasText(db.fromAddress) ? db.fromAddress : fromAddress;
        String resolvedFromName = db != null && StringUtils.hasText(db.fromName) ? db.fromName : fromName;
        String resolvedCc = db != null ? db.cc : null;
        String resolvedBcc = db != null ? db.bcc : null;

        try {
            MimeMessage mimeMessage = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setTo(normalized);
            if (StringUtils.hasText(resolvedFromAddress)) {
                helper.setFrom(StringUtils.hasText(resolvedFromName)
                        ? String.format("%s <%s>", resolvedFromName, resolvedFromAddress)
                        : resolvedFromAddress);
            }
            String[] ccList = splitEmails(resolvedCc);
            if (ccList.length > 0) helper.setCc(ccList);
            String[] bccList = splitEmails(resolvedBcc);
            if (bccList.length > 0) helper.setBcc(bccList);
            
            helper.setSubject(subject);
            helper.setText(body);
            
            if (attachmentBytes != null && attachmentBytes.length > 0) {
                helper.addAttachment(attachmentName, new ByteArrayResource(attachmentBytes));
            }
            
            sender.send(mimeMessage);
            log.info("Email notification with attachment sent to {}.", normalized);
        } catch (Exception ex) {
            log.error("Email notification with attachment failed for {}.", normalized, ex);
        }
    }
}
