import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import PageLoader from "../../components/common/PageLoader";
import ErrorState from "../../components/common/ErrorState";
import dashboardService from "../../services/dashboardService";
import { employeeDashboardData } from "../../mock/employeeDashboardData";

function formatDate(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatTime(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatMinutes(totalMinutes) {
  const safe = Number(totalMinutes || 0);
  const hours = Math.floor(safe / 60);
  const minutes = safe % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

function formatHoursMinutes(hours, minutes) {
  const safeHours = Number(hours || 0);
  const safeMinutes = Number(minutes || 0);
  return `${safeHours}h ${String(safeMinutes).padStart(2, "0")}m`;
}

function formatDayDistance(value) {
  const safe = Number(value);
  if (Number.isNaN(safe)) {
    return "";
  }
  if (safe === 0) {
    return "Today";
  }
  if (safe === 1) {
    return "Tomorrow";
  }
  if (safe > 1) {
    return `${safe} days away`;
  }
  return `${Math.abs(safe)} days ago`;
}

function getInitials(profile) {
  const first = profile?.firstName?.trim()?.[0] || "";
  const last = profile?.lastName?.trim()?.[0] || profile?.username?.trim()?.[0] || "";
  return `${first}${last}`.toUpperCase() || "EM";
}

function statusClass(status) {
  switch ((status || "").toUpperCase()) {
    case "APPROVED":
    case "COMPLETED":
    case "CHECKED_OUT":
      return "bg-success-subtle text-success";
    case "PENDING":
    case "NEW":
    case "CHECKED_IN":
    case "ON_BREAK":
    case "ON_LUNCH":
      return "bg-warning-subtle text-warning";
    case "DECLINED":
    case "INCOMPLETE":
    case "AUTO_CHECKOUT":
      return "bg-danger-subtle text-danger";
    default:
      return "bg-secondary-subtle text-secondary";
  }
}

function statusLabel(status) {
  return (status || "N/A").replaceAll("_", " ");
}

function buildQuickFallback(stats, summary) {
  if (Array.isArray(stats) && stats.length > 0) {
    return stats;
  }

  return [
    {
      id: 1,
      iconBg: "bg-primary",
      icon: "ti ti-clock",
      title: "Today Hours",
      value: formatHoursMinutes(summary?.totalHoursToday, summary?.totalMinutesToday),
      trend: "Today",
    },
    {
      id: 2,
      iconBg: "bg-info",
      icon: "ti ti-calendar-time",
      title: "This Week",
      value: formatHoursMinutes(summary?.totalHoursWeek, summary?.totalMinutesWeek),
      trend: "Work hours",
    },
    {
      id: 3,
      iconBg: "bg-success",
      icon: "ti ti-calendar-stats",
      title: "This Month",
      value: formatHoursMinutes(summary?.totalHoursMonth, summary?.totalMinutesMonth),
      trend: "Work hours",
    },
    {
      id: 4,
      iconBg: "bg-warning",
      icon: "ti ti-briefcase",
      title: "Overtime",
      value: formatMinutes(summary?.overtimeMinutesMonth),
      trend: "This month",
    },
  ];
}

export default function EmployeeDashboardPage() {
  const { data: queryData, isLoading, error, refetch } = useQuery({
    queryKey: ["employee-dashboard"],
    queryFn: dashboardService.getEmployeeDashboard,
    placeholderData: employeeDashboardData,
    keepPreviousData: true,
  });

  const data = queryData && typeof queryData === "object" ? queryData : employeeDashboardData;
  const rawProfile = data.profile || employeeDashboardData.profile;
  const attendanceSummary = data.attendanceSummary || employeeDashboardData.attendanceSummary;
  const todayAttendance = data.todayAttendance || null;
  const leaveSummary = data.leaveSummary || employeeDashboardData.leaveSummary;
  const performanceSummary = data.performanceSummary || employeeDashboardData.performanceSummary;
  const nextHoliday = data.nextHoliday || employeeDashboardData.nextHoliday;
  const leavePolicySummary = data.leavePolicySummary || employeeDashboardData.leavePolicySummary;
  const quickStats = buildQuickFallback(data.quickStats, attendanceSummary);
  const recentLeaves = Array.isArray(data.recentLeaves) ? data.recentLeaves : [];
  const recentActivities = Array.isArray(data.recentActivities) ? data.recentActivities : [];
  
  if (isLoading && !queryData) {
    return <PageLoader />;
  }

  if (error && !queryData) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="employee-dashboard-wrapper container-fluid p-0">
      <style>{`
        .employee-dashboard-wrapper .dashboard-hero {
          background: linear-gradient(135deg, #4f46e5 0%, #312e81 100%);
          border: 0;
          color: #fff;
          box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.3);
        }
        .employee-dashboard-wrapper .dashboard-hero .muted {
          color: rgba(255, 255, 255, 0.85);
        }
        .employee-dashboard-wrapper .dashboard-card {
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 1rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          background: #ffffff;
          margin-bottom: 1.5rem;
        }
        .employee-dashboard-wrapper .dashboard-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 20px -8px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.04);
        }
        .employee-dashboard-wrapper .dashboard-muted {
          color: #64748b;
          font-weight: 500;
        }
        .employee-dashboard-wrapper .avatar-fallback {
          width: 72px;
          height: 72px;
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          background: linear-gradient(135deg, #ffffff, #e2e8f0);
          color: #1e293b;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .employee-dashboard-wrapper .profile-detail-row {
          padding: 0.65rem 0.5rem;
          border-bottom: 1px solid #f1f5f9;
        }
        .employee-dashboard-wrapper .profile-detail-row:last-child {
          border-bottom: 0;
        }
        .employee-dashboard-wrapper .metric-tile-mini {
          border-radius: 0.5rem;
          padding: 0.65rem 0.4rem;
          text-align: center;
          transition: all 0.2s ease;
        }
        .employee-dashboard-wrapper .tile-primary { background-color: #e0e7ff; color: #312e81; }
        .employee-dashboard-wrapper .tile-info { background-color: #e0f2fe; color: #0369a1; }
        .employee-dashboard-wrapper .tile-success { background-color: #d1fae5; color: #065f46; }
        .employee-dashboard-wrapper .tile-warning { background-color: #fef3c7; color: #92400e; }
        .employee-dashboard-wrapper .tile-danger { background-color: #fee2e2; color: #991b1b; }
        .employee-dashboard-wrapper .tile-secondary { background-color: #f1f5f9; color: #334155; }
        
        .employee-dashboard-wrapper .badge-premium {
          padding: 0.35em 0.65em;
          font-size: 0.75em;
          font-weight: 600;
          border-radius: 0.5rem;
        }
        .employee-dashboard-wrapper .progress-sm {
          height: 6px;
        }
        .employee-dashboard-wrapper .avatar-group .avatar {
          position: relative;
          display: inline-block;
          width: 30px;
          height: 30px;
          border: 2px solid #fff;
          border-radius: 50%;
          overflow: hidden;
          margin-left: -8px;
        }
        .employee-dashboard-wrapper .avatar-group .avatar:first-child {
          margin-left: 0;
        }
        .employee-dashboard-wrapper .skill-progress {
          margin-bottom: 1.25rem;
        }
        .employee-dashboard-wrapper .skill-progress:last-child {
          margin-bottom: 0;
        }
        .employee-dashboard-wrapper .timeline-punch-line {
          height: 4px;
          background: #e2e8f0;
          position: relative;
          margin: 1.5rem 0;
        }
        .employee-dashboard-wrapper .timeline-punch-bar {
          height: 100%;
          background: #10b981;
          position: absolute;
          left: 30%;
          width: 50%;
        }
        .employee-dashboard-wrapper .timeline-punch-dot {
          width: 12px;
          height: 12px;
          background: #94a3b8;
          border: 2px solid #fff;
          border-radius: 50%;
          position: absolute;
          top: -4px;
        }
        .employee-dashboard-wrapper .timeline-punch-dot.active {
          background: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.3);
        }
        .employee-dashboard-wrapper .notification-item-compact {
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 0.75rem;
          margin-bottom: 0.75rem;
        }
        .employee-dashboard-wrapper .notification-item-compact:last-child {
          border-bottom: 0;
          padding-bottom: 0;
          margin-bottom: 0;
        }
        .employee-dashboard-wrapper .meeting-row {
          border-left: 4px solid #cbd5e1;
          padding-left: 0.75rem;
          margin-bottom: 1rem;
        }
        .employee-dashboard-wrapper .meeting-row:last-child {
          margin-bottom: 0;
        }
      `}</style>

      {/* Breadcrumb & Header row */}
      <div className="card dashboard-card p-3 mb-4">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb">
          <div className="my-auto">
            <h3 className="mb-1 fw-bold text-dark">{data.header?.title || "Employee Dashboard"}</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                {(data.header?.breadcrumbs || []).map((breadcrumb, index) => (
                  <li
                    key={`${breadcrumb.label}-${index}`}
                    className={`breadcrumb-item ${index === (data.header?.breadcrumbs?.length || 0) - 1 ? "active" : ""}`}
                  >
                    {index < (data.header?.breadcrumbs?.length || 0) - 1 && breadcrumb.href ? (
                      <Link to={breadcrumb.href} className="text-decoration-none">
                        {breadcrumb.iconClass ? <i className={`${breadcrumb.iconClass} me-1`} /> : null}
                        {breadcrumb.label}
                      </Link>
                    ) : (
                      breadcrumb.label
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap my-auto mt-md-0 mt-3">
            <span className="badge bg-light text-dark border badge-premium">
              {formatDate(new Date().toISOString())}
            </span>
            <span className="badge bg-primary-transparent text-primary badge-premium">
              {statusLabel(rawProfile?.role || "EMPLOYEE")}
            </span>
            <span className="badge bg-success-transparent text-success badge-premium">
              {statusLabel(rawProfile?.activationStatus || (rawProfile?.active ? "ACTIVE" : "INACTIVE"))}
            </span>
          </div>
        </div>
      </div>

      {/* Top Banner Message */}
      {data.statusMessage && (
        <div className="alert bg-success-transparent alert-dismissible fade show mb-4 border-0 shadow-sm d-flex align-items-center" role="alert">
          <i className="ti ti-circle-check-filled fs-18 me-2 text-success" />
          <div className="text-dark fw-medium">{data.statusMessage}</div>
          <button type="button" className="btn-close fs-14" data-bs-dismiss="alert" aria-label="Close">
            <i className="ti ti-x" />
          </button>
        </div>
      )}

      <div className="row">
        {/* Left Column - Profile, Leave summary 2, Skills, Holiday */}
        <div className="col-lg-4 col-md-12">
          {/* Profile Card */}
          <div className="card dashboard-card">
            <div className="card-body p-4">
              <div className="dashboard-hero rounded-4 p-4 mb-4 text-center">
                <div className="avatar-fallback mx-auto mb-3" style={{ width: "80px", height: "80px", borderRadius: "50%" }}>
                  <span className="fs-3 fw-bold text-dark">{getInitials(rawProfile)}</span>
                </div>
                <h4 className="mb-1 fw-bold text-white">
                  {rawProfile?.firstName || rawProfile?.lastName
                    ? `${rawProfile.firstName || ""} ${rawProfile.lastName || ""}`.trim()
                    : "Employee"}
                </h4>
                <p className="mb-2 muted fs-13">{rawProfile?.designation || "Staff"}</p>
                <span className="badge bg-white-transparent badge-premium text-white fs-12">
                  {rawProfile?.departmentName || "General"}
                </span>
              </div>

              <div className="d-grid gap-1">
                <div className="profile-detail-row d-flex justify-content-between align-items-center">
                  <span className="dashboard-muted fs-13"><i className="ti ti-phone me-2 text-primary" />Phone Number</span>
                  <div className="fw-semibold text-dark">{rawProfile?.phone || "-"}</div>
                </div>
                <div className="profile-detail-row d-flex justify-content-between align-items-center">
                  <span className="dashboard-muted fs-13"><i className="ti ti-mail me-2 text-primary" />Email Address</span>
                  <div className="fw-semibold text-dark text-truncate max-w-180" title={rawProfile?.email}>{rawProfile?.email || "-"}</div>
                </div>
                <div className="profile-detail-row d-flex justify-content-between align-items-center">
                  <span className="dashboard-muted fs-13"><i className="ti ti-user-check me-2 text-primary" />Report Office</span>
                  <div className="fw-semibold text-dark">{rawProfile?.teamName || "Main Office"}</div>
                </div>
                <div className="profile-detail-row d-flex justify-content-between align-items-center">
                  <span className="dashboard-muted fs-13"><i className="ti ti-calendar-event me-2 text-primary" />Joined on</span>
                  <div className="fw-semibold text-dark">{formatDate(rawProfile?.joinDate)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Leave Details 2 */}
          <div className="card dashboard-card">
            <div className="card-header bg-white border-0 pb-0 pt-4 px-4">
              <h5 className="mb-0 fw-bold text-dark">Leave Details</h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-6">
                  <div className="metric-tile-mini tile-primary">
                    <span className="dashboard-muted fs-12 d-block mb-1">Total Leaves</span>
                    <h5 className="fw-bold mb-0">{leaveSummary?.totalRequests || 0}</h5>
                  </div>
                </div>
                <div className="col-6">
                  <div className="metric-tile-mini tile-success">
                    <span className="dashboard-muted fs-12 d-block mb-1">Taken</span>
                    <h5 className="fw-bold mb-0">{leaveSummary?.approvedRequests || 0}</h5>
                  </div>
                </div>
                <div className="col-6">
                  <div className="metric-tile-mini tile-danger">
                    <span className="dashboard-muted fs-12 d-block mb-1">Absent</span>
                    <h5 className="fw-bold mb-0">{attendanceSummary?.daysAbsent || 0}</h5>
                  </div>
                </div>
                <div className="col-6">
                  <div className="metric-tile-mini tile-warning">
                    <span className="dashboard-muted fs-12 d-block mb-1">Request</span>
                    <h5 className="fw-bold mb-0">{leaveSummary?.pendingRequests || 0}</h5>
                  </div>
                </div>
                <div className="col-6">
                  <div className="metric-tile-mini tile-info">
                    <span className="dashboard-muted fs-12 d-block mb-1">Worked Days</span>
                    <h5 className="fw-bold mb-0">{attendanceSummary?.daysPresent || 0}</h5>
                  </div>
                </div>
                <div className="col-6">
                  <div className="metric-tile-mini tile-danger">
                    <span className="dashboard-muted fs-12 d-block mb-1">Loss of Pay</span>
                    <h5 className="fw-bold mb-0">{leaveSummary?.declinedRequests || 0}</h5>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* My Skills Card */}
          {/* <div className="card dashboard-card">
            <div className="card-header bg-white border-0 pb-0 pt-4 px-4">
              <h5 className="mb-0 fw-bold text-dark">My Skills</h5>
            </div>
            <div className="card-body p-4">
              <div className="skill-progress">
                <div className="d-flex justify-content-between mb-1">
                  <span className="fw-medium text-dark fs-13">Figma <span className="text-muted fs-11 ms-1">(Updated : 15 May 2025)</span></span>
                  <span className="fw-bold text-primary fs-13">95%</span>
                </div>
                <div className="progress progress-sm"><div className="progress-bar bg-primary" style={{ width: "95%" }} /></div>
              </div>
              <div className="skill-progress">
                <div className="d-flex justify-content-between mb-1">
                  <span className="fw-medium text-dark fs-13">HTML <span className="text-muted fs-11 ms-1">(Updated : 12 May 2025)</span></span>
                  <span className="fw-bold text-success fs-13">85%</span>
                </div>
                <div className="progress progress-sm"><div className="progress-bar bg-success" style={{ width: "85%" }} /></div>
              </div>
              <div className="skill-progress">
                <div className="d-flex justify-content-between mb-1">
                  <span className="fw-medium text-dark fs-13">CSS <span className="text-muted fs-11 ms-1">(Updated : 12 May 2025)</span></span>
                  <span className="fw-bold text-info fs-13">70%</span>
                </div>
                <div className="progress progress-sm"><div className="progress-bar bg-info" style={{ width: "70%" }} /></div>
              </div>
              <div className="skill-progress">
                <div className="d-flex justify-content-between mb-1">
                  <span className="fw-medium text-dark fs-13">Wordpress <span className="text-muted fs-11 ms-1">(Updated : 15 May 2025)</span></span>
                  <span className="fw-bold text-warning fs-13">61%</span>
                </div>
                <div className="progress progress-sm"><div className="progress-bar bg-warning" style={{ width: "61%" }} /></div>
              </div>
              <div className="skill-progress">
                <div className="d-flex justify-content-between mb-1">
                  <span className="fw-medium text-dark fs-13">Javascript <span className="text-muted fs-11 ms-1">(Updated : 13 May 2025)</span></span>
                  <span className="fw-bold text-danger fs-13">58%</span>
                </div>
                <div className="progress progress-sm"><div className="progress-bar bg-danger" style={{ width: "58%" }} /></div>
              </div>
            </div>
          </div> */}


        </div>

        {/* Center Column - Leave details 1, Attendance timeline, Total Hours Summary, Projects, Tasks */}
        <div className="col-lg-5 col-md-12">
          {/* Leave Details 1 */}
          <div className="card dashboard-card">
            <div className="card-header bg-white border-0 pb-0 pt-4 px-4 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold text-dark">Leave Details</h5>
              <span className="badge bg-success-transparent text-success badge-premium">Better than 85% of Employees</span>
            </div>
            <div className="card-body p-4">
              <div className="row g-2">
                <div className="col">
                  <div className="metric-tile-mini tile-success">
                    <h4 className="fw-bold mb-0">{Math.max(0, (attendanceSummary?.daysPresent || 0) - (attendanceSummary?.daysLate || 0))}</h4>
                    <span className="dashboard-muted fs-11">on time</span>
                  </div>
                </div>
                <div className="col">
                  <div className="metric-tile-mini tile-danger">
                    <h4 className="fw-bold mb-0">{attendanceSummary?.daysLate || 0}</h4>
                    <span className="dashboard-muted fs-11">Late Att.</span>
                  </div>
                </div>
                <div className="col">
                  <div className="metric-tile-mini tile-info">
                    <h4 className="fw-bold mb-0">0</h4>
                    <span className="dashboard-muted fs-11">WFH</span>
                  </div>
                </div>
                <div className="col">
                  <div className="metric-tile-mini tile-warning">
                    <h4 className="fw-bold mb-0">{attendanceSummary?.daysAbsent || 0}</h4>
                    <span className="dashboard-muted fs-11">Absent</span>
                  </div>
                </div>
                <div className="col">
                  <div className="metric-tile-mini tile-primary">
                    <h4 className="fw-bold mb-0">{leaveSummary?.approvedRequests || 0}</h4>
                    <span className="dashboard-muted fs-11">Sick Leave</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Log Card */}
          <div className="card dashboard-card">
            <div className="card-header bg-white border-0 pb-0 pt-4 px-4 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold text-dark">Attendance Log</h5>
              <span className="badge bg-info-transparent text-info badge-premium">
                {todayAttendance?.attendanceDate ? formatDate(todayAttendance.attendanceDate) : formatDate(new Date().toISOString())}
              </span>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="p-3 rounded bg-light">
                    <div className="text-muted fs-12"><i className="ti ti-login me-1 text-success" />Punch In at</div>
                    <div className="fw-bold fs-15 text-dark">{todayAttendance?.checkInTime ? formatTime(todayAttendance.checkInTime) : "-"}</div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="p-3 rounded bg-light">
                    <div className="text-muted fs-12"><i className="ti ti-clock-check me-1 text-primary" />Net Ratio</div>
                    <div className="fw-bold fs-15 text-dark">
                      {todayAttendance?.netWorkMinutes ? formatMinutes(todayAttendance.netWorkMinutes) : "-"} / 9h
                    </div>
                  </div>
                </div>
              </div>

              {/* Punch Timeline strip */}
              <div className="timeline-punch-line">
                <div className="timeline-punch-bar" style={{ 
                  left: todayAttendance?.checkInTime ? "30%" : "0%", 
                  width: todayAttendance?.checkOutTime ? "50%" : (todayAttendance?.checkInTime ? "20%" : "0%") 
                }} />
                <div className="timeline-punch-dot active" style={{ left: "0%" }} title="06:00 AM" />
                <div className="timeline-punch-dot active" style={{ left: "30%" }} title={`Punch In - ${todayAttendance?.checkInTime ? formatTime(todayAttendance.checkInTime) : "-"}`} />
                <div className={todayAttendance?.checkOutTime ? "timeline-punch-dot active" : "timeline-punch-dot"} style={{ left: "80%" }} title={`Punch Out - ${todayAttendance?.checkOutTime ? formatTime(todayAttendance.checkOutTime) : "-"}`} />
                <div className="timeline-punch-dot" style={{ left: "100%" }} title="11:00 PM" />
              </div>
              <div className="d-flex justify-content-between text-muted fs-11 px-1 mb-4">
                <span>06:00 AM</span>
                <span>12:00 PM</span>
                <span>06:00 PM</span>
                <span>11:00 PM</span>
              </div>

              {/* Stats Grid */}
              <div className="row g-2 text-center">
                <div className="col-6 col-md-3">
                  <div className="border rounded p-2">
                    <span className="text-muted fs-11 d-block">Total Hours</span>
                    <strong className="text-dark fs-13">
                      {todayAttendance ? formatMinutes((todayAttendance.netWorkMinutes || 0) + (todayAttendance.breakTimeMinutes || 0) + (todayAttendance.lunchTimeMinutes || 0)) : "-"}
                    </strong>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="border rounded p-2">
                    <span className="text-muted fs-11 d-block">Productive Hours</span>
                    <strong className="text-success fs-13">{todayAttendance ? formatMinutes(todayAttendance.netWorkMinutes) : "-"}</strong>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="border rounded p-2">
                    <span className="text-muted fs-11 d-block">Break hours</span>
                    <strong className="text-warning fs-13">
                      {todayAttendance ? formatMinutes((todayAttendance.breakTimeMinutes || 0) + (todayAttendance.lunchTimeMinutes || 0)) : "-"}
                    </strong>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="border rounded p-2">
                    <span className="text-muted fs-11 d-block">Overtime</span>
                    <strong className="text-danger fs-13">{todayAttendance ? formatMinutes(todayAttendance.overtimeMinutes) : "-"}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Total Hours Progress Summary */}
          <div className="card dashboard-card">
            <div className="card-header bg-white border-0 pb-0 pt-4 px-4">
              <h5 className="mb-0 fw-bold text-dark">Total Hours Today</h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-6">
                  <div className="border rounded p-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="text-muted fs-12">Total Hours Today</span>
                      <span className="text-success fw-bold fs-11"><i className="ti ti-trending-up me-1" />-</span>
                    </div>
                    <h4 className="fw-bold mb-0 text-dark">
                      {todayAttendance ? formatMinutes(todayAttendance.netWorkMinutes) : "-"}
                    </h4>
                    <span className="text-muted fs-11 mt-1 d-block">Production hours</span>
                  </div>
                </div>
                <div className="col-6">
                  <div className="border rounded p-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="text-muted fs-12">Total Hours Week</span>
                      <span className="text-success fw-bold fs-11"><i className="ti ti-trending-up me-1" />-</span>
                    </div>
                    <h4 className="fw-bold mb-0 text-dark">
                      {formatHoursMinutes(attendanceSummary?.totalHoursWeek, attendanceSummary?.totalMinutesWeek)} / 40
                    </h4>
                    <span className="text-muted fs-11 mt-1 d-block">Work week progress</span>
                  </div>
                </div>
                <div className="col-6">
                  <div className="border rounded p-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="text-muted fs-12">Total Hours Month</span>
                      <span className="text-success fw-bold fs-11"><i className="ti ti-trending-up me-1" />-</span>
                    </div>
                    <h4 className="fw-bold mb-0 text-dark">
                      {formatHoursMinutes(attendanceSummary?.totalHoursMonth, attendanceSummary?.totalMinutesMonth)} / 160
                    </h4>
                    <span className="text-muted fs-11 mt-1 d-block">Work month progress</span>
                  </div>
                </div>
                <div className="col-6">
                  <div className="border rounded p-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="text-muted fs-12">Overtime Month</span>
                      <span className="text-success fw-bold fs-11"><i className="ti ti-trending-up me-1" />-</span>
                    </div>
                    <h4 className="fw-bold mb-0 text-dark">
                      {formatMinutes(attendanceSummary?.overtimeMinutesMonth)}
                    </h4>
                    <span className="text-muted fs-11 mt-1 d-block">Overtime total progress</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Projects Card */}
          {/* <div className="card dashboard-card">
            <div className="card-header bg-white border-0 pb-0 pt-4 px-4">
              <h5 className="mb-0 fw-bold text-dark">Projects</h5>
            </div>
            <div className="card-body p-4">
              <div className="border rounded p-3 mb-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h6 className="fw-bold mb-1 text-dark">Office Management</h6>
                    <span className="text-muted fs-12"><i className="ti ti-user me-1" />Anthony Lewis <span className="badge bg-light text-dark fs-10 ms-1">Project Leader</span></span>
                  </div>
                  <span className="badge bg-danger-transparent text-danger badge-premium">14 Jan 2024 Deadline</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mt-3 fs-13">
                  <span>Tasks : <strong>6 / 10</strong></span>
                  <span>Time Spent : <strong>65/120 Hrs</strong></span>
                </div>
                <div className="progress progress-sm my-2"><div className="progress-bar bg-primary" style={{ width: "60%" }} /></div>
                <div className="avatar-group mt-2">
                  <div className="avatar"><span className="avatar-title bg-primary text-white fs-10">AL</span></div>
                  <div className="avatar"><span className="avatar-title bg-success text-white fs-10">BV</span></div>
                  <div className="avatar"><span className="avatar-title bg-info text-white fs-10">HS</span></div>
                  <div className="avatar"><span className="avatar-title bg-secondary text-white fs-10">+2</span></div>
                </div>
              </div>
            </div>
          </div> */}

          {/* Tasks Card */}
          {/* <div className="card dashboard-card">
            <div className="card-header bg-white border-0 pb-0 pt-4 px-4">
              <h5 className="mb-0 fw-bold text-dark">Tasks</h5>
            </div>
            <div className="card-body p-4">
              <div className="d-grid gap-2">
                <div className="p-3 border rounded d-flex justify-content-between align-items-center">
                  <span className="fw-medium text-dark fs-13">Patient appointment booking</span>
                  <span className="badge bg-warning text-white badge-premium">Onhold</span>
                </div>
                <div className="p-3 border rounded d-flex justify-content-between align-items-center">
                  <span className="fw-medium text-dark fs-13">Appointment booking with payment</span>
                  <span className="badge bg-primary text-white badge-premium">Inprogress</span>
                </div>
                <div className="p-3 border rounded d-flex justify-content-between align-items-center">
                  <span className="fw-medium text-dark fs-13">Patient and Doctor video conferencing</span>
                  <span className="badge bg-success text-white badge-premium">Completed</span>
                </div>
                <div className="p-3 border rounded d-flex justify-content-between align-items-center">
                  <span className="fw-medium text-dark fs-13">Private chat module</span>
                  <span className="badge bg-secondary text-white badge-premium">Pending</span>
                </div>
                <div className="p-3 border rounded d-flex justify-content-between align-items-center">
                  <span className="fw-medium text-dark fs-13">Go-Live and Post-Implementation Support</span>
                  <span className="badge bg-primary text-white badge-premium">Inprogress</span>
                </div>
              </div>
            </div>
          </div> */}
        </div>

        {/* Right Column - Performance, Birthday, Team, Notifications, Meetings */}
        <div className="col-lg-3 col-md-12">
          {/* Performance Card */}
          <div className="card dashboard-card text-center">
            <div className="card-header bg-white border-0 pb-0 pt-4 px-4">
              <h5 className="mb-0 fw-bold text-dark">Performance</h5>
            </div>
            <div className="card-body p-4">
              <div className="d-inline-flex align-items-center justify-content-center border border-success rounded-circle mb-3" style={{ width: "90px", height: "90px", borderWidth: "4px" }}>
                <h3 className="fw-bold mb-0 text-success">{performanceSummary?.completionPercent ?? 0}%</h3>
              </div>
              <div className="fw-semibold text-dark fs-13 mb-1">{statusLabel(performanceSummary?.status || "No review")}</div>
              <div className="text-muted fs-12">{performanceSummary?.summary || "No appraisal available yet."}</div>
            </div>
          </div>

          {/* Meetings Schedule Card */}
          {/* <div className="card dashboard-card">
            <div className="card-header bg-white border-0 pb-0 pt-4 px-4">
              <h5 className="mb-0 fw-bold text-dark">Meetings Schedule</h5>
            </div>
            <div className="card-body p-4">
              <div className="meeting-row" style={{ borderLeftColor: "#28a745" }}>
                <span className="text-muted fs-11 d-block mb-1">09:25 AM</span>
                <span className="fw-semibold text-dark fs-13 d-block">Marketing Strategy Presentation</span>
                <span className="badge bg-success-transparent text-success badge-premium mt-1">Marketing</span>
              </div>
              <div className="meeting-row" style={{ borderLeftColor: "#17a2b8" }}>
                <span className="text-muted fs-11 d-block mb-1">09:20 AM</span>
                <span className="fw-semibold text-dark fs-13 d-block">Design Review Hospital</span>
                <span className="badge bg-info-transparent text-info badge-premium mt-1">Review</span>
              </div>
              <div className="meeting-row" style={{ borderLeftColor: "#ffc107" }}>
                <span className="text-muted fs-11 d-block mb-1">09:18 AM</span>
                <span className="fw-semibold text-dark fs-13 d-block">Birthday Celebration of Employee</span>
                <span className="badge bg-warning-transparent text-warning badge-premium mt-1">Celebration</span>
              </div>
              <div className="meeting-row" style={{ borderLeftColor: "#007bff" }}>
                <span className="text-muted fs-11 d-block mb-1">09:10 AM</span>
                <span className="fw-semibold text-dark fs-13 d-block">Update of Project Flow</span>
                <span className="badge bg-primary-transparent text-primary badge-premium mt-1">Development</span>
              </div>
            </div>
          </div> */}

          {/* Team Birthday Card */}
          {/* <div className="card dashboard-card text-center">
            <div className="card-header bg-white border-0 pb-0 pt-4 px-4">
              <h5 className="mb-0 fw-bold text-dark">Team Birthday</h5>
            </div>
            <div className="card-body p-4">
              <div className="avatar-fallback mx-auto mb-3" style={{ width: "60px", height: "60px", borderRadius: "50%", background: "linear-gradient(135deg, #fbcfe8, #f472b6)" }}>
                <span className="fs-5 fw-bold text-dark">AJ</span>
              </div>
              <h6 className="fw-bold mb-1 text-dark">Andrew Jermia</h6>
              <span className="text-muted fs-12">IOS Developer</span>
            </div>
          </div> */}

          {/* Team Members List */}
          {/* <div className="card dashboard-card">
            <div className="card-header bg-white border-0 pb-0 pt-4 px-4">
              <h5 className="mb-0 fw-bold text-dark">Team Members</h5>
            </div>
            <div className="card-body p-4">
              <div className="d-grid gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="avatar-fallback flex-shrink-0" style={{ width: "36px", height: "36px" }}><span className="fs-11">AJ</span></div>
                  <div>
                    <h6 className="fw-semibold text-dark fs-13 mb-0">Alexander Jermai</h6>
                    <span className="text-muted fs-11">UI/UX Designer</span>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <div className="avatar-fallback flex-shrink-0" style={{ width: "36px", height: "36px" }}><span className="fs-11">DM</span></div>
                  <div>
                    <h6 className="fw-semibold text-dark fs-13 mb-0">Doglas Martini</h6>
                    <span className="text-muted fs-11">Product Designer</span>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <div className="avatar-fallback flex-shrink-0" style={{ width: "36px", height: "36px" }}><span className="fs-11">DE</span></div>
                  <div>
                    <h6 className="fw-semibold text-dark fs-13 mb-0">Daniel Esbella</h6>
                    <span className="text-muted fs-11">Project Manager</span>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <div className="avatar-fallback flex-shrink-0" style={{ width: "36px", height: "36px" }}><span className="fs-11">DE</span></div>
                  <div>
                    <h6 className="fw-semibold text-dark fs-13 mb-0">Daniel Esbella</h6>
                    <span className="text-muted fs-11">Team Lead</span>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <div className="avatar-fallback flex-shrink-0" style={{ width: "36px", height: "36px" }}><span className="fs-11">SP</span></div>
                  <div>
                    <h6 className="fw-semibold text-dark fs-13 mb-0">Stephan Peralt</h6>
                    <span className="text-muted fs-11">Team Lead</span>
                  </div>
                </div>
              </div>
            </div>
          </div> */}

          {/* Notifications Card */}
          <div className="card dashboard-card">
            <div className="card-header bg-white border-0 pb-0 pt-4 px-4">
              <h5 className="mb-0 fw-bold text-dark">Notifications</h5>
            </div>
            <div className="card-body p-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div key={activity.id || `${activity.action}-${activity.createdAt}`} className="notification-item-compact">
                    <span className="fw-medium text-dark fs-13 d-block">{activity.description || activity.action}</span>
                    <span className="text-muted fs-11">{formatDateTime(activity.createdAt)}</span>
                  </div>
                ))
              ) : (
                <div className="text-muted text-center fs-13 py-3">No recent notifications</div>
              )}
            </div>
          </div>
                    {/* Holiday & Policy */}
          <div className="row g-3">
            <div className="col-6">
              <div className="card dashboard-card">
                <div className="card-body p-3 text-center">
                  <i className="ti ti-file-text text-primary fs-24 mb-2 d-block" />
                  <span className="fw-medium text-dark fs-13 d-block text-truncate" title={leavePolicySummary?.policyName || "Leave Policy"}>
                    {leavePolicySummary?.policyName || "Leave Policy"}
                  </span>
                  <span className="text-muted fs-11 d-block mt-1">
                    Remaining: {leavePolicySummary?.remainingDays ?? 0} / {leavePolicySummary?.allowedDays ?? 0} days
                  </span>
                </div>
              </div>
            </div>
            <div className="col-6">
              <div className="card dashboard-card">
                <div className="card-body p-3 text-center">
                  <i className="ti ti-calendar-event text-danger fs-24 mb-2 d-block" />
                  <span className="fw-medium text-dark fs-13 d-block text-truncate" title={nextHoliday?.title || "Next Holiday"}>
                    {nextHoliday?.title || "Next Holiday"}
                  </span>
                  <strong className="text-danger fs-12 d-block mt-1">
                    {nextHoliday?.date ? formatDate(nextHoliday.date) : "No upcoming holiday"}
                  </strong>
                  <span className="text-muted fs-11 d-block mt-1">
                    {nextHoliday?.daysAway !== null && nextHoliday?.daysAway !== undefined
                      ? formatDayDistance(nextHoliday.daysAway)
                      : (nextHoliday?.description || "")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
