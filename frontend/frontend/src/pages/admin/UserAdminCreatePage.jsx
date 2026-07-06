import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUser } from "../../api/userAdminApi";
import { getAvailableEmployees } from "../../api/employeesApi";
import { getBranches } from "../../api/branchesApi";
import { getDepartmentsMasterByBranch } from "../../api/departmentsApi";
import { getDesignations } from "../../api/designationsApi";
import { getHeadOffices } from "../../api/headOfficesApi";
import { getUserDepartments, getUserDesignations } from "../../api/userPermissionsApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/system/ToastProvider";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import {
  COUNTRY_CODE_OPTIONS,
  defaultCountryOption,
  getCountryAllowedLengths,
  getCountryDisplayMaxLength,
  getCountryOptionByValue,
  sanitizePhoneDigits,
  validatePhoneNumber,
} from "../../utils/phoneUtils";
import "../../../public/assets/css/addModalShared.css";
import "./EmployeesPage.css";
import "./LeadsPage.css";

const FALLBACK_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD", "EMPLOYEE"];
const ENV_ROLE_OPTIONS = String(import.meta.env.VITE_ROLE_OPTIONS || "").trim();
const ROLE_OPTIONS = ENV_ROLE_OPTIONS
  ? ENV_ROLE_OPTIONS.split(",").map((r) => r.trim()).filter(Boolean)
  : FALLBACK_ROLES;

const ROLE_ASSIGNMENT_OPTIONS = {
  SUPER_ADMIN: ["ADMIN", "MANAGER", "TEAM_LEAD", "EMPLOYEE"],
  ADMIN: ["MANAGER", "TEAM_LEAD", "EMPLOYEE"],
  MANAGER: ["TEAM_LEAD", "EMPLOYEE"],
  TEAM_LEAD: ["EMPLOYEE"],
};

const EMPTY_FORM = {
  username: "",
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  role: "EMPLOYEE",
  password: "",
  confirmPassword: "",
};  

export default function UserAdminCreatePage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const currentRole = String(currentUser?.role || "").toUpperCase();
  const TABS = ["Scope & Employee", "Account Details"];

  const [form, setForm] = useState(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [phoneCountryCode, setPhoneCountryCode] = useState(defaultCountryOption?.value || "+91");
  const [phoneError, setPhoneError] = useState("");
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  // 1. Core Physical HRM Hierarchy States
  const [createHeadOfficeId, setCreateHeadOfficeId] = useState("");
  const [createBranchId, setCreateBranchId] = useState("");
  const [createDepartmentId, setCreateDepartmentId] = useState("");
  const [createTeamId, setCreateTeamId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  // 2. NEW: Independent User Permissions Hierarchy States
  const [selectedUserDepartmentId, setSelectedUserDepartmentId] = useState("");
  const [selectedUserDesignationId, setSelectedUserDesignationId] = useState("");

  // Data Arrays
  const [headOffices, setHeadOffices] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  // NEW: Dynamic permission hierarchy array data stores
  const [userDepartments, setUserDepartments] = useState([]);
  const [userDesignations, setUserDesignations] = useState([]);

  // Loading flags
  const [loadingHeadOffices, setLoadingHeadOffices] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingDesignations, setLoadingDesignations] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingUserDepartments, setLoadingUserDepartments] = useState(false);
  const [loadingUserDesignations, setLoadingUserDesignations] = useState(false);

  const selectedRole = String(form.role || "EMPLOYEE").toUpperCase();
  const roleRequiresDepartment = selectedRole !== "ADMIN";
  const roleRequiresTeam = ["TEAM_LEAD", "EMPLOYEE"].includes(selectedRole);
  
  const phoneDisplayMaxLength = getCountryDisplayMaxLength(phoneCountryCode) || 15;
  const phoneLengthDisplay = useMemo(() => {
    const allowed = getCountryAllowedLengths(phoneCountryCode);
    return allowed.length ? allowed.join(" or ") : phoneDisplayMaxLength;
  }, [phoneCountryCode, phoneDisplayMaxLength]);

  const allowedAssignRoles = useMemo(() => {
    const configured = new Set(ROLE_OPTIONS.map((role) => String(role || "").trim().toUpperCase()));
    return (ROLE_ASSIGNMENT_OPTIONS[currentRole] || []).filter((role) => configured.has(role));
  }, [currentRole]);

  useEffect(() => {
    if (allowedAssignRoles.length > 0) {
      setForm((prev) => ({ ...prev, role: allowedAssignRoles[0] }));
    }
  }, [allowedAssignRoles]);

  // Load Head Offices
  useEffect(() => {
    let isMounted = true;
    const loadHeadOffices = async () => {
      setLoadingHeadOffices(true);
      try {
        const data = await getHeadOffices();
        if (isMounted) setHeadOffices(Array.isArray(data) ? data : []);
      } catch (e) {
        if (isMounted) showError(extractApiErrorMessage(e, "Failed to load head offices"));
      } finally {
        if (isMounted) setLoadingHeadOffices(false);
      }
    };
    loadHeadOffices();
    return () => {
      isMounted = false;
    };
  }, [showError]);

  // Load Physical Branches
  useEffect(() => {
    if (!createHeadOfficeId) {
      setBranches([]);
      setCreateBranchId("");
      return;
    }
    let isMounted = true;
    const loadBranches = async () => {
      setLoadingBranches(true);
      try {
        const data = await getBranches(createHeadOfficeId);
        if (isMounted) setBranches(Array.isArray(data) ? data : []);
      } catch (e) {
        if (isMounted) showError(extractApiErrorMessage(e, "Failed to load branches"));
      } finally {
        if (isMounted) setLoadingBranches(false);
      }
    };
    loadBranches();
    return () => {
      isMounted = false;
    };
  }, [createHeadOfficeId, showError]);

  // Load Physical Departments
  useEffect(() => {
    if (!createBranchId) {
      setDepartments([]);
      setCreateDepartmentId("");
      return;
    }
    let isMounted = true;
    const loadDepartments = async () => {
      setLoadingDepartments(true);
      try {
        const data = await getDepartmentsMasterByBranch(createBranchId);
        if (isMounted) setDepartments(Array.isArray(data) ? data : []);
      } catch (e) {
        if (isMounted) showError(extractApiErrorMessage(e, "Failed to load departments"));
      } finally {
        if (isMounted) setLoadingDepartments(false);
      }
    };
    loadDepartments();
    return () => {
      isMounted = false;
    };
  }, [createBranchId, showError]);

  // Load Physical Designations
  useEffect(() => {
    if (!createDepartmentId) {
      setDesignations([]);
      setCreateTeamId("");
      return;
    }
    let isMounted = true;
    const loadDesignations = async () => {
      setLoadingDesignations(true);
      try {
        const data = await getDesignations(createDepartmentId);
        if (isMounted) setDesignations(Array.isArray(data) ? data : []);
      } catch (e) {
        if (isMounted) showError(extractApiErrorMessage(e, "Failed to load designations"));
      } finally {
        if (isMounted) setLoadingDesignations(false);
      }
    };
    loadDesignations();
    return () => {
      isMounted = false;
    };
  }, [createDepartmentId, showError]);

  // Fetch User Departments
  useEffect(() => {
    if (!createBranchId || !selectedEmployeeId) {
      setUserDepartments([]);
      setSelectedUserDepartmentId("");
      return;
    }
    let isMounted = true;
    const loadUserDepartments = async () => {
      setLoadingUserDepartments(true);
      try {
        const data = await getUserDepartments(createBranchId);
        if (isMounted) setUserDepartments(Array.isArray(data) ? data : []);
      } catch (e) {
        if (isMounted) showError(extractApiErrorMessage(e, "Failed to load user departments"));
      } finally {
        if (isMounted) setLoadingUserDepartments(false);
      }
    };
    loadUserDepartments();
    return () => {
      isMounted = false;
    };
  }, [createBranchId, selectedEmployeeId, showError]);

  // Fetch User Designations
  useEffect(() => {
    if (!selectedUserDepartmentId || !selectedEmployeeId) {
      setUserDesignations([]);
      setSelectedUserDesignationId("");
      return;
    }
    let isMounted = true;
    const loadUserDesignations = async () => {
      setLoadingUserDesignations(true);
      try {
        const data = await getUserDesignations(selectedUserDepartmentId);
        if (isMounted) setUserDesignations(Array.isArray(data) ? data : []);
      } catch (e) {
        if (isMounted) showError(extractApiErrorMessage(e, "Failed to load user designations"));
      } finally {
        if (isMounted) setLoadingUserDesignations(false);
      }
    };
    loadUserDesignations();
    return () => {
      isMounted = false;
    };
  }, [selectedUserDepartmentId, selectedEmployeeId, showError]);

  const createEmployeeScope = useMemo(() => {
    const headOfficeId = String(createHeadOfficeId || "").trim();
    const branchId = String(createBranchId || "").trim();
    const departmentId = String(createDepartmentId || "").trim();
    const designationId = String(createTeamId || "").trim();
    if (!headOfficeId || !branchId || !departmentId || !designationId) return null;

    return { headOfficeId, branchId, departmentId, designationId };
  }, [createHeadOfficeId, createBranchId, createDepartmentId, createTeamId]);

  // Fetch employees matching the scope
  useEffect(() => {
    if (!createEmployeeScope) {
      setEmployees([]);
      return;
    }
    let isMounted = true;
    const loadEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const data = await getAvailableEmployees(createEmployeeScope);
        if (isMounted) setEmployees(Array.isArray(data) ? data : []);
      } catch (e) {
        if (isMounted) showError(extractApiErrorMessage(e, "Failed to load available employees"));
      } finally {
        if (isMounted) setLoadingEmployees(false);
      }
    };
    loadEmployees();
    return () => {
      isMounted = false;
    };
  }, [createEmployeeScope, showError]);

  const selectedHeadOffice = headOffices.find((item) => String(item.id) === String(createHeadOfficeId));
  const selectedBranch = branches.find((item) => String(item.id) === String(createBranchId));
  const selectedDepartment = departments.find((item) => String(item.id) === String(createDepartmentId));
  const selectedDesignation = designations.find((item) => String(item.id) === String(createTeamId));
  
  const selectedUserDepartment = userDepartments.find((item) => String(item.id) === String(selectedUserDepartmentId));
  const selectedUserDesignation = userDesignations.find((item) => String(item.id) === String(selectedUserDesignationId));
  const selectedEmployee = employees.find((item) => String(item.id) === String(selectedEmployeeId));

  const clearSelectedEmployeeDraft = () => {
    setSelectedEmployeeId("");
    setSelectedUserDepartmentId("");
    setSelectedUserDesignationId("");
    setForm((prev) => ({
      ...prev,
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
    }));
  };

  const handleRoleChange = (role) => {
    const nextRole = String(role || "EMPLOYEE").toUpperCase();
    setForm((prev) => ({ ...prev, role: nextRole }));
    
    if (nextRole === "ADMIN") {
      setSelectedUserDepartmentId("");
      setSelectedUserDesignationId("");
    } else if (nextRole === "MANAGER") {
      setSelectedUserDesignationId("");
    }
  };

  const handleUserDepartmentChange = (value) => {
    setSelectedUserDepartmentId(value);
    setSelectedUserDesignationId("");
  };

  const handleUserDesignationChange = (value) => {
    setSelectedUserDesignationId(value);
  };

  const handleHeadOfficeChange = (value) => {
    setCreateHeadOfficeId(value);
    setCreateBranchId("");
    setCreateDepartmentId("");
    setCreateTeamId("");
    setBranches([]);
    setDepartments([]);
    setDesignations([]);
    clearSelectedEmployeeDraft();
  };

  const handleBranchChange = (value) => {
    setCreateBranchId(value);
    setCreateDepartmentId("");
    setCreateTeamId("");
    setDepartments([]);
    setDesignations([]);
    clearSelectedEmployeeDraft();
  };

  const handleDepartmentChange = (value) => {
    setCreateDepartmentId(value);
    setCreateTeamId("");
    setDesignations([]);
    clearSelectedEmployeeDraft();
  };

  const handleTeamChange = (value) => {
    setCreateTeamId(value);
    clearSelectedEmployeeDraft();
  };

  const handleSelectEmployee = (employeeId) => {
    setSelectedEmployeeId(employeeId);
    setSelectedUserDepartmentId("");
    setSelectedUserDesignationId("");
    
    const employee = employees.find((emp) => String(emp.id) === String(employeeId));
    if (!employee) return;

    const name = String(employee.name || employee.fullName || employee.employeeName || "").trim();
    const nameParts = name.split(/\s+/).filter(Boolean);
    const email = String(employee.email || employee.officialEmail || employee.personalEmail || "").trim();
    const emailPrefix = email.includes("@") ? email.split("@")[0] : email;
    const countryCode = String(employee.countryCode || "").trim();
    const phoneRaw = String(
      employee.phone || employee.personalContactNumber || employee.alternateContactNumber || "",
    ).trim();

    setPhoneCountryCode((prev) => countryCode || prev || "+91");
    setForm((prev) => ({
      ...prev,
      username: emailPrefix || prev.username,
      email: email || prev.email,
      phone: phoneRaw.replace(/\D/g, ""),
      firstName: nameParts[0] || prev.firstName || "",
      lastName: nameParts.slice(1).join(" ") || prev.lastName || "",
    }));
  };

  const handlePhoneInput = (value) => {
    const digits = value.replace(/\D/g, "");
    const allowedLengths = getCountryAllowedLengths(phoneCountryCode);
    const maxLength = allowedLengths.length > 0
      ? Math.max(...allowedLengths)
      : getCountryDisplayMaxLength(phoneCountryCode) || 15;
    setForm((prev) => ({ ...prev, phone: digits.slice(0, maxLength) }));
    setPhoneError("");
  };

  const handlePhoneBlur = () => {
    setPhoneError(validatePhoneNumber(form.phone, phoneCountryCode));
  };

  const handlePhoneCountryCodeChange = (value) => {
    const nextCode = value || "+91";
    const option = getCountryOptionByValue(nextCode);
    const lengths = getCountryAllowedLengths(nextCode);
    const maxLength = option?.maxLength || 15;

    setPhoneCountryCode(nextCode);
    setForm((prev) => ({
      ...prev,
      phone: sanitizePhoneDigits(prev.phone, maxLength, lengths),
    }));
    setPhoneError("");
  };

  const validatePhoneForSubmit = () => {
    if (form.phone && form.phone.trim()) {
      const error = validatePhoneNumber(form.phone, phoneCountryCode);
      if (error) return { isValid: false, message: error };
    }
    return { isValid: true, message: "" };
  };

  const getFormattedPhone = () => (form.phone ? `${phoneCountryCode}${form.phone}` : "");

  const validateScopeStep = () => {
    if (!createHeadOfficeId) return "Please select a head office";
    if (!createBranchId) return "Please select a branch";
    if (!createDepartmentId) return "Please select a physical department";
    if (!createTeamId) return "Please select a physical designation";
    if (!selectedEmployeeId) return "Please select an employee profile";
    if (roleRequiresDepartment && !selectedUserDepartmentId) return "Please assign a user department permissions scope";
    if (roleRequiresTeam && !selectedUserDesignationId) return "Please assign a user designation permissions scope";
    return null;
  };

  const validateAccountStep = () => {
    if (!form.username.trim()) return "Username is required";
    if (!form.email.trim()) return "Email is required";
    if (!form.password.trim()) return "Password is required";
    if (form.password !== form.confirmPassword) return "Passwords do not match";
    return null;
  };

  const handleTabChange = (index) => {
    if (activeTab === 0 && index > 0) {
      const err = validateScopeStep();
      if (err) {
        showError(err);
        return;
      }
    }
    setActiveTab(index);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const scopeValidation = validateScopeStep();
    if (scopeValidation) return showError(scopeValidation);

    if (activeTab === 0) {
      setActiveTab(1);
      return;
    }

    const accountValidation = validateAccountStep();
    if (accountValidation) return showError(accountValidation);

    const phoneValidation = validatePhoneForSubmit();
    if (!phoneValidation.isValid) return showError(phoneValidation.message);

    const selected = employees.find((emp) => String(emp.id) === String(selectedEmployeeId));
    if (!selected) return showError("Selected employee is no longer available");

    setSaving(true);
    try {
      await createUser({
        employeeId: selected.id,
        username: form.username.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: getFormattedPhone(),
        role: String(form.role || "EMPLOYEE").toUpperCase(),
        headOfficeId: selectedHeadOffice?.id || null,
        branchId: selectedBranch?.id || null,
        departmentId: selectedUserDepartment?.id || null,
        designationId: selectedUserDesignation?.id || null,
        institution: selectedBranch?.name || "",
        departmentName: selectedUserDepartment?.name || "",
        team: selectedUserDesignation?.name || "",
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      showSuccess("User created successfully");
      navigate("/useradmin");
    } catch (err) {
      showError(extractApiErrorMessage(err, "Failed to create user"));
    } finally {
      setSaving(false);
    }
  };

  const handleWizardKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (activeTab === 0) {
        handleTabChange(1);
      }
    }
  };

  const scopeSummary = [
    selectedHeadOffice?.name,
    selectedBranch?.name,
    selectedDepartment?.name,
    selectedDesignation?.name,
  ].filter(Boolean).join(" / ");

  const userPermissionSummary = [
    roleRequiresDepartment ? selectedUserDepartment?.name : null,
    roleRequiresTeam ? selectedUserDesignation?.name : null,
  ].filter(Boolean).join(" / ");

  const canGoToNext = validateScopeStep() === null;
  const employeeScopeReady = Boolean(createHeadOfficeId && createBranchId && createDepartmentId && createTeamId);

  return (
    <div className="content user-admin-create-page">
      <style>{`
        .user-admin-create-page .wizard-steps {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        .user-admin-create-page .wizard-step-button {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          width: 100%;
          padding: 0.9rem 1rem;
          border: 1px solid #dbe3ec;
          border-radius: 1rem;
          background: #ffffff;
          text-align: left;
        }
        .user-admin-create-page .wizard-step-button.is-active {
          border-color: #3b82f6;
          box-shadow: 0 10px 24px rgba(59, 130, 246, 0.08);
        }
        .user-admin-create-page .wizard-step-index {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          border-radius: 999px;
          background: #e7edf4;
          color: #3b82f6;
          font-weight: 700;
          flex: 0 0 auto;
        }
        .user-admin-create-page .wizard-step-button.is-active .wizard-step-index {
          background: #3b82f6;
          color: #ffffff;
        }
        .user-admin-create-page .wizard-step-title {
          display: block;
          font-size: 0.94rem;
          font-weight: 600;
          color: #1f2937;
        }
        .user-admin-create-page .wizard-step-copy {
          display: block;
          margin-top: 0.15rem;
          font-size: 0.8rem;
          color: #667085;
        }
        .user-admin-create-page .wizard-panel,
        .user-admin-create-page .wizard-summary-card {
          border: 1px solid #e7ecf2;
          border-radius: 1rem;
          background: #ffffff;
          padding: 1.5rem;
          height: 100%;
        }
        .user-admin-create-page .wizard-panel-title {
          font-size: 1rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.2rem;
        }
        .user-admin-create-page .wizard-panel-copy {
          color: #667085;
          font-size: 0.84rem;
          margin-bottom: 1.5rem;
        }
        .user-admin-create-page .wizard-section-divider {
          border-top: 2px dashed #e7edf4;
          margin: 1.5rem 0;
          padding-top: 1.5rem;
        }
        .user-admin-create-page .wizard-section-subtitle {
          font-size: 0.88rem;
          font-weight: 700;
          color: #3b82f6;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          margin-bottom: 1rem;
        }
        .user-admin-create-page .wizard-summary-item + .wizard-summary-item {
          margin-top: 0.75rem;
        }
        .user-admin-create-page .wizard-summary-label {
          display: block;
          margin-bottom: 0.2rem;
          color: #667085;
          font-size: 0.76rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .user-admin-create-page .wizard-summary-value {
          color: #1f2937;
          font-size: 0.92rem;
          font-weight: 600;
        }
        .user-admin-create-page .wizard-note {
          margin-top: 1.5rem;
          border: 1px dashed #d9e2ec;
          border-radius: 0.9rem;
          background: #f8fafc;
          padding: 0.85rem 0.95rem;
          color: #667085;
          font-size: 0.84rem;
        }
        .user-admin-create-page .form-control,
        .user-admin-create-page .form-select {
          border-radius: 8px;
          border: 1px solid #d0d5dd;
          padding: 0.6rem 1rem;
          font-size: 0.95rem;
        }
        .user-admin-create-page .form-control:focus,
        .user-admin-create-page .form-select:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.15);
        }
        .user-admin-create-page .form-label {
          color: #34393f;
          font-weight: 600;
          font-size: 0.88rem;
          margin-bottom: 0.4rem;
        }
        @media (max-width: 767.98px) {
          .user-admin-create-page .wizard-steps {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Redesigned Custom Header Card */}
      <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderRadius: 12 }}>
        <div className="card-body p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h3 className="fw-bold mb-1 text-slate-800" style={{ fontSize: "1.3rem" }}>Create User</h3>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0" style={{ fontSize: "0.85rem" }}>
                <li className="breadcrumb-item">
                  <Link to="/admin-dashboard" className="text-muted text-decoration-none">
                    <i className="ti ti-smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to="/useradmin" className="text-muted text-decoration-none">
                    User Admin
                  </Link>
                </li>
                <li className="breadcrumb-item active text-primary" aria-current="page">Create User</li>
              </ol>
            </nav>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary d-flex align-items-center gap-2"
              style={{ borderRadius: 8 }}
              onClick={() => navigate("/useradmin")}
              disabled={saving}
            >
              Back to List
            </button>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: 12, overflow: "hidden" }}>
        <div className="card-body p-4">
          <div className="wizard-steps">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabChange(i)}
                className={`wizard-step-button ${activeTab === i ? "is-active" : ""}`}
              >
                <span className="wizard-step-index">{i + 1}</span>
                <span>
                  <span className="wizard-step-title">{tab}</span>
                  <span className="wizard-step-copy">
                    {i === 0 ? "Profile discovery and role scoping" : "Contact details and credentials"}
                  </span>
                </span>
              </button>
            ))}
          </div>

          {activeTab === 0 && (
            <div>
              <div className="row g-4">
                <div className="col-lg-8">
                  <div className="wizard-panel shadow-none border">
                    <div className="wizard-panel-title">Employee Scope Verification</div>
                    <div className="wizard-panel-copy">Fill the core corporate matrix to pull matching unlinked staff logs.</div>
                    
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Head Office <span className="text-danger">*</span></label>
                        <select
                          className="form-select"
                          value={createHeadOfficeId}
                          onChange={(e) => handleHeadOfficeChange(e.target.value)}
                          disabled={loadingHeadOffices}
                        >
                          <option value="">Select</option>
                          {headOffices.map((ho) => (
                            <option key={ho.id} value={ho.id}>{ho.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Branch <span className="text-danger">*</span></label>
                        <select
                          className="form-select"
                          value={createBranchId}
                          onChange={(e) => handleBranchChange(e.target.value)}
                          disabled={!createHeadOfficeId || loadingBranches}
                        >
                          <option value="">Select</option>
                          {branches.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label"> Department <span className="text-danger">*</span></label>
                        <select
                          className="form-select"
                          value={createDepartmentId}
                          onChange={(e) => handleDepartmentChange(e.target.value)}
                          disabled={!createBranchId || departments.length === 0 || loadingDepartments}
                        >
                          <option value="">Select</option>
                          {departments.map((d) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Designation <span className="text-danger">*</span></label>
                        <select
                          className="form-select"
                          value={createTeamId}
                          onChange={(e) => handleTeamChange(e.target.value)}
                          disabled={!createBranchId || !createDepartmentId || designations.length === 0 || loadingDesignations}
                        >
                          <option value="">Select</option>
                          {designations.map((desig) => (
                            <option key={desig.id} value={desig.id}>{desig.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-12">
                        <label className="form-label">Select Target Employee <span className="text-danger">*</span></label>
                        <select
                          className="form-select"
                          value={selectedEmployeeId}
                          onChange={(e) => handleSelectEmployee(e.target.value)}
                          disabled={!employeeScopeReady || loadingEmployees}
                        >
                          {!employeeScopeReady ? (
                            <option value="">Complete the physical HRM profile selection above first</option>
                          ) : loadingEmployees ? (
                            <option value="">Searching branch records...</option>
                          ) : (
                            <option value="">Select</option>
                          )}
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {selectedEmployeeId && (
                      <div className="wizard-section-divider">
                        <div className="wizard-section-subtitle">Portal Permissions Configuration</div>
                        <div className="row g-3">
                          <div className="col-md-12">
                            <label className="form-label">System Role Access Level <span className="text-danger">*</span></label>
                            <select className="form-select" value={form.role} onChange={(e) => handleRoleChange(e.target.value)}>
                              {allowedAssignRoles.map((role) => (
                                <option key={role} value={role}>{role.replace(/_/g, " ")}</option>
                              ))}
                            </select>
                          </div>

                          <div className="col-md-6">
                            <label className="form-label">User Department Permissions Scope <span className="text-danger">*</span></label>
                            <select
                              className="form-select"
                              value={selectedUserDepartmentId}
                              onChange={(e) => handleUserDepartmentChange(e.target.value)}
                              disabled={!roleRequiresDepartment || userDepartments.length === 0 || loadingUserDepartments}
                            >
                              {!roleRequiresDepartment ? (
                                <option value="">Broad branch authority applied (Admin)</option>
                              ) : loadingUserDepartments ? (
                                <option value="">Loading department scopes...</option>
                              ) : userDepartments.length === 0 ? (
                                <option value="">No user department scopes found for this branch</option>
                              ) : (
                                <>
                                  <option value="">Select</option>
                                  {userDepartments.map((ud) => (
                                    <option key={ud.id} value={ud.id}>{ud.name}</option>
                                  ))}
                                </>
                              )}
                            </select>
                          </div>

                          <div className="col-md-6">
                            <label className="form-label">User Designation Permissions Scope <span className="text-danger">*</span></label>
                            <select
                              className="form-select"
                              value={selectedUserDesignationId}
                              onChange={(e) => handleUserDesignationChange(e.target.value)}
                              disabled={!roleRequiresTeam || !selectedUserDepartmentId || userDesignations.length === 0 || loadingUserDesignations}
                            >
                              {!roleRequiresDepartment ? (
                                <option value="">Broad branch authority applied (Admin)</option>
                              ) : loadingUserDesignations ? (
                                <option value="">Loading designation scopes...</option>
                              ) : !roleRequiresTeam ? (
                                <option value="">Not required for Manager operational scope</option>
                              ) : userDesignations.length === 0 ? (
                                <option value="">No user designation scopes found for this department</option>
                              ) : (
                                <>
                                  <option value="">Select</option>
                                  {userDesignations.map((uds) => (
                                    <option key={uds.id} value={uds.id}>{uds.name}</option>
                                  ))}
                                </>
                              )}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-lg-4">
                  <div className="wizard-summary-card shadow-none border">
                    <div className="wizard-panel-title">Live Metadata Summary</div>
                    <div className="wizard-panel-copy">Tracks active selections across parallel layers.</div>
                    
                    <div className="wizard-summary-item">
                      <span className="wizard-summary-label">Physical HRM Scope</span>
                      <span className="wizard-summary-value">{scopeSummary || "Not selected"}</span>
                    </div>
                    <div className="wizard-summary-item">
                      <span className="wizard-summary-label">Target Employee</span>
                      <span className="wizard-summary-value">{selectedEmployee?.name || "Not verified"}</span>
                    </div>
                    <div className="wizard-summary-item">
                      <span className="wizard-summary-label">Assigned App Persona</span>
                      <span className="wizard-summary-value">{selectedRole.replace(/_/g, " ")}</span>
                    </div>
                    <div className="wizard-summary-item">
                      <span className="wizard-summary-label">System Portal Target</span>
                      <span className="wizard-summary-value">{userPermissionSummary || "None (Full Branch)"}</span>
                    </div>

                    <div className="wizard-note">
                      {selectedRole === "ADMIN"
                        ? "Admins inherit root access parameters across all digital operations inside the selected branch anchor."
                        : selectedRole === "MANAGER"
                          ? "Managers are bounded directly to the targeted digital user department loop."
                          : "Team leads and standard accounts are tied strictly to structural user designation permission sets."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 1 && (
            <form
              id="user-create-form"
              onSubmit={(e) => e.preventDefault()}
              onKeyDown={handleWizardKeyDown}
              autoComplete="off"
            >
              <div className="row g-4">
                <div className="col-lg-8">
                  <div className="wizard-panel shadow-none border">
                    <div className="wizard-panel-title">Contact and credentials</div>
                    <div className="wizard-panel-copy">Verify extracted identity details and declare secure entry credentials.</div>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">First Name</label>
                        <input
                          className="form-control"
                          value={form.firstName}
                          onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                          placeholder="First Name"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Last Name</label>
                        <input
                          className="form-control"
                          value={form.lastName}
                          onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                          placeholder="Last Name"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Email <span className="text-danger">*</span></label>
                        <input
                          type="email"
                          className="form-control"
                          value={form.email}
                          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                          placeholder="email@example.com"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Mobile Number</label>
                        <div className={`employee-phone-input ${phoneError ? "employee-phone-input-error" : ""}`}>
                          <select
                            className="employee-phone-code"
                            value={phoneCountryCode}
                            onChange={(e) => handlePhoneCountryCodeChange(e.target.value)}
                          >
                            {COUNTRY_CODE_OPTIONS.map((opt) => (
                              <option key={`${opt.country}-${opt.callingCode}`} value={opt.value}>
                                {opt.value}
                              </option>
                            ))}
                          </select>
                          <input
                            type="tel"
                            className="employee-phone-number"
                            value={form.phone || ""}
                            maxLength={phoneDisplayMaxLength || 15}
                            onChange={(e) => handlePhoneInput(e.target.value)}
                            onBlur={handlePhoneBlur}
                            placeholder={`Enter ${phoneDisplayMaxLength} digit number`}
                          />
                        </div>
                        {phoneError && <small className="text-danger mt-1 d-block">{phoneError}</small>}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Username <span className="text-danger">*</span></label>
                        <input
                          className="form-control"
                          value={form.username}
                          onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                          placeholder="Username"
                          autoComplete="new-username"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Password <span className="text-danger">*</span></label>
                        <div className="position-relative">
                          <input
                            type={showCreatePassword ? "text" : "password"}
                            className="form-control"
                            value={form.password}
                            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                            placeholder="........"
                            autoComplete="new-password"
                            style={{ paddingRight: "2.75rem" }}
                          />
                          <button
                            type="button"
                            className="btn btn-link p-0 text-muted"
                            style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", zIndex: 10, textDecoration: "none" }}
                            onClick={() => setShowCreatePassword((prev) => !prev)}
                            aria-label={showCreatePassword ? "Hide password" : "Show password"}
                          >
                            <i className={`ti ${showCreatePassword ? "ti-eye-off" : "ti-eye"}`} style={{ fontSize: "1.1rem" }} />
                          </button>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Confirm Password <span className="text-danger">*</span></label>
                        <div className="position-relative">
                          <input
                            type={showCreatePassword ? "text" : "password"}
                            className="form-control"
                            value={form.confirmPassword}
                            onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                            placeholder="........"
                            autoComplete="new-password"
                            style={{ paddingRight: "2.75rem" }}
                          />
                          <button
                            type="button"
                            className="btn btn-link p-0 text-muted"
                            style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", zIndex: 10, textDecoration: "none" }}
                            onClick={() => setShowCreatePassword((prev) => !prev)}
                            aria-label={showCreatePassword ? "Hide password" : "Show password"}
                          >
                            <i className={`ti ${showCreatePassword ? "ti-eye-off" : "ti-eye"}`} style={{ fontSize: "1.1rem" }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-lg-4">
                  <div className="wizard-summary-card shadow-none border">
                    <div className="wizard-panel-title">Review Access Parameters</div>
                    <div className="wizard-panel-copy">Perform absolute visual verification before creating database credentials.</div>
                    <div className="wizard-summary-item">
                      <span className="wizard-summary-label">Username</span>
                      <span className="wizard-summary-value">{form.username || "Not entered"}</span>
                    </div>
                    <div className="wizard-summary-item">
                      <span className="wizard-summary-label">Email</span>
                      <span className="wizard-summary-value">{form.email || "Not entered"}</span>
                    </div>
                    <div className="wizard-summary-item">
                      <span className="wizard-summary-label">Employee Target</span>
                      <span className="wizard-summary-value">{selectedEmployee?.name || "Not selected"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="card-footer d-flex justify-content-end gap-2 bg-light p-3 border-top">
          {activeTab === 0 ? (
            <>
              <button
                type="button"
                className="btn btn-white border"
                onClick={() => navigate("/useradmin")}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleTabChange(1)}
                disabled={saving || !canGoToNext}
              >
                Next
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-white border"
                onClick={() => setActiveTab(0)}
                disabled={saving}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? "Creating..." : "Create User"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
