import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import PageSizeSelector from "../../components/admin/PageSizeSelector";
import {
  runPayroll,
  getPayslipsForMonth,
  sendPayslips,
  sendPayslipById,
  downloadPayslipPdf,
  deletePayslip,
} from "../../api/payslipApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: Math.max(1, currentYear - 2015 + 1) }, (_, i) => currentYear - i);

function fmt(val) {
  const n = parseFloat(val) || 0;
  return "₹" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const PayslipPage = () => {
  const { showSuccess, showError } = useToast();

  // Month/Year selectors
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const monthString = `${selectedMonth} ${selectedYear}`;

  // Data
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [sendingAll, setSendingAll] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [printingId, setPrintingId] = useState(null);
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // View detail
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  // Confirm modal for run payroll
  const [showRunConfirm, setShowRunConfirm] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);

  // Table search / pagination
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const loadPayslips = async () => {
    setLoading(true);
    try {
      const data = await getPayslipsForMonth(monthString);
      setPayslips(data);
      setPage(1);
      setSelectedIds(new Set());
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to load payslips"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayslips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthString]);

  const handleRunPayroll = async () => {
    setShowRunConfirm(false);
    setRunning(true);
    try {
      const result = await runPayroll(monthString);
      setPayslips(Array.isArray(result) ? result : []);
      showSuccess(`Payroll run complete — ${Array.isArray(result) ? result.length : 0} payslip(s) generated for ${monthString}`);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Payroll run failed"));
    } finally {
      setRunning(false);
    }
  };

  const handleSendAll = async () => {
    setShowSendConfirm(false);
    setSendingAll(true);
    try {
      await sendPayslips(monthString);
      showSuccess(`Bulk payslip emails triggered for ${monthString}`);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to send payslip emails"));
    } finally {
      setSendingAll(false);
    }
  };

  const handleSendOne = async (id) => {
    setSendingId(id);
    try {
      await sendPayslipById(id);
      showSuccess("Payslip email sent successfully");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to send email"));
    } finally {
      setSendingId(null);
    }
  };

  const handleDownloadPdf = async (ps) => {
    setDownloadingId(ps.id);
    try {
      const blob = await downloadPayslipPdf(ps.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Payslip_${ps.month?.replace(/ /g, "_")}_${ps.name?.replace(/ /g, "_") || ps.employeeName?.replace(/ /g, "_") || ps.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to download PDF"));
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreviewPdf = async (ps) => {
    setDownloadingId(ps.id);
    try {
      const blob = await downloadPayslipPdf(ps.id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to preview PDF"));
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePrintPdf = async (ps) => {
    setPrintingId(ps.id);
    try {
      const blob = await downloadPayslipPdf(ps.id);
      const url = URL.createObjectURL(blob);
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.style.opacity = "0";
      iframe.src = url;
      let cleanupTimer = null;

      const cleanup = () => {
        if (cleanupTimer) {
          window.clearTimeout(cleanupTimer);
          cleanupTimer = null;
        }
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
        URL.revokeObjectURL(url);
        setPrintingId(null);
      };

      iframe.onload = () => {
        setTimeout(() => {
          try {
            const pdfWindow = iframe.contentWindow;
            if (!pdfWindow) {
              cleanup();
              showError("Unable to open the PDF print dialog");
              return;
            }
            pdfWindow.addEventListener("afterprint", cleanup, { once: true });
            cleanupTimer = window.setTimeout(cleanup, 30000);
            pdfWindow.focus?.();
            pdfWindow.print?.();
          } catch (_err) {
            cleanup();
            showError("Unable to open the PDF print dialog");
          }
        }, 250);
      };
      iframe.onerror = () => {
        cleanup();
        showError("Unable to open the PDF print dialog");
      };

      document.body.appendChild(iframe);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to print PDF"));
      setPrintingId(null);
    }
  };

  const handleBulkSendMail = async () => {
    setBulkSending(true);
    let successCount = 0;
    let failCount = 0;
    try {
      await Promise.all(
        Array.from(selectedIds).map(async (id) => {
          try {
            await sendPayslipById(id);
            successCount++;
          } catch (e) {
            failCount++;
          }
        })
      );
      if (failCount === 0) {
        showSuccess(`Successfully sent emails for ${successCount} payslip(s)`);
      } else {
        showSuccess(`Sent emails for ${successCount} payslip(s); failed for ${failCount} payslip(s)`);
      }
      setSelectedIds(new Set());
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to send bulk emails"));
    } finally {
      setBulkSending(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} selected payslip(s)?`)) {
      return;
    }
    setBulkDeleting(true);
    let successCount = 0;
    let failCount = 0;
    try {
      await Promise.all(
        Array.from(selectedIds).map(async (id) => {
          try {
            await deletePayslip(id);
            successCount++;
          } catch (e) {
            failCount++;
          }
        })
      );
      if (failCount === 0) {
        showSuccess(`Successfully deleted ${successCount} payslip(s)`);
      } else {
        showSuccess(`Deleted ${successCount} payslip(s); failed for ${failCount} payslip(s)`);
      }
      setSelectedIds(new Set());
      loadPayslips();
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to delete bulk payslips"));
    } finally {
      setBulkDeleting(false);
    }
  };

  const exportCsv = () => {
    const rows = filteredPayslips;
    const headers = ["Employee", "Month", "Basic", "DA", "HRA", "Conveyance", "Overtime", "PF", "ESI", "TDS", "LOP Deduction", "Net Salary", "Status"];
    const body = rows.map((r) => [
      r.name || r.employeeName || "-", r.month, r.basic, r.da, r.hra, r.conveyance,
      r.overtime, r.pf, r.esi, r.tds, r.leaveDeduction, r.netSalary, r.status,
    ]);
    const csv = [headers, ...body]
      .map((line) => line.map((c) => `"${String(c || "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payslips_${monthString.replace(/ /g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.text(`Payslips — ${monthString}`, 14, 15);
    autoTable(doc, {
      head: [["Employee", "Month", "Basic", "HRA", "Overtime", "Net Salary", "Status"]],
      body: filteredPayslips.map((r) => [
        r.name || r.employeeName || "-",
        r.month,
        r.basic,
        r.hra,
        r.overtime || 0,
        r.netSalary,
        r.status,
      ]),
      startY: 20,
      styles: { fontSize: 8 },
    });
    doc.save(`payslips_${monthString.replace(/ /g, "_")}.pdf`);
  };

  const filteredPayslips = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return payslips;
    return payslips.filter(
      (r) =>
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.employeeName && r.employeeName.toLowerCase().includes(q)) ||
        (r.employeeCode && r.employeeCode.toLowerCase().includes(q)) ||
        (r.month && r.month.toLowerCase().includes(q)) ||
        (r.status && r.status.toLowerCase().includes(q))
    );
  }, [payslips, search]);

  const totalRows = filteredPayslips.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / Math.max(1, pageSize)));
  const clampedPage = Math.min(Math.max(1, page), pageCount);
  const pageOffset = (clampedPage - 1) * pageSize;
  const pagedRows = useMemo(
    () => filteredPayslips.slice(pageOffset, pageOffset + pageSize),
    [filteredPayslips, pageOffset, pageSize]
  );

  useEffect(() => {
    if (page !== clampedPage) setPage(clampedPage);
  }, [clampedPage, page]);

  const toggleSelectAll = () => {
    const ids = pagedRows.map((r) => r.id);
    const allSelected = ids.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const statusBadge = (status) => {
    const map = {
      Generated: { bg: "#dbeafe", color: "#1d4ed8" },
      Sent: { bg: "#dcfce7", color: "#16a34a" },
      Approved: { bg: "#fef9c3", color: "#854d0e" },
      Paid: { bg: "#f0fdf4", color: "#166534" },
    };
    const s = map[status] || { bg: "#f1f5f9", color: "#475569" };
    return (
      <span style={{ backgroundColor: s.bg, color: s.color, padding: "3px 10px", borderRadius: 20, fontSize: "0.78rem", fontWeight: 600 }}>
        {status || "—"}
      </span>
    );
  };

  // ── Detail View ──────────────────────────────────────────────────────────
  if (selectedPayslip) {
    const ps = selectedPayslip;
    const totalEarnings =
      (parseFloat(ps.basic) || 0) +
      (parseFloat(ps.da) || 0) +
      (parseFloat(ps.hra) || 0) +
      (parseFloat(ps.conveyance) || 0) +
      (parseFloat(ps.overtime) || 0);
    const totalDeductions =
      (parseFloat(ps.pf) || 0) +
      (parseFloat(ps.esi) || 0) +
      (parseFloat(ps.tds) || 0) +
      (parseFloat(ps.leaveDeduction) || 0);

    return (
      <div className="content">
        {/* Header */}
        <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h2 className="mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>
                Payslip Details
              </h2>
              <button className="btn btn-sm btn-link p-0 text-decoration-none" onClick={() => setSelectedPayslip(null)}>
                <i className="ti ti-arrow-left me-1" /> Back to Payslips
              </button>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn d-flex align-items-center gap-2"
                style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", color: "#fff", fontWeight: 600, padding: "10px 20px", borderRadius: 10 }}
                onClick={() => handleDownloadPdf(ps)}
                disabled={downloadingId === ps.id}
              >
                <i className="ti ti-download" style={{ fontSize: "1.1rem" }} />
                {downloadingId === ps.id ? "Downloading..." : "Download PDF"}
              </button>
              <button
                className="btn d-flex align-items-center gap-2"
                style={{ backgroundColor: "#22c55e", borderColor: "#22c55e", color: "#fff", fontWeight: 600, padding: "10px 20px", borderRadius: 10 }}
                onClick={() => handleSendOne(ps.id)}
                disabled={sendingId === ps.id}
              >
                <i className="ti ti-send" style={{ fontSize: "1.1rem" }} />
                {sendingId === ps.id ? "Sending..." : "Send Email"}
              </button>
              <button
                className="btn btn-light border d-flex align-items-center gap-2"
                style={{ fontWeight: 600, padding: "10px 20px", borderRadius: 10 }}
                onClick={() => handlePrintPdf(ps)}
                disabled={printingId === ps.id}
              >
                <i className="ti ti-printer" style={{ fontSize: "1.1rem" }} />
                {printingId === ps.id ? "Printing..." : "Print"}
              </button>
            </div>
          </div>
        </div>

        {/* Payslip Card */}
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body p-4">
            {/* Company / Title */}
            <div className="text-center border-bottom pb-3 mb-4">
              <h3 style={{ fontWeight: 600, color: "#0f172a", letterSpacing: 1 }}>SVL ENTERPRISES</h3>
              <p style={{ color: "#64748b", margin: 0 }}>PAYSLIP — {ps.month?.toUpperCase()}</p>
            </div>

            {/* Employee Meta */}
            <div className="row mb-4">
              {[
                ["Employee Code", ps.employeeCode || "N/A"],
                ["Employee Name", ps.name || ps.employeeName || "N/A"],
                ["Designation", ps.designation || "N/A"],
                ["Department", ps.departmentName || "N/A"],
                ["Pay Period", ps.month],
                ["Status", ps.status],
              ].map(([label, value]) => (
                <div className="col-md-6 mb-2" key={label}>
                  <div className="d-flex">
                    <span style={{ fontWeight: 500, color: "#475569", minWidth: 160 }}>{label}:</span>
                    <span style={{ color: "#475569", fontWeight: 400 }}>{value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Earnings / Deductions */}
            <div className="row">
              {/* Earnings */}
              <div className="col-md-6 mb-4">
                <div className="rounded" style={{ border: "1px solid #e2e8f0", overflow: "hidden" }}>
                  <div className="px-3 py-2" style={{ backgroundColor: "#f1f5f9" }}>
                    <span style={{ color: "#0f172a", fontWeight: 600, letterSpacing: 0.6 }}>EARNINGS</span>
                  </div>
                  {[
                    ["Basic Salary", ps.basic],
                    ["DA (Dearness Allowance)", ps.da],
                    ["HRA (House Rent Allowance)", ps.hra],
                    ["Conveyance", ps.conveyance],
                    ["Overtime", ps.overtime],
                  ].map(([label, val]) => (
                    <div key={label} className="d-flex justify-content-between px-3 py-2 border-top">
                      <span style={{ color: "#475569", fontWeight: 400 }}>{label}</span>
                      <span style={{ fontWeight: 400, color: "#0f172a" }}>{fmt(val)}</span>
                    </div>
                  ))}
                  <div className="d-flex justify-content-between px-3 py-2 border-top" style={{ backgroundColor: "#f8fafc" }}>
                    <span style={{ color: "#0f172a", fontWeight: 600 }}>Gross Salary</span>
                    <span style={{ color: "#0f172a", fontWeight: 600 }}>{fmt(totalEarnings)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="col-md-6 mb-4">
                <div className="rounded" style={{ border: "1px solid #e2e8f0", overflow: "hidden" }}>
                  <div className="px-3 py-2" style={{ backgroundColor: "#fef2f2" }}>
                    <span style={{ color: "#0f172a", fontWeight: 600, letterSpacing: 0.6 }}>DEDUCTIONS</span>
                  </div>
                  {[
                    ["Provident Fund (PF)", ps.pf],
                    ["ESI", ps.esi],
                    ["TDS / Income Tax", ps.tds],
                    ["Leave Deduction (LOP)", ps.leaveDeduction],
                  ].map(([label, val]) => (
                    <div key={label} className="d-flex justify-content-between px-3 py-2 border-top">
                      <span style={{ color: "#475569", fontWeight: 400 }}>{label}</span>
                      <span style={{ fontWeight: 400, color: "#dc2626" }}>{fmt(val)}</span>
                    </div>
                  ))}
                  <div className="d-flex justify-content-between px-3 py-2 border-top" style={{ backgroundColor: "#fef2f2" }}>
                    <span style={{ color: "#0f172a", fontWeight: 600 }}>Total Deductions</span>
                    <span style={{ color: "#dc2626", fontWeight: 600 }}>{fmt(totalDeductions)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Salary */}
            <div
              className="d-flex justify-content-between align-items-center p-3 rounded"
              style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}
            >
              <span style={{ fontWeight: 600, fontSize: "1.05rem", color: "#166534" }}>NET SALARY (PAID)</span>
              <span style={{ fontWeight: 700, fontSize: "1.3rem", color: "#166534" }}>{fmt(ps.netSalary)}</span>
            </div>

            {/* Signatures */}
            <div className="row mt-5">
              <div className="col-md-6">
                <div style={{ borderTop: "1px solid #334155", paddingTop: 8, color: "#64748b", fontSize: "0.9rem", fontWeight: 400 }}>
                  Employee Signature
                </div>
              </div>
              <div className="col-md-6 text-end">
                <div style={{ borderTop: "1px solid #334155", paddingTop: 8, color: "#64748b", fontSize: "0.9rem", fontWeight: 400 }}>
                  Authorized Signatory
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main List View ───────────────────────────────────────────────────────
  return (
    <>
      <div className="content">
        {/* Header Card */}
        <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <h2 className="mb-0" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Payslips</h2>

            <div className="d-flex align-items-center gap-2" style={{ flexWrap: "nowrap", flexShrink: 0 }}>
              <select
                className="form-select"
                style={{ height: 42, borderRadius: 10, fontSize: "0.9rem", minWidth: 130, border: "1px solid #e2e8f0", whiteSpace: "nowrap" }}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              <select
                className="form-select"
                style={{ height: 42, borderRadius: 10, fontSize: "0.9rem", minWidth: 90, border: "1px solid #e2e8f0", whiteSpace: "nowrap" }}
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              <button
                type="button"
                className="btn d-flex align-items-center gap-2 text-nowrap"
                style={{ backgroundColor: "#6366f1", borderColor: "#6366f1", color: "#fff", fontWeight: 600, padding: "10px 18px", borderRadius: 10, height: 42, whiteSpace: "nowrap" }}
                onClick={() => setShowRunConfirm(true)}
                disabled={running}
              >
                <i className="ti ti-player-play" style={{ fontSize: "1rem" }} />
                {running ? "Running..." : "Run Payroll"}
              </button>

              <button
                type="button"
                className="btn d-flex align-items-center gap-2 text-nowrap"
                style={{ backgroundColor: "#22c55e", borderColor: "#22c55e", color: "#fff", fontWeight: 600, padding: "10px 18px", borderRadius: 10, height: 42, whiteSpace: "nowrap" }}
                onClick={() => setShowSendConfirm(true)}
                disabled={sendingAll || payslips.length === 0}
              >
                <i className="ti ti-mail" style={{ fontSize: "1rem" }} />
                {sendingAll ? "Sending..." : "Send All Emails"}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {payslips.length > 0 && (
          <div className="row g-3 mb-4">
            {[
              {
                label: "Total Payslips",
                value: payslips.length,
                icon: "ti-file-text",
                color: "#3b82f6",
                bg: "#dbeafe",
              },
              {
                label: "Total Gross",
                value: "₹" + payslips.reduce((s, p) => s + (parseFloat(p.netSalary) || 0) + (parseFloat(p.pf) || 0) + (parseFloat(p.esi) || 0) + (parseFloat(p.tds) || 0) + (parseFloat(p.leaveDeduction) || 0), 0).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                icon: "ti-chart-bar",
                color: "#6366f1",
                bg: "#ede9fe",
              },
              {
                label: "Total Net Salary",
                value: "₹" + payslips.reduce((s, p) => s + (parseFloat(p.netSalary) || 0), 0).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                icon: "ti-currency-rupee",
                color: "#22c55e",
                bg: "#dcfce7",
              },
              {
                label: "Emails Sent",
                value: payslips.filter((p) => p.status === "Sent").length,
                icon: "ti-mail",
                color: "#f59e0b",
                bg: "#fef3c7",
              },
            ].map((card) => (
              <div className="col-6 col-md-3" key={card.label}>
                <div className="card border-0 shadow-sm p-3" style={{ borderRadius: 12 }}>
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: card.bg }}
                    >
                      <i className={`ti ${card.icon}`} style={{ fontSize: "1.3rem", color: card.color }} />
                    </div>
                    <div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>{card.value}</div>
                      <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{card.label}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table Card */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
          {/* Controls */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 border-bottom">
            <div className="position-relative flex-grow-1 flex-md-grow-0" style={{ minWidth: "260px" }}>
              <input
                className="form-control"
                style={{ height: 42, borderRadius: 10, paddingLeft: 38, fontSize: "0.95rem" }}
                value={search}
                placeholder="Search payslips..."
                onChange={(e) => setSearch(e.target.value)}
              />
              <i className="ti ti-search position-absolute text-muted" style={{ left: 14, top: "50%", transform: "translateY(-50%)", fontSize: "1.1rem" }} />
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              <div className="dropdown">
                <button
                  className="btn btn-outline-light dropdown-toggle d-flex align-items-center gap-2"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{ height: 42, padding: "0 18px", borderRadius: 10, fontWeight: "500", fontSize: "0.9rem", color: "#64748b", border: "1px solid #e2e8f0", backgroundColor: "#fff" }}
                >
                  <i className="ti ti-download" style={{ fontSize: "1rem" }} /> Export
                </button>
                <ul className="dropdown-menu shadow border-0">
                  <li><button className="dropdown-item py-2" onClick={exportCsv}>CSV</button></li>
                  <li><button className="dropdown-item py-2" onClick={exportPdf}>PDF</button></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : payslips.length === 0 ? (
              <div className="text-center py-5">
                <i className="ti ti-file-off" style={{ fontSize: "3rem", color: "#cbd5e1" }} />
                <div className="mt-2" style={{ color: "#94a3b8" }}>No payslips found for {monthString}. Run payroll to generate them.</div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="thead-light">
                    <tr>
                      <th style={{ width: 40 }}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={pagedRows.length > 0 && pagedRows.every((r) => selectedIds.has(r.id))}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th style={{ width: 50 }}>#</th>
                      <th>Employee</th>
                      <th>Month</th>
                      <th>Basic</th>
                      <th>Gross</th>
                      <th>Deductions</th>
                      <th>Net Salary</th>
                      <th>Status</th>
                      <th style={{ width: 100 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRows.map((row, idx) => {
                      const gross =
                        (parseFloat(row.basic) || 0) +
                        (parseFloat(row.da) || 0) +
                        (parseFloat(row.hra) || 0) +
                        (parseFloat(row.conveyance) || 0) +
                        (parseFloat(row.overtime) || 0);
                      const deductions =
                        (parseFloat(row.pf) || 0) +
                        (parseFloat(row.esi) || 0) +
                        (parseFloat(row.tds) || 0) +
                        (parseFloat(row.leaveDeduction) || 0);

                      return (
                        <tr key={row.id}>
                          <td>
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={selectedIds.has(row.id)}
                              onChange={() => toggleRow(row.id)}
                            />
                          </td>
                          <td>{pageOffset + idx + 1}</td>
                          <td>
                            <div className="fw-semibold text-dark">{row.name || row.employeeName || "—"}</div>
                            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{row.employeeCode || ""}</div>
                          </td>
                          <td>{row.month}</td>
                          <td>{fmt(row.basic)}</td>
                          <td>{fmt(gross)}</td>
                          <td style={{ color: "#dc2626" }}>{fmt(deductions)}</td>
                          <td>
                            <strong style={{ color: "#166534" }}>{fmt(row.netSalary)}</strong>
                          </td>
                          <td>{statusBadge(row.status)}</td>
                          <td>
                            <div className="dropdown">
                              <button
                                type="button"
                                className="btn btn-kebab-actions d-flex align-items-center justify-content-center dropdown-toggle no-caret"
                                style={{ width: 32, height: 32, borderRadius: "50%", border: "none", backgroundColor: "transparent", color: "#64748b" }}
                                data-bs-toggle="dropdown"
                                data-bs-boundary="viewport"
                                data-bs-popper-config='{"strategy":"fixed"}'
                                aria-expanded="false"
                              >
                                <i className="ti ti-dots-vertical" style={{ fontSize: "1.15rem" }} />
                              </button>
                              <ul className="dropdown-menu dropdown-menu-end shadow border-0" style={{ borderRadius: 10, minWidth: 170 }}>
                                <li>
                                  <button
                                    className="dropdown-item py-2 px-3 d-flex align-items-center gap-2"
                                    style={{ fontSize: "0.85rem" }}
                                    onClick={() => setSelectedPayslip(row)}
                                  >
                                    <i className="ti ti-eye" style={{ color: "#64748b" }} /> View Details
                                  </button>
                                </li>
                                <li>
                                  <button
                                    className="dropdown-item py-2 px-3 d-flex align-items-center gap-2"
                                    style={{ fontSize: "0.85rem" }}
                                    onClick={() => handlePreviewPdf(row)}
                                    disabled={downloadingId === row.id}
                                  >
                                    <i className="ti ti-file-text" style={{ color: "#a855f7" }} />
                                    {downloadingId === row.id ? "Loading..." : "Preview PDF"}
                                  </button>
                                </li>
                                <li>
                                  <button
                                    className="dropdown-item py-2 px-3 d-flex align-items-center gap-2"
                                    style={{ fontSize: "0.85rem" }}
                                    onClick={() => handleDownloadPdf(row)}
                                    disabled={downloadingId === row.id}
                                  >
                                    <i className="ti ti-download" style={{ color: "#3b82f6" }} />
                                    {downloadingId === row.id ? "Downloading..." : "Download PDF"}
                                  </button>
                                </li>
                                <li>
                                  <button
                                    className="dropdown-item py-2 px-3 d-flex align-items-center gap-2"
                                    style={{ fontSize: "0.85rem" }}
                                    onClick={() => handleSendOne(row.id)}
                                    disabled={sendingId === row.id}
                                  >
                                    <i className="ti ti-send" style={{ color: "#22c55e" }} />
                                    {sendingId === row.id ? "Sending..." : "Send Email"}
                                  </button>
                                </li>
                              </ul>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 border-top bg-white" style={{ borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
            <span className="text-muted small">
              {totalRows === 0
                ? "Showing 0 to 0 of 0 entries"
                : `Showing ${pageOffset + 1} to ${Math.min(pageOffset + pageSize, totalRows)} of ${totalRows} entries`}
            </span>
            <div className="d-flex align-items-center gap-1">
              <button
                type="button"
                className="btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                style={{ width: 32, height: 32, borderRadius: 6 }}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={clampedPage <= 1}
              >
                <i className="ti ti-chevron-left" />
              </button>
              {Array.from({ length: pageCount }).map((_, idx) => {
                const pn = idx + 1;
                return (
                  <button
                    key={pn}
                    type="button"
                    className={`btn btn-sm border-0 ${clampedPage === pn ? "btn-primary text-white" : "btn-light"}`}
                    style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: clampedPage === pn ? "#3b82f6" : undefined }}
                    onClick={() => setPage(pn)}
                  >
                    {pn}
                  </button>
                );
              })}
              <button
                type="button"
                className="btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                style={{ width: 32, height: 32, borderRadius: 6 }}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={clampedPage >= pageCount}
              >
                <i className="ti ti-chevron-right" />
              </button>
            </div>
            <PageSizeSelector pageSize={pageSize} setPageSize={setPageSize} setPage={setPage} />
          </div>
        </div>
      </div>

      {/* Run Payroll Confirm Modal */}
      {showRunConfirm && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-body text-center p-4">
                  <span className="avatar avatar-xl bg-transparent-primary text-primary mb-3" style={{ width: 64, height: 64, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", backgroundColor: "#dbeafe" }}>
                    <i className="ti ti-player-play" style={{ fontSize: "2rem", color: "#3b82f6" }} />
                  </span>
                  <h4 className="mb-1">Run Payroll for {monthString}?</h4>
                  <p className="mb-4 text-muted">
                    This will calculate and generate payslips for all active employees based on their salary structure, attendance, overtime, and leave records.
                    Existing payslips for this month will be updated.
                  </p>
                  <div className="d-flex justify-content-center gap-3">
                    <button type="button" className="btn btn-light border" onClick={() => setShowRunConfirm(false)}>Cancel</button>
                    <button type="button" className="btn btn-primary" style={{ backgroundColor: "#6366f1", borderColor: "#6366f1" }} onClick={handleRunPayroll}>
                      Yes, Run Payroll
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}

      {/* Send All Emails Confirm Modal */}
      {showSendConfirm && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-body text-center p-4">
                  <span style={{ width: 64, height: 64, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", backgroundColor: "#dcfce7" }} className="mb-3">
                    <i className="ti ti-mail" style={{ fontSize: "2rem", color: "#22c55e" }} />
                  </span>
                  <h4 className="mb-1">Send Payslip Emails?</h4>
                  <p className="mb-2 text-muted">
                    This will send payslip emails to all <strong>{payslips.length}</strong> employee(s) for <strong>{monthString}</strong> using the configured email template.
                  </p>
                  <p className="text-muted" style={{ fontSize: "0.85rem" }}>
                    <i className="ti ti-info-circle me-1" />
                    If the Payslip Email Template is set to <strong>Inactive</strong>, emails will be skipped automatically.
                  </p>
                  <div className="d-flex justify-content-center gap-3 mt-3">
                    <button type="button" className="btn btn-light border" onClick={() => setShowSendConfirm(false)}>Cancel</button>
                    <button type="button" className="btn btn-success" onClick={handleSendAll}>
                      Yes, Send All
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}

      {/* Floating Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div
          className="position-fixed bottom-0 start-50 translate-middle-x mb-4 d-flex align-items-center gap-3 px-4 py-3 shadow-lg"
          style={{ zIndex: 1050, backgroundColor: "#0f172a", borderRadius: 14, color: "#fff" }}
        >
          <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>{selectedIds.size} selected</span>
          
          <button
            className="btn btn-sm d-flex align-items-center gap-1"
            style={{ backgroundColor: "#22c55e", color: "#fff", borderRadius: 8, fontWeight: 500 }}
            onClick={handleBulkSendMail}
            disabled={bulkSending || bulkDeleting}
          >
            <i className="ti ti-mail" />
            {bulkSending ? "Sending..." : "Send Mail"}
          </button>

          <button
            className="btn btn-sm d-flex align-items-center gap-1"
            style={{ backgroundColor: "#ef4444", color: "#fff", borderRadius: 8, fontWeight: 500 }}
            onClick={handleBulkDelete}
            disabled={bulkSending || bulkDeleting}
          >
            <i className="ti ti-trash" />
            {bulkDeleting ? "Deleting..." : "Delete"}
          </button>

          <button
            className="btn btn-sm text-white-50 border-0"
            style={{ borderRadius: 8 }}
            onClick={() => setSelectedIds(new Set())}
            disabled={bulkSending || bulkDeleting}
          >
            Clear
          </button>
        </div>
      )}
    </>
  );
};

export default PayslipPage;
