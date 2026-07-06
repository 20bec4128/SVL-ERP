package com.nexorcrm.backend.service;

import com.nexorcrm.backend.entity.QuotationTemplate;
import com.nexorcrm.backend.repo.QuotationTemplateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class QuotationTemplateService {

    private final QuotationTemplateRepository repo;

    public QuotationTemplateService(QuotationTemplateRepository repo) {
        this.repo = repo;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> get() {
        // Return active template, fallback to the first one, or empty map
        return repo.findByActiveTrue()
                .or(() -> repo.findTopByOrderByIdAsc())
                .map(this::toMap)
                .orElseGet(HashMap::new);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listAll() {
        return repo.findAllByOrderByIdAsc().stream()
                .map(this::toMap)
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> save(Map<String, Object> payload) {
        QuotationTemplate tpl = repo.findTopByOrderByIdAsc().orElseGet(QuotationTemplate::new);
        applyPayload(tpl, payload);
        if (tpl.getTemplateVariant() == null || tpl.getTemplateVariant().isBlank()) {
            tpl.setTemplateVariant("standard");
        }
        return toMap(repo.save(tpl));
    }

    @Transactional
    public Map<String, Object> create(Map<String, Object> payload) {
        QuotationTemplate tpl = new QuotationTemplate();
        applyPayload(tpl, payload);
        if (tpl.getTemplateVariant() == null || tpl.getTemplateVariant().isBlank()) {
            tpl.setTemplateVariant("standard");
        }
        // If this is the first template, set it as active
        if (repo.count() == 0) {
            tpl.setActive(true);
        }
        return toMap(repo.save(tpl));
    }

    @Transactional
    public Map<String, Object> update(Long id, Map<String, Object> payload) {
        QuotationTemplate tpl = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Template not found with id: " + id));
        applyPayload(tpl, payload);
        return toMap(repo.save(tpl));
    }

    @Transactional
    public void delete(Long id) {
        QuotationTemplate tpl = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Template not found with id: " + id));
        if (Boolean.TRUE.equals(tpl.getActive())) {
            throw new IllegalStateException("Cannot delete the active template. Please activate another template first.");
        }
        repo.delete(tpl);
    }

    @Transactional
    public Map<String, Object> activate(Long id) {
        QuotationTemplate target = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Template not found with id: " + id));
        
        // Deactivate all templates
        List<QuotationTemplate> templates = repo.findAll();
        for (QuotationTemplate t : templates) {
            t.setActive(false);
        }
        repo.saveAll(templates);

        // Activate the target template
        target.setActive(true);
        return toMap(repo.save(target));
    }

    private void applyPayload(QuotationTemplate tpl, Map<String, Object> p) {
        if (p.containsKey("companyName"))       tpl.setCompanyName(str(p.get("companyName")));
        if (p.containsKey("companyTagline"))    tpl.setCompanyTagline(str(p.get("companyTagline")));
        if (p.containsKey("address"))           tpl.setAddress(str(p.get("address")));
        if (p.containsKey("phone1"))            tpl.setPhone1(str(p.get("phone1")));
        if (p.containsKey("phone2"))            tpl.setPhone2(str(p.get("phone2")));
        if (p.containsKey("workPhone"))         tpl.setWorkPhone(str(p.get("workPhone")));
        if (p.containsKey("email"))             tpl.setEmail(str(p.get("email")));
        if (p.containsKey("website"))           tpl.setWebsite(str(p.get("website")));
        if (p.containsKey("gstin"))             tpl.setGstin(str(p.get("gstin")));
        if (p.containsKey("stateCode"))         tpl.setStateCode(str(p.get("stateCode")));
        if (p.containsKey("stateName"))         tpl.setStateName(str(p.get("stateName")));
        if (p.containsKey("udyamNumber"))       tpl.setUdyamNumber(str(p.get("udyamNumber")));
        if (p.containsKey("logoBase64"))        tpl.setLogoBase64(str(p.get("logoBase64")));
        if (p.containsKey("signatureBase64"))   tpl.setSignatureBase64(str(p.get("signatureBase64")));
        if (p.containsKey("qrCodeBase64"))      tpl.setQrCodeBase64(str(p.get("qrCodeBase64")));
        if (p.containsKey("watermarkBase64"))   tpl.setWatermarkBase64(str(p.get("watermarkBase64")));
        if (p.containsKey("topImageBase64"))    tpl.setTopImageBase64(str(p.get("topImageBase64")));
        if (p.containsKey("bottomImageBase64")) tpl.setBottomImageBase64(str(p.get("bottomImageBase64")));
        if (p.containsKey("bankName"))          tpl.setBankName(str(p.get("bankName")));
        if (p.containsKey("accountNumber"))     tpl.setAccountNumber(str(p.get("accountNumber")));
        if (p.containsKey("ifscCode"))          tpl.setIfscCode(str(p.get("ifscCode")));
        if (p.containsKey("branch"))            tpl.setBranch(str(p.get("branch")));
        if (p.containsKey("validityDays"))      tpl.setValidityDays(toInt(p.get("validityDays"), 30));
        if (p.containsKey("preparedByDefault")) tpl.setPreparedByDefault(str(p.get("preparedByDefault")));
        if (p.containsKey("approvedByDefault")) tpl.setApprovedByDefault(str(p.get("approvedByDefault")));
        if (p.containsKey("policyText"))        tpl.setPolicyText(str(p.get("policyText")));
        if (p.containsKey("templateName"))      tpl.setTemplateName(str(p.get("templateName")));
        if (p.containsKey("templateVariant"))   tpl.setTemplateVariant(normalizeTemplateVariant(str(p.get("templateVariant"))));
        if (p.containsKey("active"))            tpl.setActive((Boolean) p.get("active"));
    }

    private Map<String, Object> toMap(QuotationTemplate t) {
        Map<String, Object> m = new HashMap<>();
        m.put("id",                 t.getId());
        m.put("companyName",        t.getCompanyName());
        m.put("companyTagline",     t.getCompanyTagline());
        m.put("address",            t.getAddress());
        m.put("phone1",             t.getPhone1());
        m.put("phone2",             t.getPhone2());
        m.put("workPhone",          t.getWorkPhone());
        m.put("email",              t.getEmail());
        m.put("website",            t.getWebsite());
        m.put("gstin",              t.getGstin());
        m.put("stateCode",          t.getStateCode());
        m.put("stateName",          t.getStateName());
        m.put("udyamNumber",        t.getUdyamNumber());
        m.put("logoBase64",         t.getLogoBase64());
        m.put("signatureBase64",    t.getSignatureBase64());
        m.put("qrCodeBase64",       t.getQrCodeBase64());
        m.put("watermarkBase64",    t.getWatermarkBase64());
        m.put("topImageBase64",     t.getTopImageBase64());
        m.put("bottomImageBase64",  t.getBottomImageBase64());
        m.put("bankName",           t.getBankName());
        m.put("accountNumber",      t.getAccountNumber());
        m.put("ifscCode",           t.getIfscCode());
        m.put("branch",             t.getBranch());
        m.put("validityDays",       t.getValidityDays() != null ? t.getValidityDays() : 30);
        m.put("preparedByDefault",  t.getPreparedByDefault());
        m.put("approvedByDefault",  t.getApprovedByDefault());
        m.put("policyText",         t.getPolicyText());
        m.put("templateName",       t.getTemplateName());
        m.put("templateVariant",    normalizeTemplateVariant(t.getTemplateVariant()));
        m.put("active",             t.getActive() != null ? t.getActive() : false);
        return m;
    }

    private String str(Object v) {
        return v == null ? null : v.toString();
    }

    private int toInt(Object v, int defaultVal) {
        if (v == null) return defaultVal;
        try { return Integer.parseInt(v.toString()); } catch (NumberFormatException e) { return defaultVal; }
    }

    private String normalizeTemplateVariant(String value) {
        return "premium".equalsIgnoreCase(value) ? "premium" : "standard";
    }
}
