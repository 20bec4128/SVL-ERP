export const EDUCATION_QUALIFICATION_OPTIONS = [
  "Below 8th",
  "8th Pass",
  "SSLC",
  "HSC",
  "Diploma",
  "UG",
  "PG",
  "ITI",
];

const BASIC_QUALIFICATIONS = new Set(["Below 8th", "8th Pass"]);
const COURSE_NAME_HIDDEN_QUALIFICATIONS = new Set(["SSLC"]);

const EDUCATION_UPLOAD_RULES = {
  "Below 8th": [],
  "8th Pass": [],
  SSLC: ["SSLC_MARKSHEET"],
  HSC: ["SSLC_MARKSHEET", "HSC_MARKSHEET"],
  Diploma: ["SSLC_MARKSHEET", "CERTIFICATE"],
  ITI: ["SSLC_MARKSHEET", "CERTIFICATE"],
  UG: ["CERTIFICATE", "GRADUATION_CERTIFICATE", "GRADUATION_MARKSHEET", "HSC_MARKSHEET", "SSLC_MARKSHEET"],
  PG: ["CERTIFICATE", "GRADUATION_CERTIFICATE", "GRADUATION_MARKSHEET", "HSC_MARKSHEET", "SSLC_MARKSHEET"],
};

const EDUCATION_UPLOAD_DESCRIPTORS = {
  CERTIFICATE: {
    docType: "CERTIFICATE",
    label: "Certificate",
    stateKey: "uploadCertificate",
    pathKey: "certificatePath",
  },
  GRADUATION_CERTIFICATE: {
    docType: "GRADUATION_CERTIFICATE",
    label: "Graduation Certificate",
    stateKey: "uploadGraduationCertificate",
    pathKey: "graduationCertificatePath",
  },
  GRADUATION_MARKSHEET: {
    docType: "GRADUATION_MARKSHEET",
    label: "Graduation Marksheet",
    stateKey: "uploadGraduationMarksheet",
    pathKey: "graduationMarksheetPath",
  },
  HSC_MARKSHEET: {
    docType: "HSC_MARKSHEET",
    label: "HSC Marksheet",
    stateKey: "uploadHscMarkSheet",
    pathKey: "hscMarksheetPath",
  },
  SSLC_MARKSHEET: {
    docType: "SSLC_MARKSHEET",
    label: "SSLC Marksheet",
    stateKey: "uploadSslcMarkSheet",
    pathKey: "sslcMarksheetPath",
  },
};

export const EDUCATION_UPLOAD_DOC_TYPES = Object.freeze(
  Object.keys(EDUCATION_UPLOAD_DESCRIPTORS),
);

function normalizeQualification(qualification) {
  return String(qualification || "").trim();
}

export function normalizePositiveNumericInput(value) {
  if (value === null || value === undefined) return "";
  const normalized = String(value).trim();
  if (!normalized) return "";
  return normalized.replace(/^[+-]+/, "");
}

export function calculateEducationPercentage(mark, maxMark) {
  const normalizedMark = normalizePositiveNumericInput(mark);
  const normalizedMaxMark = normalizePositiveNumericInput(maxMark);
  if (!normalizedMark || !normalizedMaxMark) return "";
  const markValue = Number(normalizedMark);
  const maxValue = Number(normalizedMaxMark);
  if (!Number.isFinite(markValue) || !Number.isFinite(maxValue) || maxValue <= 0) return "";
  return ((Math.abs(markValue) / Math.abs(maxValue)) * 100).toFixed(2);
}

export function getEducationVisibilityRules(qualification) {
  const normalizedQualification = normalizeQualification(qualification);
  const isBasicQualification = BASIC_QUALIFICATIONS.has(normalizedQualification);
  const isSslcQualification = COURSE_NAME_HIDDEN_QUALIFICATIONS.has(normalizedQualification);
  const hasQualification = Boolean(normalizedQualification);

  return {
    qualification: normalizedQualification,
    isBasicQualification,
    isSslcQualification,
    showAdditionalFields: hasQualification && !isBasicQualification,
    showCourseName: hasQualification && !isBasicQualification && !isSslcQualification,
    showUploads: hasQualification && !isBasicQualification,
  };
}

export function getEducationUploadDocTypes(qualification) {
  return [...(EDUCATION_UPLOAD_RULES[normalizeQualification(qualification)] || [])];
}

export function getPublicEducationUploadDocTypes(qualification) {
  return getEducationUploadDocTypes(qualification);
}

export function getAdminEducationUploadDescriptors(qualification) {
  return getEducationUploadDocTypes(qualification)
    .map((docType) => EDUCATION_UPLOAD_DESCRIPTORS[docType])
    .filter(Boolean);
}
