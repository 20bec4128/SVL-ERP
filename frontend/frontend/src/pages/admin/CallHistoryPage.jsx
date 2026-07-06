import { useQuery } from "@tanstack/react-query";
import PageLoader from "../../components/common/PageLoader";
import ErrorState from "../../components/common/ErrorState";
import DataTable from "../../components/admin/DataTable";
import PageHeader from "../../components/admin/PageHeader";
import crmService from "../../services/crmService";
import { callHistoryData } from "../../mock/callHistoryData";

export default function CallHistoryPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["call-history"],
    queryFn: crmService.getCallHistory,
    placeholderData: callHistoryData,
    keepPreviousData: true,
  });

  const pageData = {
    ...callHistoryData,
    ...(data || {}),
    header: {
      ...callHistoryData.header,
      ...(data?.header || {}),
      breadcrumbs: Array.isArray(data?.header?.breadcrumbs)
        ? data.header.breadcrumbs
        : callHistoryData.header.breadcrumbs,
    },
    tableRows: Array.isArray(data?.tableRows)
      ? data.tableRows
      : callHistoryData.tableRows,
  };

  const pageTitle = pageData?.header?.title || callHistoryData.header.title;
  const breadcrumbs = Array.isArray(pageData?.header?.breadcrumbs)
    ? pageData.header.breadcrumbs
    : callHistoryData.header.breadcrumbs;
  const tableRows = Array.isArray(pageData?.tableRows)
    ? pageData.tableRows
    : callHistoryData.tableRows;

  if (isLoading && !data) {
    return <PageLoader />;
  }

  if (error && !data) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <>
      <PageHeader
        title={pageTitle}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="head-icons">
            <a href="javascript:void(0);" className="" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Collapse" id="collapse-header">
              <i className="ti ti-chevrons-up" />
            </a>
          </div>
        }
      />

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
          <h5>Call History List</h5>
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
                Call Type
              </a>
              <ul className="dropdown-menu  dropdown-menu-end p-3">
                <li><a href="javascript:void(0);" className="dropdown-item rounded-1">Incoming</a></li>
                <li><a href="javascript:void(0);" className="dropdown-item rounded-1">Outgoing</a></li>
                <li><a href="javascript:void(0);" className="dropdown-item rounded-1">Missed Call</a></li>
              </ul>
            </div>
            <div className="dropdown">
              <a href="javascript:void(0);" className="dropdown-toggle btn btn-white d-inline-flex align-items-center" data-bs-toggle="dropdown">
                Sort By : Last 7 Days
              </a>
              <ul className="dropdown-menu  dropdown-menu-end p-3">
                <li><a href="javascript:void(0);" className="dropdown-item rounded-1">Recently Added</a></li>
                <li><a href="javascript:void(0);" className="dropdown-item rounded-1">Ascending</a></li>
                <li><a href="javascript:void(0);" className="dropdown-item rounded-1">Desending</a></li>
                <li><a href="javascript:void(0);" className="dropdown-item rounded-1">Last Month</a></li>
                <li><a href="javascript:void(0);" className="dropdown-item rounded-1">Last 7 Days</a></li>
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
                  <th className="no-sort">
                    <div className="form-check form-check-md">
                      <input className="form-check-input" type="checkbox" id="select-all" />
                    </div>
                  </th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Call Type</th>
                  <th>Duration</th>
                  <th>Date & Time</th>
                  <th />
                </tr>
              </thead>
            }
            tbody={
              <tbody>
                {tableRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="form-check form-check-md">
                        <input className="form-check-input" type="checkbox" />
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <a href="#" className="avatar avatar-md" data-bs-toggle="modal" data-bs-target="#view_details">
                          <img src={row.avatar} className="img-fluid rounded-circle" alt="img" />
                        </a>
                        <div className="ms-2">
                          <p className="text-dark fw-medium mb-0"><a href="#" data-bs-toggle="modal" data-bs-target="#view_details">{row.name}</a></p>
                          <span className="fs-12">{row.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>{row.phone}</td>
                    <td>
                      <div className="d-inline-flex align-items-center">
                        <i className={row.callIcon} />{row.callType}
                      </div>
                    </td>
                    <td>{row.duration}</td>
                    <td>{row.dateTime}</td>
                    <td>
                      <div className="action-icon d-inline-flex">
                        <a href="#" className="me-2" data-bs-toggle="modal" data-bs-target="#call_history"><i className="ti ti-eye" /></a>
                        <a href="#" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash" /></a>
                      </div>
                    </td>
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
