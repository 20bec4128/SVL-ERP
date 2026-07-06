import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bulkCreateLeads, getAssignableLeadGroups, checkDuplicateLeads, getImportableEmployees } from '../../api/leadsApi';
import { getGroupMembers, getUserGroups } from '../../api/userGroupApi';
import { getLeadFlow } from '../../api/flowApi';
import { getBranches } from '../../api/branchesApi';
import { CRM_PAGE_OPTIONS } from '../../constants/crmPages';
import { useAuth } from '../../context/AuthContext';
import LeadImportEditModal from '../../components/admin/LeadImportEditModal';
import './LeadImportPage.css';

const QUICK_SELECT_OPTIONS = [
  { label: 'First 10', value: 10 },
  { label: 'First 25', value: 25 },
  { label: 'First 50', value: 50 },
  { label: 'First 100', value: 100 },
  { label: 'All', value: Infinity },
];

const CSV_COLUMNS = [
  'name', 'mobile', 'email', 'primarySource',
  'secondarySource', 'productType', 'variant', 'quantity', 'companyName',
  'streetAddress', 'state', 'district',
];

function cleanImportMobile(value) {
  if (!value) return "";
  // Strip URI prefixes like "p:" or "tel:"
  let cleaned = String(value).replace(/^(p:|tel:)/i, "").trim();
  // Strip all non-digits
  cleaned = cleaned.replace(/\D/g, "");
  // If it starts with 91 and has 12 digits, strip the 91 country code
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    cleaned = cleaned.slice(2);
  }
  // If it starts with 0 and has 11 digits, strip the 0
  else if (cleaned.length === 11 && cleaned.startsWith("0")) {
    cleaned = cleaned.slice(1);
  }
  return cleaned;
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith('#'));
  if (lines.length < 2) return [];
  return lines.slice(1).map((line, idx) => {
    const cols = line.split(',').map((c) => c.trim());
    const row = { _rowIndex: idx };
    CSV_COLUMNS.forEach((col, i) => {
      let val = cols[i] || '';
      if (col === 'mobile') {
        val = cleanImportMobile(val);
      }
      row[col] = val;
    });
    row._error = !row.name || !row.mobile || !row.primarySource ? 'Missing required field(s)' : null;
    return row;
  });
}

function downloadSampleCSV() {
  const mandatoryNote = '# MANDATORY: name | mobile | primarySource';
  const optionalNote = '# OPTIONAL: email | secondarySource | productType | variant | quantity | companyName | streetAddress | state | district';
  const header = CSV_COLUMNS.join(',');
  const sample = [
    'John Doe,9876543210,john@example.com,Facebook,Google,Software,Large,100,Acme Corp,123 Main St,Maharashtra,Mumbai',
    'Jane Smith,9123456789,jane@example.com,Google,Facebook,Hardware,Medium,50,Tech Solutions,456 Oak Ave,Karnataka,Bengaluru',
  ].join('\n');
  const csv = mandatoryNote + '\n' + optionalNote + '\n' + header + '\n' + sample;
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leads-sample.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function LeadImportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = String(user?.role || '').toUpperCase();
  const fileInputRef = useRef(null);

  // rows state
  const [rows, setRows] = useState([]);
  const [checkedIndexes, setCheckedIndexes] = useState(new Set());
  const [dupCheckedIndexes, setDupCheckedIndexes] = useState(new Set());

  // duplicate check state
  const [dupCheckLoading, setDupCheckLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('valid'); // 'valid' | 'duplicate'

  // employees / groups
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [employeePickerValue, setEmployeePickerValue] = useState('');
  const [dupSelectedEmployeeIds, setDupSelectedEmployeeIds] = useState([]);
  const [dupEmployeePickerValue, setDupEmployeePickerValue] = useState('');

  // misc
  const [submitting, setSubmitting] = useState(false);
  const [dupSubmitting, setDupSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [dupSubmitError, setDupSubmitError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [dupSuccessMsg, setDupSuccessMsg] = useState('');
  const [showCustomCount, setShowCustomCount] = useState(false);
  const [customCount, setCustomCount] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRowForEdit, setSelectedRowForEdit] = useState(null);

  const leadPageKey = CRM_PAGE_OPTIONS.find((item) => item.key === 'leads')?.key || 'leads';
  const [branchOptions, setBranchOptions] = useState([]);
  const [groupOptions, setGroupOptions] = useState([]);
  const [flowRules, setFlowRules] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedBranchName, setSelectedBranchName] = useState('');
  const [createBranchFlowGroupId, setCreateBranchFlowGroupId] = useState('');

  const selectedBranch = useMemo(
    () => branchOptions.find((branch) => String(branch.id) === String(selectedBranchId)),
    [branchOptions, selectedBranchId],
  );
  const selectedBranchNameValue = String(selectedBranch?.name || selectedBranchName || '').trim();

  const leadEligibleGroups = useMemo(
    () =>
      groupOptions.filter((group) =>
        Array.isArray(group.pageKeys)
          ? group.pageKeys.map((key) => String(key || '').trim().toLowerCase()).includes(leadPageKey)
          : false,
      ),
    [groupOptions, leadPageKey],
  );

  const importBranchOptions = useMemo(
    () =>
      role === 'SUPER_ADMIN'
        ? (Array.isArray(branchOptions) ? branchOptions : []).filter((branch) => branch?.id != null)
        : Array.from(
            new Set(
              leadEligibleGroups
                .map((group) => String(group?.institutionName || '').trim())
                .filter(Boolean),
            ),
          ),
    [branchOptions, leadEligibleGroups, role],
  );

  const newLeadFlowGroupId = useMemo(() => {
    const rule = Array.isArray(flowRules)
      ? flowRules.find((item) => String(item?.status || '').trim().toLowerCase() === 'new lead')
      : null;
    return rule?.handledByGroupId != null && String(rule.handledByGroupId).trim() !== ''
      ? String(rule.handledByGroupId)
      : '';
  }, [flowRules]);

  const fallbackLeadGroup = useMemo(
    () => (leadEligibleGroups.length > 0 ? leadEligibleGroups[0] : null),
    [leadEligibleGroups],
  );

  const importGroup = useMemo(() => {
    if (role === 'SUPER_ADMIN') {
      if (!selectedBranchId) return null;
      const branchFlowGroup = createBranchFlowGroupId
        ? leadEligibleGroups.find((group) => String(group.id) === String(createBranchFlowGroupId)) || null
        : null;
      return branchFlowGroup || fallbackLeadGroup;
    }
    return newLeadFlowGroupId
      ? leadEligibleGroups.find((group) => String(group.id) === String(newLeadFlowGroupId)) || fallbackLeadGroup
      : fallbackLeadGroup;
  }, [createBranchFlowGroupId, fallbackLeadGroup, leadEligibleGroups, newLeadFlowGroupId, role, selectedBranchId]);

  const importGroupId = useMemo(() => {
    if (role === 'SUPER_ADMIN') {
      if (!selectedBranchId) return '';
      return createBranchFlowGroupId || (importGroup?.id ? String(importGroup.id) : '');
    }
    return importGroup?.id ? String(importGroup.id) : '';
  }, [createBranchFlowGroupId, importGroup?.id, role, selectedBranchId]);

  useEffect(() => {
    let isMounted = true;
    const loadOptions = async () => {
      try {
        const [branches, assignable, allGroups] = await Promise.all([
          role === 'SUPER_ADMIN' ? getBranches() : Promise.resolve([]),
          getAssignableLeadGroups(),
          getUserGroups(),
        ]);
        if (!isMounted) return;
        setBranchOptions(Array.isArray(branches) ? branches : []);
        const byId = new Map((Array.isArray(allGroups) ? allGroups : []).map((g) => [String(g.id), g]));
        const merged = (Array.isArray(assignable) ? assignable : []).map((group) => {
          const full = byId.get(String(group.id));
          const pageKeys =
            Array.isArray(group.pageKeys) && group.pageKeys.length > 0
              ? group.pageKeys
              : Array.isArray(full?.pageKeys) ? full.pageKeys : [];
          return { ...group, pageKeys };
        });
        setGroupOptions(merged);
      } catch {
        if (!isMounted) return;
        setBranchOptions([]);
        setGroupOptions([]);
      }
    };
    loadOptions();
    return () => { isMounted = false; };
  }, [role]);

  useEffect(() => {
    if (role !== 'SUPER_ADMIN') return;
    const branchId = String(selectedBranchId || '').trim();
    const branchName = String(selectedBranchNameValue || '').trim();
    if (!branchId && !branchName) {
      setCreateBranchFlowGroupId('');
      setFlowRules([]);
      return;
    }
    let isMounted = true;
    const loadBranchFlow = async () => {
      try {
        const flowPayload = await getLeadFlow({
          branchId: branchId || null,
          institutionName: branchName,
        });
        if (!isMounted) return;
        const branchRules = Array.isArray(flowPayload?.rules) ? flowPayload.rules : [];
        const newLeadRule = branchRules.find(
          (item) => String(item?.status || '').trim().toLowerCase() === 'new lead',
        );
        const nextGroupId =
          newLeadRule?.handledByGroupId != null && String(newLeadRule.handledByGroupId).trim() !== ''
            ? String(newLeadRule.handledByGroupId)
            : '';
        setCreateBranchFlowGroupId(nextGroupId);
        setFlowRules(branchRules);
      } catch {
        if (!isMounted) return;
        setCreateBranchFlowGroupId('');
        setFlowRules([]);
      }
    };
    loadBranchFlow();
    return () => {
      isMounted = false;
    };
  }, [role, selectedBranchId, selectedBranchNameValue]);

  useEffect(() => {
    if (role === 'EMPLOYEE' && user?.id) {
      setSelectedEmployeeIds([String(user.id)]);
      setDupSelectedEmployeeIds([String(user.id)]);
    } else {
      setSelectedEmployeeIds([]);
      setDupSelectedEmployeeIds([]);
    }
    setEmployeePickerValue('');
    setDupEmployeePickerValue('');
  }, [selectedBranchId, importGroupId, role, user]);

  useEffect(() => {
    let isMounted = true;
    if (role === 'EMPLOYEE' && user?.id) {
      const selfOption = { id: user.id, username: user.username || 'Myself' };
      setEmployees([selfOption]);
      setSelectedEmployeeIds([String(user.id)]);
      setDupSelectedEmployeeIds([String(user.id)]);
      return () => { isMounted = false; };
    }
    if (!importGroupId) {
      if (role === 'SUPER_ADMIN' && selectedBranchId) {
        getImportableEmployees()
          .then((employeesList) => {
            if (!isMounted) return;
            setEmployees(
              (Array.isArray(employeesList) ? employeesList : []).map((employee) => ({
                id: employee.id,
                username: employee.username || `User ${employee.id}`,
              })),
            );
          })
          .catch(() => {
            if (!isMounted) return;
            setEmployees([]);
          });
        return () => {
          isMounted = false;
        };
      }
      setEmployees([]);
      return () => { isMounted = false; };
    }
    getGroupMembers(importGroupId)
      .then((members) => {
        if (!isMounted) return;
        const eligibleMembers = (Array.isArray(members) ? members : []).filter((member) => {
          const roleName = String(member?.role || '').toUpperCase();
          const pageKeys = Array.isArray(member?.pageKeys)
            ? member.pageKeys.map((key) => String(key || '').trim().toLowerCase()).filter(Boolean)
            : [];
          return roleName === 'EMPLOYEE' && (pageKeys.length === 0 || pageKeys.includes(leadPageKey));
        });
        setEmployees(
          eligibleMembers.map((member) => ({
            id: member.userId,
            username: member.username || `User ${member.userId}`,
          })),
        );
      })
      .catch(() => {
        if (!isMounted) return;
        if (role === 'SUPER_ADMIN' && selectedBranchId) {
          getImportableEmployees()
            .then((employeesList) => {
              if (!isMounted) return;
              setEmployees(
                (Array.isArray(employeesList) ? employeesList : []).map((employee) => ({
                  id: employee.id,
                  username: employee.username || `User ${employee.id}`,
                })),
              );
            })
            .catch(() => {
              if (!isMounted) return;
              setEmployees([]);
            });
          return;
        }
        setEmployees([]);
      });
    return () => { isMounted = false; };
  }, [importGroupId, leadPageKey, role, selectedBranchId, user]);

  // ── After CSV parse, run duplicate check ────────────────────────────────
  async function runDuplicateCheck(parsedRows) {
    const validParsed = parsedRows.filter((r) => !r._error);
    if (validParsed.length === 0) return parsedRows;

    setDupCheckLoading(true);
    try {
      const contacts = validParsed.map((r) => ({
        mobile: r.mobile || '',
        email: r.email || '',
        _rowIndex: r._rowIndex,
      }));
      const matches = await checkDuplicateLeads(contacts);
      // matches = [{ mobile, email, matchedLeadId, matchedLeadRef, matchedLeadName }]
      const matchByMobile = new Map(matches.map((m) => [String(m.mobile || '').trim(), m]));
      const matchByEmail = new Map(
        matches
          .filter((m) => m.email)
          .map((m) => [String(m.email || '').trim().toLowerCase(), m]),
      );

      return parsedRows.map((row) => {
        if (row._error) return row;
        const byMobile = matchByMobile.get(String(row.mobile || '').trim());
        const byEmail = row.email
          ? matchByEmail.get(String(row.email || '').trim().toLowerCase())
          : null;
        const match = byMobile || byEmail;
        if (match) {
          return {
            ...row,
            _duplicate: true,
            _duplicateOf: {
              id: match.matchedLeadId,
              ref: match.matchedLeadRef,
              name: match.matchedLeadName,
            },
          };
        }
        return { ...row, _duplicate: false };
      });
    } catch {
      // If check fails, proceed without marking duplicates
      return parsedRows;
    } finally {
      setDupCheckLoading(false);
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const parsed = parseCSV(ev.target.result || '');
      setCheckedIndexes(new Set());
      setDupCheckedIndexes(new Set());
      setSubmitError('');
      setDupSubmitError('');
      setSuccessMsg('');
      setDupSuccessMsg('');
      setActiveTab('valid');
      const checked = await runDuplicateCheck(parsed);
      setRows(checked);
    };
    reader.readAsText(file);
  }

  function handleQuickSelect(value) {
    const validRows = rows.filter((r) => !r._error && !r._duplicate);
    const limit = value === Infinity ? validRows.length : value;
    setCheckedIndexes(new Set(validRows.slice(0, limit).map((r) => r._rowIndex)));
  }

  function toggleRow(rowIndex) {
    setCheckedIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(rowIndex)) next.delete(rowIndex);
      else next.add(rowIndex);
      return next;
    });
  }

  function toggleDupRow(rowIndex) {
    setDupCheckedIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(rowIndex)) next.delete(rowIndex);
      else next.add(rowIndex);
      return next;
    });
  }

  function toggleEmployee(id) {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleDupEmployee(id) {
    setDupSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function addEmployeeFromDropdown(id) {
    if (!id) return;
    setSelectedEmployeeIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setEmployeePickerValue('');
  }

  function addDupEmployeeFromDropdown(id) {
    if (!id) return;
    setDupSelectedEmployeeIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setDupEmployeePickerValue('');
  }

  // ── Submit valid leads ────────────────────────────────────────────────────
  async function handleSubmit() {
    setSubmitError('');
    setSuccessMsg('');
    const selectedRows = rows.filter((r) => checkedIndexes.has(r._rowIndex) && !r._error && !r._duplicate);
    if (selectedRows.length === 0) { setSubmitError('Select at least one valid row.'); return; }
    if (selectedEmployeeIds.length === 0) { setSubmitError('Select at least one employee.'); return; }

    const leads = selectedRows.map((row, i) => ({
      name: row.name,
      mobile: row.mobile,
      primarySource: row.primarySource,
      leadPincode: row.leadPincode || null,
      email: row.email || null,
      countryCode: row.countryCode || null,
      secondarySource: row.secondarySource || null,
      companyName: row.companyName || null,
      productType: row.productType || null,
      variant: row.variant || null,
      quantity: row.quantity ? Number(row.quantity) : null,
      leadCountry: row.leadCountry || null,
      leadState: row.leadState || row.state || null,
      leadCity: row.leadCity || row.district || null,
      streetAddress: row.streetAddress || null,
      assignedUserId: selectedEmployeeIds[i % selectedEmployeeIds.length],
      isDuplicate: false,
    }));

    setSubmitting(true);
    try {
      const result = await bulkCreateLeads(leads, selectedBranchNameValue || null);
      setSuccessMsg(result.created + ' leads imported successfully.');
      setRows((prevRows) =>
        prevRows.map((row) =>
          checkedIndexes.has(row._rowIndex) && !row._error && !row._duplicate
            ? { ...row, _imported: true }
            : row
        )
      );
      setCheckedIndexes(new Set());
      if (role === 'EMPLOYEE' && user?.id) {
        setSelectedEmployeeIds([String(user.id)]);
      } else {
        setSelectedEmployeeIds([]);
      }
      setEmployeePickerValue('');
    } catch (err) {
      setSubmitError(err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Import failed.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Submit duplicate leads into duplicate bucket ──────────────────────────
  async function handleDupSubmit() {
    setDupSubmitError('');
    setDupSuccessMsg('');
    const selectedRows = rows.filter((r) => dupCheckedIndexes.has(r._rowIndex) && r._duplicate && !r._imported);
    if (selectedRows.length === 0) { setDupSubmitError('Select at least one duplicate row.'); return; }
    if (dupSelectedEmployeeIds.length === 0) { setDupSubmitError('Select at least one employee.'); return; }

    const leads = selectedRows.map((row, i) => ({
      name: row.name,
      mobile: row.mobile,
      primarySource: row.primarySource,
      leadPincode: row.leadPincode || null,
      email: row.email || null,
      countryCode: row.countryCode || null,
      secondarySource: row.secondarySource || null,
      companyName: row.companyName || null,
      productType: row.productType || null,
      variant: row.variant || null,
      quantity: row.quantity ? Number(row.quantity) : null,
      leadCountry: row.leadCountry || null,
      leadState: row.leadState || row.state || null,
      leadCity: row.leadCity || row.district || null,
      streetAddress: row.streetAddress || null,
      assignedUserId: dupSelectedEmployeeIds[i % dupSelectedEmployeeIds.length],
      isDuplicate: true,
      duplicateOfLeadId: row._duplicateOf?.id || null,
      duplicateOfLeadRef: row._duplicateOf?.ref || null,
      duplicateOfLeadName: row._duplicateOf?.name || null,
    }));

    setDupSubmitting(true);
    try {
      const result = await bulkCreateLeads(leads, selectedBranchNameValue || null);
      setDupSuccessMsg(result.created + ' duplicate lead(s) added to duplicate bucket.');
      setRows((prevRows) =>
        prevRows.map((row) =>
          dupCheckedIndexes.has(row._rowIndex) && row._duplicate
            ? { ...row, _imported: true }
            : row
        )
      );
      setDupCheckedIndexes(new Set());
      if (role === 'EMPLOYEE' && user?.id) {
        setDupSelectedEmployeeIds([String(user.id)]);
      } else {
        setDupSelectedEmployeeIds([]);
      }
      setDupEmployeePickerValue('');
    } catch (err) {
      setDupSubmitError(err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Import failed.');
    } finally {
      setDupSubmitting(false);
    }
  }

  // ── Derived rows ──────────────────────────────────────────────────────────
  const visibleRows = rows.filter((r) => !r._imported);
  const validRows = visibleRows.filter((r) => !r._error && !r._duplicate);
  const duplicateRows = visibleRows.filter((r) => r._duplicate && !r._error);
  const errorRows = visibleRows.filter((r) => r._error);
  const checkedValidCount = validRows.filter((r) => checkedIndexes.has(r._rowIndex)).length;
  const checkedDupCount = duplicateRows.filter((r) => dupCheckedIndexes.has(r._rowIndex)).length;

  // ── Employee section (shared renderer) ───────────────────────────────────
  function renderEmployeeSection({
    employeeIds, setEmployeeIds, pickerValue, setPickerValue,
    addFromDropdown, toggleEmp, error, successMsgVal, onSubmit,
    submittingVal, checkedCount, isDupSection,
  }) {
    console.log("RENDER EMPLOYEE SECTION:", {
      role,
      userId: user?.id,
      employeeIds,
      checkedCount,
      employees,
      importGroupId,
    });
    return (
      <div className="card mb-3">
        <div className="card-body">
          <h6 className="card-title">
            {isDupSection ? 'Assign Duplicate Leads to Employee(s)' : 'Step 3 - Assign to Employee(s)'}
          </h6>
          {role === 'SUPER_ADMIN' && (
            <div className="mb-3" style={{ maxWidth: 360 }}>
              <label className="form-label">Branch</label>
              <select
                              className="form-select"
                              value={selectedBranchId}
                              onChange={(e) => {
                                const nextBranchId = e.target.value;
                                const nextBranch = branchOptions.find((branch) => String(branch.id) === String(nextBranchId));
                                setSelectedBranchId(nextBranchId);
                                setSelectedBranchName(nextBranch?.name || '');
                                setCreateBranchFlowGroupId('');
                              }}
                            >
                <option value="">Select Branch</option>
                {importBranchOptions.map((branch) => (
                  <option key={branch.id || branch} value={branch.id || branch}>{branch.name || branch}</option>
                ))}
              </select>
            </div>
          )}
          {employees.length === 0 ? (
            <p className="text-muted">
              {role === 'SUPER_ADMIN' && !selectedBranchId
                ? 'Select a branch to load New Lead handlers.'
                : importGroupId
                  ? 'No active employees in this group.'
                  : 'No group available.'}
            </p>
          ) : (
            <>
              {role !== 'EMPLOYEE' && (
                <div className="mb-3" style={{ maxWidth: 360 }}>
                  <label className="form-label">Assign Employee</label>
                  <select
                    className="form-select"
                    value={pickerValue}
                    onChange={(e) => { setPickerValue(e.target.value); addFromDropdown(e.target.value); }}
                  >
                    <option value="">Select employee</option>
                    {employees
                      .filter((emp) => !employeeIds.includes(String(emp.id)))
                      .map((emp) => (
                        <option key={emp.id} value={String(emp.id)}>{emp.username}</option>
                      ))}
                  </select>
                </div>
              )}
              <div className="d-flex flex-wrap gap-2 mb-3">
                {employeeIds.length === 0 ? (
                  <span className="text-muted small">No employee selected yet.</span>
                ) : (
                  employeeIds.map((employeeId) => {
                    const employee = employees.find((emp) => String(emp.id) === String(employeeId));
                    return (
                      <span
                        key={employeeId}
                        className="badge rounded-pill text-bg-primary d-inline-flex align-items-center gap-2 px-3 py-2"
                      >
                        <span>{employee?.username || employeeId}</span>
                        {role !== 'EMPLOYEE' && (
                          <button
                            type="button"
                            className="btn btn-link btn-sm text-white p-0 text-decoration-none"
                            onClick={() => toggleEmp(employeeId)}
                            style={{ lineHeight: 1 }}
                          >x</button>
                        )}
                      </span>
                    );
                  })
                )}
              </div>
            </>
          )}
          {error && <div className="alert alert-danger py-2">{error}</div>}
          {successMsgVal && <div className="alert alert-success py-2">{successMsgVal}</div>}
          <button
            className={`btn ${isDupSection ? 'btn-warning' : 'btn-success'}`}
            disabled={submittingVal || checkedCount === 0 || employeeIds.length === 0}
            onClick={onSubmit}
          >
            {submittingVal
              ? 'Importing...'
              : isDupSection
                ? `Add ${checkedCount} to Duplicate Bucket`
                : `Import ${checkedCount} Lead(s)`}
          </button>
        </div>
      </div>
    );
  }

  const hasRows = visibleRows.length > 0 || dupCheckLoading;

  return (
    <div className="content">
      <div className="d-flex align-items-center gap-2 mb-4">
        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/leads')}>
          <i className="ti ti-arrow-left me-1" />
          Back to Leads
        </button>
        <h4 className="mb-0">Import Leads</h4>
      </div>

      {/* Step 1 */}
      <div className="card mb-3">
        <div className="card-body">
          <h6 className="card-title">Step 1 - Download Sample CSV</h6>
          <button className="btn btn-outline-primary btn-sm" onClick={downloadSampleCSV}>
            <i className="ti ti-download me-1" />
            Download Sample CSV
          </button>
        </div>
      </div>

      {/* Step 2 */}
      <div className="card mb-3">
        <div className="card-body">
          <h6 className="card-title">Step 2 - Upload CSV</h6>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="form-control"
            style={{ maxWidth: 360 }}
            onChange={handleFileChange}
          />
          {dupCheckLoading && (
            <div className="mt-2 text-muted small d-flex align-items-center gap-2">
              <div className="spinner-border spinner-border-sm" role="status" />
              Checking for duplicates…
            </div>
          )}
        </div>
      </div>

      {/* Preview table with tabs */}
      {hasRows && !dupCheckLoading && (
        <div className="card mb-3">
          <div className="card-body">
            {/* Tab header */}
            <ul className="nav nav-tabs mb-3">
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'valid' ? 'active' : ''}`}
                  onClick={() => setActiveTab('valid')}
                >
                  Valid
                  <span className={`badge ms-2 ${activeTab === 'valid' ? 'bg-primary' : 'bg-secondary'}`}>
                    {validRows.length}
                  </span>
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'duplicate' ? 'active' : ''}`}
                  onClick={() => setActiveTab('duplicate')}
                >
                  Duplicates
                  <span className={`badge ms-2 ${duplicateRows.length > 0 ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                    {duplicateRows.length}
                  </span>
                </button>
              </li>
              {errorRows.length > 0 && (
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'error' ? 'active' : ''}`}
                    onClick={() => setActiveTab('error')}
                  >
                    Errors
                    <span className="badge ms-2 bg-danger">{errorRows.length}</span>
                  </button>
                </li>
              )}
            </ul>

            {/* ── VALID TAB ── */}
            {activeTab === 'valid' && (
              <>
                <div className="d-flex align-items-center gap-3 mb-3 flex-wrap">
                  <h6 className="mb-0">Preview ({validRows.length} rows)</h6>
                  <div className="d-flex align-items-center gap-2">
                    <label className="mb-0 text-muted small">Quick Select:</label>
                    <select
                      className="form-select form-select-sm"
                      style={{ width: 'auto' }}
                      defaultValue=""
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'custom') {
                          setShowCustomCount(true);
                          setCustomCount('');
                        } else {
                          setShowCustomCount(false);
                          handleQuickSelect(val === 'all' ? Infinity : Number(val));
                        }
                      }}
                    >
                      <option value="" disabled>Choose...</option>
                      {QUICK_SELECT_OPTIONS.map((opt) => (
                        <option key={opt.label} value={opt.value === Infinity ? 'all' : opt.value}>
                          {opt.label}
                        </option>
                      ))}
                      <option value="custom">Custom...</option>
                    </select>
                    {showCustomCount && (
                      <div className="d-flex align-items-center gap-1">
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          style={{ width: 80 }}
                          min={1}
                          max={validRows.length}
                          placeholder="Count"
                          value={customCount}
                          onChange={(e) => setCustomCount(e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => { const n = parseInt(customCount, 10); if (n > 0) handleQuickSelect(n); }}
                        >Go</button>
                      </div>
                    )}
                  </div>
                  <span className="text-muted small">{checkedValidCount} selected</span>
                </div>
                <div className="table-responsive">
                  <table className="table table-sm table-bordered table-hover">
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>#</th>
                        <th style={{ width: 40 }}>
                          <input
                            type="checkbox"
                            checked={validRows.length > 0 && checkedValidCount === validRows.length}
                            onChange={(e) => {
                              if (e.target.checked) setCheckedIndexes(new Set(validRows.map((r) => r._rowIndex)));
                              else setCheckedIndexes(new Set());
                            }}
                          />
                        </th>
                        <th>Name</th>
                        <th>Mobile</th>
                        <th>Primary Source</th>
                        <th style={{ width: 80 }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validRows.map((row, idx) => (
                        <tr key={row._rowIndex}>
                          <td>{idx + 1}</td>
                          <td>
                            <input
                              type="checkbox"
                              checked={checkedIndexes.has(row._rowIndex)}
                              onChange={() => toggleRow(row._rowIndex)}
                            />
                          </td>
                          <td>{row.name}</td>
                          <td>{row.mobile}</td>
                          <td>{row.primarySource}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => { setSelectedRowForEdit(row); setEditModalOpen(true); }}
                              title="Edit lead details"
                            >
                              <i className="ti ti-pencil" /> Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                      {validRows.length === 0 && (
                        <tr><td colSpan={6} className="text-center text-muted py-3">No valid rows</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── DUPLICATE TAB ── */}
            {activeTab === 'duplicate' && (
              <>
                <div className="d-flex align-items-center gap-3 mb-3 flex-wrap">
                  <h6 className="mb-0">Duplicate Leads ({duplicateRows.length} rows)</h6>
                  <span className="text-muted small">
                    These leads match an existing lead by mobile or email. You can assign them to the duplicate bucket for review.
                  </span>
                  <span className="text-muted small">{checkedDupCount} selected</span>
                </div>
                <div className="table-responsive">
                  <table className="table table-sm table-bordered table-hover">
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>#</th>
                        <th style={{ width: 40 }}>
                          <input
                            type="checkbox"
                            checked={duplicateRows.length > 0 && checkedDupCount === duplicateRows.length}
                            onChange={(e) => {
                              if (e.target.checked) setDupCheckedIndexes(new Set(duplicateRows.map((r) => r._rowIndex)));
                              else setDupCheckedIndexes(new Set());
                            }}
                          />
                        </th>
                        <th>Name</th>
                        <th>Mobile</th>
                        <th>Primary Source</th>
                        <th>Matches Existing Lead</th>
                        <th style={{ width: 80 }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {duplicateRows.map((row, idx) => (
                        <tr key={row._rowIndex} className="table-warning">
                          <td>{idx + 1}</td>
                          <td>
                            <input
                              type="checkbox"
                              checked={dupCheckedIndexes.has(row._rowIndex)}
                              onChange={() => toggleDupRow(row._rowIndex)}
                            />
                          </td>
                          <td>{row.name}</td>
                          <td>{row.mobile}</td>
                          <td>{row.primarySource}</td>
                          <td>
                            {row._duplicateOf ? (
                              <span className="text-danger small">
                                <i className="ti ti-alert-circle me-1" />
                                {row._duplicateOf.name || '—'}
                                {row._duplicateOf.ref && (
                                  <span className="text-muted ms-1">({row._duplicateOf.ref})</span>
                                )}
                              </span>
                            ) : (
                              <span className="badge bg-warning text-dark">Duplicate</span>
                            )}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => { setSelectedRowForEdit(row); setEditModalOpen(true); }}
                              title="Edit lead details"
                            >
                              <i className="ti ti-pencil" /> Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                      {duplicateRows.length === 0 && (
                        <tr><td colSpan={7} className="text-center text-muted py-3">No duplicate rows</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── ERROR TAB ── */}
            {activeTab === 'error' && (
              <>
                <h6 className="mb-3">Error Rows ({errorRows.length})</h6>
                <div className="table-responsive">
                  <table className="table table-sm table-bordered">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Mobile</th>
                        <th>Primary Source</th>
                        <th>Error</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {errorRows.map((row, idx) => (
                        <tr key={row._rowIndex} className="table-danger">
                          <td>{idx + 1}</td>
                          <td>{row.name || <span className="text-danger">-</span>}</td>
                          <td>{row.mobile || <span className="text-danger">-</span>}</td>
                          <td>{row.primarySource || <span className="text-danger">-</span>}</td>
                          <td><span className="badge bg-danger">{row._error}</span></td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => { setSelectedRowForEdit(row); setEditModalOpen(true); }}
                            >
                              <i className="ti ti-pencil" /> Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Step 3 — assign valid leads */}
      {activeTab === 'valid' && validRows.length > 0 && (
        renderEmployeeSection({
          employeeIds: selectedEmployeeIds,
          setEmployeeIds: setSelectedEmployeeIds,
          pickerValue: employeePickerValue,
          setPickerValue: setEmployeePickerValue,
          addFromDropdown: addEmployeeFromDropdown,
          toggleEmp: toggleEmployee,
          error: submitError,
          successMsgVal: successMsg,
          onSubmit: handleSubmit,
          submittingVal: submitting,
          checkedCount: checkedValidCount,
          isDupSection: false,
        })
      )}

      {/* Step 3 — assign duplicate leads */}
      {activeTab === 'duplicate' && duplicateRows.length > 0 && (
        renderEmployeeSection({
          employeeIds: dupSelectedEmployeeIds,
          setEmployeeIds: setDupSelectedEmployeeIds,
          pickerValue: dupEmployeePickerValue,
          setPickerValue: setDupEmployeePickerValue,
          addFromDropdown: addDupEmployeeFromDropdown,
          toggleEmp: toggleDupEmployee,
          error: dupSubmitError,
          successMsgVal: dupSuccessMsg,
          onSubmit: handleDupSubmit,
          submittingVal: dupSubmitting,
          checkedCount: checkedDupCount,
          isDupSection: true,
        })
      )}

      {visibleRows.length === 0 && rows.length > 0 && successMsg && (
        <div className="alert alert-success py-2">{successMsg}</div>
      )}

      <LeadImportEditModal
        isOpen={editModalOpen}
        onClose={() => { setEditModalOpen(false); setSelectedRowForEdit(null); }}
        rowData={selectedRowForEdit}
        allowEditMandatory={!!(selectedRowForEdit?._duplicate)}
        onSave={async (updatedData) => {
          const targetIndex = selectedRowForEdit._rowIndex;
          const isDupRow = !!(selectedRowForEdit._duplicate);
          if (updatedData.mobile) {
            updatedData.mobile = cleanImportMobile(updatedData.mobile);
          }
          // Merge the update first
          const mergedRow = { ...selectedRowForEdit, ...updatedData };
          setRows((prevRows) =>
            prevRows.map((row) =>
              row._rowIndex === targetIndex ? mergedRow : row
            )
          );
          // For duplicate rows: re-run conflict check so mobile/email changes take effect
          if (isDupRow) {
            try {
              const matches = await checkDuplicateLeads([{
                mobile: updatedData.mobile || '',
                email: updatedData.email || '',
              }]);
              const match = Array.isArray(matches) && matches.length > 0 ? matches[0] : null;
              setRows((prevRows) =>
                prevRows.map((row) => {
                  if (row._rowIndex !== targetIndex) return row;
                  if (match) {
                    return {
                      ...row,
                      _duplicate: true,
                      _duplicateOf: {
                        id: match.matchedLeadId,
                        ref: match.matchedLeadRef,
                        name: match.matchedLeadName,
                      },
                    };
                  }
                  // No longer a duplicate — move to valid
                  return { ...row, _duplicate: false, _duplicateOf: undefined };
                })
              );
            } catch {
              // leave as-is if check fails
            }
          }
        }}
      />
    </div>
  );
}
