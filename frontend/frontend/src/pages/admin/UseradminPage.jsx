import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  changeUserRole,
  deleteSelectedSessions,
  deleteUser,
  getPendingUsers,
  getUserLogs,
  getUserSessions,
  getUsers,
  setUserActive,
} from "../../api/userAdminApi";
import { getUserDepartments, getUserDesignations } from "../../api/userPermissionsApi";
import { getInstitutions, getUserOrgSelection } from "../../api/orgHierarchyApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/system/ToastProvider";
import "./LeadsPage.css";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import ConfirmDialog from "../../components/system/ConfirmDialog";

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

const INITIAL_FILTERS = {
  search: "",
  role: "",
  status: "",
  institution: "",      
  department: "",       
  team: "",             
};

const normalizeText = (value) => String(value || "").trim().toLowerCase();
const sameText = (left, right) => normalizeText(left) === normalizeText(right);

function UseradminPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const currentRole = String(currentUser?.role || "").toUpperCase();

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionSelection, setSessionSelection] = useState(new Set());
  const [userLogs, setUserLogs] = useState([]);
  const [pendingRows, setPendingRows] = useState([]);
  const [pendingPage, setPendingPage] = useState(0);
  const [pendingSize, setPendingSize] = useState(10);
  const [pendingTotalPages, setPendingTotalPages] = useState(0);
  const [pendingTotalElements, setPendingTotalElements] = useState(0);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("users");

  // Selection states
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Filter Panel States
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [isFilterOpen, setIsFilterOpen] = useState(false); 
  const [orgLoading, setOrgLoading] = useState(false);
  
  const [institutionId, setInstitutionId] = useState("");
  const [userDepartmentId, setUserDepartmentId] = useState("");

  const [institutions, setInstitutions] = useState([]);
  const [userDepartments, setUserDepartments] = useState([]);
  const [userDesignations, setUserDesignations] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Load Primary Users List
  const load = async (nextPage = page, nextSize = size) => {
    setLoading(true);
    try {
      const payload = await getUsers(nextPage, nextSize);
      setRows(payload.items || []);
      setPage(payload.page ?? nextPage);
      setSize(payload.size ?? nextSize);
      setTotalPages(payload.totalPages ?? 0);
      setTotalElements(payload.totalElements ?? 0);
      setSelectedIds(new Set());
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to load users"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  // Load Pending Approvals List
  const loadPending = async (nextPage = pendingPage, nextSize = pendingSize) => {
    setPendingLoading(true);
    try {
      const payload = await getPendingUsers(nextPage, nextSize);
      setPendingRows(payload.items || []);
      setPendingPage(payload.page ?? nextPage);
      setPendingSize(payload.size ?? nextSize);
      setPendingTotalPages(payload.totalPages ?? 0);
      setPendingTotalElements(payload.totalElements ?? 0);
      setSelectedIds(new Set());
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to load pending users"));
      setPendingRows([]);
    } finally {
      setPendingLoading(false);
    }
  };

  useEffect(() => {
    load(0, size);
    loadPending(0, pendingSize);
  }, []);

  // Load Physical Branches
  useEffect(() => {
    let isMounted = true;
    const loadInstitutions = async () => {
      setOrgLoading(true);
      try {
        const data = await getInstitutions();
        if (!isMounted) return;
        setInstitutions(Array.isArray(data) ? data : []);

        const currentInstitutionName = currentUser?.institution || "";
        if (currentInstitutionName) {
          const match = data.find(
            (item) => String(item.name || "").toLowerCase() === String(currentInstitutionName).toLowerCase()
          );
          if (match) {
            setInstitutionId(String(match.id));
          }
        }
      } catch (e) {
        if (isMounted) showError(extractApiErrorMessage(e, "Failed to load branches"));
      } finally {
        if (isMounted) setOrgLoading(false);
      }
    };
    loadInstitutions();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.institution]);

  // Load User Configuration Data Scopes on Mount
  useEffect(() => {
    let isMounted = true;
    const loadUserSelection = async () => {
      if (!currentUser?.id) return;
      try {
        const selection = await getUserOrgSelection(currentUser.id);
        if (!isMounted || !selection) return;
        if (selection.institutionId) setInstitutionId(String(selection.institutionId));
      } catch (e) {
        if (isMounted) showError(extractApiErrorMessage(e, "Failed to load org selections"));
      }
    };
    loadUserSelection();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  // Fetch departments when branch changes
  useEffect(() => {
    let isMounted = true;
    const loadUserDepartments = async () => {
      if (!institutionId) {
        setUserDepartments([]);
        return;
      }
      setOrgLoading(true);
      try {
        const data = await getUserDepartments(institutionId);
        if (!isMounted) return;
        setUserDepartments(Array.isArray(data) ? data : []);

        const currentDeptName = currentUser?.departmentName || "";
        if (currentDeptName && currentRole !== "SUPER_ADMIN") {
          const match = data.find((item) => sameText(item.name, currentDeptName));
          if (match) setUserDepartmentId(String(match.id));
        }
      } catch (e) {
        if (isMounted) showError(extractApiErrorMessage(e, "Failed to load user departments"));
      } finally {
        if (isMounted) setOrgLoading(false);
      }
    };
    loadUserDepartments();
    return () => {
      isMounted = false;
    };
  }, [institutionId, currentUser?.departmentName, currentRole]);

  // Fetch designations when department changes
  useEffect(() => {
    let isMounted = true;
    const loadUserDesignations = async () => {
      if (!institutionId || !userDepartmentId) {
        setUserDesignations([]);
        return;
      }
      setOrgLoading(true);
      try {
        const data = await getUserDesignations(userDepartmentId);
        if (!isMounted) return;
        setUserDesignations(Array.isArray(data) ? data : []);
      } catch (e) {
        if (isMounted) showError(extractApiErrorMessage(e, "Failed to load user designations"));
      } finally {
        if (isMounted) setOrgLoading(false);
      }
    };
    loadUserDesignations();
    return () => {
      isMounted = false;
    };
  }, [institutionId, userDepartmentId]);

  const canAccessPage = useMemo(() => {
    return currentRole && currentRole !== "EMPLOYEE";
  }, [currentRole]);

  const isSameBranch = (row) => !currentUser?.institution || sameText(row?.institution, currentUser?.institution);
  const isSameDepartment = (row) => !currentUser?.departmentName || sameText(row?.departmentName, currentUser?.departmentName);
  const isSameTeam = (row) => !currentUser?.team || sameText(row?.team, currentUser?.team);

  const canSeeUser = (row) => {
    const role = String(currentUser?.role || "").toUpperCase();
    if (role === "SUPER_ADMIN") return true;
    if (role === "ADMIN") return isSameBranch(row);
    if (role === "MANAGER") {
      return isSameDepartment(row) && ["TEAM_LEAD", "EMPLOYEE"].includes(String(row?.role || "").toUpperCase());
    }
    if (role === "TEAM_LEAD") {
      return isSameTeam(row) && String(row?.role || "").toUpperCase() === "EMPLOYEE";
    }
    return false;
  };

  const visibleRows = useMemo(() => rows.filter(canSeeUser), [rows, currentUser]);
  const visiblePendingRows = useMemo(() => pendingRows.filter(canSeeUser), [pendingRows, currentUser]);

  const ordered = useMemo(() => [...visibleRows].sort((a, b) => (b.id || 0) - (a.id || 0)), [visibleRows]);
  const orderedPending = useMemo(() => [...visiblePendingRows].sort((a, b) => (b.id || 0) - (a.id || 0)), [visiblePendingRows]);

  const roleOptions = useMemo(() => [...FALLBACK_ROLES], []);

  const applyFilters = (targetRows) => {
    const searchTerm = filters.search.trim().toLowerCase();
    return targetRows.filter((row) => {
      if (searchTerm) {
        const haystack = [row.username, row.email, row.firstName, row.lastName].filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(searchTerm)) return false;
      }

      if (filters.status) {
        if (Boolean(row.active) !== (filters.status === "ACTIVE")) return false;
      }

      if (currentRole === "SUPER_ADMIN" || currentRole === "ADMIN") {
        if (filters.institution && !sameText(row.institution, filters.institution)) return false;
        if (filters.role && row.role !== filters.role) return false;
        if (filters.department && !sameText(row.departmentName, filters.department)) return false;
        if (filters.team && !sameText(row.team, filters.team)) return false;
      } else if (currentRole === "MANAGER") {
        if (filters.team && !sameText(row.team, filters.team)) return false;
      }

      return true;
    });
  };

  const filteredRows = useMemo(() => applyFilters(ordered), [ordered, filters, currentRole]);
  const filteredPending = useMemo(() => applyFilters(orderedPending), [orderedPending, filters, currentRole]);

  const allowedAssignRoles = useMemo(() => {
    const configured = new Set(ROLE_OPTIONS.map((role) => String(role || "").trim().toUpperCase()));
    return (ROLE_ASSIGNMENT_OPTIONS[currentRole] || []).filter((role) => configured.has(role));
  }, [currentRole]);

  const openCreate = () => navigate("/useradmin/create");
  const openEdit = (row) => row?.id && navigate(`/user-edit/${row.id}`, { state: { user: row } });

  const handleToggleActive = async (row) => {
    setSaving(true);
    try {
      await setUserActive(row.id, !row.active);
      showSuccess(row.active ? "User deactivated" : "User activated");
      await load();
      await loadPending();
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to update status"));
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (row, role) => {
    if (!allowedAssignRoles.includes(role)) {
      showError("You are not allowed to assign this role");
      return;
    }
    setSaving(true);
    try {
      await changeUserRole(row.id, role);
      showSuccess("Role updated");
      await load();
      await loadPending();
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to update role"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!row?.id) return;
    setUserToDelete(row);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete?.id) return;
    setSaving(true);
    try {
      await deleteUser(userToDelete.id);
      showSuccess("User deleted");
      await load();
      await loadPending();
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to delete user"));
    } finally {
      setSaving(false);
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  // Selection Checkbox Logic
  const handleSelectAll = (checked) => {
    const list = activeTab === "users" ? filteredRows : filteredPending;
    if (checked) {
      setSelectedIds(new Set(list.map(r => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id, checked) => {
    const next = new Set(selectedIds);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setSelectedIds(next);
  };

  // Bulk Actions
  const handleBulkToggleActive = async (active) => {
    setSaving(true);
    try {
      await Promise.all(Array.from(selectedIds).map(id => setUserActive(id, active)));
      showSuccess(active ? "Selected users activated" : "Selected users deactivated");
      setSelectedIds(new Set());
      await load();
      await loadPending();
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to update selected users"));
    } finally {
      setSaving(false);
    }
  };

  const handleBulkDelete = async () => {
    setSaving(true);
    try {
      await Promise.all(Array.from(selectedIds).map(id => deleteUser(id)));
      showSuccess("Selected users deleted");
      setSelectedIds(new Set());
      await load();
      await loadPending();
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to delete selected users"));
    } finally {
      setSaving(false);
      setShowBulkDeleteConfirm(false);
    }
  };

  // Export methods
  const getTargetRows = () => {
    const all = activeTab === "users" ? filteredRows : filteredPending;
    return selectedIds.size > 0
      ? all.filter(r => selectedIds.has(r.id))
      : all;
  };

  const exportExcel = () => {
    const targetRows = getTargetRows();
    const headers = activeTab === "users"
      ? ["Username", "System Role", "E-mail", "User Department", "User Designation"]
      : ["Username", "Status", "E-mail", "Registered"];
    const escapeXml = (unsafe) => String(unsafe ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const headerHtml = `<tr>${headers.map(h => `<th>${escapeXml(h)}</th>`).join("")}</tr>`;
    const rowsHtml = targetRows.map(r => activeTab === "users" ? `
      <tr>
        <td>${escapeXml(r.username)}</td>
        <td>${escapeXml(r.role)}</td>
        <td>${escapeXml(r.email)}</td>
        <td>${escapeXml(r.departmentName)}</td>
        <td>${escapeXml(r.team)}</td>
      </tr>
    ` : `
      <tr>
        <td>${escapeXml(r.username)}</td>
        <td>Pending</td>
        <td>${escapeXml(r.email)}</td>
        <td>${escapeXml(r.registeredAt)}</td>
      </tr>
    `).join("");
    const template = `<html><head><meta charset="UTF-8"/></head><body><table><thead>${headerHtml}</thead><tbody>${rowsHtml}</tbody></table></body></html>`;
    const blob = new Blob([template], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `users-${activeTab}-${Date.now()}.xls`;
    link.click();
  };

  const exportCsv = () => {
    const targetRows = getTargetRows();
    const headers = activeTab === "users"
      ? ["Username", "System Role", "E-mail", "User Department", "User Designation"]
      : ["Username", "Status", "E-mail", "Registered"];
    const csvContent = [
      headers.join(","),
      ...targetRows.map(r => activeTab === "users" ? [
        `"${(r.username || '').replace(/"/g, '""')}"`,
        `"${(r.role || '').replace(/"/g, '""')}"`,
        `"${(r.email || '').replace(/"/g, '""')}"`,
        `"${(r.departmentName || '').replace(/"/g, '""')}"`,
        `"${(r.team || '').replace(/"/g, '""')}"`
      ].join(",") : [
        `"${(r.username || '').replace(/"/g, '""')}"`,
        `"Pending"`,
        `"${(r.email || '').replace(/"/g, '""')}"`,
        `"${(r.registeredAt || '').replace(/"/g, '""')}"`
      ].join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `users-${activeTab}-${Date.now()}.csv`;
    link.click();
  };

  const exportPdf = () => {
    const targetRows = getTargetRows();
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text(activeTab === "users" ? "Users Report" : "Pending Users Report", 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 58);
    const headers = activeTab === "users"
      ? [["Username", "System Role", "E-mail", "User Department", "User Designation"]]
      : [["Username", "Status", "E-mail", "Registered"]];
    const body = targetRows.map(r => activeTab === "users" ? [
      r.username || '',
      r.role || '',
      r.email || '',
      r.departmentName || '',
      r.team || ''
    ] : [
      r.username || '',
      'Pending',
      r.email || '',
      r.registeredAt || ''
    ]);
    autoTable(doc, {
      head: headers,
      body,
      startY: 72,
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 40, right: 40 }
    });
    doc.save(`users-${activeTab}-${Date.now()}.pdf`);
  };

  const loadUserDetails = async (row) => {
    if (!row?.id) return;
    setSelectedUser(row);
    setSessions([]);
    setUserLogs([]);
    setSessionSelection(new Set());
    try {
      const [sessionsData, logsData] = await Promise.all([
        getUserSessions(row.id),
        getUserLogs(row.id),
      ]);
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
      setUserLogs(Array.isArray(logsData) ? logsData : []);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to load user details"));
    }
  };

  const toggleSessionSelection = (id) => {
    setSessionSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteSessions = async () => {
    if (!selectedUser?.id || sessionSelection.size === 0) return;
    setSaving(true);
    try {
      await deleteSelectedSessions(selectedUser.id, Array.from(sessionSelection));
      showSuccess("Sessions deleted");
      await loadUserDetails(selectedUser);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to delete sessions"));
    } finally {
      setSaving(false);
    }
  };

  // Compute active badge counter for filters button indicator
  const activeFilterCount = useMemo(() => {
    return Object.keys(filters).filter(k => k !== "search" && filters[k] !== "").length;
  }, [filters]);

  if (!canAccessPage) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body">
            <h4 className="mb-1">Unauthorized</h4>
            <p className="mb-0">You do not have access to this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content user-admin-page">
      <style>{`
        .user-admin-page .form-control,
        .user-admin-page .form-select {
          border-radius: 8px;
          border: 1px solid #d0d5dd;
          padding: 0.6rem 1rem;
          font-size: 0.95rem;
        }
        .user-admin-page .form-control:focus,
        .user-admin-page .form-select:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.15);
        }
        .user-admin-page .show-entries-select {
          padding: 0 8px !important;
          border-radius: 8px !important;
          height: 32px !important;
          font-size: 0.85rem !important;
        }
        .user-admin-page .form-label {
          color: #34393f;
          font-weight: 600;
          font-size: 0.88rem;
          margin-bottom: 0.4rem;
        }
        .user-admin-page .nav-tabs .nav-link {
          color: #64748b;
          font-weight: 500;
          padding: 0.75rem 1.25rem;
        }
        .user-admin-page .nav-tabs .nav-link.active {
          color: #2563eb;
          border-color: #e2e8f0 #e2e8f0 #fff;
          font-weight: 600;
        }
        .user-admin-page .badge {
          border-radius: 1.5rem;
          padding: 0.4rem 0.8rem;
          font-weight: 500;
        }
        .user-admin-page .btn-icon {
          width: 32px;
          height: 32px;
          padding: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
        }
        
        /* PREMIUM SLIDE SIDEBAR FILTER PANEL */
        .user-admin-page .filter-sidebar {
          position: fixed;
          top: 0;
          right: -350px;
          width: 350px;
          height: 100vh;
          background: #ffffff;
          box-shadow: -10px 0 30px rgba(0, 0, 0, 0.1);
          z-index: 1040;
          transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
        }
        .user-admin-page .filter-sidebar.is-open {
          right: 0;
        }
        .user-admin-page .filter-sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(2px);
          z-index: 1030;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.25s linear;
        }
        .user-admin-page .filter-sidebar-overlay.is-visible {
          opacity: 1;
          pointer-events: auto;
        }
        .user-admin-page .filter-sidebar-header {
          padding: 1.25rem;
          border-bottom: 1px solid #eef2f6;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .user-admin-page .filter-sidebar-body {
          padding: 1.25rem;
          overflow-y: auto;
          flex: 1;
        }
        .user-admin-page .filter-sidebar-footer {
          padding: 1.25rem;
          border-top: 1px solid #eef2f6;
          display: flex;
          gap: 0.75rem;
        }
      `}</style>

      {/* Slide Sidebar Backdrop Overlay */}
      <div 
        className={`filter-sidebar-overlay ${isFilterOpen ? "is-visible" : ""}`} 
        onClick={() => setIsFilterOpen(false)} 
      />

      {/* Slide Filter Sidebar */}
      <div className={`filter-sidebar ${isFilterOpen ? "is-open" : ""}`}>
        <div className="filter-sidebar-header">
          <h5 className="mb-0 d-flex align-items-center gap-2">
            <i className="ti ti-filter" style={{ fontSize: "1.2rem" }} /> Filter Criteria
          </h5>
          <button type="button" className="btn-close" onClick={() => setIsFilterOpen(false)} aria-label="Close" />
        </div>
        
        <div className="filter-sidebar-body d-flex flex-column gap-3">
          <div>
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {currentRole === "SUPER_ADMIN" && (
            <div>
              <label className="form-label">Target Branch</label>
              <select
                className="form-select"
                value={filters.institution}
                onChange={(e) => {
                  const val = e.target.value;
                  setFilters((prev) => ({ ...prev, institution: val, department: "", team: "" }));
                  if (val) {
                    const inst = institutions.find((i) => sameText(i.name, val));
                    if (inst) setInstitutionId(String(inst.id));
                  } else {
                    setInstitutionId("");
                  }
                  setUserDepartmentId("");
                }}
              >
                <option value="">Select Branch</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.name}>{inst.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="form-label">User Department</label>
            <select
              className="form-select"
              value={filters.department}
              onChange={(e) => {
                const val = e.target.value;
                setFilters((prev) => ({ ...prev, department: val, team: "" }));
                if (val) {
                  const dept = userDepartments.find((d) => sameText(d.name, val));
                  if (dept) setUserDepartmentId(String(dept.id));
                } else {
                  setUserDepartmentId("");
                }
              }}
              disabled={currentRole === "MANAGER" || (currentRole === "SUPER_ADMIN" ? !filters.institution : !institutionId)}
            >
              <option value="">Select User Department</option>
              {userDepartments.map((dept) => (
                <option key={dept.id} value={dept.name}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">User Designation</label>
            <select
              className="form-select"
              value={filters.team}
              onChange={(e) => setFilters((prev) => ({ ...prev, team: e.target.value }))}
              disabled={currentRole === "SUPER_ADMIN" ? !filters.department : !userDepartmentId}
            >
              <option value="">Select User Designation</option>
              {userDesignations.map((desig) => (
                <option key={desig.id} value={desig.name}>{desig.name}</option>
              ))}
            </select>
          </div>

          {["SUPER_ADMIN", "ADMIN"].includes(currentRole) && (
            <div>
              <label className="form-label">System Role Access</label>
              <select
                className="form-select"
                value={filters.role}
                onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value }))}
              >
                <option value="">All Roles</option>
                {roleOptions
                  .filter((val) => (currentRole === "ADMIN" ? val !== "SUPER_ADMIN" : true))
                  .map((value) => (
                    <option key={value} value={value}>{value.replace(/_/g, " ")}</option>
                  ))}
              </select>
            </div>
          )}
        </div>

        <div className="filter-sidebar-footer">
          <button 
            type="button" 
            className="btn btn-primary w-100" 
            onClick={() => setIsFilterOpen(false)}
          >
            Apply Filters
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary w-100"
            onClick={() => {
              setFilters({ ...INITIAL_FILTERS, search: filters.search });
              if (currentRole === "SUPER_ADMIN") setInstitutionId("");
              setUserDepartmentId("");
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Custom Header Card */}
      <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderRadius: 12 }}>
        <div className="card-body p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h3 className="fw-bold mb-1 text-slate-800" style={{ fontSize: "1.3rem" }}>User Admin</h3>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0" style={{ fontSize: "0.85rem" }}>
                <li className="breadcrumb-item">
                  <Link to="/admin-dashboard" className="text-muted text-decoration-none">
                    <i className="ti ti-smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item text-muted">Admin</li>
                <li className="breadcrumb-item active text-primary" aria-current="page">User Admin</li>
              </ol>
            </nav>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-primary d-flex align-items-center gap-2"
              style={{
                backgroundColor: "#3b82f6",
                borderColor: "#3b82f6",
                fontWeight: "600",
                padding: "10px 20px",
                borderRadius: "10px",
                fontSize: "0.9rem"
              }}
              onClick={openCreate}
            >
              <i className="ti ti-plus" style={{ fontSize: "1.1rem" }} />
              Add User
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: 12, overflow: "hidden" }}>
        {/* Category Tabs Interface */}
        <div className="border-bottom bg-light px-3 pt-2">
          <ul className="nav nav-tabs border-0" role="tablist">
            {["users", "pending", "sessions", "logs"].map((tab) => (
              <li className="nav-item" key={tab}>
                <button
                  className={`nav-link border-0 text-capitalize ${activeTab === tab ? "active bg-white fw-bold text-primary" : "text-muted"}`}
                  type="button"
                  style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
                  onClick={() => {
                    setActiveTab(tab);
                    setSelectedIds(new Set());
                  }}
                >
                  {tab === "users" ? "User Table" : tab === "pending" ? "Awaiting Activation" : tab}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Search & Export Controls Inside Card */}
        <div className="p-3 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3 bg-light">
          <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: 350 }}>
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0" style={{ borderRadius: "8px 0 0 8px" }}>
                <i className="ti ti-search text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                style={{ borderRadius: "0 8px 8px 0", height: 38 }}
                placeholder="Search by username or email..."
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              />
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button 
              type="button" 
              className={`btn border d-flex align-items-center gap-2 ${activeFilterCount > 0 ? "btn-light" : "btn-white"}`}
              style={{ height: 38, borderRadius: 8, fontSize: "0.85rem" }}
              onClick={() => setIsFilterOpen(true)}
            >
              <i className="ti ti-adjustments-horizontal" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="badge bg-dark text-white p-1 px-2" style={{ fontSize: "0.75rem" }}>
                  {activeFilterCount}
                </span>
              )}
            </button>

            {(activeTab === "users" || activeTab === "pending") && (
              <div className="dropdown">
                <button
                  className="btn btn-white border d-flex align-items-center gap-2 dropdown-toggle"
                  type="button"
                  id="usersExportDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{ height: 38, borderRadius: 8, fontSize: "0.85rem" }}
                >
                  <i className="ti ti-download" /> Export
                </button>
                <ul className="dropdown-menu shadow border-0" aria-labelledby="usersExportDropdown">
                  <li><button className="dropdown-item" onClick={exportExcel}>Excel</button></li>
                  <li><button className="dropdown-item" onClick={exportCsv}>CSV</button></li>
                  <li><button className="dropdown-item" onClick={exportPdf}>PDF</button></li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Tab Content Panes Container */}
        <div className="tab-content">
          {activeTab === "users" && (
            <div className="tab-pane fade show active">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 40 }} className="ps-4">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={filteredRows.length > 0 && filteredRows.every(r => selectedIds.has(r.id))}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                      </th>
                      <th>Username</th>
                      <th>System Role</th>
                      <th>E-mail</th>
                      <th>User Department</th>
                      <th>User Designation</th>
                      <th style={{ width: 80 }} className="pe-4 text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} className="text-center py-4">Loading user metrics...</td></tr>
                    ) : filteredRows.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-4 text-muted">No users found matching selections</td></tr>
                    ) : (
                      filteredRows.map((row) => (
                        <tr key={row.id}>
                          <td className="ps-4">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={selectedIds.has(row.id)}
                              onChange={(e) => handleSelectRow(row.id, e.target.checked)}
                            />
                          </td>
                          <td className="fw-semibold text-slate-800">{row.username || "-"}</td>
                          <td>
                            <span className={`badge ${row.active ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger"}`}>
                              {row.role || "User"}
                            </span>
                          </td>
                          <td>{row.email || "-"}</td>
                          <td>{row.departmentName || "-"}</td>
                          <td>{row.team || "-"}</td>
                          <td className="pe-4 text-end">
                            <div className="dropdown">
                              <button className="btn btn-light btn-sm btn-icon" data-bs-toggle="dropdown" aria-expanded="false">
                                <i className="ti ti-dots-vertical" />
                              </button>
                              <ul className="dropdown-menu dropdown-menu-end shadow border-0">
                                <li>
                                  <button className="dropdown-item" onClick={() => openEdit(row)}>
                                    Edit Details
                                  </button>
                                </li>
                                <li>
                                  <button className="dropdown-item" onClick={() => { loadUserDetails(row); setActiveTab("sessions"); }}>
                                    View Sessions
                                  </button>
                                </li>
                                <li>
                                  <button className="dropdown-item" onClick={() => handleToggleActive(row)} disabled={saving}>
                                    {row.active ? "Deactivate" : "Activate"}
                                  </button>
                                </li>
                                <li><hr className="dropdown-divider" /></li>
                                <li>
                                  <button className="dropdown-item text-danger" onClick={() => handleDelete(row)} disabled={saving}>
                                    Delete User
                                  </button>
                                </li>
                              </ul>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Custom Pagination Footer */}
              {!loading && filteredRows.length > 0 && (
                <div className="p-3 border-top d-flex flex-wrap align-items-center justify-content-between gap-3 bg-light">
                  <div className="text-muted small">
                    Showing {totalElements > 0 ? page * size + 1 : 0} to {Math.min((page + 1) * size, totalElements)} of {totalElements} entries
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn-pagination-arrow btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                      style={{ width: 32, height: 32, borderRadius: 6 }}
                      onClick={() => load(page - 1, size)}
                      disabled={page <= 0 || loading}
                    >
                      <i className="ti ti-chevron-left" />
                    </button>
                    {(() => {
                      const buttons = [];
                      for (let i = 0; i < totalPages; i++) {
                        if (i === 0 || i === totalPages - 1 || (i >= page - 2 && i <= page + 2)) {
                          buttons.push(
                            <button
                              key={i}
                              className={`btn-pagination-num btn btn-sm border-0 ${page === i ? 'btn-primary text-white' : 'btn-light'}`}
                              style={{ width: 32, height: 32, borderRadius: 6, fontWeight: "500", backgroundColor: page === i ? "#3b82f6" : undefined }}
                              onClick={() => load(i, size)}
                            >
                              {i + 1}
                            </button>
                          );
                        } else if (i === page - 3 || i === page + 3) {
                          buttons.push(<span key={`dots-${i}`} className="px-1 text-muted">...</span>);
                        }
                      }
                      return buttons;
                    })()}
                    <button
                      type="button"
                      className="btn-pagination-arrow btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                      style={{ width: 32, height: 32, borderRadius: 6 }}
                      onClick={() => load(page + 1, size)}
                      disabled={page + 1 >= totalPages || loading}
                    >
                      <i className="ti ti-chevron-right" />
                    </button>
                    <PageSizeSelector
                      pageSize={size}
                      setPageSize={(newSize) => {
                        setSize(newSize);
                        load(0, newSize);
                      }}
                      setPage={(p) => setPage(p - 1)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "pending" && (
            <div className="tab-pane fade show active">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 40 }} className="ps-4">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={filteredPending.length > 0 && filteredPending.every(r => selectedIds.has(r.id))}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                      </th>
                      <th>Username</th>
                      <th>Status</th>
                      <th>E-mail</th>
                      <th>Registered</th>
                      <th>Assign Security Role</th>
                      <th style={{ width: 80 }} className="pe-4 text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingLoading ? (
                      <tr><td colSpan={7} className="text-center py-4">Loading pending queue...</td></tr>
                    ) : filteredPending.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-4 text-muted">No pending user profiles found</td></tr>
                    ) : (
                      filteredPending.map((row) => (
                        <tr key={row.id}>
                          <td className="ps-4">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={selectedIds.has(row.id)}
                              onChange={(e) => handleSelectRow(row.id, e.target.checked)}
                            />
                          </td>
                          <td className="fw-semibold text-slate-800">{row.username || "-"}</td>
                          <td><span className="badge bg-warning-subtle text-warning">Pending</span></td>
                          <td>{row.email || "-"}</td>
                          <td>{row.registeredAt || "-"}</td>
                          <td>
                            <select
                              className="form-select form-select-sm"
                              style={{ maxWidth: "180px", borderRadius: "6px" }}
                              value={allowedAssignRoles.includes(row.role) ? row.role : allowedAssignRoles[allowedAssignRoles.length - 1] || "EMPLOYEE"}
                              onChange={(e) => handleRoleChange(row, e.target.value)}
                              disabled={saving}
                            >
                              {allowedAssignRoles.map((role) => (
                                <option key={role} value={role}>{role.replace(/_/g, " ")}</option>
                              ))}
                            </select>
                          </td>
                          <td className="pe-4 text-end">
                            <div className="dropdown">
                              <button className="btn btn-light btn-sm btn-icon" data-bs-toggle="dropdown" aria-expanded="false">
                                <i className="ti ti-dots-vertical" />
                              </button>
                              <ul className="dropdown-menu dropdown-menu-end shadow border-0">
                                <li>
                                  <button className="dropdown-item" onClick={() => openEdit(row)}>
                                    Edit Details
                                  </button>
                                </li>
                                <li>
                                  <button className="dropdown-item text-success" onClick={() => handleToggleActive(row)} disabled={saving}>
                                    Activate Account
                                  </button>
                                </li>
                                <li><hr className="dropdown-divider" /></li>
                                <li>
                                  <button className="dropdown-item text-danger" onClick={() => handleDelete(row)} disabled={saving}>
                                    Delete User
                                  </button>
                                </li>
                              </ul>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Custom Pagination Footer for Pending */}
              {!pendingLoading && filteredPending.length > 0 && (
                <div className="p-3 border-top d-flex flex-wrap align-items-center justify-content-between gap-3 bg-light">
                  <div className="text-muted small">
                    Showing {pendingTotalElements > 0 ? pendingPage * pendingSize + 1 : 0} to {Math.min((pendingPage + 1) * pendingSize, pendingTotalElements)} of {pendingTotalElements} entries
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn-pagination-arrow btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                      style={{ width: 32, height: 32, borderRadius: 6 }}
                      onClick={() => loadPending(pendingPage - 1, pendingSize)}
                      disabled={pendingPage <= 0 || pendingLoading}
                    >
                      <i className="ti ti-chevron-left" />
                    </button>
                    {(() => {
                      const buttons = [];
                      for (let i = 0; i < pendingTotalPages; i++) {
                        if (i === 0 || i === pendingTotalPages - 1 || (i >= pendingPage - 2 && i <= pendingPage + 2)) {
                          buttons.push(
                            <button
                              key={i}
                              className={`btn-pagination-num btn btn-sm border-0 ${pendingPage === i ? 'btn-primary text-white' : 'btn-light'}`}
                              style={{ width: 32, height: 32, borderRadius: 6, fontWeight: "500", backgroundColor: pendingPage === i ? "#3b82f6" : undefined }}
                              onClick={() => loadPending(i, pendingSize)}
                            >
                              {i + 1}
                            </button>
                          );
                        } else if (i === pendingPage - 3 || i === pendingPage + 3) {
                          buttons.push(<span key={`dots-${i}`} className="px-1 text-muted">...</span>);
                        }
                      }
                      return buttons;
                    })()}
                    <button
                      type="button"
                      className="btn-pagination-arrow btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                      style={{ width: 32, height: 32, borderRadius: 6 }}
                      onClick={() => loadPending(pendingPage + 1, pendingSize)}
                      disabled={pendingPage + 1 >= pendingTotalPages || pendingLoading}
                    >
                      <i className="ti ti-chevron-right" />
                    </button>
                    <PageSizeSelector
                      pageSize={pendingSize}
                      setPageSize={(newSize) => {
                        setPendingSize(newSize);
                        loadPending(0, newSize);
                      }}
                      setPage={(p) => setPendingPage(p - 1)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "sessions" && (
            <div className="tab-pane fade show active p-4">
              {!selectedUser ? (
                <div className="text-muted p-2">Select a user target from the Primary User Table above to track sessions.</div>
              ) : (
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h5 className="mb-0">Active System Connections: <span className="text-primary">{selectedUser.username}</span></h5>
                    <button type="button" className="btn btn-light btn-sm" onClick={() => setSelectedUser(null)}>Clear View</button>
                  </div>
                  <div className="table-responsive card border shadow-none mb-3" style={{ borderRadius: "10px" }}>
                    <table className="table mb-0 table-striped">
                      <thead className="table-light">
                        <tr>
                          <th className="ps-4" style={{ width: "50px" }}></th>
                          <th>IP Connection</th>
                          <th>Persistent State</th>
                          <th>Last Communication</th>
                          <th className="pe-4">Expiration Stamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.length === 0 ? (
                          <tr><td colSpan={5} className="text-center py-3 text-muted">No active network sessions detected</td></tr>
                        ) : (
                          sessions.map((session) => (
                            <tr key={session.id}>
                              <td className="ps-4">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={sessionSelection.has(session.id)}
                                  onChange={() => toggleSessionSelection(session.id)}
                                />
                              </td>
                              <td><code>{session.ipAddress || "-"}</code></td>
                              <td>{session.persistent ? "Yes" : "No"}</td>
                              <td>{session.lastUpdateAt || "-"}</td>
                              <td className="pe-4">{session.expiresAt || "-"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <button
                    className="btn btn-sm btn-danger px-3"
                    style={{ borderRadius: "8px" }}
                    onClick={handleDeleteSessions}
                    disabled={sessionSelection.size === 0 || saving}
                  >
                    Terminate Selected Sessions
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "logs" && (
            <div className="tab-pane fade show active p-4">
              {!selectedUser ? (
                <div className="text-muted p-2">Select a user target from the Primary User Table above to fetch audit logs.</div>
              ) : (
                <div className="table-responsive card border shadow-none" style={{ borderRadius: "10px" }}>
                  <table className="table mb-0 table-striped">
                    <thead className="table-light">
                      <tr>
                        <th className="ps-4">Logged Security Event</th>
                        <th>Origin IP</th>
                        <th className="pe-4">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userLogs.length === 0 ? (
                        <tr><td colSpan={3} className="text-center py-3 text-muted">No security audit event logs found</td></tr>
                      ) : (
                        userLogs.map((log) => (
                          <tr key={log.id}>
                            <td className="ps-4 fw-medium">{log.event || "-"}</td>
                            <td><code>{log.ipAddress || "-"}</code></td>
                            <td className="pe-4">{log.eventAt || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Dark Bottom Actions Bar */}
      {selectedIds.size > 0 && (activeTab === "users" || activeTab === "pending") && createPortal(
        <div className="floating-bulk-bar" style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#0f172a",
          color: "#fff",
          padding: "12px 24px",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          gap: 16,
          zIndex: 9999,
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
        }}>
          <span className="small">{selectedIds.size} user(s) selected</span>
          <button className="btn btn-sm btn-outline-light" onClick={() => setSelectedIds(new Set())}>Clear</button>
          
          {activeTab === "users" && (
            <>
              <button className="btn btn-sm btn-success" onClick={() => handleBulkToggleActive(true)} disabled={saving}>Bulk Activate</button>
              <button className="btn btn-sm btn-warning" onClick={() => handleBulkToggleActive(false)} disabled={saving}>Bulk Deactivate</button>
            </>
          )}

          {activeTab === "pending" && (
            <button className="btn btn-sm btn-success" onClick={() => handleBulkToggleActive(true)} disabled={saving}>Bulk Activate</button>
          )}

          <button className="btn btn-sm btn-danger" onClick={() => setShowBulkDeleteConfirm(true)} disabled={saving}>Bulk Delete</button>
        </div>,
        document.body
      )}

      {/* Individual Delete Confirm Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete User Account"
        message={`Are you completely sure you want to erase the account profile "${userToDelete?.username || userToDelete?.email}"? All active tokens and references will be purged.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setShowDeleteConfirm(false); setUserToDelete(null); }}
        confirmLabel="Confirm Delete"
        cancelLabel="Cancel"
      />

      {/* Bulk Delete Confirm Dialog */}
      <ConfirmDialog
        open={showBulkDeleteConfirm}
        title="Bulk Delete Users"
        message={`Are you completely sure you want to delete the ${selectedIds.size} selected user accounts? This action is irreversible.`}
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkDeleteConfirm(false)}
        confirmLabel="Confirm Bulk Delete"
        cancelLabel="Cancel"
      />
    </div>
  );
}

export default UseradminPage;
