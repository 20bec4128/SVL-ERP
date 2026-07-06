package com.nexorcrm.backend.service;

import com.nexorcrm.backend.entity.PayslipTemplate;
import com.nexorcrm.backend.repo.PayslipTemplateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
public class PayslipTemplateService {

    private final PayslipTemplateRepository repo;

    public PayslipTemplateService(PayslipTemplateRepository repo) {
        this.repo = repo;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> get() {
        return repo.findTopByOrderByIdAsc()
                .map(this::toMap)
                .orElseGet(HashMap::new);
    }

    @Transactional
    public Map<String, Object> save(Map<String, Object> payload) {
        PayslipTemplate tpl = repo.findTopByOrderByIdAsc().orElseGet(PayslipTemplate::new);
        applyPayload(tpl, payload);
        return toMap(repo.save(tpl));
    }

    private void applyPayload(PayslipTemplate tpl, Map<String, Object> p) {
        if (p.containsKey("companyName"))       tpl.setCompanyName(str(p.get("companyName")));
        if (p.containsKey("companyTagline"))    tpl.setCompanyTagline(str(p.get("companyTagline")));
        if (p.containsKey("address"))           tpl.setAddress(str(p.get("address")));
        if (p.containsKey("phone1"))            tpl.setPhone1(str(p.get("phone1")));
        if (p.containsKey("phone2"))            tpl.setPhone2(str(p.get("phone2")));
        if (p.containsKey("workPhone"))         tpl.setWorkPhone(str(p.get("workPhone")));
        if (p.containsKey("email"))             tpl.setEmail(str(p.get("email")));
        if (p.containsKey("website"))           tpl.setWebsite(str(p.get("website")));
        if (p.containsKey("gstin"))             tpl.setGstin(str(p.get("gstin")));
        if (p.containsKey("udyamNumber"))       tpl.setUdyamNumber(str(p.get("udyamNumber")));
        if (p.containsKey("logoBase64"))        tpl.setLogoBase64(str(p.get("logoBase64")));
        if (p.containsKey("topImageBase64"))    tpl.setTopImageBase64(str(p.get("topImageBase64")));
        if (p.containsKey("bottomImageBase64")) tpl.setBottomImageBase64(str(p.get("bottomImageBase64")));
        if (p.containsKey("signatureBase64"))   tpl.setSignatureBase64(str(p.get("signatureBase64")));
    }

    private Map<String, Object> toMap(PayslipTemplate t) {
        Map<String, Object> m = new HashMap<>();
        m.put("companyName",        t.getCompanyName());
        m.put("companyTagline",     t.getCompanyTagline());
        m.put("address",            t.getAddress());
        m.put("phone1",             t.getPhone1());
        m.put("phone2",             t.getPhone2());
        m.put("workPhone",          t.getWorkPhone());
        m.put("email",              t.getEmail());
        m.put("website",            t.getWebsite());
        m.put("gstin",              t.getGstin());
        m.put("udyamNumber",        t.getUdyamNumber());
        m.put("logoBase64",         t.getLogoBase64());
        m.put("topImageBase64",     t.getTopImageBase64());
        m.put("bottomImageBase64",  t.getBottomImageBase64());
        m.put("signatureBase64",    t.getSignatureBase64());
        return m;
    }

    private String str(Object v) {
        return v == null ? null : v.toString();
    }
}
