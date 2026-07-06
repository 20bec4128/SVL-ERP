import React from "react";
import { Link } from "react-router-dom";

const InvoiceReportPage = () => {
  return (
    <>
      <div className="content">
        {/* Breadcrumb */}
				<div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
					<div className="my-auto mb-2">
						<h2 className="mb-1">Invoice Report</h2>
						<nav>
							<ol className="breadcrumb mb-0">
								<li className="breadcrumb-item">
									<Link to="/dashboard"><i className="ti ti-smart-home"></i></Link>
								</li>
								<li className="breadcrumb-item">
									HR
								</li>
								<li className="breadcrumb-item active" aria-current="page">Invoice Report</li>
							</ol>
						</nav>
					</div>
					<div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
						<div className="mb-2">
							<div className="dropdown">
								<Link to="#" className="dropdown-toggle btn btn-white d-inline-flex align-items-center" data-bs-toggle="dropdown">
									<i className="ti ti-file-export me-1"></i>Export
								</Link>
								<ul className="dropdown-menu  dropdown-menu-end p-3">
									<li>
										<Link to="#" className="dropdown-item rounded-1"><i className="ti ti-file-type-pdf me-1"></i>Export as PDF</Link>
									</li>
									<li>
										<Link to="#" className="dropdown-item rounded-1"><i className="ti ti-file-type-xls me-1"></i>Export as Excel </Link>
									</li>
								</ul>
							</div>

						</div>
						<div className="head-icons ms-2">
							<Link to="#" className="" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Collapse" id="collapse-header">
								<i className="ti ti-chevrons-up"></i>
							</Link>
						</div>
					</div>
				</div>
				{/* /Breadcrumb */}

				<div className="row">

					{/* Total Exponses */}
					<div className="col-xl-7 d-flex">
						<div className="row flex-fill">
							<div className="col-lg-6 col-md-6 d-flex">
								<div className="card invoice-report  flex-fill">
									<span className="invoice-report-badge">
									</span>
									<div className="card-body d-flex flex-wrap align-items-center justify-content-between">
										<div className="d-flex align-items-center flex-column overflow-hidden">
											<div>
												<div>
													<span className="fs-14 fw-normal text-truncate mb-1">Total Invoice</span>
													<h5>600</h5>
												</div>
											</div>
										</div>
										<div className="d-flex justify-content-between align-items-center flex-wrap">
											<span className="badge badge-sm badge-success me-3">+19.01%</span>
											<Link to="#" className="avatar avatar-md br-10  bg-transparent-primary border border-primary">
												<span className="text-primary"><i className="ti ti-file-invoice"></i></span>
											</Link>

										</div>

									</div>
								</div>
							</div>
							<div className="col-lg-6 col-md-6 d-flex">
								<div className="card invoice-report  flex-fill">
									<span className="invoice-report-badge-warning">
									</span>
									<div className="card-body d-flex flex-wrap align-items-center justify-content-between">
										<div className="d-flex align-items-center flex-column overflow-hidden">
											<div>
												<div>
													<span className="fs-14 fw-normal text-truncate mb-1">Partially Paid</span>
													<h5>80</h5>
												</div>
											</div>
										</div>
										<div className="d-flex justify-content-between align-items-center flex-wrap">
											<span className="badge badge-sm badge-success me-3">+19.01%</span>
											<Link to="#" className="avatar avatar-md br-10  bg-transparent-primary border border-primary">
												<span className="text-primary"><i className="ti ti-file-invoice"></i></span>
											</Link>
										</div>
									</div>
								</div>
							</div>
							<div className="col-lg-6 col-md-6 d-flex">
								<div className="card invoice-report  flex-fill">
									<span className="invoice-report-badge-success">
									</span>
									<div className="card-body d-flex flex-wrap align-items-center justify-content-between">
										<div className="d-flex align-items-center flex-column overflow-hidden">
											<div>
												<div>
													<span className="fs-14 fw-normal text-truncate mb-1">Paid Invoices</span>
													<h5>450</h5>
												</div>
											</div>
										</div>
										<div className="d-flex justify-content-between align-items-center flex-wrap">
											<span className="badge badge-sm badge-success me-3">+19.01%</span>
											<Link to="#" className="avatar avatar-md br-10  bg-transparent-primary border border-primary">
												<span className="text-primary"><i className="ti ti-file-invoice"></i></span>
											</Link>
										</div>
									</div>
								</div>
							</div>
							<div className="col-lg-6 col-md-6 d-flex">
								<div className="card invoice-report  flex-fill">
									<span className="invoice-report-badge-purple">
									</span>
									<div className="card-body d-flex flex-wrap align-items-center justify-content-between">
										<div className="d-flex align-items-center flex-column overflow-hidden">
											<div>
												<div>
													<span className="fs-14 fw-normal text-truncate mb-1">Overdue Invoices</span>
													<h5>40</h5>
												</div>
											</div>
										</div>
										<div className="d-flex justify-content-between align-items-center flex-wrap">
											<span className="badge badge-sm badge-success me-3">+19.01%</span>
											<Link to="#" className="avatar avatar-md br-10  bg-transparent-primary border border-primary">
												<span className="text-primary"><i className="ti ti-file-invoice"></i></span>
											</Link>
										</div>
									</div>
								</div>
							</div>
							<div className="col-lg-6 col-md-6 d-flex">
								<div className="card invoice-report  flex-fill">
									<span className="invoice-report-badge-danger">
									</span>
									<div className="card-body d-flex flex-wrap align-items-center justify-content-between">
										<div className="d-flex align-items-center flex-column overflow-hidden">
											<div>
												<div>
													<span className="fs-14 fw-normal text-truncate mb-1">Unpaid Invoices</span>
													<h5>150</h5>
												</div>
											</div>
										</div>
										<div className="d-flex justify-content-between align-items-center flex-wrap">
											<span className="badge badge-sm badge-success me-3">+19.01%</span>
											<Link to="#" className="avatar avatar-md br-10  bg-transparent-primary border border-primary">
												<span className="text-primary"><i className="ti ti-file-invoice"></i></span>
											</Link>
										</div>
									</div>
								</div>
							</div>
							<div className="col-lg-6 col-md-6 d-flex">
								<div className="card invoice-report  flex-fill">
									<span className="invoice-report-badge-skyblue">
									</span>
									<div className="card-body d-flex flex-wrap align-items-center justify-content-between">
										<div className="d-flex align-items-center flex-column overflow-hidden">
											<div>
												<div>
													<span className="fs-14 fw-normal text-truncate mb-1">Revenue</span>
													<h5>$25,340</h5>
												</div>
											</div>
										</div>
										<div className="d-flex justify-content-between align-items-center flex-wrap">
											<span className="badge badge-sm badge-success me-3">+19.01%</span>
											<Link to="#" className="avatar avatar-md br-10  bg-transparent-primary border border-primary">
												<span className="text-primary"><i className="ti ti-file-invoice"></i></span>
											</Link>
										</div>
									</div>
								</div>
							</div>
						</div>

					</div>
					{/* /Total Exponses */}

					{/* Total Exponses */}
					<div className="col-xl-5 d-flex">
						<div className="card flex-fill">
							<div className="card-header border-0 pb-0">
								<div className="d-flex flex-wrap justify-content-between align-items-center">
									<div className="d-flex align-items-center ">
										<span className="me-2"><i className="ti ti-chart-area-line text-danger"></i></span>
										<h5>Expense </h5>
									</div>
									<div className="dropdown">
										<Link to="#" className="dropdown-toggle btn btn-sm fs-12 btn-white d-inline-flex align-items-center" data-bs-toggle="dropdown">
											This Year
										</Link>
										<ul className="dropdown-menu  dropdown-menu-end p-2">
											<li>
												<Link to="#" className="dropdown-item rounded-1">2024</Link>
											</li>
											<li>
												<Link to="#" className="dropdown-item rounded-1">2023</Link>
											</li>
											<li>
												<Link to="#" className="dropdown-item rounded-1">2022</Link>
											</li>
										</ul>
									</div>
								</div>
							</div>
							<div className="card-body py-0">
								<div id="invoice-report"></div>
							</div>
						</div>
					</div>
					{/* /Total Exponses */}
				</div>

				<div className="card">
					<div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
						<h5>Invoice List</h5>
						<div className="d-flex my-xl-auto right-content align-items-center flex-wrap row-gap-3">
							<div className="me-3">
								<div className="input-icon-end position-relative">
									<input type="text" className="form-control date-range bookingrange" placeholder="dd/mm/yyyy - dd/mm/yyyy" />
									<span className="input-icon-addon">
										<i className="ti ti-chevron-down"></i>
									</span>
								</div>
							</div>
							<div className="dropdown me-3">
								<Link to="#" className="dropdown-toggle btn btn-white d-inline-flex align-items-center" data-bs-toggle="dropdown">
									$0.00 - $00
								</Link>
								<ul className="dropdown-menu  dropdown-menu-end p-3">
									<li>
										<Link to="#" className="dropdown-item rounded-1">$10 - $20</Link>
									</li>
									<li>
										<Link to="#" className="dropdown-item rounded-1">$20 - $30</Link>
									</li>
									<li>
										<Link to="#" className="dropdown-item rounded-1">$30 - $40</Link>
									</li>
								</ul>
							</div>
							<div className="dropdown me-3">
								<Link to="#" className="dropdown-toggle btn btn-white d-inline-flex align-items-center" data-bs-toggle="dropdown">
									Select Status
								</Link>
								<ul className="dropdown-menu  dropdown-menu-end p-3">
									<li>
										<Link to="#" className="dropdown-item rounded-1">Paid</Link>
									</li>
									<li>
										<Link to="#" className="dropdown-item rounded-1">Sent</Link>
									</li>
									<li>
										<Link to="#" className="dropdown-item rounded-1">Partially Paid</Link>
									</li>
								</ul>
							</div>
							<div className="dropdown">
								<Link to="#" className="dropdown-toggle btn btn-white d-inline-flex align-items-center" data-bs-toggle="dropdown">
									Sort By : Last 7 Days
								</Link>
								<ul className="dropdown-menu  dropdown-menu-end p-3">
									<li>
										<Link to="#" className="dropdown-item rounded-1">Recently Added</Link>
									</li>
									<li>
										<Link to="#" className="dropdown-item rounded-1">Ascending</Link>
									</li>
									<li>
										<Link to="#" className="dropdown-item rounded-1">Desending</Link>
									</li>
									<li>
										<Link to="#" className="dropdown-item rounded-1">Last Month</Link>
									</li>
									<li>
										<Link to="#" className="dropdown-item rounded-1">Last 7 Days</Link>
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
												<input className="form-check-input" type="checkbox" id="select-all" />
											</div>
										</th>
										<th>Invoice ID</th>
										<th>Client Name</th>
										<th>Company Name</th>
										<th>Created Date</th>
										<th>Due Date</th>
										<th>Amount</th>
										<th>Status</th>
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
											Inv-001
										</td>
										<td>
											<div className="d-flex align-items-center file-name-icon">
												<Link to="#" className="avatar avatar-md border avatar-rounded">
													<img src="/assets/img/users/user-39.jpg" className="img-fluid" alt="img" />
												</Link>
												<div className="ms-2">
													<h6 className="fw-medium"><Link to="#">Michael Walker</Link></h6>
													<span className="fs-12 fw-normal">CEO</span>
												</div>
											</div>
										</td>
										<td>BrightWave Innovations</td>
										<td>
											14 Jan 2024
										</td>
										<td>
											15 Jan 2024
										</td>
										<td>
											$3000
										</td>
										<td>
											<span className="badge badge-success-transparent">Paid</span>
										</td>
									</tr>
									<tr>
										<td>
											<div className="form-check form-check-md">
												<input className="form-check-input" type="checkbox" />
											</div>
										</td>
										<td>
											Inv-002
										</td>
										<td>
											<div className="d-flex align-items-center file-name-icon">
												<Link to="#" className="avatar avatar-md border avatar-rounded">
													<img src="/assets/img/users/user-40.jpg" className="img-fluid" alt="img" />
												</Link>
												<div className="ms-2">
													<h6 className="fw-medium"><Link to="#">Sophie Headrick</Link></h6>
													<span className="fs-12 fw-normal">Manager</span>
												</div>
											</div>
										</td>
										<td>Stellar Dynamics</td>
										<td>
											21 Jan 2024
										</td>
										<td>
											25 Jan 2024
										</td>
										<td>
											$2500
										</td>
										<td>
											<span className="badge badge-purple-transparent">Sent</span>
										</td>
									</tr>
									<tr>
										<td>
											<div className="form-check form-check-md">
												<input className="form-check-input" type="checkbox" />
											</div>
										</td>
										<td>
											Inv-003
										</td>
										<td>
											<div className="d-flex align-items-center file-name-icon">
												<Link to="#" className="avatar avatar-md border avatar-rounded">
													<img src="/assets/img/users/user-41.jpg" className="img-fluid" alt="img" />
												</Link>
												<div className="ms-2">
													<h6 className="fw-medium"><Link to="#">Cameron Drake</Link></h6>
													<span className="fs-12 fw-normal">Director</span>
												</div>
											</div>
										</td>
										<td>Quantum Nexus</td>
										<td>
											20 Feb 2024
										</td>
										<td>
											22 Feb 2024
										</td>
										<td>
											$2800
										</td>
										<td>
											<span className="badge badge-warning-transparent">Partially Paid</span>
										</td>
									</tr>
									<tr>
										<td>
											<div className="form-check form-check-md">
												<input className="form-check-input" type="checkbox" />
											</div>
										</td>
										<td>
											Inv-004
										</td>
										<td>
											<div className="d-flex align-items-center file-name-icon">
												<Link to="#" className="avatar avatar-md border avatar-rounded">
													<img src="/assets/img/users/user-42.jpg" className="img-fluid" alt="img" />
												</Link>
												<div className="ms-2">
													<h6 className="fw-medium"><Link to="#">Doris Crowley</Link></h6>
													<span className="fs-12 fw-normal">Consultant</span>
												</div>
											</div>
										</td>
										<td>EcoVision Enterprises</td>
										<td>
											15 Mar 2024
										</td>
										<td>
											17 Mar 2024
										</td>
										<td>
											$3300
										</td>
										<td>
											<span className="badge badge-purple-transparent">Sent</span>
										</td>
									</tr>
									<tr>
										<td>
											<div className="form-check form-check-md">
												<input className="form-check-input" type="checkbox" />
											</div>
										</td>
										<td>
											Inv-005
										</td>
										<td>
											<div className="d-flex align-items-center file-name-icon">
												<Link to="#" className="avatar avatar-md border avatar-rounded">
													<img src="/assets/img/users/user-43.jpg" className="img-fluid" alt="img" />
												</Link>
												<div className="ms-2">
													<h6 className="fw-medium"><Link to="#">Thomas Bordelon</Link></h6>
													<span className="fs-12 fw-normal">Manager</span>
												</div>
											</div>
										</td>
										<td>Aurora Technologies</td>
										<td>
											12 Apr 2024
										</td>
										<td>
											16 Apr 2024
										</td>
										<td>
											$3600
										</td>
										<td>
											<span className="badge badge-success-transparent">Paid</span>
										</td>
									</tr>
									<tr>
										<td>
											<div className="form-check form-check-md">
												<input className="form-check-input" type="checkbox" />
											</div>
										</td>
										<td>
											Inv-006
										</td>
										<td>
											<div className="d-flex align-items-center file-name-icon">
												<Link to="#" className="avatar avatar-md border avatar-rounded">
													<img src="/assets/img/users/user-44.jpg" className="img-fluid" alt="img" />
												</Link>
												<div className="ms-2">
													<h6 className="fw-medium"><Link to="#">Kathleen Gutierrez</Link></h6>
													<span className="fs-12 fw-normal">Director</span>
												</div>
											</div>
										</td>
										<td>BlueSky Ventures</td>
										<td>
											20 Apr 2024
										</td>
										<td>
											21 Apr 2024
										</td>
										<td>
											$2000
										</td>
										<td>
											<span className="badge badge-warning-transparent">Partially Paid</span>
										</td>
									</tr>
									<tr>
										<td>
											<div className="form-check form-check-md">
												<input className="form-check-input" type="checkbox" />
											</div>
										</td>
										<td>
											Inv-007
										</td>
										<td>
											<div className="d-flex align-items-center file-name-icon">
												<Link to="#" className="avatar avatar-md border avatar-rounded">
													<img src="/assets/img/users/user-45.jpg" className="img-fluid" alt="img" />
												</Link>
												<div className="ms-2">
													<h6 className="fw-medium"><Link to="#">Bruce Wright</Link></h6>
													<span className="fs-12 fw-normal">CEO</span>
												</div>
											</div>
										</td>
										<td>TerraFusion Energy</td>
										<td>
											06 Jul 2024
										</td>
										<td>
											06 Jul 2024
										</td>
										<td>
											$3400
										</td>
										<td>
											<span className="badge badge-purple-transparent">Sent</span>
										</td>
									</tr>
									<tr>
										<td>
											<div className="form-check form-check-md">
												<input className="form-check-input" type="checkbox" />
											</div>
										</td>
										<td>
											Inv-008
										</td>
										<td>
											<div className="d-flex align-items-center file-name-icon">
												<Link to="#" className="avatar avatar-md border avatar-rounded">
													<img src="/assets/img/users/user-46.jpg" className="img-fluid" alt="img" />
												</Link>
												<div className="ms-2">
													<h6 className="fw-medium"><Link to="#">Estelle Morgan</Link></h6>
													<span className="fs-12 fw-normal">Manager</span>
												</div>
											</div>
										</td>
										<td>UrbanPulse Design</td>
										<td>
											02 Sep 2024
										</td>
										<td>
											04 Sep 2024
										</td>
										<td>
											$4000
										</td>
										<td>
											<span className="badge badge-success-transparent">Paid</span>
										</td>
									</tr>
									<tr>
										<td>
											<div className="form-check form-check-md">
												<input className="form-check-input" type="checkbox" />
											</div>
										</td>
										<td>
											Inv-009
										</td>
										<td>
											<div className="d-flex align-items-center file-name-icon">
												<Link to="#" className="avatar avatar-md border avatar-rounded">
													<img src="/assets/img/users/user-47.jpg" className="img-fluid" alt="img" />
												</Link>
												<div className="ms-2">
													<h6 className="fw-medium"><Link to="#">Stephen Dias</Link></h6>
													<span className="fs-12 fw-normal">CEO</span>
												</div>
											</div>
										</td>
										<td>Nimbus Networks</td>
										<td>
											15 Nov 2024
										</td>
										<td>
											15 Nov 2024
										</td>
										<td>
											$4500
										</td>
										<td>
											<span className="badge badge-warning-transparent">Partially Paid</span>
										</td>
									</tr>
									<tr>
										<td>
											<div className="form-check form-check-md">
												<input className="form-check-input" type="checkbox" />
											</div>
										</td>
										<td>
											Inv-010
										</td>
										<td>
											<div className="d-flex align-items-center file-name-icon">
												<Link to="#" className="avatar avatar-md border avatar-rounded">
													<img src="/assets/img/users/user-48.jpg" className="img-fluid" alt="img" />
												</Link>
												<div className="ms-2">
													<h6 className="fw-medium"><Link to="#">Angela Thomas</Link></h6>
													<span className="fs-12 fw-normal">Consultant</span>
												</div>
											</div>
										</td>
										<td>Epicurean Delights</td>
										<td>
											10 Dec 2024
										</td>
										<td>
											11 Dec 2024
										</td>
										<td>
											$3800
										</td>
										<td>
											<span className="badge badge-success-transparent">Paid</span>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>
      </div>

     
    </>
  );
};

export default InvoiceReportPage;
