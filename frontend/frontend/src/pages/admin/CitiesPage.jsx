import { useQuery } from "@tanstack/react-query";
import PageLoader from "../../components/common/PageLoader";
import ErrorState from "../../components/common/ErrorState";
import DataTable from "../../components/admin/DataTable";
import PageHeader from "../../components/admin/PageHeader";
import StatusBadge from "../../components/admin/StatusBadge";
import crmService from "../../services/crmService";
import { citiesData } from "../../mock/citiesData";

export default function CitiesPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["cities"],
    queryFn: crmService.getCities,
    placeholderData: citiesData,
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
              <a href="#" data-bs-toggle="modal" data-bs-target="#add_cities" className="btn btn-primary d-flex align-items-center"><i className="ti ti-circle-plus me-2" />Add City</a>
            </div>
            <div className="head-icons ms-2">
              <a href="javascript:void(0);" className="" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Collapse" id="collapse-header">
                <i className="ti ti-chevrons-up" />
              </a>
            </div>
          </>
        }
      />

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
          <h5>Cities List</h5>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap row-gap-3">
            <div className="dropdown">
              <a href="javascript:void(0);" className="dropdown-toggle btn btn-white d-inline-flex align-items-center" data-bs-toggle="dropdown">Sort By : Last 7 Days</a>
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
                  <th className="no-sort"><div className="form-check form-check-md"><input className="form-check-input" type="checkbox" id="select-all" /></div></th>
                  <th>City Name</th>
                  <th>State Name</th>
                  <th>Country Name</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
            }
            tbody={
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.id}>
                    <td><div className="form-check form-check-md"><input className="form-check-input" type="checkbox" /></div></td>
                    <td><h6 className="fw-medium"><a href="#">{row.cityName}</a></h6></td>
                    <td>{row.stateName}</td>
                    <td>{row.countryName}</td>
                    <td><StatusBadge className={row.statusClass} iconClass="ti ti-point-filled me-1">{row.status}</StatusBadge></td>
                    <td>
                      <div className="action-icon d-inline-flex">
                        <a href="#" data-bs-toggle="modal" data-bs-target="#edit_cities" className="me-2"><i className="ti ti-edit" /></a>
                        <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash" /></a>
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
