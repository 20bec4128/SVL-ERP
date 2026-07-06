import { useQuery } from "@tanstack/react-query";
import PageLoader from "../../components/common/PageLoader";
import ErrorState from "../../components/common/ErrorState";
import PageHeader from "../../components/admin/PageHeader";
import StatCard from "../../components/admin/StatCard";
import InfoCard from "../../components/admin/InfoCard";
import DataTable from "../../components/admin/DataTable";
import StatusBadge from "../../components/admin/StatusBadge";
import attendanceService from "../../services/attendanceService";
import { attendanceReportData } from "../../mock/attendanceReportData";

export default function AttendanceReportPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["attendance-report"],
    queryFn: attendanceService.getAttendanceReport,
    placeholderData: attendanceReportData,
    keepPreviousData: true,
  });

  if (isLoading && !data) {
    return <PageLoader />;
  }

  if (error) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <>
      <PageHeader
        title={data.header.title}
        breadcrumbs={data.header.breadcrumbs}
        actions={
          <>
            <div className="mb-2">
              <div className="dropdown">
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
              </div>
            </div>
            <div className="head-icons ms-2">
              <a href="javascript:void(0);" className="" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Collapse" id="collapse-header">
                <i className="ti ti-chevrons-up" />
              </a>
            </div>
          </>
        }
      />

      <div className="row">
        <div className="col-xl-6 d-flex">
          <div className="row flex-fill">
            {data.stats.map((item) => (
              <StatCard key={item.id} colClass="col-lg-6 col-md-6 d-flex" cardClass="card flex-fill">
                <div className="d-flex align-items-center overflow-hidden mb-2">
                  <div className="attendence-icon">
                    <span><i className={item.iconClass} /></span>
                  </div>
                  <div className="ms-2 overflow-hidden">
                    <p className="fs-12 fw-normal mb-1 text-truncate">{item.label}</p>
                    <h4>{item.value}</h4>
                  </div>
                </div>
                <div className="attendance-report-bar mb-2">
                  <div className="progress" role="progressbar" aria-label="Success example" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100" style={{ height: "5px" }}>
                    <div className={`progress-bar ${item.progressClass}`} style={{ width: item.progressWidth }} />
                  </div>
                </div>
                <div>
                  <p className="fs-12 fw-normal d-flex align-items-center text-truncate">
                    <span className={item.changeClass}><i className={item.changeIconClass} />{item.change}</span>
                    {item.note}
                  </p>
                </div>
              </StatCard>
            ))}
          </div>
        </div>
        <div className="col-xl-6">
          <InfoCard cardClass="card">
            <div className="card-header border-0 pb-0">
              <div className="d-flex flex-wrap justify-content-between align-items-center">
                <div className="d-flex align-items-center ">
                  <span className="me-2"><i className="ti ti-chart-line text-danger" /></span>
                  <h5>Attendance </h5>
                </div>
                <div className="dropdown">
                  <a href="javascript:void(0);" className="dropdown-toggle btn btn-sm fs-12 btn-white d-inline-flex align-items-center" data-bs-toggle="dropdown">
                    This Year
                  </a>
                  <ul className="dropdown-menu  dropdown-menu-end p-2">
                    {data.yearOptions.map((year) => (
                      <li key={year}>
                        <a href="javascript:void(0);" className="dropdown-item rounded-1">{year}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="card-body py-0 px-2">
              <div id="attendance-report"> </div>
            </div>
          </InfoCard>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
          <h5>Employee Attendance</h5>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap row-gap-3">
            <div className="me-3">
              <div className="input-icon-end position-relative">
                <input type="text" className="form-control date-range bookingrange" placeholder="dd/mm/yyyy - dd/mm/yyyy" />
                <span className="input-icon-addon">
                  <i className="ti ti-chevron-down" />
                </span>
              </div>
            </div>
            <div className="dropdown me-3">
              <a href="javascript:void(0);" className="dropdown-toggle btn btn-white d-inline-flex align-items-center" data-bs-toggle="dropdown">
                Select Status
              </a>
              <ul className="dropdown-menu  dropdown-menu-end p-3">
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">Present</a>
                </li>
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">Absent</a>
                </li>
              </ul>
            </div>
            <div className="dropdown">
              <a href="javascript:void(0);" className="dropdown-toggle btn btn-white d-inline-flex align-items-center" data-bs-toggle="dropdown">
                Sort By : Last 7 Days
              </a>
              <ul className="dropdown-menu  dropdown-menu-end p-3">
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">Recently Added</a>
                </li>
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">Ascending</a>
                </li>
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">Desending</a>
                </li>
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">Last Month</a>
                </li>
                <li>
                  <a href="javascript:void(0);" className="dropdown-item rounded-1">Last 7 Days</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          <DataTable
            wrapperClass="custom-datatable-filter table-responsive"
            tableClass="table datatable"
            thead={
              <thead className="thead-light">
                <tr>
                  {data.table.columns.map((column) => <th key={column.key}>{column.label}</th>)}
                </tr>
              </thead>
            }
            tbody={
              <tbody>
                {data.table.rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <a href="#" className="avatar avatar-md" data-bs-toggle="modal" data-bs-target="#view_details">
                          <img src={row.avatar} className="img-fluid rounded-circle" alt="img" />
                        </a>
                        <div className="ms-2">
                          <p className="text-dark mb-0"><a href="#" data-bs-toggle="modal" data-bs-target="#view_details">{row.name}</a></p>
                          <span className="fs-12">{row.department}</span>
                        </div>
                      </div>
                    </td>
                    <td>{row.date}</td>
                    <td>{row.checkIn}</td>
                    <td><StatusBadge className={row.statusClass}>{row.status}</StatusBadge></td>
                    <td>{row.checkOut}</td>
                    <td>{row.break}</td>
                    <td>{row.late}</td>
                    <td>{row.overtime}</td>
                    <td><StatusBadge className={row.hoursClass}>{row.hours}</StatusBadge></td>
                  </tr>
                ))}
              </tbody>
            }
          />
        </div>
      </div>
    </>
  );
}
