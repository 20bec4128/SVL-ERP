import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getBranches } from "../../api/branchesApi";
import { getDepartmentsMasterByBranch } from "../../api/departmentsApi";
import { getDesignations } from "../../api/designationsApi";
import { getEmployeeById, onboardEmployee, updateOnboardEmployee } from "../../api/employeesApi";
import { getHeadOffices } from "../../api/headOfficesApi";
import { getLeavePolicies } from "../../api/leaveSettingsApi";
import { getAdditions, getDeductions } from "../../api/payrollItemsApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import {
  COUNTRY_CODE_OPTIONS,
  defaultCountryOption,
  getCountryDisplayMaxLength,
  sanitizePhoneDigits,
  validatePhoneNumber,
} from "../../utils/phoneUtils";
import {
  EDUCATION_QUALIFICATION_OPTIONS,
  calculateEducationPercentage,
  getAdminEducationUploadDescriptors,
  getEducationVisibilityRules,
  normalizePositiveNumericInput,
} from "../../utils/educationUploads";
import "../../../public/assets/css/addModalShared.css";
import "./EmployeesPage.css";

const YES_NO_OPTIONS = [
  { value: "YES", label: "Yes" },
  { value: "NO", label: "No" },
];

const EMPTY_FORM = {
  nameInCaps: "",
  personalContactNumber: "",
  countryCode: defaultCountryOption.value,
  personalEmail: "",
  officialEmail: "",
  dateOfBirth: "",
  fatherName: "",
  motherName: "",
  alternateContactNumber: "",
  location: "",
  pinCode: "",
  state: "",
  currentAddress: "",
  permanentAddress: "",
  maritalStatus: "",
  spouseName: "",
  bloodGroup: "",
  educationQualification: "",
  educationCourseName: "",
  educationCertificateNumber: "",
  educationRollNumber: "",
  educationMark: "",
  educationMaxMark: "",
  educationMarkPercentage: "",
  educationFromYear: "",
  educationToYear: "",
  graduationDetails: "",
  hscMarkAndYear: "",
  sslcMarkAndYear: "",
  uploadCertificate: null,
  candidatePhoto: null,
  uploadCandidateAadharCard: null,
  uploadCandidatePanCard: null,
  uploadBankPassBookCopy: null,
  uploadExperienceCertificate: null,
  uploadGraduationCertificate: null,
  uploadGraduationMarksheet: null,
  uploadHscMarkSheet: null,
  uploadSslcMarkSheet: null,
  uploadCommunityCertificate: null,
  experienceCertificateAvailable: "NO",
  bankAccountHolderName: "",
  bankAccountNumber: "",
  ifscCode: "",
  bankAndBranch: "",
  previousEmploymentJoiningDate: "",
  previousEmploymentRelievingDate: "",
  previousEmploymentSalaryAtJoining: "",
  previousEmploymentSalaryAtRelieving: "",
  previousEmploymentRelievedWithNoticePeriod: "",
  previousEmploymentAbsconded: "",
  previousEmploymentDesignationAtJoining: "",
  previousEmploymentDesignationAtRelieving: "",
  previousEmploymentManagerName: "",
  previousEmploymentManagerMobileNumber: "",
  previousEmploymentCompanyAddress: "",
  emergencyContactName1: "",
  emergencyContactRelation1: "",
  emergencyContactPhone1: "",
  emergencyContactName2: "",
  emergencyContactRelation2: "",
  emergencyContactPhone2: "",
  friendRefName1: "",
  friendRefContact1: "",
  friendRefName2: "",
  friendRefContact2: "",
  pfUan: "",
  esiNo: "",
  declarationDate: "",
  declarationPlace: "",
  branchToJoin: "",
  platformSource: "",
  institution: "",
  institutionCategory: "",
  institutionType: "",
  userDepartmentName: "",
  team: "",
  designation: "",
  joinDate: "",
  status: "ACTIVE",
  img: "assets/img/users/user-32.jpg",
  basic: "",
  da: "",
  hra: "",
  conveyance: "",
  tds: "",
  esi: "",
  pf: "",
  leaveDeduction: "",
  netSalary: "",
  leavePolicyIds: [],
};

const EMPTY_FILE_PATHS = {
  candidatePhotoPath: "",
  aadharCardPath: "",
  panCardPath: "",
  bankPassbookPath: "",
  experienceCertificatePath: "",
  certificatePath: "",
  graduationCertificatePath: "",
  graduationMarksheetPath: "",
  hscMarksheetPath: "",
  sslcMarksheetPath: "",
  communityCertificatePath: "",
};

const EMPTY_SECTIONS = {
  familyDetails: false,
  addressDetails: false,
  educationDetails: false,
  bankDetails: false,
  previousEmployment: false,
  emergencyContacts: false,
  friendReferences: false,
  pfEsiDetails: false,
  declarationDetails: false,
};

const EDUCATION_FIELDS_TO_CLEAR = [
  "educationCourseName",
  "educationCertificateNumber",
  "educationRollNumber",
  "educationMark",
  "educationMaxMark",
  "educationMarkPercentage",
  "educationFromYear",
  "educationToYear",
];

const EDUCATION_UPLOAD_KEYS = [
  "uploadCertificate",
  "uploadGraduationCertificate",
  "uploadGraduationMarksheet",
  "uploadHscMarkSheet",
  "uploadSslcMarkSheet",
];

function isActiveMaster(item) {
  return String(item?.status || "ACTIVE").toUpperCase() !== "INACTIVE";
}

function withInactiveSelected(items, selectedId) {
  const list = Array.isArray(items) ? items : [];
  const active = list.filter(isActiveMaster);
  if (!selectedId) return active;
  const selected = list.find((item) => String(item?.id) === String(selectedId));
  if (!selected || isActiveMaster(selected)) return active;
  return [...active, { ...selected, name: `${selected?.name || "Selected"} (Inactive)` }];
}

function hasText(value) {
  if (value === null || value === undefined) return false;
  return String(value).trim().length > 0;
}

function hasAnyText(source, keys) {
  return keys.some((key) => hasText(source?.[key]));
}


function pickDate(value) {
  return value ? String(value).slice(0, 10) : "";
}

function normalizeEmployee(raw = {}) {
  const form = {
    ...EMPTY_FORM,
    nameInCaps: raw?.nameInCaps || raw?.name || "",
    personalContactNumber: raw?.personalContactNumber || raw?.phone || "",
    countryCode: raw?.countryCode || defaultCountryOption.value,
    personalEmail: raw?.personalEmail || raw?.email || "",
    officialEmail: raw?.officialEmail || "",
    dateOfBirth: pickDate(raw?.dateOfBirth),
    fatherName: raw?.fatherName || "",
    motherName: raw?.motherName || "",
    alternateContactNumber: raw?.alternateContactNumber || "",
    location: raw?.location || "",
    pinCode: raw?.pinCode || "",
    state: raw?.state || "",
    currentAddress: raw?.currentAddress || "",
    permanentAddress: raw?.permanentAddress || "",
    maritalStatus: raw?.maritalStatus || "",
    spouseName: raw?.spouseName || "",
    bloodGroup: raw?.bloodGroup || "",
    educationQualification: raw?.educationQualification || "",
    educationCourseName: raw?.educationCourseName || "",
    educationCertificateNumber: raw?.educationCertificateNumber || "",
    educationRollNumber: raw?.educationRollNumber || "",
    educationMark: normalizePositiveNumericInput(raw?.educationMark),
    educationMaxMark: normalizePositiveNumericInput(raw?.educationMaxMark),
    educationMarkPercentage:
      calculateEducationPercentage(raw?.educationMark, raw?.educationMaxMark) ||
      normalizePositiveNumericInput(raw?.educationMarkPercentage) ||
      "",
    educationFromYear: raw?.educationFromYear || "",
    educationToYear: raw?.educationToYear || "",
    graduationDetails: raw?.graduationDetails || "",
    hscMarkAndYear: raw?.hscMarkAndYear || "",
    sslcMarkAndYear: raw?.sslcMarkAndYear || "",
    uploadCertificate: null,
    bankAccountHolderName: raw?.bankAccountHolderName || "",
    bankAccountNumber: raw?.bankAccountNumber || "",
    ifscCode: raw?.ifscCode || "",
    bankAndBranch: raw?.bankAndBranch || "",
    previousEmploymentJoiningDate: pickDate(raw?.previousEmploymentJoiningDate),
    previousEmploymentRelievingDate: pickDate(raw?.previousEmploymentRelievingDate),
    previousEmploymentSalaryAtJoining: raw?.previousEmploymentSalaryAtJoining || "",
    previousEmploymentSalaryAtRelieving: raw?.previousEmploymentSalaryAtRelieving || "",
    previousEmploymentRelievedWithNoticePeriod: raw?.previousEmploymentRelievedWithNoticePeriod || "",
    previousEmploymentAbsconded: raw?.previousEmploymentAbsconded || "",
    previousEmploymentDesignationAtJoining: raw?.previousEmploymentDesignationAtJoining || "",
    previousEmploymentDesignationAtRelieving: raw?.previousEmploymentDesignationAtRelieving || "",
    previousEmploymentManagerName: raw?.previousEmploymentManagerName || "",
    previousEmploymentManagerMobileNumber: raw?.previousEmploymentManagerMobileNumber || "",
    previousEmploymentCompanyAddress: raw?.previousEmploymentCompanyAddress || "",
    experienceCertificateAvailable: raw?.experienceCertificatePath ? "YES" : "NO",
    emergencyContactName1: raw?.emergencyContactName1 || "",
    emergencyContactRelation1: raw?.emergencyContactRelation1 || "",
    emergencyContactPhone1: raw?.emergencyContactPhone1 || "",
    emergencyContactName2: raw?.emergencyContactName2 || "",
    emergencyContactRelation2: raw?.emergencyContactRelation2 || "",
    emergencyContactPhone2: raw?.emergencyContactPhone2 || "",
    friendRefName1: raw?.friendRefName1 || "",
    friendRefContact1: raw?.friendRefContact1 || "",
    friendRefName2: raw?.friendRefName2 || "",
    friendRefContact2: raw?.friendRefContact2 || "",
    pfUan: raw?.pfUan || "",
    esiNo: raw?.esiNo || "",
    declarationDate: pickDate(raw?.declarationDate),
    declarationPlace: raw?.declarationPlace || "",
    branchToJoin: raw?.branchToJoin || raw?.branchName || "",
    platformSource: raw?.platformSource || "",
    institution: raw?.institution || raw?.institutionName || "",
    institutionCategory: raw?.institutionCategory || raw?.institution_category || raw?.category || "",
    institutionType: raw?.institutionType || raw?.institution_type || "",
    userDepartmentName: raw?.userDepartmentName || raw?.orgDepartmentName || raw?.departmentName || "",
    team: raw?.team || raw?.orgTeam || raw?.userTeam || "",
    designation: raw?.designation || "",
    joinDate: pickDate(raw?.joinDate),
    status: String(raw?.status || "ACTIVE").toUpperCase(),
    img: raw?.img || "assets/img/users/user-32.jpg",
    basic: raw?.basic || "",
    da: raw?.da || "",
    hra: raw?.hra || "",
    conveyance: raw?.conveyance || "",
    tds: raw?.tds || "",
    esi: raw?.esi || "",
    pf: raw?.pf || "",
    leaveDeduction: raw?.leaveDeduction || "",
    netSalary: raw?.netSalary || "",
    leavePolicyIds: Array.isArray(raw?.leavePolicyIds)
      ? raw.leavePolicyIds.filter((value) => value !== null && value !== undefined).map((value) => Number(value))
      : [],
  };

  const existingFiles = {
    candidatePhotoPath: raw?.candidatePhotoPath || "",
    aadharCardPath: raw?.aadharCardPath || "",
    panCardPath: raw?.panCardPath || "",
    bankPassbookPath: raw?.bankPassbookPath || "",
    experienceCertificatePath: raw?.experienceCertificatePath || "",
    certificatePath: raw?.certificatePath || "",
    graduationCertificatePath: raw?.graduationCertificatePath || "",
    graduationMarksheetPath: raw?.graduationMarksheetPath || "",
    hscMarksheetPath: raw?.hscMarksheetPath || "",
    sslcMarksheetPath: raw?.sslcMarksheetPath || "",
    communityCertificatePath: raw?.communityCertificatePath || "",
  };

  const sections = {
    familyDetails: hasAnyText(form, [
      "fatherName",
      "motherName",
      "alternateContactNumber",
      "maritalStatus",
      "spouseName",
      "bloodGroup",
      "officialEmail",
    ]),
    addressDetails:
      hasAnyText(form, ["location", "pinCode", "state", "currentAddress", "permanentAddress"]) ||
      hasText(existingFiles.aadharCardPath) ||
      hasText(existingFiles.panCardPath),
    educationDetails:
      hasAnyText(form, [
        "educationQualification",
        "educationCourseName",
        "educationCertificateNumber",
        "educationRollNumber",
        "educationMark",
        "educationMaxMark",
        "educationMarkPercentage",
        "educationFromYear",
        "educationToYear",
      ]) ||
      hasAnyText(form, ["graduationDetails", "hscMarkAndYear", "sslcMarkAndYear"]) ||
      hasText(existingFiles.certificatePath) ||
      hasText(existingFiles.graduationCertificatePath) ||
      hasText(existingFiles.graduationMarksheetPath) ||
      hasText(existingFiles.hscMarksheetPath) ||
      hasText(existingFiles.sslcMarksheetPath) ||
      !!form.uploadCertificate,
    bankDetails:
      hasAnyText(form, ["bankAccountHolderName", "bankAccountNumber", "ifscCode", "bankAndBranch"]) ||
      hasText(existingFiles.bankPassbookPath),
    previousEmployment:
      hasAnyText(form, [
        "previousEmploymentJoiningDate",
        "previousEmploymentRelievingDate",
        "previousEmploymentSalaryAtJoining",
        "previousEmploymentSalaryAtRelieving",
        "previousEmploymentRelievedWithNoticePeriod",
        "previousEmploymentAbsconded",
        "previousEmploymentDesignationAtJoining",
        "previousEmploymentDesignationAtRelieving",
        "previousEmploymentManagerName",
        "previousEmploymentManagerMobileNumber",
        "previousEmploymentCompanyAddress",
        "platformSource",
        "joinDate",
      ]) ||
      hasText(existingFiles.experienceCertificatePath) ||
      form.experienceCertificateAvailable === "YES" ||
      !!form.uploadExperienceCertificate,
    emergencyContacts: hasAnyText(form, [
      "emergencyContactName1",
      "emergencyContactRelation1",
      "emergencyContactPhone1",
      "emergencyContactName2",
      "emergencyContactRelation2",
      "emergencyContactPhone2",
    ]),
    friendReferences: hasAnyText(form, ["friendRefName1", "friendRefContact1", "friendRefName2", "friendRefContact2"]),
    pfEsiDetails: hasAnyText(form, ["pfUan", "esiNo"]),
    declarationDetails: hasAnyText(form, ["declarationDate", "declarationPlace"]),
  };

  return { form, existingFiles, sections };
}

function appendIfPresent(fd, key, value) {
  if (value === null || value === undefined || value === "") return;
  fd.append(key, value);
}

function FileViewLink({ label, existingPath, fileValue, apiBase }) {
  const [objectUrl, setObjectUrl] = useState("");

  useEffect(() => {
    if (fileValue instanceof File) {
      const url = URL.createObjectURL(fileValue);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setObjectUrl("");
    return undefined;
  }, [fileValue]);

  const buildPreviewUrl = (path) => {
    const raw = String(path || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    const employeeFileMatch = raw.match(/uploads\/employees\/(\d+)\/([^/]+)/i);
    if (employeeFileMatch) {
      const employeeId = employeeFileMatch[1];
      const fileKey = employeeFileMatch[2];
      return `${apiBase}/api/employees/${employeeId}/files/${encodeURIComponent(fileKey)}`;
    }
    return `${apiBase}${raw.startsWith("/") ? "" : "/"}${raw}`;
  };

  const existingUrl = buildPreviewUrl(existingPath);
  const viewUrl = objectUrl || existingUrl;

  if (!viewUrl) return null;

  return (
    <div className="d-flex align-items-center gap-2 flex-wrap mt-1">
      <a className="btn btn-sm btn-outline-primary" href={viewUrl} target="_blank" rel="noreferrer">
        View
      </a>
      {fileValue instanceof File ? (
        <span className="text-muted small">{fileValue.name}</span>
      ) : (
        <a href={viewUrl} target="_blank" rel="noreferrer" className="small text-decoration-none">
          {label}
        </a>
      )}
    </div>
  );
}

const FORM_TABS = [
  { id: "org-details", label: "Organization" },
  { id: "basic-details", label: "Basic Details" },
  { id: "salary-details", label: "Salary Details" },
  { id: "leave-details", label: "Leave Details" },
  { id: "family-details", label: "Family Details" },
  { id: "address-details", label: "Address Details" },
  { id: "education-details", label: "Education Details" },
  { id: "bank-details", label: "Bank Details" },
  { id: "prev-employment", label: "Previous Employment" },
  { id: "emergency-contacts", label: "Emergency Contacts" },
  { id: "friend-refs", label: "Friend References" },
  { id: "declaration", label: "Declaration" }
];

export default function EmployeeFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [additionsList, setAdditionsList] = useState([]);
  const [deductionsList, setDeductionsList] = useState([]);
  const [leavePolicies, setLeavePolicies] = useState([]);

  const isFieldActive = (fieldKey) => {
    if (["basic", "da", "hra", "conveyance"].includes(fieldKey)) {
      if (additionsList.length === 0) return true;
      const match = additionsList.find(item => {
        const name = (item.name || "").toLowerCase();
        if (fieldKey === "basic") return name.includes("basic");
        if (fieldKey === "da") return name.includes("da") || name.includes("dearness");
        if (fieldKey === "hra") return name.includes("hra") || name.includes("house rent");
        if (fieldKey === "conveyance") return name.includes("conveyance");
        return false;
      });
      if (match) {
        return match.status === "Active" || match.status === "ACTIVE";
      }
    } else if (["tds", "esi", "pf", "leaveDeduction"].includes(fieldKey)) {
      if (deductionsList.length === 0) return true;
      const match = deductionsList.find(item => {
        const name = (item.name || "").toLowerCase();
        if (fieldKey === "tds") return name.includes("tds");
        if (fieldKey === "esi") return name.includes("esi");
        if (fieldKey === "pf") return name.includes("pf");
        if (fieldKey === "leaveDeduction") return name.includes("leave") || name.includes("lop");
        return false;
      });
      if (match) {
        return match.status === "Active" || match.status === "ACTIVE";
      }
    }
    return true;
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [headOffices, setHeadOffices] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [headOfficeId, setHeadOfficeId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [designationId, setDesignationId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [existingFiles, setExistingFiles] = useState(EMPTY_FILE_PATHS);
  const [sections, setSections] = useState(EMPTY_SECTIONS);
  const [activeTab, setActiveTab] = useState("org-details");
  const [leavePolicyDropdownOpen, setLeavePolicyDropdownOpen] = useState(false);
  const leavePolicyDropdownRef = useRef(null);

  const apiBase = useMemo(
    () => (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8082").replace(/\/+$/, ""),
    [],
  );

  const sortedHeadOffices = [...headOffices].sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  const sortedBranches = [...branches].sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  const sortedDepartments = [...departments].sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  const sortedDesignations = [...designations].sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

  const selectedDesignation = sortedDesignations.find((item) => String(item.id) === String(designationId));
  const selectedLeavePolicyIds = useMemo(
    () => new Set((form.leavePolicyIds || []).map((value) => Number(value))),
    [form.leavePolicyIds],
  );
  const selectedLeavePolicies = useMemo(
    () =>
      (leavePolicies || [])
        .filter((policy) => selectedLeavePolicyIds.has(Number(policy?.id)))
        .sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || ""))),
    [leavePolicies, selectedLeavePolicyIds],
  );
  const groupedLeavePolicies = useMemo(() => {
    const groups = new Map();
    (leavePolicies || []).forEach((policy) => {
      const groupName = policy?.leaveTypeName || "Other Leave Policies";
      if (!groups.has(groupName)) groups.set(groupName, []);
      groups.get(groupName).push(policy);
    });
    return Array.from(groups.entries())
      .map(([leaveTypeName, policies]) => ({
        leaveTypeName,
        policies: [...policies].sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || ""))),
      }))
      .sort((a, b) => a.leaveTypeName.localeCompare(b.leaveTypeName));
  }, [leavePolicies]);
  const educationVisibility = useMemo(
    () => getEducationVisibilityRules(form.educationQualification),
    [form.educationQualification],
  );

  useEffect(() => {
    const basic = parseFloat(form.basic) || 0;
    const da = parseFloat(form.da) || 0;
    const hra = parseFloat(form.hra) || 0;
    const conveyance = parseFloat(form.conveyance) || 0;
    const tds = parseFloat(form.tds) || 0;
    const esi = parseFloat(form.esi) || 0;
    const pf = parseFloat(form.pf) || 0;
    const leaveDeduction = parseFloat(form.leaveDeduction) || 0;

    const calculated = (basic + da + hra + conveyance) - (tds + esi + pf + leaveDeduction);
    const netSalary = calculated < 0 ? "0.00" : calculated.toFixed(2);

    if (String(form.netSalary) !== String(netSalary)) {
      setForm((prev) => ({ ...prev, netSalary }));
    }
  }, [form.basic, form.da, form.hra, form.conveyance, form.tds, form.esi, form.pf, form.leaveDeduction, form.netSalary]);

  useEffect(() => {
    if (!leavePolicyDropdownOpen) return undefined;

    const handleClickOutside = (event) => {
      if (!leavePolicyDropdownRef.current?.contains(event.target)) {
        setLeavePolicyDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [leavePolicyDropdownOpen]);

  const handleNumericChange = (key, rawValue) => {
    const sanitized = rawValue.replace(/[^0-9.]/g, "");
    setField(key, sanitized);
  };

  const isScrollingToRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      isScrollingToRef.current = true;
      setActiveTab(id);
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingToRef.current = false;
      }, 800);
    }
  };

  useEffect(() => {
    if (loading) return;

    const handleScroll = () => {
      if (isScrollingToRef.current) return;

      const offset = 180; // Approximate top of tab bar from screen top
      let activeSectionId = "org-details";

      // Iterate tabs from top to bottom
      for (const tab of FORM_TABS) {
        const el = document.getElementById(tab.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          // If the top of the element has scrolled past the offset height
          if (rect.top <= offset) {
            activeSectionId = tab.id;
          }
        }
      }

      setActiveTab(activeSectionId);
    };

    // Use capturing phase (capture: true) to ensure we receive scroll events from nested container layouts
    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });

    // Run once on load to set initial state
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll, { capture: true });
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [loading]);

  const loadBranches = async (headOfficeValue, selectedBranchValue = "") => {
    if (!headOfficeValue) {
      setBranches([]);
      return [];
    }
    try {
      const data = await getBranches(headOfficeValue);
      const normalized = isEdit ? withInactiveSelected(Array.isArray(data) ? data : [], selectedBranchValue) : (Array.isArray(data) ? data : []);
      setBranches(normalized);
      return normalized;
    } catch {
      setBranches([]);
      return [];
    }
  };

  const loadDepartments = async (branchValue, selectedDepartmentValue = "") => {
    if (!branchValue) {
      setDepartments([]);
      return [];
    }
    try {
      const data = await getDepartmentsMasterByBranch(branchValue);
      const normalized = isEdit ? withInactiveSelected(Array.isArray(data) ? data : [], selectedDepartmentValue) : (Array.isArray(data) ? data : []);
      setDepartments(normalized);
      return normalized;
    } catch {
      setDepartments([]);
      return [];
    }
  };

  const loadDesignations = async (departmentValue, selectedDesignationValue = "") => {
    if (!departmentValue) {
      setDesignations([]);
      return [];
    }
    try {
      const data = await getDesignations(departmentValue);
      const normalized = isEdit ? withInactiveSelected(Array.isArray(data) ? data : [], selectedDesignationValue) : (Array.isArray(data) ? data : []);
      setDesignations(normalized);
      return normalized;
    } catch {
      setDesignations([]);
      return [];
    }
  };

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const [offices, additions, deductions, policies] = await Promise.all([
          getHeadOffices(),
          getAdditions(),
          getDeductions(),
          getLeavePolicies()
        ]);
        if (!active) return;
        setHeadOffices(Array.isArray(offices) ? offices : []);
        setAdditionsList(Array.isArray(additions) ? additions : []);
        setDeductionsList(Array.isArray(deductions) ? deductions : []);
        setLeavePolicies(Array.isArray(policies) ? policies : []);

        if (!isEdit || !id) {
          setForm(EMPTY_FORM);
          setExistingFiles(EMPTY_FILE_PATHS);
          setSections(EMPTY_SECTIONS);
          setHeadOfficeId("");
          setBranchId("");
          setDepartmentId("");
          setDesignationId("");
          setBranches([]);
          setDepartments([]);
          setDesignations([]);
          return;
        }

        const employee = await getEmployeeById(id);
        if (!active) return;
        const normalized = normalizeEmployee(employee || {});
        setForm(normalized.form);
        setExistingFiles(normalized.existingFiles);
        setSections(normalized.sections);

        const nextHeadOfficeId = String(employee?.headOfficeId || "");
        const nextBranchId = String(employee?.branchId || "");
        const nextDepartmentId = String(employee?.departmentMasterId || "");
        const nextDesignationId = String(employee?.designationMasterId || "");

        setHeadOfficeId(nextHeadOfficeId);
        setBranchId(nextBranchId);
        setDepartmentId(nextDepartmentId);
        setDesignationId(nextDesignationId);
        setHeadOffices(withInactiveSelected(Array.isArray(offices) ? offices : [], nextHeadOfficeId));

        await loadBranches(nextHeadOfficeId, nextBranchId);
        await loadDepartments(nextBranchId, nextDepartmentId);
        await loadDesignations(nextDepartmentId, nextDesignationId);
      } catch (e) {
        showError(extractApiErrorMessage(e, isEdit ? "Failed to load employee" : "Failed to load form"));
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [id, isEdit, showError]);

  const handleHeadOfficeChange = async (value) => {
    setHeadOfficeId(value);
    setBranchId("");
    setDepartmentId("");
    setDesignationId("");
    setBranches([]);
    setDepartments([]);
    setDesignations([]);
    await loadBranches(value);
  };

  const handleBranchChange = async (value) => {
    setBranchId(value);
    setDepartmentId("");
    setDesignationId("");
    setDepartments([]);
    setDesignations([]);
    await loadDepartments(value);
  };

  const handleDepartmentChange = async (value) => {
    setDepartmentId(value);
    setDesignationId("");
    setDesignations([]);
    await loadDesignations(value);
  };

  const handlePhoneChange = (value) => {
    const sanitized = sanitizePhoneDigits(value, getCountryDisplayMaxLength(form.countryCode || defaultCountryOption.value));
    setForm((prev) => ({ ...prev, personalContactNumber: sanitized }));
  };

  const handleDobChange = (value) => {
    setForm((prev) => {
      if (!value) {
        return { ...prev, dateOfBirth: "" };
      }

      const [year] = String(value).split("-");
      if (!year || year.length !== 4 || !/^\d{4}$/.test(year)) {
        return prev;
      }

      return { ...prev, dateOfBirth: value };
    });
  };

  const handleDeclarationDateChange = (value) => {
    setForm((prev) => {
      if (!value) {
        return { ...prev, declarationDate: "" };
      }

      const [year] = String(value).split("-");
      if (!year || year.length !== 4 || !/^\d{4}$/.test(year)) {
        return prev;
      }

      return { ...prev, declarationDate: value };
    });
  };

  const handleEducationFieldChange = (key, value) => {
    const normalizedValue =
      key === "educationMark" || key === "educationMaxMark" ? normalizePositiveNumericInput(value) : value;
    setForm((prev) => {
      const next = { ...prev, [key]: normalizedValue };
      if (key === "educationMark" || key === "educationMaxMark") {
        next.educationMarkPercentage = calculateEducationPercentage(
          key === "educationMark" ? normalizedValue : next.educationMark,
          key === "educationMaxMark" ? normalizedValue : next.educationMaxMark,
        );
      }
      if (key === "educationQualification") {
        const visibility = getEducationVisibilityRules(value);
        if (!value || visibility.isBasicQualification) {
          EDUCATION_FIELDS_TO_CLEAR.forEach((fieldKey) => {
            next[fieldKey] = "";
          });
          EDUCATION_UPLOAD_KEYS.forEach((fieldKey) => {
            next[fieldKey] = null;
          });
        } else if (!visibility.showCourseName) {
          next.educationCourseName = "";
        }
      }
      return next;
    });
  };

  const handleFileChange = (key, file) => {
    setForm((prev) => ({ ...prev, [key]: file || null }));
  };

  const handleExperienceCertificateAvailableChange = (value) => {
    setForm((prev) => ({
      ...prev,
      experienceCertificateAvailable: value,
      uploadExperienceCertificate: value === "YES" ? prev.uploadExperienceCertificate : null,
    }));
  };

  const toggleSection = (key) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleLeavePolicy = (policyId) => {
    const numericId = Number(policyId);
    if (!Number.isFinite(numericId)) return;
    setForm((prev) => {
      const current = new Set((prev.leavePolicyIds || []).map((value) => Number(value)));
      if (current.has(numericId)) {
        current.delete(numericId);
      } else {
        current.add(numericId);
      }
      return { ...prev, leavePolicyIds: Array.from(current) };
    });
  };

  const validate = () => {
    if (!headOfficeId) return "Head Office is required";
    if (!branchId) return "Branch is required";
    if (!departmentId) return "Department is required";
    if (!designationId) return "Team / Designation is required";
    if (!hasText(form.nameInCaps)) return "Name is required";
    if (!hasText(form.personalContactNumber)) return "Contact Number is required";
    if (!hasText(form.personalEmail)) return "Email is required";
    if (!hasText(form.dateOfBirth)) return "DOB is required";
    if (!hasText(form.basic)) return "Basic Salary is required";
    const phoneError = validatePhoneNumber(form.personalContactNumber, form.countryCode || defaultCountryOption.value);
    if (phoneError) return phoneError;
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const message = validate();
    if (message) {
      showError(message);
      return;
    }

    const fd = new FormData();
    fd.append("headOfficeId", headOfficeId);
    fd.append("branchId", branchId);
    fd.append("departmentMasterId", departmentId);
    fd.append("designationMasterId", designationId);
    if (selectedDesignation?.name) {
      fd.append("designation", selectedDesignation.name);
    }

    const allowedEducationUploadStateKeys = new Set(
      getAdminEducationUploadDescriptors(form.educationQualification).map((item) => item.stateKey),
    );

    const normalizedForm = {
      ...form,
      educationMark: normalizePositiveNumericInput(form.educationMark),
      educationMaxMark: normalizePositiveNumericInput(form.educationMaxMark),
      educationMarkPercentage:
        calculateEducationPercentage(form.educationMark, form.educationMaxMark) ||
        normalizePositiveNumericInput(form.educationMarkPercentage) ||
        "",
    };

    Object.entries(normalizedForm).forEach(([key, value]) => {
      if (key.endsWith("Path")) return;
      if (key === "leavePolicyIds") return;
      if (
        key.startsWith("upload") &&
        ["uploadCertificate", "uploadGraduationCertificate", "uploadGraduationMarksheet", "uploadHscMarkSheet", "uploadSslcMarkSheet"].includes(key) &&
        !allowedEducationUploadStateKeys.has(key)
      ) {
        return;
      }
      if (key === "uploadExperienceCertificate" && form.experienceCertificateAvailable !== "YES") {
        return;
      }
      if (key === "experienceCertificateAvailable") {
        return;
      }
      if (value instanceof File) {
        fd.append(key, value);
        return;
      }
      appendIfPresent(fd, key, value);
    });
    fd.append("leavePolicyIdsProvided", "true");
    (form.leavePolicyIds || []).forEach((policyId) => {
      const numericId = Number(policyId);
      if (Number.isFinite(numericId)) {
        fd.append("leavePolicyIds", String(numericId));
      }
    });

    setSaving(true);
    try {
      if (isEdit) {
        await updateOnboardEmployee(id, fd);
        showSuccess("Employee updated successfully");
      } else {
        await onboardEmployee(fd);
        showSuccess("Employee added successfully");
      }
      navigate("/employees");
    } catch (e) {
      showError(extractApiErrorMessage(e, isEdit ? "Failed to update employee" : "Failed to add employee"));
    } finally {
      setSaving(false);
    }
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="container-fluid">
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div>
            <h5 className="mb-0">{isEdit ? "Edit Employee" : "Add Employee"}</h5>
            <small className="text-muted">Maintain employee onboarding details.</small>
          </div>
          <button type="button" className="btn btn-outline-secondary" onClick={() => navigate("/employees")}>
            Back
          </button>
        </div>

        <div className="card-body">
          {loading ? (
            <div className="py-4 text-center text-muted">Loading employee form...</div>
          ) : (
            <>
              {/* Sticky Form Navigation Tabs */}
              <div className="form-nav-container">
                <div className="form-nav-tabs">
                  {FORM_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`form-nav-tab ${activeTab === tab.id ? "active" : ""}`}
                      onClick={() => scrollToSection(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <form id="employee-form" onSubmit={handleSubmit}>
                {/* Organization Details */}
                <div id="org-details" className="form-section-card card">
                  <div className="card-body">
                    <p className="avm-section-title">Organization Details</p>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Head Office <span className="text-danger">*</span></label>
                          <select
                            className="avm-select form-select"
                            value={headOfficeId}
                            onChange={(e) => handleHeadOfficeChange(e.target.value)}
                          >
                            <option value="">Select</option>
                            {sortedHeadOffices.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Branch <span className="text-danger">*</span></label>
                          <select
                            className="avm-select form-select"
                            value={branchId}
                            onChange={(e) => handleBranchChange(e.target.value)}
                            disabled={!headOfficeId}
                          >
                            <option value="">Select</option>
                            {sortedBranches.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Department <span className="text-danger">*</span></label>
                          <select
                            className="avm-select form-select"
                            value={departmentId}
                            onChange={(e) => handleDepartmentChange(e.target.value)}
                            disabled={!branchId}
                          >
                            <option value="">Select</option>
                            {sortedDepartments.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Team / Designation <span className="text-danger">*</span></label>
                          <select
                            className="avm-select form-select"
                            value={designationId}
                            onChange={(e) => setDesignationId(e.target.value)}
                            disabled={!departmentId}
                          >
                            <option value="">Select</option>
                            {sortedDesignations.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Basic Details */}
                <div id="basic-details" className="form-section-card card mt-4">
                  <div className="card-body">
                    <p className="avm-section-title">Basic Details</p>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Name <span className="text-danger">*</span></label>
                          <input
                            type="text"
                            className="avm-input form-control"
                            value={form.nameInCaps}
                            onChange={(e) => setField("nameInCaps", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Contact Number <span className="text-danger">*</span></label>
                          <div className="employee-phone-input user-wizard-phone-group">
                            <select
                              className="employee-phone-code"
                              value={form.countryCode || defaultCountryOption.value}
                              onChange={(e) => setField("countryCode", e.target.value)}
                            >
                              {COUNTRY_CODE_OPTIONS.map((option) => (
                                <option key={`${option.country}-${option.callingCode}`} value={option.value}>
                                  {option.value}
                                </option>
                              ))}
                            </select>
                            <input
                              type="tel"
                              className="employee-phone-number avm-input form-control"
                              placeholder={`Enter ${getCountryDisplayMaxLength(form.countryCode || defaultCountryOption.value)} digit number`}
                              maxLength={getCountryDisplayMaxLength(form.countryCode || defaultCountryOption.value) || 15}
                              value={form.personalContactNumber}
                              onChange={(e) => handlePhoneChange(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Email <span className="text-danger">*</span></label>
                          <input
                            type="email"
                            className="avm-input form-control"
                            value={form.personalEmail}
                            onChange={(e) => setField("personalEmail", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">DOB <span className="text-danger">*</span></label>
                          <input
                            type="date"
                            className="avm-input form-control"
                            max="9999-12-31"
                            value={form.dateOfBirth}
                            onChange={(e) => handleDobChange(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Candidate Photo</label>
                          <input
                            type="file"
                            className="form-control"
                            onChange={(e) => handleFileChange("candidatePhoto", e.target.files?.[0] || null)}
                          />
                          <FileViewLink
                            label="Candidate Photo"
                            existingPath={existingFiles.candidatePhotoPath}
                            fileValue={form.candidatePhoto}
                            apiBase={apiBase}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Community Certificate</label>
                          <input
                            type="file"
                            className="form-control"
                            onChange={(e) => handleFileChange("uploadCommunityCertificate", e.target.files?.[0] || null)}
                          />
                          <FileViewLink
                            label="Community Certificate"
                            existingPath={existingFiles.communityCertificatePath}
                            fileValue={form.uploadCommunityCertificate}
                            apiBase={apiBase}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Salary Details */}
                <div id="salary-details" className="form-section-card card mt-4">
                  <div className="card-body">
                    <p className="avm-section-title">Salary Details</p>
                    <div className="row g-3">
                      {isFieldActive("basic") && (
                        <div className="col-md-6">
                          <div className="avm-field">
                            <label className="avm-label">Basic Salary (₹) <span className="text-danger">*</span></label>
                            <input
                              type="text"
                              className="avm-input form-control"
                              value={form.basic}
                              onChange={(e) => handleNumericChange("basic", e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                      {isFieldActive("da") && (
                        <div className="col-md-6">
                          <div className="avm-field">
                            <label className="avm-label">DA (Dearness Allowance) (₹)</label>
                            <input
                              type="text"
                              className="avm-input form-control"
                              value={form.da}
                              onChange={(e) => handleNumericChange("da", e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                      {isFieldActive("hra") && (
                        <div className="col-md-6">
                          <div className="avm-field">
                            <label className="avm-label">HRA (House Rent Allowance) (₹)</label>
                            <input
                              type="text"
                              className="avm-input form-control"
                              value={form.hra}
                              onChange={(e) => handleNumericChange("hra", e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                      {isFieldActive("conveyance") && (
                        <div className="col-md-6">
                          <div className="avm-field">
                            <label className="avm-label">Conveyance (₹)</label>
                            <input
                              type="text"
                              className="avm-input form-control"
                              value={form.conveyance}
                              onChange={(e) => handleNumericChange("conveyance", e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                      {isFieldActive("tds") && (
                        <div className="col-md-6">
                          <div className="avm-field">
                            <label className="avm-label">TDS (₹)</label>
                            <input
                              type="text"
                              className="avm-input form-control"
                              value={form.tds}
                              onChange={(e) => handleNumericChange("tds", e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                      {isFieldActive("esi") && (
                        <div className="col-md-6">
                          <div className="avm-field">
                            <label className="avm-label">ESI (₹)</label>
                            <input
                              type="text"
                              className="avm-input form-control"
                              value={form.esi}
                              onChange={(e) => handleNumericChange("esi", e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                      {isFieldActive("pf") && (
                        <div className="col-md-6">
                          <div className="avm-field">
                            <label className="avm-label">PF (Provident Fund) (₹)</label>
                            <input
                              type="text"
                              className="avm-input form-control"
                              value={form.pf}
                              onChange={(e) => handleNumericChange("pf", e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                      {isFieldActive("leaveDeduction") && (
                        <div className="col-md-6">
                          <div className="avm-field">
                            <label className="avm-label">Leave Deduction (₹)</label>
                            <input
                              type="text"
                              className="avm-input form-control"
                              value={form.leaveDeduction}
                              onChange={(e) => handleNumericChange("leaveDeduction", e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                      <div className="col-md-12">
                        <div className="avm-field">
                          <label className="avm-label" style={{ fontWeight: "700" }}>Calculated Net Salary (₹)</label>
                          <input
                            type="text"
                            className="avm-input form-control bg-light"
                            style={{ fontWeight: "700", color: "#0f172a" }}
                            value={form.netSalary}
                            readOnly
                            disabled
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Leave Details */}
                <div id="leave-details" className="form-section-card card mt-4">
                  <div className="card-body">
                    <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
                      <div>
                        <p className="avm-section-title mb-1">Leave Details</p>
                        <p className="text-muted small mb-3">
                          Select the leave policies applicable for this employee.
                        </p>
                      </div>
                      <span className="badge bg-light text-dark border">
                        {selectedLeavePolicyIds.size} selected
                      </span>
                    </div>

                    <div className="employee-leave-dropdown" ref={leavePolicyDropdownRef}>
                      <button
                        type="button"
                        className="employee-leave-dropdown-toggle"
                        onClick={() => setLeavePolicyDropdownOpen((open) => !open)}
                        disabled={groupedLeavePolicies.length === 0}
                        aria-expanded={leavePolicyDropdownOpen}
                      >
                        <span>
                          {selectedLeavePolicyIds.size > 0
                            ? `${selectedLeavePolicyIds.size} policies selected`
                            : "Select leave policies"}
                        </span>
                        <i className={`ti ti-chevron-down ${leavePolicyDropdownOpen ? "rotate" : ""}`} />
                      </button>

                      {leavePolicyDropdownOpen && groupedLeavePolicies.length > 0 && (
                        <div className="employee-leave-dropdown-menu">
                          {groupedLeavePolicies.map((group) => (
                            <div className="employee-leave-dropdown-group" key={group.leaveTypeName}>
                              <div className="employee-leave-dropdown-group-title">{group.leaveTypeName}</div>
                              {group.policies.map((policy) => {
                                const policyId = Number(policy?.id);
                                const checked = selectedLeavePolicyIds.has(policyId);
                                return (
                                  <label className="employee-leave-dropdown-option" key={policy.id}>
                                    <input
                                      type="checkbox"
                                      className="form-check-input"
                                      checked={checked}
                                      onChange={() => toggleLeavePolicy(policyId)}
                                    />
                                    <span className="employee-leave-dropdown-option-body">
                                      <span className="employee-leave-dropdown-option-name">{policy.name}</span>
                                      <span className="employee-leave-dropdown-option-meta">
                                        {Number(policy.daysPerYear || 0)} days/year
                                        {policy.maxDaysPerRequest ? ` - Max ${policy.maxDaysPerRequest}/request` : ""}
                                        {policy.carryForwardEnabled ? " - Carry forward" : ""}
                                      </span>
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {groupedLeavePolicies.length === 0 ? (
                      <div className="employee-leave-empty mt-3">
                        No leave policies are configured yet. Create policies from Leave Settings first.
                      </div>
                    ) : selectedLeavePolicies.length === 0 ? (
                      <div className="employee-leave-selected-empty mt-3">No leave policies selected.</div>
                    ) : (
                      <div className="employee-leave-selected-list mt-3">
                        {selectedLeavePolicies.map((policy) => (
                          <span className="employee-leave-selected-chip" key={policy.id}>
                            <span>
                              <strong>{policy.name}</strong>
                              <small>{policy.leaveTypeName || "Other Leave Policies"}</small>
                            </span>
                            <button
                              type="button"
                              className="employee-leave-selected-remove"
                              onClick={() => toggleLeavePolicy(policy.id)}
                              aria-label={`Remove ${policy.name}`}
                            >
                              x
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {false && (groupedLeavePolicies.length === 0 ? (
                      <div className="employee-leave-empty">
                        No leave policies are configured yet. Create policies from Leave Settings first.
                      </div>
                    ) : (
                      <div className="employee-leave-groups">
                        {groupedLeavePolicies.map((group) => (
                          <div className="employee-leave-group" key={group.leaveTypeName}>
                            <div className="employee-leave-group-title">{group.leaveTypeName}</div>
                            <div className="row g-3">
                              {group.policies.map((policy) => {
                                const policyId = Number(policy?.id);
                                const checked = selectedLeavePolicyIds.has(policyId);
                                return (
                                  <div className="col-lg-6" key={policy.id}>
                                    <label className={`employee-leave-policy ${checked ? "selected" : ""}`}>
                                      <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={checked}
                                        onChange={() => toggleLeavePolicy(policyId)}
                                      />
                                      <span className="employee-leave-policy-body">
                                        <span className="employee-leave-policy-name">{policy.name}</span>
                                        <span className="employee-leave-policy-meta">
                                          {Number(policy.daysPerYear || 0)} days/year
                                          {policy.maxDaysPerRequest ? ` · Max ${policy.maxDaysPerRequest}/request` : ""}
                                          {policy.carryForwardEnabled ? " · Carry forward" : ""}
                                        </span>
                                      </span>
                                    </label>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Family Details */}
                <div id="family-details" className="form-section-card card mt-4">
                  <div className="card-body">
                    <p className="avm-section-title">Family Details</p>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Father's Name</label>
                          <input className="avm-input form-control" value={form.fatherName} onChange={(e) => setField("fatherName", e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Mother's Name</label>
                          <input className="avm-input form-control" value={form.motherName} onChange={(e) => setField("motherName", e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Marital Status</label>
                          <select className="avm-select form-select" value={form.maritalStatus} onChange={(e) => setField("maritalStatus", e.target.value)}>
                            <option value="">Select</option>
                            <option value="SINGLE">Single</option>
                            <option value="MARRIED">Married</option>
                            <option value="DIVORCED">Divorced</option>
                            <option value="WIDOWED">Widowed</option>
                          </select>
                        </div>
                      </div>
                      {String(form.maritalStatus || "").toUpperCase() === "MARRIED" && (
                        <div className="col-md-6">
                          <div className="avm-field">
                            <label className="avm-label">Spouse Name</label>
                            <input className="avm-input form-control" value={form.spouseName} onChange={(e) => setField("spouseName", e.target.value)} />
                          </div>
                        </div>
                      )}
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Blood Group</label>
                          <select className="avm-select form-select" value={form.bloodGroup} onChange={(e) => setField("bloodGroup", e.target.value)}>
                            <option value="">Select</option>
                            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => (
                              <option key={group} value={group}>
                                {group}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Official Email</label>
                          <input className="avm-input form-control" type="email" value={form.officialEmail} onChange={(e) => setField("officialEmail", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Details */}
                <div id="address-details" className="form-section-card card mt-4">
                  <div className="card-body">
                    <p className="avm-section-title">Address Details</p>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Location</label>
                          <input className="avm-input form-control" value={form.location} onChange={(e) => setField("location", e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Pin Code</label>
                          <input className="avm-input form-control" value={form.pinCode} onChange={(e) => setField("pinCode", e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">State</label>
                          <input className="avm-input form-control" value={form.state} onChange={(e) => setField("state", e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Branch to Join</label>
                          <input className="avm-input form-control" value={form.branchToJoin} onChange={(e) => setField("branchToJoin", e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Aadhar Card</label>
                          <input
                            type="file"
                            className="form-control"
                            onChange={(e) => handleFileChange("uploadCandidateAadharCard", e.target.files?.[0] || null)}
                          />
                          <FileViewLink
                            label="Aadhar Card"
                            existingPath={existingFiles.aadharCardPath}
                            fileValue={form.uploadCandidateAadharCard}
                            apiBase={apiBase}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">PAN Card</label>
                          <input
                            type="file"
                            className="form-control"
                            onChange={(e) => handleFileChange("uploadCandidatePanCard", e.target.files?.[0] || null)}
                          />
                          <FileViewLink
                            label="PAN Card"
                            existingPath={existingFiles.panCardPath}
                            fileValue={form.uploadCandidatePanCard}
                            apiBase={apiBase}
                          />
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="avm-field">
                          <label className="avm-label">Current Address</label>
                          <textarea rows={2} className="avm-input form-control" value={form.currentAddress} onChange={(e) => setField("currentAddress", e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="avm-field">
                          <label className="avm-label">Permanent Address</label>
                          <textarea rows={2} className="avm-input form-control" value={form.permanentAddress} onChange={(e) => setField("permanentAddress", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Education Details */}
                <div id="education-details" className="form-section-card card mt-4">
                  <div className="card-body">
                    <p className="avm-section-title">Education Details</p>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Qualification</label>
                          <select
                            className="avm-input form-select"
                            value={form.educationQualification}
                            onChange={(e) => handleEducationFieldChange("educationQualification", e.target.value)}
                          >
                            <option value="">Select Qualification</option>
                            {EDUCATION_QUALIFICATION_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {educationVisibility.showAdditionalFields ? (
                      <>
                        <div className="row g-3 mt-1">
                          {educationVisibility.showCourseName ? (
                            <div className="col-md-4">
                              <div className="avm-field">
                                <label className="avm-label">Course Name</label>
                                <input
                                  className="avm-input form-control"
                                  value={form.educationCourseName}
                                  onChange={(e) => handleEducationFieldChange("educationCourseName", e.target.value)}
                                />
                              </div>
                            </div>
                          ) : null}
                          <div className="col-md-4">
                            <div className="avm-field">
                              <label className="avm-label">Roll Number</label>
                              <input
                                className="avm-input form-control"
                                value={form.educationRollNumber}
                                onChange={(e) => handleEducationFieldChange("educationRollNumber", e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="avm-field">
                              <label className="avm-label">Certificate Number</label>
                              <input
                                className="avm-input form-control"
                                value={form.educationCertificateNumber}
                                onChange={(e) => handleEducationFieldChange("educationCertificateNumber", e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="col-md-4">
                            <div className="avm-field">
                              <label className="avm-label">Mark</label>
                              <input
                                type="number"
                                step="any"
                                min={0}
                                className="avm-input form-control"
                                value={form.educationMark}
                                onChange={(e) => handleEducationFieldChange("educationMark", e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="avm-field">
                              <label className="avm-label">Max Mark</label>
                              <input
                                type="number"
                                step="any"
                                min={0}
                                className="avm-input form-control"
                                value={form.educationMaxMark}
                                onChange={(e) => handleEducationFieldChange("educationMaxMark", e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="avm-field">
                              <label className="avm-label">Mark (%)</label>
                              <input className="avm-input form-control" value={form.educationMarkPercentage} readOnly />
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="avm-field">
                              <label className="avm-label">From Year</label>
                              <input
                                type="text"
                                inputMode="numeric"
                                maxLength={4}
                                className="avm-input form-control"
                                value={form.educationFromYear}
                                onChange={(e) => handleEducationFieldChange("educationFromYear", e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="avm-field">
                              <label className="avm-label">To Year</label>
                              <input
                                type="text"
                                inputMode="numeric"
                                maxLength={4}
                                className="avm-input form-control"
                                value={form.educationToYear}
                                onChange={(e) => handleEducationFieldChange("educationToYear", e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="row g-3 mt-1">
                          {getAdminEducationUploadDescriptors(form.educationQualification).map((upload) => (
                            <div className="col-md-6" key={upload.stateKey}>
                              <div className="avm-field">
                                <label className="avm-label">{upload.label}</label>
                                <input
                                  type="file"
                                  className="form-control"
                                  onChange={(e) => handleFileChange(upload.stateKey, e.target.files?.[0] || null)}
                                />
                                <FileViewLink
                                  label={upload.label}
                                  existingPath={existingFiles[upload.pathKey]}
                                  fileValue={form[upload.stateKey]}
                                  apiBase={apiBase}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>

                {/* Bank Details */}
                <div id="bank-details" className="form-section-card card mt-4">
                  <div className="card-body">
                    <p className="avm-section-title">Bank Details</p>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Bank Account Holder Name</label>
                          <input className="avm-input form-control" value={form.bankAccountHolderName} onChange={(e) => setField("bankAccountHolderName", e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Bank Account Number</label>
                          <input className="avm-input form-control" value={form.bankAccountNumber} onChange={(e) => setField("bankAccountNumber", e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">IFSC Code</label>
                          <input className="avm-input form-control" value={form.ifscCode} onChange={(e) => setField("ifscCode", e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Bank & Branch</label>
                          <input className="avm-input form-control" value={form.bankAndBranch} onChange={(e) => setField("bankAndBranch", e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="avm-field">
                          <label className="avm-label">Bank Passbook Copy</label>
                          <input
                            type="file"
                            className="form-control"
                            onChange={(e) => handleFileChange("uploadBankPassBookCopy", e.target.files?.[0] || null)}
                          />
                          <FileViewLink
                            label="Bank Passbook Copy"
                            existingPath={existingFiles.bankPassbookPath}
                            fileValue={form.uploadBankPassBookCopy}
                            apiBase={apiBase}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Previous Employment */}
                <div id="prev-employment" className="form-section-card card mt-4">
                  <div className="card-body">
                    <p className="avm-section-title">Previous Employment</p>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Joining Date</label>
                          <input
                            type="date"
                            className="avm-input form-control"
                            value={form.previousEmploymentJoiningDate}
                            onChange={(e) => setField("previousEmploymentJoiningDate", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Relieving Date</label>
                          <input
                            type="date"
                            className="avm-input form-control"
                            value={form.previousEmploymentRelievingDate}
                            onChange={(e) => setField("previousEmploymentRelievingDate", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Salary at the Time of Joining (₹)</label>
                          <input
                            type="number"
                            step="any"
                            className="avm-input form-control"
                            value={form.previousEmploymentSalaryAtJoining}
                            onChange={(e) => setField("previousEmploymentSalaryAtJoining", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Salary at the Time of Relieving (₹)</label>
                          <input
                            type="number"
                            step="any"
                            className="avm-input form-control"
                            value={form.previousEmploymentSalaryAtRelieving}
                            onChange={(e) => setField("previousEmploymentSalaryAtRelieving", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Whether Relieved with Notice Period</label>
                          <select
                            className="avm-select form-select"
                            value={form.previousEmploymentRelievedWithNoticePeriod}
                            onChange={(e) => setField("previousEmploymentRelievedWithNoticePeriod", e.target.value)}
                          >
                            <option value="">Select</option>
                            {YES_NO_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Whether Absconded</label>
                          <select
                            className="avm-select form-select"
                            value={form.previousEmploymentAbsconded}
                            onChange={(e) => setField("previousEmploymentAbsconded", e.target.value)}
                          >
                            <option value="">Select</option>
                            {YES_NO_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Designation at the Time of Joining</label>
                          <input
                            className="avm-input form-control"
                            value={form.previousEmploymentDesignationAtJoining}
                            onChange={(e) => setField("previousEmploymentDesignationAtJoining", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Designation at the Time of Relieving</label>
                          <input
                            className="avm-input form-control"
                            value={form.previousEmploymentDesignationAtRelieving}
                            onChange={(e) => setField("previousEmploymentDesignationAtRelieving", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Previous Company Manager Name</label>
                          <input
                            className="avm-input form-control"
                            value={form.previousEmploymentManagerName}
                            onChange={(e) => setField("previousEmploymentManagerName", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Manager Mobile Number</label>
                          <input
                            type="tel"
                            className="avm-input form-control"
                            value={form.previousEmploymentManagerMobileNumber}
                            onChange={(e) => setField("previousEmploymentManagerMobileNumber", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="avm-field">
                          <label className="avm-label">Previous Company Address</label>
                          <textarea
                            rows={2}
                            className="avm-input form-control"
                            value={form.previousEmploymentCompanyAddress}
                            onChange={(e) => setField("previousEmploymentCompanyAddress", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="form-check d-flex gap-2 align-items-center mb-0">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={form.experienceCertificateAvailable === "YES"}
                              onChange={(e) => handleExperienceCertificateAvailableChange(e.target.checked ? "YES" : "NO")}
                            />
                            <span className="form-check-label">Experience Certificate available?</span>
                          </label>
                        </div>
                      </div>
                      {form.experienceCertificateAvailable === "YES" && (
                        <div className="col-md-6">
                          <div className="avm-field">
                            <label className="avm-label">Experience Certificate</label>
                            <input
                              type="file"
                              className="form-control"
                              onChange={(e) => handleFileChange("uploadExperienceCertificate", e.target.files?.[0] || null)}
                            />
                            <FileViewLink
                              label="Experience Certificate"
                              existingPath={existingFiles.experienceCertificatePath}
                              fileValue={form.uploadExperienceCertificate}
                              apiBase={apiBase}
                            />
                          </div>
                        </div>
                      )}
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">From Which Platform You Came to Know</label>
                          <input className="avm-input form-control" value={form.platformSource} onChange={(e) => setField("platformSource", e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">PF UAN</label>
                          <input className="avm-input form-control" value={form.pfUan} onChange={(e) => setField("pfUan", e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">ESI No</label>
                          <input className="avm-input form-control" value={form.esiNo} onChange={(e) => setField("esiNo", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emergency Contacts */}
                <div id="emergency-contacts" className="form-section-card card mt-4">
                  <div className="card-body">
                    <p className="avm-section-title">Emergency Contacts</p>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <div className="avm-field">
                          <label className="avm-label">Name 1</label>
                          <input className="avm-input form-control" value={form.emergencyContactName1} onChange={(e) => setField("emergencyContactName1", e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="avm-field">
                          <label className="avm-label">Relationship 1</label>
                          <input className="avm-input form-control" value={form.emergencyContactRelation1} onChange={(e) => setField("emergencyContactRelation1", e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="avm-field">
                          <label className="avm-label">Contact No 1</label>
                          <input className="avm-input form-control" value={form.emergencyContactPhone1} onChange={(e) => setField("emergencyContactPhone1", e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="avm-field">
                          <label className="avm-label">Name 2</label>
                          <input className="avm-input form-control" value={form.emergencyContactName2} onChange={(e) => setField("emergencyContactName2", e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="avm-field">
                          <label className="avm-label">Relationship 2</label>
                          <input className="avm-input form-control" value={form.emergencyContactRelation2} onChange={(e) => setField("emergencyContactRelation2", e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="avm-field">
                          <label className="avm-label">Contact No 2</label>
                          <input className="avm-input form-control" value={form.emergencyContactPhone2} onChange={(e) => setField("emergencyContactPhone2", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Friend References */}
                <div id="friend-refs" className="form-section-card card mt-4">
                  <div className="card-body">
                    <p className="avm-section-title">Friend / Ex-Colleague References</p>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Name 1</label>
                          <input className="avm-input form-control" value={form.friendRefName1} onChange={(e) => setField("friendRefName1", e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Contact No 1</label>
                          <input className="avm-input form-control" value={form.friendRefContact1} onChange={(e) => setField("friendRefContact1", e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Name 2</label>
                          <input className="avm-input form-control" value={form.friendRefName2} onChange={(e) => setField("friendRefName2", e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Contact No 2</label>
                          <input className="avm-input form-control" value={form.friendRefContact2} onChange={(e) => setField("friendRefContact2", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>


                {/* Declaration Details */}
                <div id="declaration" className="form-section-card card mt-4">
                  <div className="card-body">
                    <p className="avm-section-title">Declaration Details</p>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Declaration Date</label>
                          <input
                            type="date"
                            className="avm-input form-control"
                            value={form.declarationDate}
                            max="9999-12-31"
                            onChange={(e) => handleDeclarationDateChange(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="avm-field">
                          <label className="avm-label">Declaration Place</label>
                          <input className="avm-input form-control" value={form.declarationPlace} onChange={(e) => setField("declarationPlace", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>

        <div className="card-footer d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-light" onClick={() => navigate("/employees")} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="employee-form" className="btn btn-primary" disabled={saving || loading}>
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Employee"}
          </button>
        </div>
      </div>
    </div>
  );
}
