ALTER TABLE quotation_template
ADD COLUMN IF NOT EXISTS template_variant VARCHAR(30);

UPDATE quotation_template
SET template_variant = 'standard'
WHERE template_variant IS NULL;

INSERT INTO quotation_template (
    company_name,
    company_tagline,
    address,
    phone1,
    phone2,
    work_phone,
    email,
    website,
    gstin,
    state_code,
    state_name,
    udyam_number,
    logo_base64,
    signature_base64,
    qr_code_base64,
    watermark_base64,
    top_image_base64,
    bottom_image_base64,
    bank_name,
    account_number,
    ifsc_code,
    branch,
    validity_days,
    prepared_by_default,
    approved_by_default,
    policy_text,
    template_name,
    template_variant,
    active,
    created_at,
    updated_at
)
SELECT
    src.company_name,
    src.company_tagline,
    src.address,
    src.phone1,
    src.phone2,
    src.work_phone,
    src.email,
    src.website,
    src.gstin,
    src.state_code,
    src.state_name,
    src.udyam_number,
    src.logo_base64,
    src.signature_base64,
    src.qr_code_base64,
    src.watermark_base64,
    src.top_image_base64,
    src.bottom_image_base64,
    src.bank_name,
    src.account_number,
    src.ifsc_code,
    src.branch,
    src.validity_days,
    src.prepared_by_default,
    src.approved_by_default,
    src.policy_text,
    'Premium Template',
    'premium',
    FALSE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (
    SELECT *
    FROM quotation_template
    ORDER BY id
    LIMIT 1
) src
WHERE NOT EXISTS (
    SELECT 1
    FROM quotation_template existing
    WHERE LOWER(COALESCE(existing.template_variant, '')) = 'premium'
);
