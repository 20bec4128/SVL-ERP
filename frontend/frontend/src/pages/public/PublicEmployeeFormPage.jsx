import React, { useEffect, useMemo, useState } from "react";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useParams } from "react-router-dom";
import { getPublicEmployeeForm, submitPublicEmployeeForm } from "../../api/employeesApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import { defaultCountryOption, getCountryDisplayMaxLength, sanitizePhoneDigits } from "../../utils/phoneUtils";
import {
  EDUCATION_QUALIFICATION_OPTIONS,
  EDUCATION_UPLOAD_DOC_TYPES,
  calculateEducationPercentage,
  getPublicEducationUploadDocTypes,
  getEducationVisibilityRules,
  normalizePositiveNumericInput,
} from "../../utils/educationUploads";

function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === "";
}


function sanitizeYearDigits(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, 4);
}

function normalizeEducationValues(form) {
  const next = { ...form };
  next.EDUCATION_MARK = normalizePositiveNumericInput(next.EDUCATION_MARK);
  next.EDUCATION_MAX_MARK = normalizePositiveNumericInput(next.EDUCATION_MAX_MARK);
  const computedPercentage = calculateEducationPercentage(next.EDUCATION_MARK, next.EDUCATION_MAX_MARK);
  if (computedPercentage || next.EDUCATION_MARK_PERCENTAGE) {
    next.EDUCATION_MARK_PERCENTAGE =
      computedPercentage || normalizePositiveNumericInput(next.EDUCATION_MARK_PERCENTAGE) || "";
  }
  return next;
}

const EDUCATION_FIELDS_TO_CLEAR = [
  "EDUCATION_COURSE_NAME",
  "EDUCATION_CERTIFICATE_NUMBER",
  "EDUCATION_ROLL_NUMBER",
  "EDUCATION_MARK",
  "EDUCATION_MAX_MARK",
  "EDUCATION_MARK_PERCENTAGE",
  "EDUCATION_FROM_YEAR",
  "EDUCATION_TO_YEAR",
];

const PUBLIC_FORM_SECTION_CONFIGS = [
  {
    key: "personal",
    title: "Personal Details",
    fieldKeys: [
      "NAME",
      "DEPT",
      "FATHER_NAME",
      "MOTHER_NAME",
      "ALTERNATE_CONTACT_NUMBER",
      "PERSONAL_EMAIL",
      "OFFICIAL_EMAIL",
      "DATE_OF_BIRTH",
      "GENDER",
      "MARITAL_STATUS",
      "SPOUSE_NAME",
      "BLOOD_GROUP",
    ],
    uploadDocTypes: ["CANDIDATE_PHOTO"],
    uploadAfterFieldKey: "DATE_OF_BIRTH",
  },
  {
    key: "address",
    title: "Address Details",
    fieldKeys: ["LOCATION", "PIN_CODE", "STATE", "CURRENT_ADDRESS", "PERMANENT_ADDRESS", "PAN_NUMBER", "AADHAAR_NUMBER"],
    uploadDocTypes: ["AADHAAR_CARD", "PAN_CARD", "COMMUNITY_CERTIFICATE"],
    uploadAfterFieldKey: "PERMANENT_ADDRESS",
  },
  {
    key: "education",
    title: "Education Details",
    fieldKeys: [
      "EDUCATION_QUALIFICATION",
      "EDUCATION_COURSE_NAME",
      "EDUCATION_CERTIFICATE_NUMBER",
      "EDUCATION_ROLL_NUMBER",
      "EDUCATION_MARK",
      "EDUCATION_MAX_MARK",
      "EDUCATION_MARK_PERCENTAGE",
      "EDUCATION_FROM_YEAR",
      "EDUCATION_TO_YEAR",
    ],
    uploadDocTypes: [
      "CERTIFICATE",
      "GRADUATION_CERTIFICATE",
      "GRADUATION_MARKSHEET",
      "HSC_MARKSHEET",
      "SSLC_MARKSHEET",
    ],
    uploadAfterFieldKey: "EDUCATION_TO_YEAR",
  },
  {
    key: "bank",
    title: "Bank Details",
    fieldKeys: ["BANK_ACCOUNT_HOLDER_NAME", "BANK_ACCOUNT_NUMBER", "BANK_IFSC", "BANK_NAME_BRANCH"],
    uploadDocTypes: ["BANK_PASSBOOK"],
    uploadAfterFieldKey: "BANK_NAME_BRANCH",
  },
  {
    key: "previousEmployment",
    title: "Previous Employment",
    fieldKeys: [
      "PLATFORM_SOURCE",
      "PREVIOUS_EMPLOYMENT_JOINING_DATE",
      "PREVIOUS_EMPLOYMENT_RELIEVING_DATE",
      "PREVIOUS_EMPLOYMENT_SALARY_AT_JOINING",
      "PREVIOUS_EMPLOYMENT_SALARY_AT_RELIEVING",
      "PREVIOUS_EMPLOYMENT_RELIEVED_WITH_NOTICE_PERIOD",
      "PREVIOUS_EMPLOYMENT_ABSCONDED",
      "PREVIOUS_EMPLOYMENT_DESIGNATION_AT_JOINING",
      "PREVIOUS_EMPLOYMENT_DESIGNATION_AT_RELIEVING",
      "PREVIOUS_EMPLOYMENT_MANAGER_NAME",
      "PREVIOUS_EMPLOYMENT_MANAGER_MOBILE_NUMBER",
      "PREVIOUS_EMPLOYMENT_COMPANY_ADDRESS",
    ],
    uploadDocTypes: ["RESUME", "EXPERIENCE_CERTIFICATE"],
    uploadAfterFieldKey: "PREVIOUS_EMPLOYMENT_COMPANY_ADDRESS",
  },
  {
    key: "emergencyContacts",
    title: "Emergency Contacts",
    fieldKeys: [
      "EMERGENCY_CONTACT_NAME_1",
      "EMERGENCY_CONTACT_RELATION_1",
      "EMERGENCY_CONTACT_PHONE_1",
      "EMERGENCY_CONTACT_NAME_2",
      "EMERGENCY_CONTACT_RELATION_2",
      "EMERGENCY_CONTACT_PHONE_2",
    ],
    uploadDocTypes: [],
  },
  {
    key: "friendReferences",
    title: "Friend References",
    fieldKeys: ["FRIEND_REF_NAME_1", "FRIEND_REF_CONTACT_1", "FRIEND_REF_NAME_2", "FRIEND_REF_CONTACT_2"],
    uploadDocTypes: [],
  },
  {
    key: "pfEsiDetails",
    title: "PF / ESI Details",
    fieldKeys: ["PF_UAN", "ESI_NO"],
    uploadDocTypes: [],
  },
  {
    key: "declarationDetails",
    title: "Declaration Details",
    fieldKeys: ["DECLARATION_DATE", "DECLARATION_PLACE"],
    uploadDocTypes: [],
  },
];

export default function PublicEmployeeFormPage() {
  const { token } = useParams();
  const { showSuccess, showError } = useToast();
  const submissionKey = token ? `public-employee-form-submitted:${token}` : null;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);
  const [form, setForm] = useState({});
  const [initialForm, setInitialForm] = useState({});
  const [files, setFiles] = useState({}); // { DOC_TYPE: File | File[] }
  const [experienceCertificateAvailable, setExperienceCertificateAvailable] = useState("NO");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getPublicEmployeeForm(token);
        let cachedSubmission = null;
        if (submissionKey) {
          const cachedRaw = window.sessionStorage.getItem(submissionKey);
          if (cachedRaw) {
            try {
              cachedSubmission = JSON.parse(cachedRaw);
            } catch {
              cachedSubmission = { submitted: true };
            }
          }
        }
        setData({
          ...res,
          submitted: Boolean(res?.submitted || cachedSubmission?.submitted),
          profileStatus: res?.profileStatus || cachedSubmission?.profileStatus || null,
        });
        const initial = {};
        (res?.fields || []).forEach((f) => {
          initial[f.fieldKey] = f.currentValue || "";
        });
        // COUNTRY_CODE is submitted for PHONE-type fields, but we don't want a separate country-code UI.
        // Default it if missing so backend validation stays stable.
        if (!initial.COUNTRY_CODE) {
          initial.COUNTRY_CODE = defaultCountryOption.value;
        }
        const normalized = normalizeEducationValues(initial);
        setForm(normalized);
        setInitialForm(initial);
        const experienceUpload = (res?.uploads || []).find((upload) => upload?.docType === "EXPERIENCE_CERTIFICATE");
        const experienceStatus = String(experienceUpload?.status || "").toUpperCase();
        setExperienceCertificateAvailable(["PENDING", "REJECTED"].includes(experienceStatus) ? "YES" : "NO");
      } catch (e) {
        showError(extractApiErrorMessage(e, "Invalid or expired link"));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token, showError, submissionKey]);

  const fieldList = useMemo(() => (data?.fields || []), [data]);
  const uploadList = useMemo(() => (data?.uploads || []), [data]);

  const editableFieldList = useMemo(
    () =>
      fieldList.filter((f) => {
        const status = String(f?.status || "").toUpperCase();
        // In update links, approved fields should not appear again.
        if (status === "APPROVED") return false;
        // Respect backend "editable" hint.
        return f?.editable !== false;
      }),
    [fieldList],
  );

  const editableUploadList = useMemo(
    () =>
      uploadList.filter((u) => {
        const status = String(u?.status || "").toUpperCase();
        if (status === "APPROVED") return false;
        return u?.editable !== false;
      }),
    [uploadList],
  );

  const hiddenScalarKeys = useMemo(
    () =>
      new Set([
        "HEAD_OFFICE_ID",
        "BRANCH_ID",
        "DEPARTMENT_MASTER_ID",
        "DESIGNATION_MASTER_ID",
        "INSTITUTION",
        "DEPARTMENT_NAME",
        "TEAM",
        "DESIGNATION",
        "STATUS",
        "COUNTRY_CODE",
        "PHONE",
      ]),
    [],
  );

  const dropdownKeys = useMemo(
    () =>
      new Set([
        "GENDER",
        "MARITAL_STATUS",
        "BLOOD_GROUP",
        "EDUCATION_QUALIFICATION",
        "PLATFORM_SOURCE",
      ]),
    [],
  );

  const yesNoFieldKeys = useMemo(
    () =>
      new Set([
        "PREVIOUS_EMPLOYMENT_RELIEVED_WITH_NOTICE_PERIOD",
        "PREVIOUS_EMPLOYMENT_ABSCONDED",
      ]),
    [],
  );

  const groupedMobileKeys = useMemo(() => new Set(["COUNTRY_CODE", "PHONE"]), []);

  const uploadByDocType = useMemo(
    () => new Map(editableUploadList.map((upload) => [upload.docType, upload])),
    [editableUploadList],
  );

  const handleDateChange = (fieldKey, value) => {
    setForm((prev) => {
      if (!value) {
        return { ...prev, [fieldKey]: "" };
      }

      const [year] = String(value).split("-");
      if (!year || year.length !== 4 || !/^\d{4}$/.test(year)) {
        return prev;
      }

      return { ...prev, [fieldKey]: value };
    });
  };

  const handleEducationFieldChange = (fieldKey, value) => {
    const normalizedValue =
      fieldKey === "EDUCATION_MARK" || fieldKey === "EDUCATION_MAX_MARK"
        ? normalizePositiveNumericInput(value)
        : value;
    setForm((prev) => {
      const next = { ...prev, [fieldKey]: normalizedValue };
      if (fieldKey === "EDUCATION_MARK" || fieldKey === "EDUCATION_MAX_MARK") {
        next.EDUCATION_MARK_PERCENTAGE = calculateEducationPercentage(
          fieldKey === "EDUCATION_MARK" ? normalizedValue : next.EDUCATION_MARK,
          fieldKey === "EDUCATION_MAX_MARK" ? normalizedValue : next.EDUCATION_MAX_MARK,
        );
      }
      if (fieldKey === "EDUCATION_QUALIFICATION") {
        const visibility = getEducationVisibilityRules(value);
        if (!value || visibility.isBasicQualification) {
          EDUCATION_FIELDS_TO_CLEAR.forEach((key) => {
            next[key] = "";
          });
        } else if (!visibility.showCourseName) {
          next.EDUCATION_COURSE_NAME = "";
        }
      }
      return next;
    });

    if (fieldKey === "EDUCATION_QUALIFICATION") {
      const visibility = getEducationVisibilityRules(value);
      const allowedDocTypes = new Set(
        visibility.showUploads ? getPublicEducationUploadDocTypes(value) : [],
      );
      setFiles((prev) => {
        const next = { ...prev };
        if (!visibility.showUploads) {
          EDUCATION_UPLOAD_DOC_TYPES.forEach((docType) => {
            delete next[docType];
          });
          return next;
        }
        EDUCATION_UPLOAD_DOC_TYPES.forEach((docType) => {
          if (!allowedDocTypes.has(docType)) {
            delete next[docType];
          }
        });
        return next;
      });
    }
  };

  const renderUploadField = (upload) => {
    if (!upload) return null;
    const rejected = String(upload.status || "").toUpperCase() === "REJECTED";
    return (
      <div key={upload.docType} className="mb-3">
        <label className="form-label">
          {upload.label || upload.docType} {rejected ? <span className="text-danger">*</span> : null}
        </label>
        {rejected && upload.remarks ? (
          <div className="text-danger small mb-1">Remark: {upload.remarks}</div>
        ) : null}
        <input
          type="file"
          multiple={upload.docType === "CERTIFICATE"}
          className="form-control"
          accept={upload.docType === "CANDIDATE_PHOTO" ? "image/*" : undefined}
          onChange={(e) => {
            const selected = Array.from(e.target.files || []);
            setFiles((p) => ({
              ...p,
              [upload.docType]: upload.docType === "CERTIFICATE" ? selected : (selected[0] || null),
            }));
          }}
        />
      </div>
    );
  };

  const isEducationUploadAllowed = (docType) => {
    if (!EDUCATION_UPLOAD_DOC_TYPES.includes(docType)) {
      return true;
    }
    const visibility = getEducationVisibilityRules(form.EDUCATION_QUALIFICATION);
    if (!visibility.showUploads) {
      return false;
    }
    return getPublicEducationUploadDocTypes(form.EDUCATION_QUALIFICATION).includes(docType);
  };

  const handleExperienceCertificateAvailableChange = (value) => {
    setExperienceCertificateAvailable(value);
    if (value !== "YES") {
      setFiles((prev) => {
        const next = { ...prev };
        delete next.EXPERIENCE_CERTIFICATE;
        return next;
      });
    }
  };

  const renderExperienceCertificateToggle = () => (
    <div className="mb-3">
      <label className="form-check d-flex gap-2 align-items-center mb-0">
        <input
          type="checkbox"
          className="form-check-input"
          checked={experienceCertificateAvailable === "YES"}
          onChange={(e) => handleExperienceCertificateAvailableChange(e.target.checked ? "YES" : "NO")}
        />
        <span className="form-check-label">Experience Certificate available?</span>
      </label>
    </div>
  );

  const renderExperienceCertificateUpload = () => {
    if (experienceCertificateAvailable !== "YES") {
      return null;
    }

    return (
      <div className="col-md-6">
        <label className="form-label">Experience Certificate</label>
        <input
          type="file"
          className="form-control"
          onChange={(e) => setFiles((p) => ({ ...p, EXPERIENCE_CERTIFICATE: e.target.files?.[0] || null }))}
        />
      </div>
    );
  };

  const renderFieldControl = (f) => {
    if (!f) return null;
    if (f.fieldKey === "SPOUSE_NAME" && String(form.MARITAL_STATUS || "").toUpperCase() !== "MARRIED") {
      return null;
    }

    const rejected = String(f.status || "").toUpperCase() === "REJECTED";
    const inputType = String(f.inputType || "TEXT").toUpperCase();
    const editable = f.editable !== false;
    const lockedDepartment = f.fieldKey === "DEPT";
    const isDropdown = dropdownKeys.has(f.fieldKey);
    const isYesNoSelect = yesNoFieldKeys.has(f.fieldKey);
    const isStandalonePhone = f.fieldKey === "PREVIOUS_EMPLOYMENT_MANAGER_MOBILE_NUMBER";
    const isEducationYear = f.fieldKey === "EDUCATION_FROM_YEAR" || f.fieldKey === "EDUCATION_TO_YEAR";
    const isEducationMark = f.fieldKey === "EDUCATION_MARK" || f.fieldKey === "EDUCATION_MAX_MARK";
    const isEducationPercentage = f.fieldKey === "EDUCATION_MARK_PERCENTAGE";
    const isEducationQualification = f.fieldKey === "EDUCATION_QUALIFICATION";

    return (
      <div key={f.fieldKey} className="mb-3">
        <label className="form-label">
          {f.label || f.fieldKey} {rejected ? <span className="text-danger">*</span> : null}
        </label>
        {rejected && f.remarks ? <div className="text-danger small mb-1">Remark: {f.remarks}</div> : null}
        {isEducationQualification ? (
          <select
            className="form-select"
            value={form[f.fieldKey] || ""}
            onChange={(e) => handleEducationFieldChange(f.fieldKey, e.target.value)}
            disabled={!editable || lockedDepartment}
          >
            <option value="">Select Qualification</option>
            {EDUCATION_QUALIFICATION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : isEducationMark ? (
          <input
            type="number"
            step="any"
            min={0}
            className="form-control"
            value={form[f.fieldKey] || ""}
            onChange={(e) => handleEducationFieldChange(f.fieldKey, e.target.value)}
            disabled={!editable || lockedDepartment}
          />
        ) : isEducationPercentage ? (
          <input
            type="text"
            className="form-control"
            value={form[f.fieldKey] || ""}
            readOnly
            tabIndex={-1}
          />
        ) : isEducationYear ? (
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            className="form-control"
            value={form[f.fieldKey] || ""}
            onChange={(e) => handleEducationFieldChange(f.fieldKey, sanitizeYearDigits(e.target.value))}
            disabled={!editable || lockedDepartment}
          />
        ) : isDropdown || isYesNoSelect ? (
          <select
            className="form-select"
            value={form[f.fieldKey] || ""}
            onChange={(e) => setForm((p) => ({ ...p, [f.fieldKey]: e.target.value }))}
            disabled={!editable || lockedDepartment}
          >
            <option value="">Select</option>
            {f.fieldKey === "GENDER" ? (
              <>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </>
            ) : null}
            {f.fieldKey === "MARITAL_STATUS" ? (
              <>
                <option value="SINGLE">Single</option>
                <option value="MARRIED">Married</option>
                <option value="DIVORCED">Divorced</option>
                <option value="WIDOWED">Widowed</option>
              </>
            ) : null}
            {f.fieldKey === "BLOOD_GROUP" ? (
              <>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </>
            ) : null}
            {f.fieldKey === "PLATFORM_SOURCE" ? (
              <>
                <option value="REFERRAL">Referral</option>
                <option value="WALK_IN">Walk-in</option>
                <option value="ONLINE">Online</option>
                <option value="JOB_PORTAL">Job Portal</option>
                <option value="OTHER">Other</option>
              </>
            ) : null}
            {isYesNoSelect ? (
              <>
                <option value="YES">Yes</option>
                <option value="NO">No</option>
              </>
            ) : null}
          </select>
        ) : inputType === "TEXTAREA" ? (
          <textarea
            className="form-control"
            rows={3}
            value={form[f.fieldKey] || ""}
            onChange={(e) => setForm((p) => ({ ...p, [f.fieldKey]: e.target.value }))}
            disabled={!editable || lockedDepartment}
          />
        ) : inputType === "DATE" ? (
          <input
            type="date"
            className="form-control"
            value={form[f.fieldKey] || ""}
            max="9999-12-31"
            onChange={(e) => handleDateChange(f.fieldKey, e.target.value)}
            disabled={!editable || lockedDepartment}
          />
        ) : inputType === "EMAIL" ? (
          <input
            type="email"
            className="form-control"
            value={form[f.fieldKey] || ""}
            onChange={(e) => setForm((p) => ({ ...p, [f.fieldKey]: e.target.value }))}
            disabled={!editable || lockedDepartment}
          />
        ) : inputType === "NUMBER" ? (
          <input
            type="number"
            className="form-control"
            value={form[f.fieldKey] || ""}
            onChange={(e) => setForm((p) => ({ ...p, [f.fieldKey]: e.target.value }))}
            disabled={!editable || lockedDepartment}
          />
        ) : isStandalonePhone ? (
          <input
            type="tel"
            className="form-control"
            maxLength={15}
            value={form[f.fieldKey] || ""}
            onChange={(e) => {
              const sanitized = sanitizePhoneDigits(e.target.value, 15);
              setForm((p) => ({ ...p, [f.fieldKey]: sanitized }));
            }}
            disabled={!editable || lockedDepartment}
          />
        ) : inputType === "PHONE" ? (
          <input
            type="tel"
            className="form-control"
            maxLength={getCountryDisplayMaxLength(form.COUNTRY_CODE || defaultCountryOption.value) || 15}
            value={form[f.fieldKey] || ""}
            onChange={(e) => {
              const sanitized = sanitizePhoneDigits(
                e.target.value,
                getCountryDisplayMaxLength(form.COUNTRY_CODE || defaultCountryOption.value),
              );
              setForm((p) => ({ ...p, [f.fieldKey]: sanitized }));
            }}
            disabled={!editable || lockedDepartment}
            placeholder={`Enter ${getCountryDisplayMaxLength(form.COUNTRY_CODE || defaultCountryOption.value)} digit number`}
          />
        ) : (
          <input
            type="text"
            className="form-control"
            value={form[f.fieldKey] || ""}
            onChange={(e) => setForm((p) => ({ ...p, [f.fieldKey]: e.target.value }))}
            disabled={!editable || lockedDepartment}
            placeholder={lockedDepartment ? "Assigned by HR" : undefined}
          />
        )}
      </div>
    );
  };

  const renderSection = (section) => {
    const sectionFields = editableFieldList.filter(
      (field) => section.fieldKeys.includes(field.fieldKey) && !hiddenScalarKeys.has(field.fieldKey),
    ).sort((a, b) => section.fieldKeys.indexOf(a.fieldKey) - section.fieldKeys.indexOf(b.fieldKey));
    const sectionUploads = (section.uploadDocTypes || [])
      .map((docType) => uploadByDocType.get(docType))
      .filter(Boolean);
    const visibleSectionUploads =
      section.key === "education"
        ? sectionUploads.filter((upload) => isEducationUploadAllowed(upload.docType))
        : section.key === "previousEmployment"
          ? sectionUploads.filter((upload) => upload.docType !== "EXPERIENCE_CERTIFICATE")
        : sectionUploads;

    if (sectionFields.length === 0 && visibleSectionUploads.length === 0) {
      return null;
    }

    const uploadAnchor = section.uploadAfterFieldKey || null;
    let uploadsInserted = false;

    return (
      <section key={section.key} className="mb-4">
        <h5 className="mb-3">{section.title}</h5>
        {section.key === "education" ? (
          <>
            {sectionFields
              .filter((field) => field.fieldKey === "EDUCATION_QUALIFICATION")
              .map((field) => renderFieldControl(field))}
            {getEducationVisibilityRules(form.EDUCATION_QUALIFICATION).showAdditionalFields ? (
              <div className="row g-3">
                {sectionFields
                  .filter((field) => field.fieldKey !== "EDUCATION_QUALIFICATION")
                  .filter((field) =>
                    field.fieldKey !== "EDUCATION_COURSE_NAME" ||
                    getEducationVisibilityRules(form.EDUCATION_QUALIFICATION).showCourseName,
                  )
                  .map((field) => (
                    <div key={field.fieldKey} className="col-md-4">
                      {renderFieldControl(field)}
                    </div>
                  ))}
              </div>
            ) : null}
          </>
        ) : (
          sectionFields.map((field) => {
            const node = renderFieldControl(field);
            const isPreviousEmploymentAddress =
              section.key === "previousEmployment" && field.fieldKey === "PREVIOUS_EMPLOYMENT_COMPANY_ADDRESS";
            const shouldInsertUploads =
              !uploadsInserted && uploadAnchor && field.fieldKey === uploadAnchor && visibleSectionUploads.length > 0;
            return (
              <React.Fragment key={field.fieldKey}>
                {node}
                {isPreviousEmploymentAddress ? (
                  <div className="row g-3 mt-1">
                    <div className="col-md-6">{renderExperienceCertificateToggle()}</div>
                    {renderExperienceCertificateUpload()}
                  </div>
                ) : null}
                {shouldInsertUploads && (() => {
                  uploadsInserted = true;
                  return visibleSectionUploads.map(renderUploadField);
                })()}
              </React.Fragment>
            );
          })
        )}
        {!uploadsInserted &&
          visibleSectionUploads.map((upload) => {
            uploadsInserted = true;
            return renderUploadField(upload);
          })}
      </section>
    );
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      const normalizedForm = normalizeEducationValues(form);
      editableFieldList.forEach((f) => {
        const fieldKey = f.fieldKey;
        const val = normalizedForm[fieldKey];
        const initial = initialForm[fieldKey];
        const changed = String(val || "") !== String(initial || "");
        const alwaysSubmit = fieldKey === "DEPT";
        if (!isBlank(val) && (alwaysSubmit || changed || groupedMobileKeys.has(fieldKey))) {
          fd.append(`field_${fieldKey}`, val);
        }
      });

      editableUploadList.forEach((u) => {
        const docType = u.docType;
        if (EDUCATION_UPLOAD_DOC_TYPES.includes(docType) && !isEducationUploadAllowed(docType)) {
          return;
        }
        if (docType === "EXPERIENCE_CERTIFICATE" && experienceCertificateAvailable !== "YES") {
          return;
        }
        const v = files[docType];
        if (!v) return;
        if (Array.isArray(v)) {
          v.forEach((file) => fd.append(`doc_${docType}`, file));
        } else {
          fd.append(`doc_${docType}`, v);
        }
      });

      const res = await submitPublicEmployeeForm(token, fd);
      showSuccess("Submitted for verification");
      if (submissionKey) {
        window.sessionStorage.setItem(
          submissionKey,
          JSON.stringify({
            submitted: true,
            profileStatus: res?.profileStatus || "PENDING_VERIFICATION",
          }),
        );
      }
      setData((prev) =>
        prev
          ? {
              ...prev,
              submitted: true,
              profileStatus: res?.profileStatus || prev.profileStatus || "PENDING_VERIFICATION",
            }
          : prev,
      );
    } catch (e2) {
      showError(extractApiErrorMessage(e2, "Failed to submit"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="container py-5">
        <div className="card">
          <div className="card-body d-flex justify-content-center py-5">
            <LoadingSpinner size="page" label="Loading form" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container py-5">
        <div className="card">
          <div className="card-body text-danger">Invalid or expired link.</div>
        </div>
      </div>
    );
  }

  const noFields = (data.fields || []).length === 0 && (data.uploads || []).length === 0;
  const noEditableFields = editableFieldList.length === 0 && editableUploadList.length === 0;
  const isSubmitted = Boolean(data?.submitted);

  if (isSubmitted) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header">
                <h4 className="mb-0">Complete Your Profile</h4>
                <div className="text-muted small">
                  {data.name || "Employee"} Â· {data.emailMasked || ""} {data.phoneMasked ? `Â· ${data.phoneMasked}` : ""}
                </div>
              </div>
              <div className="card-body">
                <div className="text-center py-4">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10 text-success mb-3"
                    style={{ width: 64, height: 64 }}
                  >
                    <i className="ti ti-circle-check" style={{ fontSize: 32 }} />
                  </div>
                  <h5 className="mb-2">Profile submitted successfully</h5>
                  <div className="text-muted mb-3">Your details have been sent for verification.</div>
                  <div className="alert alert-success d-inline-flex align-items-center gap-2 mb-0">
                    <span className="fw-semibold">Status:</span>
                    <span>{String(data.profileStatus || "PENDING_VERIFICATION").replaceAll("_", " ")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <h4 className="mb-0">Complete Your Profile</h4>
              <div className="text-muted small">
                {data.name || "Employee"} · {data.emailMasked || ""} {data.phoneMasked ? `· ${data.phoneMasked}` : ""}
              </div>
            </div>
            <div className="card-body">
              {noFields || noEditableFields ? (
                <div className="alert alert-success mb-0">No fields required at this time.</div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {PUBLIC_FORM_SECTION_CONFIGS.map(renderSection)}

                  <button className="btn btn-primary" type="submit" disabled={saving}>
                    {saving ? "Submitting..." : "Submit"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
