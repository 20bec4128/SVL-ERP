import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { loadLegacyUiScripts } from "../../utils/loadLegacyUiScripts";
import PageLoader from "../../components/common/PageLoader";
import ErrorState from "../../components/common/ErrorState";
import PageHeader from "../../components/admin/PageHeader";
import StatCard from "../../components/admin/StatCard";
import dashboardService from "../../services/dashboardService";
import { dashboardData } from "../../mock/dashboardData";
import { useAuth } from "../../context/AuthContext";

const employeeBadgeClasses = [
  "badge-secondary-transparent",
  "badge-danger-transparent",
  "badge-info-transparent",
  "badge-purple-transparent",
  "badge-pink-transparent",
];

function getEmployeeBadgeClass(index) {
  return employeeBadgeClasses[index % employeeBadgeClasses.length];
}

function getAvatarSrc(avatar) {
  return avatar || "/assets/img/profiles/avatar-31.jpg";
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { data: queryData, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: dashboardService.getDashboard,
    placeholderData: dashboardData,
    keepPreviousData: true,
  });

  const hasValidData =
    Boolean(queryData?.header?.title) &&
    Array.isArray(queryData?.header?.breadcrumbs) &&
    Boolean(queryData?.welcome) &&
    Array.isArray(queryData?.topStats);

  const data = hasValidData ? queryData : dashboardData;
  const welcomeAvatar = user?.profilePhotoUrl
    || data.welcome?.avatar
    || "/assets/img/profiles/avatar-31.jpg";
  const welcomeName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.username ||
    data.welcome?.name ||
    "Admin";
  const MAX_EMPLOYEES = 5;
  const MAX_BIRTHDAY_ITEMS = 4;
  const allEmployees = Array.isArray(data.employees) ? data.employees : [];
  const employees = allEmployees.slice(0, MAX_EMPLOYEES);
  const hasMoreEmployees = allEmployees.length > MAX_EMPLOYEES;

  // Flatten birthday groups and cap at MAX_BIRTHDAY_ITEMS total
  const allBirthdayGroups = Array.isArray(data.birthdays) ? data.birthdays : [];
  let _birthdayItemCount = 0;
  const birthdayGroups = allBirthdayGroups.reduce((acc, group) => {
    if (_birthdayItemCount >= MAX_BIRTHDAY_ITEMS) return acc;
    const items = (group.items || []).slice(0, MAX_BIRTHDAY_ITEMS - _birthdayItemCount);
    _birthdayItemCount += items.length;
    if (items.length > 0) acc.push({ ...group, items });
    return acc;
  }, []);
  const totalBirthdayItems = allBirthdayGroups.reduce((sum, g) => sum + (g.items || []).length, 0);
  const hasMoreBirthdays = totalBirthdayItems > MAX_BIRTHDAY_ITEMS;
  const attendanceOverview = data.attendanceOverview || null;
  const attendanceChartKey = [
    attendanceOverview?.totalCount ?? "",
    attendanceOverview?.presentPercentage ?? "",
    attendanceOverview?.latePercentage ?? "",
    attendanceOverview?.permissionPercentage ?? "",
    attendanceOverview?.absentPercentage ?? "",
  ].join("|");

  useEffect(() => {
    if (isLoading) return;

    let empDeptChart = null;
    let salesChart = null;
    let attendanceChart = null;
    let semiDonutChart = null;

    loadLegacyUiScripts([
      "/assets/plugins/apexchart/apexcharts.min.js",
      "/assets/plugins/chartjs/chart.min.js"
    ]).then(() => {
      // 1. Employee Department Chart
      const empEl = document.querySelector("#emp-department");
      if (empEl && window.ApexCharts) {
        empEl.innerHTML = ""; // Clear any residue
        empDeptChart = new window.ApexCharts(empEl, {
          chart: {
            height: 220,
            type: "bar",
            padding: { top: 0, left: 0, right: 0, bottom: 0 },
            toolbar: { show: false }
          },
          colors: ["#FF6F28"],
          grid: {
            borderColor: "#E5E7EB",
            strokeDashArray: 5,
            padding: { top: -20, left: 0, right: 0, bottom: 0 }
          },
          plotOptions: {
            bar: {
              borderRadius: 5,
              horizontal: true,
              barHeight: "35%",
              endingShape: "rounded"
            }
          },
          dataLabels: { enabled: false },
          series: [{ data: [80, 110, 80, 20, 60, 100], name: "Employee" }],
          xaxis: {
            categories: ["UI/UX", "Development", "Management", "HR", "Testing", "Marketing"],
            labels: { style: { colors: "#111827", fontSize: "13px" } }
          }
        });
        empDeptChart.render();
      }

      // 2. Sales Income Chart
      const salesEl = document.querySelector("#sales-income");
      if (salesEl && window.ApexCharts) {
        salesEl.innerHTML = ""; // Clear any residue
        salesChart = new window.ApexCharts(salesEl, {
          chart: {
            height: 290,
            type: "bar",
            stacked: true,
            toolbar: { show: false }
          },
          colors: ["#FF6F28", "#F8F9FA"],
          responsive: [{
            breakpoint: 480,
            options: { legend: { position: "bottom", offsetX: -10, offsetY: 0 } }
          }],
          plotOptions: {
            bar: {
              borderRadius: 5,
              borderRadiusWhenStacked: "all",
              horizontal: false,
              endingShape: "rounded"
            }
          },
          series: [
            { name: "Income", data: [40, 30, 45, 80, 85, 90, 80, 80, 80, 85, 20, 80] },
            { name: "Expenses", data: [60, 70, 55, 20, 15, 10, 20, 20, 20, 15, 80, 20] }
          ],
          xaxis: {
            categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            labels: { style: { colors: "#6B7280", fontSize: "13px" } }
          },
          yaxis: {
            labels: { offsetX: -15, style: { colors: "#6B7280", fontSize: "13px" } }
          },
          grid: {
            borderColor: "#E5E7EB",
            strokeDashArray: 5,
            padding: { left: -8 }
          },
          legend: { show: false },
          dataLabels: { enabled: false },
          fill: { opacity: 1 }
        });
        salesChart.render();
      }

      // 3. Attendance Overview Chart
      const attEl = document.getElementById("attendance");
      if (attEl && window.Chart) {
        const ctx = attEl.getContext("2d");
        // Destroy old Chart instance if exists on canvas
        const existingChart = window.Chart.getChart(attEl);
        if (existingChart) existingChart.destroy();

        // Use live data if available, otherwise fallback to placeholders
        const overview = attendanceOverview;
        const lateVal = overview ? overview.latePercentage : 21;
        const presentVal = overview ? overview.presentPercentage : 59;
        const permissionVal = overview ? overview.permissionPercentage : 2;
        const absentVal = overview ? overview.absentPercentage : 15;

        attendanceChart = new window.Chart(ctx, {
          type: "doughnut",
          data: {
            labels: ["Late", "Present", "Permission", "Absent"],
            datasets: [{
              label: "Semi Donut",
              data: [lateVal, presentVal, permissionVal, absentVal],
              backgroundColor: ["#0C4B5E", "#03C95A", "#FFC107", "#E70D0D"],
              borderWidth: 5,
              borderRadius: 10,
              borderColor: "#fff",
              hoverBorderWidth: 0,
              cutout: "60%"
            }]
          },
          options: {
            rotation: -100,
            circumference: 200,
            layout: { padding: { top: -20, bottom: -20 } },
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { enabled: false },
            }
          }
        });
      }

      // 4. Tasks Statistics Semi Donut Chart
      const semiEl = document.getElementById("mySemiDonutChart");
      if (semiEl && window.Chart) {
        const ctx = semiEl.getContext("2d");
        const existingChart = window.Chart.getChart(semiEl);
        if (existingChart) existingChart.destroy();

        semiDonutChart = new window.Chart(ctx, {
          type: "doughnut",
          data: {
            labels: ["Ongoing", "Onhold", "Completed", "Overdue"],
            datasets: [{
              label: "Semi Donut",
              data: [20, 40, 20, 10],
              backgroundColor: ["#FFC107", "#1B84FF", "#03C95A", "#E70D0D"],
              borderWidth: -10,
              borderColor: "transparent",
              hoverBorderWidth: 0,
              cutout: "75%",
              spacing: -30
            }]
          },
          options: {
            rotation: -100,
            circumference: 185,
            layout: { padding: { top: -20, bottom: 20 } },
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
          }
        });
      }
    }).catch(err => {
      console.error("Failed to load chart scripts", err);
    });

    return () => {
      if (empDeptChart) empDeptChart.destroy();
      if (salesChart) salesChart.destroy();
      if (attendanceChart) attendanceChart.destroy();
      if (semiDonutChart) semiDonutChart.destroy();
    };
  }, [isLoading, attendanceChartKey]);

  if (isLoading && !hasValidData) {
    return <PageLoader />;
  }

  if (error && !hasValidData) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <>
      <PageHeader
        title={data.header.title}
        breadcrumbs={data.header.breadcrumbs}
        actions={
          <>
            <div className="me-2 mb-2">
              {/* <div className="dropdown">
                <a href="javascript:void(0);" className="dropdown-toggle btn btn-white d-inline-flex align-items-center" data-bs-toggle="dropdown">
                  <i className="ti ti-file-export me-1" />Export
                </a>
                <ul className="dropdown-menu  dropdown-menu-end p-3">
                  <li>
                    <a href="javascript:void(0);" className="dropdown-item rounded-1"><i className="ti ti-file-type-pdf me-1" />Export as PDF</a>
                  </li>
                  <li>
                    <a href="javascript:void(0);" className="dropdown-item rounded-1"><i className="ti ti-file-type-xls me-1" />Export as Excel </a>
                  </li>
                </ul>
              </div> */}
            </div>
            
            {/* <div className="ms-2 head-icons">
              <a href="javascript:void(0);" className="" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Collapse" id="collapse-header">
                <i className="ti ti-chevrons-up" />
              </a>
            </div> */}
          </>
        }
      />
      <style>{`
        .admin-dashboard-wrapper .welcome-gradient {
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%) !important;
          border-radius: 20px !important;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.08) !important;
          border: none !important;
          overflow: hidden;
        }
        .admin-dashboard-wrapper .welcome-gradient h3 {
          color: #ffffff !important;
          font-weight: 700 !important;
        }
        .admin-dashboard-wrapper .welcome-gradient p {
          color: rgba(255, 255, 255, 0.85) !important;
        }
        .admin-dashboard-wrapper .welcome-gradient .edit-icon {
          background: transparent !important;
          background-color: transparent !important;
          color: rgba(255, 255, 255, 0.6) !important;
          border: none !important;
          box-shadow: none !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: auto !important;
          height: auto !important;
          padding: 0 !important;
          margin-left: 4px;
        }
        .admin-dashboard-wrapper .welcome-gradient .edit-icon i {
          color: rgba(255, 255, 255, 0.6) !important;
        }
        .admin-dashboard-wrapper .card:not(.welcome-gradient) {
          border: 1px solid rgba(226, 232, 240, 0.8) !important;
          border-radius: 20px !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -2px rgba(0, 0, 0, 0.02) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          background: #ffffff !important;
        }
        .admin-dashboard-wrapper .card:not(.welcome-gradient):hover {
          transform: translateY(-4px) !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.06), 0 8px 10px -6px rgba(0, 0, 0, 0.06) !important;
          border-color: #3b82f6 !important;
        }
        .admin-dashboard-wrapper .avatar.rounded-circle {
          border-radius: 12px !important;
          width: 48px !important;
          height: 48px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.08) !important;
        }
        .admin-dashboard-wrapper .avatar.rounded-circle.bg-success {
          background-color: #03C95A !important;
          border: 1px solid #03C95A !important;
        }
        .admin-dashboard-wrapper .avatar.rounded-circle i {
          color: #ffffff !important;
        }
        .admin-dashboard-wrapper .btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
          border: none !important;
          box-shadow: 0 4px 10px rgba(59, 130, 246, 0.2) !important;
          border-radius: 10px !important;
          font-weight: 600 !important;
        }
        .admin-dashboard-wrapper .btn-secondary {
          background: rgba(255, 255, 255, 0.1) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          color: #ffffff !important;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05) !important;
          border-radius: 10px !important;
          font-weight: 600 !important;
          backdrop-filter: blur(8px) !important;
        }
        .admin-dashboard-wrapper .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.18) !important;
          color: #ffffff !important;
        }
      `}</style>
      <div className="admin-dashboard-wrapper">
        {/* Welcome Wrap */}
        <div className="card welcome-gradient border-0 mb-4">
          <div className="card-body d-flex align-items-center justify-content-between flex-wrap pb-2 pt-2">
            <div className="d-flex align-items-center mb-3 mt-2">
              <span className="avatar avatar-xl flex-shrink-0" style={{ border: "3px solid rgba(255, 255, 255, 0.2)", borderRadius: "50%", boxShadow: "0 8px 16px rgba(0, 0, 0, 0.15)" }}>
                <img src={welcomeAvatar} className="rounded-circle" alt={welcomeName} />
              </span>
              <div className="ms-3 text-white">
                <h3 className="mb-2 text-white" style={{ fontWeight: "700", display: "flex", alignItems: "center" }}>Welcome Back, {welcomeName} <a href="javascript:void(0);" className="edit-icon"><i className="ti ti-edit fs-14" /></a></h3>
                <p className="mb-0" style={{ color: "rgba(255, 255, 255, 0.85)" }}>You have <span className="text-info fw-semibold text-decoration-underline" style={{ color: "#38bdf8" }}>{data.welcome.pendingApprovals}</span> Pending Approvals &amp; <span className="text-info fw-semibold text-decoration-underline" style={{ color: "#38bdf8" }}>{data.welcome.leaveRequests}</span> Leave Requests</p>
              </div>
            </div>
            
          </div>
        </div>
        {/* /Welcome Wrap */}
  <div className="row align-items-start">
    {/* Widget Info */}
    <div className="col-xxl-8 d-flex">
      <div className="row flex-fill">
        {data.topStats.map((stat) => (
          <StatCard key={stat.id}>
            <span className={`avatar rounded-circle ${stat.iconBg} mb-2`}>
              <i className={stat.icon} />
            </span>
            <h6 className="fs-13 fw-medium text-default mb-1">{stat.title}</h6>
            <h3 className="mb-3">
              {stat.value}{" "}
              <span className={`fs-12 fw-medium ${stat.trendClass}`}>
                <i className={stat.trendIcon} />
                {stat.trend}
              </span>
            </h3>
            <a href={stat.link} className="link-default">
              {stat.linkLabel}
            </a>
          </StatCard>
        ))}
      </div>
    </div>
    {/* /Widget Info */}
    {/* Employees By Department */}
    {/* <div className="col-xxl-4 d-flex">
      <div className="card flex-fill">
        <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
          <h5 className="mb-2">Employees By Department</h5>
          <div className="dropdown mb-2">
            <a href="javascript:void(0);" className="btn btn-white border btn-sm d-inline-flex align-items-center" data-bs-toggle="dropdown">
              <i className="ti ti-calendar me-1" />This Week
            </a>
            <ul className="dropdown-menu  dropdown-menu-end p-3">
              <li>
                <a href="javascript:void(0);" className="dropdown-item rounded-1">This Month</a>
              </li>
              <li>
                <a href="javascript:void(0);" className="dropdown-item rounded-1">This Week</a>
              </li>
              <li>
                <a href="javascript:void(0);" className="dropdown-item rounded-1">Last Week</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="card-body">
          <div id="emp-department" />
          <p className="fs-13"><i className="ti ti-circle-filled me-2 fs-8 text-primary" />No of
            Employees increased by <span className="text-success fw-bold">+20%</span> from last Week
          </p>
        </div>
      </div>
    </div> */}
    {/* /Employees By Department */}
    <div className="col-xxl-4 col-xl-6 d-flex">
      <div className="card flex-fill">
        <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
          <h5 className="mb-2">Clock-In/Out</h5>
          <div className="d-flex align-items-center">
            <div className="dropdown mb-2">
              <a href="javascript:void(0);" className="dropdown-toggle btn btn-white btn-sm d-inline-flex align-items-center border-0 fs-13 me-2" data-bs-toggle="dropdown">
                All Departments
              </a>
              <ul className="dropdown-menu  dropdown-menu-end p-3">
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">Finance</a>
                </li>
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">Development</a>
                </li>
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">Marketing</a>
                </li>
              </ul>
            </div>
            <div className="dropdown mb-2">
              <a href="javascript:void(0);" className="btn btn-white border btn-sm d-inline-flex align-items-center" data-bs-toggle="dropdown">
                <i className="ti ti-calendar me-1" />Today
              </a>
              <ul className="dropdown-menu  dropdown-menu-end p-3">
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">This Month</a>
                </li>
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">This Week</a>
                </li>
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">Today</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="card-body">
          {(() => {
            const clockList = data.clockInOutList || [];
            const lateList = data.lateList || [];
            // Show up to 3 on-time or checked-in employees with detail for the last one
            const onTimeList = clockList.filter(e => !e.late);
            const simpleRows = onTimeList.slice(0, 2);
            const detailRow = onTimeList[2] || null;

            const getStatusBadge = (item) => {
              const isOut = item.status === "CHECKED_OUT" || item.status === "AUTO_CHECKOUT";
              const badgeClass = isOut ? "badge-danger" : "badge-success";
              const time = isOut ? (item.checkOutTime || "-") : (item.checkInTime || "-");
              return (
                <span className={`fs-10 fw-medium d-inline-flex align-items-center badge ${badgeClass}`}>
                  <i className="ti ti-circle-filled fs-5 me-1" />{time}
                </span>
              );
            };

            return (
              <>
                <div>
                  {simpleRows.map((emp, idx) => (
                    <div key={idx} className="d-flex align-items-center justify-content-between mb-3 p-2 border border-dashed br-5">
                      <div className="d-flex align-items-center">
                        <a href="javascript:void(0);" className="avatar flex-shrink-0">
                          <img src={emp.avatar || "/assets/img/profiles/avatar-31.jpg"} className="rounded-circle border border-2" alt="img" />
                        </a>
                        <div className="ms-2">
                          <h6 className="fs-14 fw-medium text-truncate">{emp.employeeName}</h6>
                          <p className="fs-13">{emp.designation}</p>
                        </div>
                      </div>
                      <div className="d-flex align-items-center">
                        <a href="javascript:void(0);" className="link-default me-2"><i className="ti ti-clock-share" /></a>
                        {getStatusBadge(emp)}
                      </div>
                    </div>
                  ))}
                  {detailRow && (
                    <div className="mb-3 p-2 border br-5">
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                          <a href="javascript:void(0);" className="avatar flex-shrink-0">
                            <img src={detailRow.avatar || "/assets/img/profiles/avatar-31.jpg"} className="rounded-circle border border-2" alt="img" />
                          </a>
                          <div className="ms-2">
                            <h6 className="fs-14 fw-medium text-truncate">{detailRow.employeeName}</h6>
                            <p className="fs-13">{detailRow.designation}</p>
                          </div>
                        </div>
                        <div className="d-flex align-items-center">
                          <a href="javascript:void(0);" className="link-default me-2"><i className="ti ti-clock-share" /></a>
                          {getStatusBadge(detailRow)}
                        </div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between flex-wrap mt-2 border br-5 p-2 pb-0">
                        <div>
                          <p className="mb-1 d-inline-flex align-items-center"><i className="ti ti-circle-filled text-success fs-5 me-1" />Clock In</p>
                          <h6 className="fs-13 fw-normal mb-2">{detailRow.checkInTime || "-"}</h6>
                        </div>
                        <div>
                          <p className="mb-1 d-inline-flex align-items-center"><i className="ti ti-circle-filled text-danger fs-5 me-1" />Clock Out</p>
                          <h6 className="fs-13 fw-normal mb-2">{detailRow.checkOutTime || "-"}</h6>
                        </div>
                        <div>
                          <p className="mb-1 d-inline-flex align-items-center"><i className="ti ti-circle-filled text-warning fs-5 me-1" />Production</p>
                          <h6 className="fs-13 fw-normal mb-2">{detailRow.productionHours || "00:00 Hrs"}</h6>
                        </div>
                      </div>
                    </div>
                  )}
                  {clockList.length === 0 && (
                    <p className="text-muted text-center py-3 small">No clock-in records for today</p>
                  )}
                </div>
                {lateList.length > 0 && (
                  <>
                    <h6 className="mb-2">Late</h6>
                    {lateList.slice(0, 2).map((emp, idx) => (
                      <div key={idx} className="d-flex align-items-center justify-content-between mb-3 p-2 border border-dashed br-5">
                        <div className="d-flex align-items-center">
                          <span className="avatar flex-shrink-0">
                            <img src={emp.avatar || "/assets/img/profiles/avatar-31.jpg"} className="rounded-circle border border-2" alt="img" />
                          </span>
                          <div className="ms-2">
                            <h6 className="fs-14 fw-medium text-truncate">
                              {emp.employeeName}{" "}
                              {emp.lateMinutes > 0 && (
                                <span className="fs-10 fw-medium d-inline-flex align-items-center badge badge-success">
                                  <i className="ti ti-clock-hour-11 me-1" />{emp.lateMinutes} Min
                                </span>
                              )}
                            </h6>
                            <p className="fs-13">{emp.designation}</p>
                          </div>
                        </div>
                        <div className="d-flex align-items-center">
                          <a href="javascript:void(0);" className="link-default me-2"><i className="ti ti-clock-share" /></a>
                          <span className="fs-10 fw-medium d-inline-flex align-items-center badge badge-danger">
                            <i className="ti ti-circle-filled fs-5 me-1" />{emp.checkInTime || "-"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            );
          })()}
          <a href="attendance-report.php" className="btn btn-light btn-md w-100">View All Attendance</a>
        </div>
      </div>
    </div>
  </div>
  <div className="row">
    {/* Total Employee */}
    {/* <div className="col-xxl-4 d-flex">
      <div className="card flex-fill">
        <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
          <h5 className="mb-2">Employee Status</h5>
          <div className="dropdown mb-2">
            <a href="javascript:void(0);" className="btn btn-white border btn-sm d-inline-flex align-items-center" data-bs-toggle="dropdown">
              <i className="ti ti-calendar me-1" />This Week
            </a>
            <ul className="dropdown-menu  dropdown-menu-end p-3">
              <li>
                <a href="javascript:void(0);" className="dropdown-item rounded-1">This Month</a>
              </li>
              <li>
                <a href="javascript:void(0);" className="dropdown-item rounded-1">This Week</a>
              </li>
              <li>
                <a href="javascript:void(0);" className="dropdown-item rounded-1">Today</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-1">
            <p className="fs-13 mb-3">Total Employee</p>
            <h3 className="mb-3">154</h3>
          </div>
          <div className="progress-stacked emp-stack mb-3">
            <div className="progress" role="progressbar" aria-label="Segment one" aria-valuenow={15} aria-valuemin={0} aria-valuemax={100} style={{width: '40%'}}>
              <div className="progress-bar bg-warning" />
            </div>
            <div className="progress" role="progressbar" aria-label="Segment two" aria-valuenow={30} aria-valuemin={0} aria-valuemax={100} style={{width: '20%'}}>
              <div className="progress-bar bg-secondary" />
            </div>
            <div className="progress" role="progressbar" aria-label="Segment three" aria-valuenow={20} aria-valuemin={0} aria-valuemax={100} style={{width: '10%'}}>
              <div className="progress-bar bg-danger" />
            </div>
            <div className="progress" role="progressbar" aria-label="Segment four" aria-valuenow={20} aria-valuemin={0} aria-valuemax={100} style={{width: '30%'}}>
              <div className="progress-bar bg-pink" />
            </div>
          </div>
          <div className="border mb-3">
            <div className="row gx-0">
              <div className="col-6">
                <div className="p-2 flex-fill border-end border-bottom">
                  <p className="fs-13 mb-2"><i className="ti ti-square-filled text-primary fs-12 me-2" />Fulltime <span className="text-gray-9">(48%)</span></p>
                  <h2 className="display-1">112</h2>
                </div>
              </div>
              <div className="col-6">
                <div className="p-2 flex-fill border-bottom text-end">
                  <p className="fs-13 mb-2"><i className="ti ti-square-filled me-2 text-secondary fs-12" />Contract <span className="text-gray-9">(20%)</span></p>
                  <h2 className="display-1">112</h2>
                </div>
              </div>
              <div className="col-6">
                <div className="p-2 flex-fill border-end">
                  <p className="fs-13 mb-2"><i className="ti ti-square-filled me-2 text-danger fs-12" />Probation <span className="text-gray-9">(22%)</span></p>
                  <h2 className="display-1">12</h2>
                </div>
              </div>
              <div className="col-6">
                <div className="p-2 flex-fill text-end">
                  <p className="fs-13 mb-2"><i className="ti ti-square-filled text-pink me-2 fs-12" />WFH <span className="text-gray-9">(20%)</span></p>
                  <h2 className="display-1">04</h2>
                </div>
              </div>
            </div>
          </div>
          <h6 className="mb-2">Top Performer</h6>
          <div className="p-2 d-flex align-items-center justify-content-between border border-primary bg-primary-100 br-5 mb-4">
            <div className="d-flex align-items-center overflow-hidden">
              <span className="me-2">
                <i className="ti ti-award-filled text-primary fs-24" />
              </span>
              <a href="employees.php" className="avatar avatar-md me-2">
                <img src="assets/img/profiles/avatar-24.jpg" className="rounded-circle border border-white" alt="img" />
              </a>
              <div>
                <h6 className="text-truncate mb-1 fs-14 fw-medium"><a href="employees.php">Daniel Esbella</a></h6>
                <p className="fs-13">IOS Developer</p>
              </div>
            </div>
            <div className="text-end">
              <p className="fs-13 mb-1">Performance</p>
              <h5 className="text-primary">99%</h5>
            </div>
          </div>
          <a href="employees.php" className="btn btn-light btn-md w-100">View All Employees</a>
        </div>
      </div>
    </div> */}
    {/* /Total Employee */}
    {/* Attendance Overview */}
    <div className="col-xxl-4 col-xl-6 d-flex">
      <div className="card flex-fill">
        <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
          <h5 className="mb-2">Attendance Overview</h5>
          <div className="dropdown mb-2">
            <a href="javascript:void(0);" className="btn btn-white border btn-sm d-inline-flex align-items-center" data-bs-toggle="dropdown">
              <i className="ti ti-calendar me-1" />Today
            </a>
            <ul className="dropdown-menu  dropdown-menu-end p-3">
              <li>
                <a href="javascript:void(0);" className="dropdown-item rounded-1">This Month</a>
              </li>
              <li>
                <a href="javascript:void(0);" className="dropdown-item rounded-1">This Week</a>
              </li>
              <li>
                <a href="javascript:void(0);" className="dropdown-item rounded-1">Today</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="card-body">
          {(() => {
            const overview = data.attendanceOverview;
            const totalCount = overview ? overview.totalCount : 120;
            const presentPct = overview ? overview.presentPercentage : 59;
            const latePct = overview ? overview.latePercentage : 21;
            const permissionPct = overview ? overview.permissionPercentage : 2;
            const absentPct = overview ? overview.absentPercentage : 15;
            const absentees = overview?.absentees || [];
            const visibleAbsentees = absentees.slice(0, 4);
            const extraAbsentees = absentees.length > 4 ? absentees.length - 4 : 0;
            return (
              <>
                <div className="chartjs-wrapper-demo position-relative mb-4">
                  <canvas id="attendance" height={200} />
                  <div className="position-absolute text-center attendance-canvas">
                    <p className="fs-13 mb-1">Total Attendance</p>
                    <h3>{totalCount}</h3>
                  </div>
                </div>
                <h6 className="mb-3">Status</h6>
                <div className="d-flex align-items-center justify-content-between">
                  <p className="f-13 mb-2"><i className="ti ti-circle-filled text-success me-1" />Present</p>
                  <p className="f-13 fw-medium text-gray-9 mb-2">{presentPct}%</p>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <p className="f-13 mb-2"><i className="ti ti-circle-filled text-secondary me-1" />Late</p>
                  <p className="f-13 fw-medium text-gray-9 mb-2">{latePct}%</p>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <p className="f-13 mb-2"><i className="ti ti-circle-filled text-warning me-1" />Permission</p>
                  <p className="f-13 fw-medium text-gray-9 mb-2">{permissionPct}%</p>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <p className="f-13 mb-2"><i className="ti ti-circle-filled text-danger me-1" />Absent</p>
                  <p className="f-13 fw-medium text-gray-9 mb-2">{absentPct}%</p>
                </div>
                <div className="bg-light br-5 box-shadow-xs p-2 pb-0 d-flex align-items-center justify-content-between flex-wrap">
                  <div className="d-flex align-items-center">
                    <p className="mb-2 me-2">Total Absenties</p>
                    {absentees.length > 0 ? (
                      <div className="avatar-list-stacked avatar-group-sm mb-2">
                        {visibleAbsentees.map((ab, idx) => (
                          <span key={idx} className="avatar avatar-rounded">
                            <img
                              className="border border-white"
                              src={ab.avatar || "/assets/img/profiles/avatar-31.jpg"}
                              alt={ab.name}
                              title={ab.name}
                            />
                          </span>
                        ))}
                        {extraAbsentees > 0 && (
                          <a className="avatar bg-primary avatar-rounded text-fixed-white fs-10" href="javascript:void(0);">
                            +{extraAbsentees}
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted small mb-2">None today</span>
                    )}
                  </div>
                  <a href="/leaves" className="fs-13 link-primary text-decoration-underline mb-2">View Details</a>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
    {/* /Attendance Overview */}
    {/* Employees */}
    <div className="col-xxl-4 col-xl-6 d-flex">
      <div className="card flex-fill">
        <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
          <h5 className="mb-2">Employees</h5>
          <Link to="/employees" className="btn btn-light btn-md mb-2">
            View All{hasMoreEmployees ? ` (${allEmployees.length})` : ""}
          </Link>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-nowrap mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Department</th>
                </tr>
              </thead>
              <tbody>
                {employees.length > 0 ? (
                  employees.map((employee, index) => (
                    <tr key={employee.employeeId ?? `${employee.employeeName}-${index}`}>
                      <td>
                        <div className="d-flex align-items-center">
                          <Link to="/employees" className="avatar">
                            <img
                              src={getAvatarSrc(employee.avatar)}
                              className="img-fluid rounded-circle"
                              alt={employee.employeeName || "Employee"}
                            />
                          </Link>
                          <div className="ms-2">
                            <h6 className="fw-medium mb-1">
                              <Link to="/employees">{employee.employeeName || "Employee"}</Link>
                            </h6>
                            <span className="fs-12">{employee.designation || "Employee"}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getEmployeeBadgeClass(index)} badge-xs`}>
                          {employee.departmentName || "Department"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="text-center text-muted py-4">
                      No employee records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    {/* /Employees */}
    {/* Birthdays */}
    <div className="col-xxl-4 col-xl-6 d-flex">
      <div className="card flex-fill">
        <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
          <h5 className="mb-2">Birthdays</h5>
          <Link to="/employees" className="btn btn-light btn-md mb-2">
            View All{hasMoreBirthdays ? ` (${totalBirthdayItems})` : ""}
          </Link>
        </div>
        <div className="card-body pb-1">
          {birthdayGroups.length > 0 ? (
            birthdayGroups.map((group, groupIndex) => (
              <div key={group.label ?? `birthday-group-${groupIndex}`}>
                <h6 className="mb-2">{group.label || "Upcoming"}</h6>
                {(group.items || []).map((birthday, birthdayIndex) => (
                  <div
                    key={birthday.employeeId ?? `${group.label}-${birthday.employeeName}-${birthdayIndex}`}
                    className="bg-light p-2 border border-dashed rounded-top mb-3"
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center">
                        <Link to="/employees" className="avatar">
                          <img
                            src={getAvatarSrc(birthday.avatar)}
                            className="rounded-circle"
                            alt={birthday.employeeName || "Employee"}
                          />
                        </Link>
                        <div className="ms-2 overflow-hidden">
                          <h6 className="fs-medium mb-1">{birthday.employeeName || "Employee"}</h6>
                          <p className="fs-13 mb-0">{birthday.designation || "Employee"}</p>
                        </div>
                      </div>
                      <a href="javascript:void(0);" className="btn btn-secondary btn-xs">
                        <i className="ti ti-cake me-1" />
                        Send
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <p className="text-muted mb-3">No upcoming birthdays.</p>
          )}
        </div>
      </div>
    </div>
    {/* /Birthdays */}
  </div>
  <div className="row">
    {/* Jobs Applicants */}
    {/* <div className="col-xxl-4 d-flex">
      <div className="card flex-fill">
        <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
          <h5 className="mb-2">Jobs Applicants</h5>
          <a href="job-list.php" className="btn btn-light btn-md mb-2">View All</a>
        </div>
        <div className="card-body">
          <ul className="nav nav-tabs tab-style-1 nav-justified d-sm-flex d-block p-0 mb-4" role="tablist">
            <li className="nav-item" role="presentation">
              <a className="nav-link fw-medium" data-bs-toggle="tab" data-bs-target="#openings" aria-current="page" href="#openings" aria-selected="true" role="tab">Openings</a>
            </li>
            <li className="nav-item" role="presentation">
              <a className="nav-link fw-medium active" data-bs-toggle="tab" data-bs-target="#applicants" href="#applicants" aria-selected="false" tabIndex={-1} role="tab">Applicants</a>
            </li>
          </ul>
          <div className="tab-content">
            <div className="tab-pane fade" id="openings">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div className="d-flex align-items-center">
                  <a href="#" className="avatar overflow-hidden flex-shrink-0 bg-gray-100">
                    <img src="assets/img/icons/apple.svg" className="img-fluid rounded-circle w-auto h-auto" alt="img" />
                  </a>
                  <div className="ms-2 overflow-hidden">
                    <p className="text-dark fw-medium text-truncate mb-0"><a href="javascript:void(0);">Senior IOS Developer</a></p>
                    <span className="fs-12">No of Openings : 25 </span>
                  </div>
                </div>
                <a href="javascript:void(0);" className="btn btn-light btn-sm p-0 btn-icon d-flex align-items-center justify-content-center"><i className="ti ti-edit" /></a>
              </div>
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div className="d-flex align-items-center">
                  <a href="#" className="avatar overflow-hidden flex-shrink-0 bg-gray-100">
                    <img src="assets/img/icons/php.svg" className="img-fluid w-auto h-auto" alt="img" />
                  </a>
                  <div className="ms-2 overflow-hidden">
                    <p className="text-dark fw-medium text-truncate mb-0"><a href="javascript:void(0);">Junior PHP Developer</a></p>
                    <span className="fs-12">No of Openings : 20 </span>
                  </div>
                </div>
                <a href="javascript:void(0);" className="btn btn-light btn-sm p-0 btn-icon d-flex align-items-center justify-content-center"><i className="ti ti-edit" /></a>
              </div>
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div className="d-flex align-items-center">
                  <a href="#" className="avatar overflow-hidden flex-shrink-0 bg-gray-100">
                    <img src="assets/img/icons/react.svg" className="img-fluid w-auto h-auto" alt="img" />
                  </a>
                  <div className="ms-2 overflow-hidden">
                    <p className="text-dark fw-medium text-truncate mb-0"><a href="javascript:void(0);">Junior React Developer </a></p>
                    <span className="fs-12">No of Openings : 30 </span>
                  </div>
                </div>
                <a href="javascript:void(0);" className="btn btn-light btn-sm p-0 btn-icon d-flex align-items-center justify-content-center"><i className="ti ti-edit" /></a>
              </div>
              <div className="d-flex align-items-center justify-content-between mb-0">
                <div className="d-flex align-items-center">
                  <a href="#" className="avatar overflow-hidden flex-shrink-0 bg-gray-100">
                    <img src="assets/img/icons/laravel-icon.svg" className="img-fluid w-auto h-auto" alt="img" />
                  </a>
                  <div className="ms-2 overflow-hidden">
                    <p className="text-dark fw-medium text-truncate mb-0"><a href="javascript:void(0);">Senior Laravel Developer</a></p>
                    <span className="fs-12">No of Openings : 40 </span>
                  </div>
                </div>
                <a href="javascript:void(0);" className="btn btn-light btn-sm p-0 btn-icon d-flex align-items-center justify-content-center"><i className="ti ti-edit" /></a>
              </div>
            </div>
            <div className="tab-pane fade show active" id="applicants">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div className="d-flex align-items-center">
                  <a href="#" className="avatar overflow-hidden flex-shrink-0">
                    <img src="assets/img/users/user-09.jpg" className="img-fluid rounded-circle" alt="img" />
                  </a>
                  <div className="ms-2 overflow-hidden">
                    <p className="text-dark fw-medium text-truncate mb-0"><a href="#">Brian Villalobos</a></p>
                    <span className="fs-13 d-inline-flex align-items-center">Exp : 5+ Years<i className="ti ti-circle-filled fs-4 mx-2 text-primary" />USA</span>
                  </div>
                </div>
                <span className="badge badge-secondary badge-xs">UI/UX Designer</span>
              </div>
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div className="d-flex align-items-center">
                  <a href="#" className="avatar overflow-hidden flex-shrink-0">
                    <img src="assets/img/users/user-32.jpg" className="img-fluid rounded-circle" alt="img" />
                  </a>
                  <div className="ms-2 overflow-hidden">
                    <p className="text-dark fw-medium text-truncate mb-0"><a href="#">Anthony Lewis</a></p>
                    <span className="fs-13 d-inline-flex align-items-center">Exp : 4+ Years<i className="ti ti-circle-filled fs-4 mx-2 text-primary" />USA</span>
                  </div>
                </div>
                <span className="badge badge-info badge-xs">Python Developer</span>
              </div>
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div className="d-flex align-items-center">
                  <a href="#" className="avatar overflow-hidden flex-shrink-0">
                    <img src="assets/img/users/user-32.jpg" className="img-fluid rounded-circle" alt="img" />
                  </a>
                  <div className="ms-2 overflow-hidden">
                    <p className="text-dark fw-medium text-truncate mb-0"><a href="#">Stephan Peralt</a></p>
                    <span className="fs-13 d-inline-flex align-items-center">Exp : 6+ Years<i className="ti ti-circle-filled fs-4 mx-2 text-primary" />USA</span>
                  </div>
                </div>
                <span className="badge badge-pink badge-xs">Android Developer</span>
              </div>
              <div className="d-flex align-items-center justify-content-between mb-0">
                <div className="d-flex align-items-center">
                  <a href="javascript:void(0);" className="avatar overflow-hidden flex-shrink-0">
                    <img src="assets/img/users/user-34.jpg" className="img-fluid rounded-circle" alt="img" />
                  </a>
                  <div className="ms-2 overflow-hidden">
                    <p className="text-dark fw-medium text-truncate mb-0"><a href="javascript:void(0);">Doglas Martini</a></p>
                    <span className="fs-13 d-inline-flex align-items-center">Exp : 2+ Years<i className="ti ti-circle-filled fs-4 mx-2 text-primary" />USA</span>
                  </div>
                </div>
                <span className="badge badge-purple badge-xs">React Developer</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div> */}
    {/* /Jobs Applicants */}
   
    {/* Todo */}
    {/* <div className="col-xxl-4 col-xl-6 d-flex">
      <div className="card flex-fill">
        <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
          <h5 className="mb-2">Todo</h5>
          <div className="d-flex align-items-center">
            <div className="dropdown mb-2 me-2">
              <a href="javascript:void(0);" className="btn btn-white border btn-sm d-inline-flex align-items-center" data-bs-toggle="dropdown">
                <i className="ti ti-calendar me-1" />Today
              </a>
              <ul className="dropdown-menu  dropdown-menu-end p-3">
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">This Month</a>
                </li>
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">This Week</a>
                </li>
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">Today</a>
                </li>
              </ul>
            </div>
            <a href="#" className="btn btn-primary btn-icon btn-xs rounded-circle d-flex align-items-center justify-content-center p-0 mb-2" data-bs-toggle="modal" data-bs-target="#add_todo"><i className="ti ti-plus fs-16" /></a>
          </div>
        </div>
        <div className="card-body">
          <div className="d-flex align-items-center todo-item border p-2 br-5 mb-2">
            <i className="ti ti-grid-dots me-2" />
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="todo1" />
              <label className="form-check-label fw-medium" htmlFor="todo1">Add Holidays</label>
            </div>
          </div>
          <div className="d-flex align-items-center todo-item border p-2 br-5 mb-2">
            <i className="ti ti-grid-dots me-2" />
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="todo2" />
              <label className="form-check-label fw-medium" htmlFor="todo2">Add Meeting to Client</label>
            </div>
          </div>
          <div className="d-flex align-items-center todo-item border p-2 br-5 mb-2">
            <i className="ti ti-grid-dots me-2" />
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="todo3" />
              <label className="form-check-label fw-medium" htmlFor="todo3">Chat with Adrian</label>
            </div>
          </div>
          <div className="d-flex align-items-center todo-item border p-2 br-5 mb-2">
            <i className="ti ti-grid-dots me-2" />
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="todo4" />
              <label className="form-check-label fw-medium" htmlFor="todo4">Management Call</label>
            </div>
          </div>
          <div className="d-flex align-items-center todo-item border p-2 br-5 mb-2">
            <i className="ti ti-grid-dots me-2" />
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="todo5" />
              <label className="form-check-label fw-medium" htmlFor="todo5">Add Payroll</label>
            </div>
          </div>
          <div className="d-flex align-items-center todo-item border p-2 br-5 mb-0">
            <i className="ti ti-grid-dots me-2" />
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="todo6" />
              <label className="form-check-label fw-medium" htmlFor="todo6">Add Policy for Increment </label>
            </div>
          </div>
        </div>
      </div>
    </div> */}
    {/* /Todo */}
  </div>
  <div className="row">
    {/* Sales Overview */}
    {/* <div className="col-xl-7 d-flex">
      <div className="card flex-fill">
        <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
          <h5 className="mb-2">Sales Overview</h5>
          <div className="d-flex align-items-center">
            <div className="dropdown mb-2">
              <a href="javascript:void(0);" className="dropdown-toggle btn btn-white border-0 btn-sm d-inline-flex align-items-center fs-13 me-2" data-bs-toggle="dropdown">
                All Departments
              </a>
              <ul className="dropdown-menu  dropdown-menu-end p-3">
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">UI/UX Designer</a>
                </li>
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">HR Manager</a>
                </li>
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">Junior Tester</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="card-body pb-0">
          <div className="d-flex align-items-center justify-content-between flex-wrap">
            <div className="d-flex align-items-center mb-1">
              <p className="fs-13 text-gray-9 me-3 mb-0"><i className="ti ti-square-filled me-2 text-primary" />Income</p>
              <p className="fs-13 text-gray-9 mb-0"><i className="ti ti-square-filled me-2 text-gray-2" />Expenses</p>
            </div>
            <p className="fs-13 mb-1">Last Updated at 11:30PM</p>
          </div>
          <div id="sales-income" />
        </div>
      </div>
    </div> */}
    {/* /Sales Overview */}
    {/* Invoices */}
    {/* <div className="col-xl-5 d-flex">
      <div className="card flex-fill">
        <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
          <h5 className="mb-2">Invoices</h5>
          <div className="d-flex align-items-center">
            <div className="dropdown mb-2">
              <a href="javascript:void(0);" className="dropdown-toggle btn btn-white btn-sm d-inline-flex align-items-center fs-13 me-2 border-0" data-bs-toggle="dropdown">
                Invoices
              </a>
              <ul className="dropdown-menu  dropdown-menu-end p-3">
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">Invoices</a>
                </li>
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">Paid</a>
                </li>
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">Unpaid</a>
                </li>
              </ul>
            </div>
            <div className="dropdown mb-2">
              <a href="javascript:void(0);" className="btn btn-white border btn-sm d-inline-flex align-items-center" data-bs-toggle="dropdown">
                <i className="ti ti-calendar me-1" />This Week
              </a>
              <ul className="dropdown-menu  dropdown-menu-end p-3">
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">This Month</a>
                </li>
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">This Week</a>
                </li>
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">Today</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="card-body pt-2">
          <div className="table-responsive pt-1">
            <table className="table table-nowrap table-borderless mb-0">
              <tbody>
                <tr>
                  <td className="px-0">
                    <div className="d-flex align-items-center">
                      <a href="invoice-details.php" className="avatar">
                        <img src="assets/img/users/user-39.jpg" className="img-fluid rounded-circle" alt="img" />
                      </a>
                      <div className="ms-2">
                        <h6 className="fw-medium"><a href="invoice-details.php">Redesign Website</a></h6>
                        <span className="fs-13 d-inline-flex align-items-center">#INVOO2<i className="ti ti-circle-filled fs-4 mx-1 text-primary" />Logistics</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="fs-13 mb-1">Payment</p>
                    <h6 className="fw-medium">₹3560</h6>
                  </td>
                  <td className="px-0 text-end">
                    <span className="badge badge-danger-transparent badge-xs d-inline-flex align-items-center"><i className="ti ti-circle-filled fs-5 me-1" />Unpaid</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-0">
                    <div className="d-flex align-items-center">
                      <a href="invoice-details.php" className="avatar">
                        <img src="assets/img/users/user-40.jpg" className="img-fluid rounded-circle" alt="img" />
                      </a>
                      <div className="ms-2">
                        <h6 className="fw-medium"><a href="invoice-details.php">Module Completion</a></h6>
                        <span className="fs-13 d-inline-flex align-items-center">#INVOO5<i className="ti ti-circle-filled fs-4 mx-1 text-primary" />Yip Corp</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="fs-13 mb-1">Payment</p>
                    <h6 className="fw-medium">₹4175</h6>
                  </td>
                  <td className="px-0 text-end">
                    <span className="badge badge-danger-transparent badge-xs d-inline-flex align-items-center"><i className="ti ti-circle-filled fs-5 me-1" />Unpaid</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-0">
                    <div className="d-flex align-items-center">
                      <a href="invoice-details.php" className="avatar">
                        <img src="assets/img/users/user-55.jpg" className="img-fluid rounded-circle" alt="img" />
                      </a>
                      <div className="ms-2">
                        <h6 className="fw-medium"><a href="invoice-details.php">Change on Emp Module</a></h6>
                        <span className="fs-13 d-inline-flex align-items-center">#INVOO3<i className="ti ti-circle-filled fs-4 mx-1 text-primary" />Ignis LLP</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="fs-13 mb-1">Payment</p>
                    <h6 className="fw-medium">₹6985</h6>
                  </td>
                  <td className="px-0 text-end">
                    <span className="badge badge-danger-transparent badge-xs d-inline-flex align-items-center"><i className="ti ti-circle-filled fs-5 me-1" />Unpaid</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-0">
                    <div className="d-flex align-items-center">
                      <a href="invoice-details.php" className="avatar">
                        <img src="assets/img/users/user-42.jpg" className="img-fluid rounded-circle" alt="img" />
                      </a>
                      <div className="ms-2">
                        <h6 className="fw-medium"><a href="invoice-details.php">Changes on the Board</a></h6>
                        <span className="fs-13 d-inline-flex align-items-center">#INVOO2<i className="ti ti-circle-filled fs-4 mx-1 text-primary" />Ignis LLP</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="fs-13 mb-1">Payment</p>
                    <h6 className="fw-medium">₹1457</h6>
                  </td>
                  <td className="px-0 text-end">
                    <span className="badge badge-danger-transparent badge-xs d-inline-flex align-items-center"><i className="ti ti-circle-filled fs-5 me-1" />Unpaid</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-0">
                    <div className="d-flex align-items-center">
                      <a href="invoice-details.php" className="avatar">
                        <img src="assets/img/users/user-44.jpg" className="img-fluid rounded-circle" alt="img" />
                      </a>
                      <div className="ms-2">
                        <h6 className="fw-medium"><a href="invoice-details.php">Hospital Management</a></h6>
                        <span className="fs-13 d-inline-flex align-items-center">#INVOO6<i className="ti ti-circle-filled fs-4 mx-1 text-primary" />HCL Corp</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="fs-13 mb-1">Payment</p>
                    <h6 className="fw-medium">₹6458</h6>
                  </td>
                  <td className="px-0 text-end">
                    <span className="badge badge-success-transparent badge-xs d-inline-flex align-items-center"><i className="ti ti-circle-filled fs-5 me-1" />Paid</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <a href="invoice.php" className="btn btn-light btn-md w-100 mt-2">View All</a>
        </div>
      </div>
    </div> */}
    {/* /Invoices */}
  </div>
  <div className="row">
    {/* Projects */}
    {/* <div className="col-xxl-8 col-xl-7 d-flex">
      <div className="card flex-fill">
        <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
          <h5 className="mb-2">Projects</h5>
          <div className="d-flex align-items-center">
            <div className="dropdown mb-2">
              <a href="javascript:void(0);" className="btn btn-white border btn-sm d-inline-flex align-items-center" data-bs-toggle="dropdown">
                <i className="ti ti-calendar me-1" />This Week
              </a>
              <ul className="dropdown-menu  dropdown-menu-end p-3">
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">This Month</a>
                </li>
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">This Week</a>
                </li>
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">Today</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-nowrap mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Team</th>
                  <th>Hours</th>
                  <th>Deadline</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><a href="project-details.php" className="link-default">PRO-001</a></td>
                  <td>
                    <h6 className="fw-medium"><a href="project-details.php">Office Management App</a></h6>
                  </td>
                  <td>
                    <div className="avatar-list-stacked avatar-group-sm">
                      <span className="avatar avatar-rounded">
                        <img className="border border-white" src="assets/img/profiles/avatar-02.jpg" alt="img" />
                      </span>
                      <span className="avatar avatar-rounded">
                        <img className="border border-white" src="assets/img/profiles/avatar-03.jpg" alt="img" />
                      </span>
                      <span className="avatar avatar-rounded">
                        <img className="border border-white" src="assets/img/profiles/avatar-05.jpg" alt="img" />
                      </span>
                    </div>
                  </td>
                  <td>
                    <p className="mb-1">15/255 Hrs</p>
                    <div className="progress progress-xs w-100" role="progressbar" aria-valuenow={40} aria-valuemin={0} aria-valuemax={100}>
                      <div className="progress-bar bg-primary" style={{width: '40%'}} />
                    </div>
                  </td>
                  <td>12/09/2024</td>
                  <td>
                    <span className="badge badge-danger d-inline-flex align-items-center badge-xs">
                      <i className="ti ti-point-filled me-1" />High
                    </span>
                  </td>
                </tr>
                <tr>
                  <td><a href="project-details.php" className="link-default">PRO-002</a></td>
                  <td>
                    <h6 className="fw-medium"><a href="project-details.php">Clinic Management </a></h6>
                  </td>
                  <td>
                    <div className="avatar-list-stacked avatar-group-sm">
                      <span className="avatar avatar-rounded">
                        <img className="border border-white" src="assets/img/profiles/avatar-06.jpg" alt="img" />
                      </span>
                      <span className="avatar avatar-rounded">
                        <img className="border border-white" src="assets/img/profiles/avatar-07.jpg" alt="img" />
                      </span>
                      <span className="avatar avatar-rounded">
                        <img className="border border-white" src="assets/img/profiles/avatar-08.jpg" alt="img" />
                      </span>
                      <a className="avatar bg-primary avatar-rounded text-fixed-white fs-10 fw-medium" href="javascript:void(0);">
                        +1
                      </a>
                    </div>
                  </td>
                  <td>
                    <p className="mb-1">15/255 Hrs</p>
                    <div className="progress progress-xs w-100" role="progressbar" aria-valuenow={40} aria-valuemin={0} aria-valuemax={100}>
                      <div className="progress-bar bg-primary" style={{width: '40%'}} />
                    </div>
                  </td>
                  <td>24/10/2024</td>
                  <td>
                    <span className="badge badge-success d-inline-flex align-items-center badge-xs">
                      <i className="ti ti-point-filled me-1" />Low
                    </span>
                  </td>
                </tr>
                <tr>
                  <td><a href="project-details.php" className="link-default">PRO-003</a></td>
                  <td>
                    <h6 className="fw-medium"><a href="project-details.php">Educational Platform</a></h6>
                  </td>
                  <td>
                    <div className="avatar-list-stacked avatar-group-sm">
                      <span className="avatar avatar-rounded">
                        <img className="border border-white" src="assets/img/profiles/avatar-06.jpg" alt="img" />
                      </span>
                      <span className="avatar avatar-rounded">
                        <img className="border border-white" src="assets/img/profiles/avatar-08.jpg" alt="img" />
                      </span>
                      <span className="avatar avatar-rounded">
                        <img className="border border-white" src="assets/img/profiles/avatar-09.jpg" alt="img" />
                      </span>
                    </div>
                  </td>
                  <td>
                    <p className="mb-1">40/255 Hrs</p>
                    <div className="progress progress-xs w-100" role="progressbar" aria-valuenow={50} aria-valuemin={0} aria-valuemax={100}>
                      <div className="progress-bar bg-primary" style={{width: '50%'}} />
                    </div>
                  </td>
                  <td>18/02/2024</td>
                  <td>
                    <span className="badge badge-pink d-inline-flex align-items-center badge-xs">
                      <i className="ti ti-point-filled me-1" />Medium
                    </span>
                  </td>
                </tr>
                <tr>
                  <td><a href="project-details.php" className="link-default">PRO-004</a></td>
                  <td>
                    <h6 className="fw-medium"><a href="project-details.php">Chat &amp; Call Mobile App</a></h6>
                  </td>
                  <td>
                    <div className="avatar-list-stacked avatar-group-sm">
                      <span className="avatar avatar-rounded">
                        <img className="border border-white" src="assets/img/profiles/avatar-11.jpg" alt="img" />
                      </span>
                      <span className="avatar avatar-rounded">
                        <img className="border border-white" src="assets/img/profiles/avatar-12.jpg" alt="img" />
                      </span>
                      <span className="avatar avatar-rounded">
                        <img className="border border-white" src="assets/img/profiles/avatar-13.jpg" alt="img" />
                      </span>
                    </div>
                  </td>
                  <td>
                    <p className="mb-1">35/155 Hrs</p>
                    <div className="progress progress-xs w-100" role="progressbar" aria-valuenow={50} aria-valuemin={0} aria-valuemax={100}>
                      <div className="progress-bar bg-primary" style={{width: '50%'}} />
                    </div>
                  </td>
                  <td>19/02/2024</td>
                  <td>
                    <span className="badge badge-danger d-inline-flex align-items-center badge-xs">
                      <i className="ti ti-point-filled me-1" />High
                    </span>
                  </td>
                </tr>
                <tr>
                  <td><a href="project-details.php" className="link-default">PRO-005</a></td>
                  <td>
                    <h6 className="fw-medium"><a href="project-details.php">Travel Planning Website</a></h6>
                  </td>
                  <td>
                    <div className="avatar-list-stacked avatar-group-sm">
                      <span className="avatar avatar-rounded">
                        <img className="border border-white" src="assets/img/profiles/avatar-17.jpg" alt="img" />
                      </span>
                      <span className="avatar avatar-rounded">
                        <img className="border border-white" src="assets/img/profiles/avatar-18.jpg" alt="img" />
                      </span>
                      <span className="avatar avatar-rounded">
                        <img className="border border-white" src="assets/img/profiles/avatar-19.jpg" alt="img" />
                      </span>
                    </div>
                  </td>
                  <td>
                    <p className="mb-1">50/235 Hrs</p>
                    <div className="progress progress-xs w-100" role="progressbar" aria-valuenow={50} aria-valuemin={0} aria-valuemax={100}>
                      <div className="progress-bar bg-primary" style={{width: '50%'}} />
                    </div>
                  </td>
                  <td>18/02/2024</td>
                  <td>
                    <span className="badge badge-pink d-inline-flex align-items-center badge-xs">
                      <i className="ti ti-point-filled me-1" />Medium
                    </span>
                  </td>
                </tr>
                <tr>
                  <td><a href="project-details.php" className="link-default">PRO-006</a></td>
                  <td>
                    <h6 className="fw-medium"><a href="project-details.php">Service Booking Software</a></h6>
                  </td>
                  <td>
                    <div className="avatar-list-stacked avatar-group-sm">
                      <span className="avatar avatar-rounded">
                        <img className="border border-white" src="assets/img/profiles/avatar-06.jpg" alt="img" />
                      </span>
                      <span className="avatar avatar-rounded">
                        <img className="border border-white" src="assets/img/profiles/avatar-08.jpg" alt="img" />
                      </span>
                      <span className="avatar avatar-rounded">
                        <img className="border border-white" src="assets/img/profiles/avatar-09.jpg" alt="img" />
                      </span>
                    </div>
                  </td>
                  <td>
                    <p className="mb-1">40/255 Hrs</p>
                    <div className="progress progress-xs w-100" role="progressbar" aria-valuenow={50} aria-valuemin={0} aria-valuemax={100}>
                      <div className="progress-bar bg-primary" style={{width: '50%'}} />
                    </div>
                  </td>
                  <td>20/02/2024</td>
                  <td>
                    <span className="badge badge-success d-inline-flex align-items-center badge-xs">
                      <i className="ti ti-point-filled me-1" />Low
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="border-0"><a href="project-details.php" className="link-default">PRO-008</a></td>
                  <td className="border-0">
                    <h6 className="fw-medium"><a href="project-details.php">Travel Planning Website</a></h6>
                  </td>
                  <td className="border-0">
                    <div className="avatar-list-stacked avatar-group-sm">
                      <span className="avatar avatar-rounded">
                        <img className="border border-white" src="assets/img/profiles/avatar-15.jpg" alt="img" />
                      </span>
                      <span className="avatar avatar-rounded">
                        <img className="border border-white" src="assets/img/profiles/avatar-16.jpg" alt="img" />
                      </span>
                      <span className="avatar avatar-rounded">
                        <img className="border border-white" src="assets/img/profiles/avatar-17.jpg" alt="img" />
                      </span>
                      <a className="avatar bg-primary avatar-rounded text-fixed-white fs-10 fw-medium" href="javascript:void(0);">
                        +2
                      </a>
                    </div>
                  </td>
                  <td className="border-0">
                    <p className="mb-1">15/255 Hrs</p>
                    <div className="progress progress-xs w-100" role="progressbar" aria-valuenow={45} aria-valuemin={0} aria-valuemax={100}>
                      <div className="progress-bar bg-primary" style={{width: '45%'}} />
                    </div>
                  </td>
                  <td className="border-0">17/10/2024</td>
                  <td className="border-0">
                    <span className="badge badge-pink d-inline-flex align-items-center badge-xs">
                      <i className="ti ti-point-filled me-1" />Medium
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div> */}
    {/* /Projects */}
    {/* Tasks Statistics */}
    {/* <div className="col-xxl-4 col-xl-5 d-flex">
      <div className="card flex-fill">
        <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
          <h5 className="mb-2">Tasks Statistics</h5>
          <div className="d-flex align-items-center">
            <div className="dropdown mb-2">
              <a href="javascript:void(0);" className="btn btn-white border btn-sm d-inline-flex align-items-center" data-bs-toggle="dropdown">
                <i className="ti ti-calendar me-1" />This Week
              </a>
              <ul className="dropdown-menu  dropdown-menu-end p-3">
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">This Month</a>
                </li>
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">This Week</a>
                </li>
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">Today</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="chartjs-wrapper-demo position-relative mb-4">
            <canvas id="mySemiDonutChart" height={190} />
            <div className="position-absolute text-center attendance-canvas">
              <p className="fs-13 mb-1">Total Tasks</p>
              <h3>124/165</h3>
            </div>
          </div>
          <div className="d-flex align-items-center flex-wrap">
            <div className="border-end text-center me-2 pe-2 mb-3">
              <p className="fs-13 d-inline-flex align-items-center mb-1"><i className="ti ti-circle-filled fs-10 me-1 text-warning" />Ongoing</p>
              <h5>24%</h5>
            </div>
            <div className="border-end text-center me-2 pe-2 mb-3">
              <p className="fs-13 d-inline-flex align-items-center mb-1"><i className="ti ti-circle-filled fs-10 me-1 text-info" />On Hold </p>
              <h5>10%</h5>
            </div>
            <div className="border-end text-center me-2 pe-2 mb-3">
              <p className="fs-13 d-inline-flex align-items-center mb-1"><i className="ti ti-circle-filled fs-10 me-1 text-danger" />Overdue</p>
              <h5>16%</h5>
            </div>
            <div className="text-center me-2 pe-2 mb-3">
              <p className="fs-13 d-inline-flex align-items-center mb-1"><i className="ti ti-circle-filled fs-10 me-1 text-success" />Ongoing</p>
              <h5>40%</h5>
            </div>
          </div>
          <div className="bg-dark br-5 p-3 pb-0 d-flex align-items-center justify-content-between">
            <div className="mb-2">
              <h4 className="text-success">389/689 hrs</h4>
              <p className="fs-13 mb-0">Spent on Overall Tasks This Week</p>
            </div>
            <a href="tasks.php" className="btn btn-sm btn-light mb-2 text-nowrap">View All</a>
          </div>
        </div>
      </div>
    </div> */}
    {/* /Tasks Statistics */}
  </div>
  <div className="row">
    {/* Schedules */}
    {/* <div className="col-xxl-4 d-flex">
      <div className="card flex-fill">
        <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
          <h5 className="mb-2">Schedules</h5>
          <a href="candidates.php" className="btn btn-light btn-md mb-2">View All</a>
        </div>
        <div className="card-body">
          <div className="bg-light p-3 br-5 mb-4">
            <span className="badge badge-secondary badge-xs mb-1">UI/ UX Designer</span>
            <h6 className="mb-2 text-truncate">Interview Candidates - UI/UX Designer</h6>
            <div className="d-flex align-items-center flex-wrap">
              <p className="fs-13 mb-1 me-2"><i className="ti ti-calendar-event me-2" />Thu, 15 Feb 2025</p>
              <p className="fs-13 mb-1"><i className="ti ti-clock-hour-11 me-2" />01:00 PM - 02:20 PM</p>
            </div>
            <div className="d-flex align-items-center justify-content-between border-top mt-2 pt-3">
              <div className="avatar-list-stacked avatar-group-sm">
                <span className="avatar avatar-rounded">
                  <img className="border border-white" src="assets/img/users/user-49.jpg" alt="img" />
                </span>
                <span className="avatar avatar-rounded">
                  <img className="border border-white" src="assets/img/users/user-13.jpg" alt="img" />
                </span>
                <span className="avatar avatar-rounded">
                  <img className="border border-white" src="assets/img/users/user-11.jpg" alt="img" />
                </span>
                <span className="avatar avatar-rounded">
                  <img className="border border-white" src="assets/img/users/user-22.jpg" alt="img" />
                </span>
                <span className="avatar avatar-rounded">
                  <img className="border border-white" src="assets/img/users/user-58.jpg" alt="img" />
                </span>
                <a className="avatar bg-primary avatar-rounded text-fixed-white fs-10 fw-medium" href="javascript:void(0);">
                  +3
                </a>
              </div>
              <a href="#" className="btn btn-primary btn-xs">Join Meeting</a>
            </div>
          </div>
          <div className="bg-light p-3 br-5 mb-0">
            <span className="badge badge-dark badge-xs mb-1">IOS Developer</span>
            <h6 className="mb-2 text-truncate">Interview Candidates - IOS Developer</h6>
            <div className="d-flex align-items-center flex-wrap">
              <p className="fs-13 mb-1 me-2"><i className="ti ti-calendar-event me-2" />Thu, 15 Feb 2025</p>
              <p className="fs-13 mb-1"><i className="ti ti-clock-hour-11 me-2" />02:00 PM - 04:20 PM</p>
            </div>
            <div className="d-flex align-items-center justify-content-between border-top mt-2 pt-3">
              <div className="avatar-list-stacked avatar-group-sm">
                <span className="avatar avatar-rounded">
                  <img className="border border-white" src="assets/img/users/user-49.jpg" alt="img" />
                </span>
                <span className="avatar avatar-rounded">
                  <img className="border border-white" src="assets/img/users/user-13.jpg" alt="img" />
                </span>
                <span className="avatar avatar-rounded">
                  <img className="border border-white" src="assets/img/users/user-11.jpg" alt="img" />
                </span>
                <span className="avatar avatar-rounded">
                  <img className="border border-white" src="assets/img/users/user-22.jpg" alt="img" />
                </span>
                <span className="avatar avatar-rounded">
                  <img className="border border-white" src="assets/img/users/user-58.jpg" alt="img" />
                </span>
                <a className="avatar bg-primary avatar-rounded text-fixed-white fs-10 fw-medium" href="javascript:void(0);">
                  +3
                </a>
              </div>
              <a href="#" className="btn btn-primary btn-xs">Join Meeting</a>
            </div>
          </div>
        </div>
      </div>
    </div> */}
    {/* /Schedules */}
    {/* Recent Activities */}
    {/* <div className="col-xxl-4 col-xl-6 d-flex">
      <div className="card flex-fill">
        <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
          <h5 className="mb-2">Recent Activities</h5>
          <a href="activity.php" className="btn btn-light btn-md mb-2">View All</a>
        </div>
        <div className="card-body">
          {(Array.isArray(data.recentActivities) && data.recentActivities.length > 0) ? (
            data.recentActivities.map((activity) => (
              <div className="recent-item" key={activity.id}>
                <div className="d-flex justify-content-between">
                  <div className="d-flex align-items-center w-100">
                    <a href="javascript:void(0);" className="avatar flex-shrink-0">
                      <img src={welcomeAvatar} className="rounded-circle" alt={welcomeName} />
                    </a>
                    <div className="ms-2 flex-fill">
                      <div className="d-flex align-items-center justify-content-between gap-2">
                        <h6 className="fs-medium text-truncate mb-0">
                          <a href="javascript:void(0);">{activity.performedBy || "System"}</a>
                        </h6>
                        <p className="fs-13 mb-0">{activity.timeLabel || "-"}</p>
                      </div>
                      <p className="fs-13 mb-0">{activity.displayText || activity.description || activity.action || "Activity recorded"}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-muted small">No recent activity available.</div>
          )}
        </div>
      </div>
    </div> */}
    {/* /Recent Activities */}
   
  </div>
  </div>
    </>
  );
}


