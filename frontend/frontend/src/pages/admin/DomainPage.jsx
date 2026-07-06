import React from "react";
import { Link } from "react-router-dom";

const DomainPage = () => {
  return (
    <>
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">Domain</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <a href="admin-dashboard.php">
                    <i className="ti ti-smart-home"></i>
                  </a>
                </li>
                <li className="breadcrumb-item">Superadmin</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Domain List
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
            <div className="me-2 mb-2">
              <div className="dropdown">
                <a
                  href="javascript:void(0);"
                  className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  <i className="ti ti-file-export me-1"></i>Export
                </a>
                <ul className="dropdown-menu  dropdown-menu-end p-3">
                  <li>
                    <a
                      href="javascript:void(0);"
                      className="dropdown-item rounded-1"
                    >
                      <i className="ti ti-file-type-pdf me-1"></i>Export as PDF
                    </a>
                  </li>
                  <li>
                    <a
                      href="javascript:void(0);"
                      className="dropdown-item rounded-1"
                    >
                      <i className="ti ti-file-type-xls me-1"></i>Export as
                      Excel{" "}
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="ms-2 head-icons">
              <a
                href="javascript:void(0);"
                className=""
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                data-bs-original-title="Collapse"
                id="collapse-header"
              >
                <i className="ti ti-chevrons-up"></i>
              </a>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <h5>Domain List</h5>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap row-gap-3">
              <div className="me-3">
                <div className="input-icon-end position-relative">
                  <input
                    type="text"
                    className="form-control date-range bookingrange"
                    placeholder="dd/mm/yyyy - dd/mm/yyyy"
                  />
                  <span className="input-icon-addon">
                    <i className="ti ti-chevron-down"></i>
                  </span>
                </div>
              </div>
              <div className="dropdown me-3">
                <a
                  href="javascript:void(0);"
                  className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  Select Plan
                </a>
                <ul className="dropdown-menu  dropdown-menu-end p-3">
                  <li>
                    <a
                      href="javascript:void(0);"
                      className="dropdown-item rounded-1"
                    >
                      Monthly
                    </a>
                  </li>
                  <li>
                    <a
                      href="javascript:void(0);"
                      className="dropdown-item rounded-1"
                    >
                      Yearly
                    </a>
                  </li>
                </ul>
              </div>
              <div className="dropdown me-3">
                <a
                  href="javascript:void(0);"
                  className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  Select Status
                </a>
                <ul className="dropdown-menu  dropdown-menu-end p-3">
                  <li>
                    <a
                      href="javascript:void(0);"
                      className="dropdown-item rounded-1"
                    >
                      Approved
                    </a>
                  </li>
                  <li>
                    <a
                      href="javascript:void(0);"
                      className="dropdown-item rounded-1"
                    >
                      Pending
                    </a>
                  </li>
                  <li>
                    <a
                      href="javascript:void(0);"
                      className="dropdown-item rounded-1"
                    >
                      Rejected
                    </a>
                  </li>
                </ul>
              </div>
              <div className="dropdown">
                <a
                  href="javascript:void(0);"
                  className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  Sort By : Last 7 Days
                </a>
                <ul className="dropdown-menu  dropdown-menu-end p-3">
                  <li>
                    <a
                      href="javascript:void(0);"
                      className="dropdown-item rounded-1"
                    >
                      Recently Added
                    </a>
                  </li>
                  <li>
                    <a
                      href="javascript:void(0);"
                      className="dropdown-item rounded-1"
                    >
                      Ascending
                    </a>
                  </li>
                  <li>
                    <a
                      href="javascript:void(0);"
                      className="dropdown-item rounded-1"
                    >
                      Desending
                    </a>
                  </li>
                  <li>
                    <a
                      href="javascript:void(0);"
                      className="dropdown-item rounded-1"
                    >
                      Last Month
                    </a>
                  </li>
                  <li>
                    <a
                      href="javascript:void(0);"
                      className="dropdown-item rounded-1"
                    >
                      Last 7 Days
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="custom-datatable-filter table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th className="no-sort">
                      <div className="form-check form-check-md">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="select-all"
                        />
                      </div>
                    </th>
                    <th>Name</th>
                    <th>Domain URL</th>
                    <th>Plan</th>
                    <th>Created Date</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div className="form-check form-check-md">
                        <input className="form-check-input" type="checkbox" />
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center file-name-icon">
                        <a
                          href="#"
                          className="avatar avatar-md border rounded-circle"
                        >
                          <img
                            src="assets/img/company/company-01.svg"
                            className="img-fluid"
                            alt="img"
                          />
                        </a>
                        <div className="ms-2">
                          <h6 className="fw-medium">
                            <a href="#">BrightWave Innovations</a>
                          </h6>
                        </div>
                      </div>
                    </td>
                    <td>bwi.example.com</td>
                    <td>Advanced (Monthly)</td>
                    <td>12 Sep 2024</td>
                    <td>
                      <a
                        href="#"
                        className="badge badge-soft-success d-inline-flex align-items-center badge-xs"
                      >
                        <i className="ti ti-checks me-1"></i>Approved
                      </a>
                    </td>
                    <td>
                      <div className="action-icon d-inline-flex">
                        <a
                          href="#"
                          className="me-2"
                          data-bs-toggle="modal"
                          data-bs-target="#domain_approved"
                        >
                          <i className="ti ti-eye"></i>
                        </a>
                        <a
                          href="javascript:void(0);"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash"></i>
                        </a>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div className="form-check form-check-md">
                        <input className="form-check-input" type="checkbox" />
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center file-name-icon">
                        <a
                          href="#"
                          className="avatar avatar-md border rounded-circle"
                        >
                          <img
                            src="assets/img/company/company-02.svg"
                            className="img-fluid"
                            alt="img"
                          />
                        </a>
                        <div className="ms-2">
                          <h6 className="fw-medium">
                            <a href="#">Stellar Dynamics</a>
                          </h6>
                        </div>
                      </div>
                    </td>
                    <td>sd.example.com</td>
                    <td>Basic (Yearly)</td>
                    <td>24 Oct 2024</td>
                    <td>
                      <a
                        href="#"
                        className="badge badge-soft-skyblue d-inline-flex align-items-center badge-xs"
                      >
                        <i className="ti ti-clock me-1"></i>Pending
                      </a>
                    </td>
                    <td>
                      <div className="action-icon d-inline-flex">
                        <a
                          href="#"
                          className="me-2"
                          data-bs-toggle="modal"
                          data-bs-target="#domain_pending"
                        >
                          <i className="ti ti-eye"></i>
                        </a>
                        <a
                          href="javascript:void(0);"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash"></i>
                        </a>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div className="form-check form-check-md">
                        <input className="form-check-input" type="checkbox" />
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center file-name-icon">
                        <a
                          href="#"
                          className="avatar avatar-md border rounded-circle"
                        >
                          <img
                            src="assets/img/company/company-03.svg"
                            className="img-fluid"
                            alt="img"
                          />
                        </a>
                        <div className="ms-2">
                          <h6 className="fw-medium">
                            <a href="#">Quantum Nexus</a>
                          </h6>
                        </div>
                      </div>
                    </td>
                    <td>qn.example.com</td>
                    <td>Advanced (Monthly)</td>
                    <td>18 Feb 2024</td>
                    <td>
                      <a
                        href="#"
                        className="badge badge-soft-danger d-inline-flex align-items-center badge-xs"
                      >
                        <i className="ti ti-x me-1"></i>Rejected
                      </a>
                    </td>
                    <td>
                      <div className="action-icon d-inline-flex">
                        <a
                          href="#"
                          className="me-2"
                          data-bs-toggle="modal"
                          data-bs-target="#domain_rejected"
                        >
                          <i className="ti ti-eye"></i>
                        </a>
                        <a
                          href="javascript:void(0);"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash"></i>
                        </a>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div className="form-check form-check-md">
                        <input className="form-check-input" type="checkbox" />
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center file-name-icon">
                        <a
                          href="#"
                          className="avatar avatar-md border rounded-circle"
                        >
                          <img
                            src="assets/img/company/company-04.svg"
                            className="img-fluid"
                            alt="img"
                          />
                        </a>
                        <div className="ms-2">
                          <h6 className="fw-medium">
                            <a href="#">EcoVision Enterprises</a>
                          </h6>
                        </div>
                      </div>
                    </td>
                    <td>eve.example.com</td>
                    <td>Advanced (Monthly)</td>
                    <td>17 Oct 2024</td>
                    <td>
                      <a
                        href="#"
                        className="badge badge-soft-success d-inline-flex align-items-center badge-xs"
                      >
                        <i className="ti ti-checks me-1"></i>Approved
                      </a>
                    </td>
                    <td>
                      <div className="action-icon d-inline-flex">
                        <a
                          href="#"
                          className="me-2"
                          data-bs-toggle="modal"
                          data-bs-target="#domain_approved"
                        >
                          <i className="ti ti-eye"></i>
                        </a>
                        <a
                          href="javascript:void(0);"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash"></i>
                        </a>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div className="form-check form-check-md">
                        <input className="form-check-input" type="checkbox" />
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center file-name-icon">
                        <a
                          href="#"
                          className="avatar avatar-md border rounded-circle"
                        >
                          <img
                            src="assets/img/company/company-05.svg"
                            className="img-fluid"
                            alt="img"
                          />
                        </a>
                        <div className="ms-2">
                          <h6 className="fw-medium">
                            <a href="#">Aurora Technologies</a>
                          </h6>
                        </div>
                      </div>
                    </td>
                    <td>at.example.com</td>
                    <td>Enterprise (Monthly)</td>
                    <td>20 Jul 2024</td>
                    <td>
                      <a
                        href="#"
                        className="badge badge-soft-success d-inline-flex align-items-center badge-xs"
                      >
                        <i className="ti ti-checks me-1"></i>Approved
                      </a>
                    </td>
                    <td>
                      <div className="action-icon d-inline-flex">
                        <a
                          href="#"
                          className="me-2"
                          data-bs-toggle="modal"
                          data-bs-target="#domain_approved"
                        >
                          <i className="ti ti-eye"></i>
                        </a>
                        <a
                          href="javascript:void(0);"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash"></i>
                        </a>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div className="form-check form-check-md">
                        <input className="form-check-input" type="checkbox" />
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center file-name-icon">
                        <a
                          href="#"
                          className="avatar avatar-md border rounded-circle"
                        >
                          <img
                            src="assets/img/company/company-06.svg"
                            className="img-fluid"
                            alt="img"
                          />
                        </a>
                        <div className="ms-2">
                          <h6 className="fw-medium">
                            <a href="#">BlueSky Ventures</a>
                          </h6>
                        </div>
                      </div>
                    </td>
                    <td>bsv.example.com</td>
                    <td>Advanced (Monthly)</td>
                    <td>10 Apr 2024</td>
                    <td>
                      <a
                        href="#"
                        className="badge badge-soft-skyblue d-inline-flex align-items-center badge-xs"
                      >
                        <i className="ti ti-clock me-1"></i>Pending
                      </a>
                    </td>
                    <td>
                      <div className="action-icon d-inline-flex">
                        <a
                          href="#"
                          className="me-2"
                          data-bs-toggle="modal"
                          data-bs-target="#domain_pending"
                        >
                          <i className="ti ti-eye"></i>
                        </a>
                        <a
                          href="javascript:void(0);"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash"></i>
                        </a>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div className="form-check form-check-md">
                        <input className="form-check-input" type="checkbox" />
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center file-name-icon">
                        <a
                          href="#"
                          className="avatar avatar-md border rounded-circle"
                        >
                          <img
                            src="assets/img/company/company-07.svg"
                            className="img-fluid"
                            alt="img"
                          />
                        </a>
                        <div className="ms-2">
                          <h6 className="fw-medium">
                            <a href="#">TerraFusion Energy</a>
                          </h6>
                        </div>
                      </div>
                    </td>
                    <td>tfe.example.com</td>
                    <td>Enterprise (Yearly)</td>
                    <td>29 Aug 2024</td>
                    <td>
                      <a
                        href="#"
                        className="badge badge-soft-success d-inline-flex align-items-center badge-xs"
                      >
                        <i className="ti ti-checks me-1"></i>Approved
                      </a>
                    </td>
                    <td>
                      <div className="action-icon d-inline-flex">
                        <a
                          href="#"
                          className="me-2"
                          data-bs-toggle="modal"
                          data-bs-target="#domain_approved"
                        >
                          <i className="ti ti-eye"></i>
                        </a>
                        <a
                          href="javascript:void(0);"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash"></i>
                        </a>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div className="form-check form-check-md">
                        <input className="form-check-input" type="checkbox" />
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center file-name-icon">
                        <a
                          href="#"
                          className="avatar avatar-md border rounded-circle"
                        >
                          <img
                            src="assets/img/company/company-08.svg"
                            className="img-fluid"
                            alt="img"
                          />
                        </a>
                        <div className="ms-2">
                          <h6 className="fw-medium">
                            <a href="#">UrbanPulse Design</a>
                          </h6>
                        </div>
                      </div>
                    </td>
                    <td>upd.example.com</td>
                    <td>Basic (Monthly)</td>
                    <td>22 Feb 2024</td>
                    <td>
                      <a
                        href="#"
                        className="badge badge-soft-danger d-inline-flex align-items-center badge-xs"
                      >
                        <i className="ti ti-x me-1"></i>Rejected
                      </a>
                    </td>
                    <td>
                      <div className="action-icon d-inline-flex">
                        <a
                          href="#"
                          className="me-2"
                          data-bs-toggle="modal"
                          data-bs-target="#domain_rejected"
                        >
                          <i className="ti ti-eye"></i>
                        </a>
                        <a
                          href="javascript:void(0);"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash"></i>
                        </a>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div className="form-check form-check-md">
                        <input className="form-check-input" type="checkbox" />
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center file-name-icon">
                        <a
                          href="#"
                          className="avatar avatar-md border rounded-circle"
                        >
                          <img
                            src="assets/img/company/company-09.svg"
                            className="img-fluid"
                            alt="img"
                          />
                        </a>
                        <div className="ms-2">
                          <h6 className="fw-medium">
                            <a href="#">Nimbus Networks</a>
                          </h6>
                        </div>
                      </div>
                    </td>
                    <td>nn.example.com</td>
                    <td>Basic (Yearly)</td>
                    <td>03 Nov 2024</td>
                    <td>
                      <a
                        href="#"
                        className="badge badge-soft-success d-inline-flex align-items-center badge-xs"
                      >
                        <i className="ti ti-checks me-1"></i>Approved
                      </a>
                    </td>
                    <td>
                      <div className="action-icon d-inline-flex">
                        <a
                          href="#"
                          className="me-2"
                          data-bs-toggle="modal"
                          data-bs-target="#domain_approved"
                        >
                          <i className="ti ti-eye"></i>
                        </a>
                        <a
                          href="javascript:void(0);"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash"></i>
                        </a>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div className="form-check form-check-md">
                        <input className="form-check-input" type="checkbox" />
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center file-name-icon">
                        <a
                          href="#"
                          className="avatar avatar-md border rounded-circle"
                        >
                          <img
                            src="assets/img/company/company-10.svg"
                            className="img-fluid"
                            alt="img"
                          />
                        </a>
                        <div className="ms-2">
                          <h6 className="fw-medium">
                            <a href="#">Epicurean Delights</a>
                          </h6>
                        </div>
                      </div>
                    </td>
                    <td>ed.example.com</td>
                    <td>Advanced (Monthly)</td>
                    <td>17 Dec 2024</td>
                    <td>
                      <a
                        href="#"
                        className="badge badge-soft-success d-inline-flex align-items-center badge-xs"
                      >
                        <i className="ti ti-checks me-1"></i>Approved
                      </a>
                    </td>
                    <td>
                      <div className="action-icon d-inline-flex">
                        <a
                          href="#"
                          className="me-2"
                          data-bs-toggle="modal"
                          data-bs-target="#domain_approved"
                        >
                          <i className="ti ti-eye"></i>
                        </a>
                        <a
                          href="javascript:void(0);"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash"></i>
                        </a>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" id="domain_approved">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title d-flex align-items-center">
                Domain Detail
                <span className="badge bg-outline-success d-inline-flex align-items-center badge-xs ms-2">
                  <i className="ti ti-point-filled"></i>Approved
                </span>
              </h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x"></i>
              </button>
            </div>
            <form action="domain.php">
              <div className="modal-body pb-0">
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <div className="p-3 mb-3 br-5 bg-transparent-light">
                        <div className="row">
                          <div className="col-md-12">
                            <div className="d-flex align-items-center file-name-icon">
                              <a
                                href="#"
                                className="avatar avatar-md border avatar-rounded"
                              >
                                <img
                                  src="assets/img/company/company-01.svg"
                                  className="img-fluid"
                                  alt="img"
                                />
                              </a>
                              <div className="ms-2">
                                <h6 className="fw-medium fs-14">
                                  <a href="#">BrightWave Innovations</a>
                                </h6>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Plan Name</span>
                      <h6 className="fw-normal">Advanced</h6>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Plan Type</span>
                      <h6 className="fw-normal">Monthly</h6>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Account URL</span>
                      <h6 className="fw-normal">bwi.example.com</h6>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Price</span>
                      <h6 className="fw-normal">200</h6>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Register Date</span>
                      <h6 className="fw-normal">12 Sep 2024</h6>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Expiring On</span>
                      <h6 className="fw-normal">11 Oct 2024</h6>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="modal fade" id="domain_pending">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title d-flex align-items-center">
                Domain Detail
                <span className="badge bg-outline-skyblue d-inline-flex align-items-center badge-xs ms-2">
                  <i className="ti ti-point-filled"></i>Pending
                </span>
              </h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x"></i>
              </button>
            </div>
            <form action="domain.php">
              <div className="modal-body pb-0">
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <div className="p-3 mb-3 br-5 bg-transparent-light">
                        <div className="row">
                          <div className="col-md-6">
                            <div className="d-flex align-items-center file-name-icon">
                              <a
                                href="#"
                                className="avatar avatar-md border avatar-rounded"
                              >
                                <img
                                  src="assets/img/company/company-01.svg"
                                  className="img-fluid"
                                  alt="img"
                                />
                              </a>
                              <div className="ms-2">
                                <h6 className="fw-medium fs-14">
                                  <a href="#">BrightWave Innovations</a>
                                </h6>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6 text-end">
                            <span className="badge badge-success d-inline-flex align-items-center badge-xs ms-2">
                              <i className="ti ti-check me-1"></i>Approve
                            </span>
                            <span className="badge badge-danger d-inline-flex align-items-center badge-xs ms-2">
                              <i className="ti ti-x me-1"></i>Reject
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Plan Name</span>
                      <h6 className="fw-normal">Advanced</h6>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Plan Type</span>
                      <h6 className="fw-normal">Monthly</h6>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Account URL</span>
                      <h6 className="fw-normal">bwi.example.com</h6>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Price</span>
                      <h6 className="fw-normal">200</h6>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Register Date</span>
                      <h6 className="fw-normal">12 Sep 2024</h6>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Expiring On</span>
                      <h6 className="fw-normal">11 Oct 2024</h6>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="modal fade" id="domain_rejected">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title d-flex align-items-center">
                Domain Detail
                <span className="badge bg-outline-danger d-inline-flex align-items-center badge-xs ms-2">
                  <i className="ti ti-point-filled"></i>Rejected
                </span>
              </h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x"></i>
              </button>
            </div>
            <form action="domain.php">
              <div className="modal-body pb-0">
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <div className="p-3 mb-3 br-5 bg-transparent-light">
                        <div className="row">
                          <div className="col-md-12">
                            <div className="d-flex align-items-center file-name-icon">
                              <a
                                href="#"
                                className="avatar avatar-md border avatar-rounded"
                              >
                                <img
                                  src="assets/img/company/company-01.svg"
                                  className="img-fluid"
                                  alt="img"
                                />
                              </a>
                              <div className="ms-2">
                                <h6 className="fw-medium fs-14">
                                  <a href="#">BrightWave Innovations</a>
                                </h6>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Plan Name</span>
                      <h6 className="fw-normal">Advanced</h6>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Plan Type</span>
                      <h6 className="fw-normal">Monthly</h6>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Account URL</span>
                      <h6 className="fw-normal">bwi.example.com</h6>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Price</span>
                      <h6 className="fw-normal">200</h6>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Register Date</span>
                      <h6 className="fw-normal">12 Sep 2024</h6>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <span className="fs-12">Expiring On</span>
                      <h6 className="fw-normal">11 Oct 2024</h6>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="modal fade" id="delete_modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center">
              <span className="avatar avatar-xl bg-transparent-danger text-danger mb-3">
                <i className="ti ti-trash-x fs-36"></i>
              </span>
              <h4 className="mb-1">Confirm Delete</h4>
              <p className="mb-3">
                You want to delete all the marked items, this cant be undone
                once you delete.
              </p>
              <div className="d-flex justify-content-center">
                <a
                  href="javascript:void(0);"
                  className="btn btn-light me-3"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </a>
                <a href="domain.php" className="btn btn-danger">
                  Yes, Delete
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DomainPage;
