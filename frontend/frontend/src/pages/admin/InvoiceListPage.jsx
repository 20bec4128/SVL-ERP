import React from "react";
import { Link } from "react-router-dom";

const InvoiceListPage = () => {
  return (
    <>
      <div className="content">
        {/* Breadcrumb */}
				<div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
					<div className="my-auto mb-2">
						<h2 className="mb-1">Invoices</h2>
						<nav>
							<ol className="breadcrumb mb-0">
								<li className="breadcrumb-item">
									<Link to="/dashboard"><i className="ti ti-smart-home"></i></Link>
								</li>
								<li className="breadcrumb-item">
									Application
								</li>
								<li className="breadcrumb-item active" aria-current="page">Invoices</li>
							</ol>
						</nav>
					</div>
					<div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
						<div className="me-2 mb-2">
							<div className="dropdown">
								<Link to="#"
									className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
									data-bs-toggle="dropdown">
									<i className="ti ti-file-export me-2"></i>Export
								</Link>
								<ul className="dropdown-menu  dropdown-menu-end p-3">
									<li>
										<Link to="#" className="dropdown-item rounded-1"><i
												className="ti ti-file-type-pdf me-1"></i>Export as PDF</Link>
									</li>
									<li>
										<Link to="#" className="dropdown-item rounded-1"><i
												className="ti ti-file-type-xls me-1"></i>Export as Excel </Link>
									</li>
								</ul>
							</div>
						</div>
						<div className="mb-2">
							<Link to="/add-invoices" className="btn btn-primary d-flex align-items-center"><i
									className="ti ti-circle-plus me-2"></i>Add Invoice</Link>
						</div>
						<div className="ms-2 head-icons">
							<Link to="#" className="" data-bs-toggle="tooltip" data-bs-placement="top"
								data-bs-original-title="Collapse" id="collapse-header">
								<i className="ti ti-chevrons-up"></i>
							</Link>
						</div>
					</div>
				</div>
				{/* /Breadcrumb */}

				{/* Invoice Data */}
				<div className="row">
					<div className="col-xl-3 col-sm-6">
						<div className="card flex-fill">
							<div className="card-body">
								<div className="d-flex align-items-center overflow-hidden mb-2">
									<div>
										<p className="fs-12 fw-normal mb-1 text-truncate">Total Invoice</p>
										<h5>$3,237.94</h5>
									</div>
								</div>
								<div className="attendance-report-bar mb-2">
									<div className="progress" role="progressbar" aria-label="Success example"
										aria-valuenow="25" aria-valuemin="0" aria-valuemax="100" style={{"height":"5px"}}>
										<div className="progress-bar bg-pink" style={{"width":"85%"}}></div>
									</div>
								</div>
								<div>
									<p className="fs-12 fw-normal d-flex align-items-center text-truncate"><span
											className="text-success fs-12 d-flex align-items-center me-1"><i
												className="ti ti-arrow-wave-right-up me-1"></i>+32.40%</span>from last month
									</p>
								</div>
							</div>
						</div>
					</div>
					<div className="col-xl-3 col-sm-6">
						<div className="card flex-fill">
							<div className="card-body">
								<div className="d-flex align-items-center overflow-hidden mb-2">
									<div>
										<p className="fs-12 fw-normal mb-1 text-truncate">Outstanding</p>
										<h5>$3,237.94</h5>
									</div>
								</div>
								<div className="attendance-report-bar mb-2">
									<div className="progress" role="progressbar" aria-label="Success example"
										aria-valuenow="25" aria-valuemin="0" aria-valuemax="100" style={{"height":"5px"}}>
										<div className="progress-bar bg-purple" style={{"width":"50%"}}></div>
									</div>
								</div>
								<div>
									<p className="fs-12 fw-normal d-flex align-items-center text-truncate"><span
											className="text-danger fs-12 d-flex align-items-center me-1"><i
												className="ti ti-arrow-wave-right-up me-1"></i>-4.40%</span>from last month
									</p>
								</div>
							</div>
						</div>
					</div>
					<div className="col-xl-3 col-sm-6">
						<div className="card flex-fill">
							<div className="card-body">
								<div className="d-flex align-items-center overflow-hidden mb-2">
									<div>
										<p className="fs-12 fw-normal mb-1 text-truncate">Draft</p>
										<h5>$3,237.94</h5>
									</div>
								</div>
								<div className="attendance-report-bar mb-2">
									<div className="progress" role="progressbar" aria-label="Success example"
										aria-valuenow="25" aria-valuemin="0" aria-valuemax="100" style={{"height":"5px"}}>
										<div className="progress-bar bg-warning" style={{"width":"30%"}}></div>
									</div>
								</div>
								<div>
									<p className="fs-12 fw-normal d-flex align-items-center text-truncate"><span
											className="text-success fs-12 d-flex align-items-center me-1"><i
												className="ti ti-arrow-wave-right-up me-1"></i>12%</span>from last month</p>
								</div>
							</div>
						</div>
					</div>
					<div className="col-xl-3 col-sm-6">
						<div className="card flex-fill">
							<div className="card-body">
								<div className="d-flex align-items-center overflow-hidden mb-2">
									<div>
										<p className="fs-12 fw-normal mb-1 text-truncate">Total Overdue</p>
										<h5>$3,237.94</h5>
									</div>
								</div>
								<div className="attendance-report-bar mb-2">
									<div className="progress" role="progressbar" aria-label="Success example"
										aria-valuenow="25" aria-valuemin="0" aria-valuemax="100" style={{"height":"5px"}}>
										<div className="progress-bar bg-danger" style={{"width":"20%"}}></div>
									</div>
								</div>
								<div>
									<p className="fs-12 fw-normal d-flex align-items-center text-truncate"><span
											className="text-danger fs-12 d-flex align-items-center me-1"><i
												className="ti ti-arrow-wave-right-up me-1"></i>-15.40%</span>from last month
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
				{/* /Invoice Data */}

				{/* Invoice DataTable */}
				<div className="row">
					<div className="col-sm-12">
						<div className="card">
							<div
								className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
								<h5 className="d-flex align-items-center">Invoices<span
										className="badge badge-dark-transparent ms-2">2000 Invoices</span></h5>
								<div className="d-flex align-items-center flex-wrap row-gap-3">

									<div className="input-icon position-relative w-120 me-2">
										<span className="input-icon-addon">
											<i className="ti ti-calendar"></i>
										</span>
										<input type="text" className="form-control datetimepicker"
											placeholder="Created Date" />
									</div>
									<div className="input-icon position-relative w-120 me-2">
										<span className="input-icon-addon">
											<i className="ti ti-calendar"></i>
										</span>
										<input type="text" className="form-control datetimepicker" placeholder="Due Date" />
									</div>
									<div className="dropdown me-2">
										<Link to="#"
											className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
											data-bs-toggle="dropdown">
											Select Status
										</Link>
										<ul className="dropdown-menu  dropdown-menu-end p-3">
											<li>
												<Link to="#" className="dropdown-item rounded-1">Paid</Link>
											</li>
											<li>
												<Link to="#"
													className="dropdown-item rounded-1">Overdue</Link>
											</li>
											<li>
												<Link to="#"
													className="dropdown-item rounded-1">Pending</Link>
											</li>
											<li>
												<Link to="#" className="dropdown-item rounded-1">Draft</Link>
											</li>
										</ul>
									</div>
									<div className="dropdown">
										<Link to="#"
											className="dropdown-toggle btn btn-white d-inline-flex align-items-center fs-12"
											data-bs-toggle="dropdown">
											<span className="fs-12 d-inline-flex me-1">Sort By : </span>
											Last 7 Days
										</Link>
										<ul className="dropdown-menu  dropdown-menu-end p-3">
											<li>
												<Link to="#" className="dropdown-item rounded-1">Last 7
													Days</Link>
											</li>
											<li>
												<Link to="#" className="dropdown-item rounded-1">Created
													Date</Link>
											</li>
											<li>
												<Link to="#" className="dropdown-item rounded-1">Due
													Date</Link>
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
												<th>Invoice</th>
												<th>Name</th>
												<th>Created On</th>
												<th>Total</th>
												<th>Amount Due</th>
												<th>Due Date</th>
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
													<Link to="/invoice-details" className="tb-data">INV-1454</Link>
												</td>
												<td>
													<div className="d-flex align-items-center">
														<Link to="/invoice-details" className="avatar avatar-lg me-2">
															<img src="/assets/img/users/user-32.jpg"
																className="rounded-circle" alt="user" />
														</Link>
														<div>
															<h6 className="fw-medium"><Link to="/invoice-details">Anthony
																	Lewis</Link>
															</h6>
														<span className="fs-12"><Link to="cdn-cgi/l/email-protection"
																	className="__cf_email__"
																	data-cfemail="bcddd2c8d4d3d2c5fcd9c4ddd1ccd0d992dfd3d1">[email&#160;protected]</Link></span>
														</div>
													</div>
												</td>
												<td>14 Jan 2024, 04:27 AM </td>
												<td>$300</td>
												<td>$0</td>
												<td>14 Jan 2024, 04:27 AM</td>
												<td>
													<span
														className="badge badge-soft-success d-inline-flex align-items-center">
														<i className="ti ti-point-filled me-1"></i>Paid
													</span>
												</td>
												<td>
													<div className="action-icon d-inline-flex">
														<Link to="/invoice-details" className="me-2"><i
																className="ti ti-eye"></i></Link>
														<Link to="/edit-invoices" className="me-2"><i
																className="ti ti-edit"></i></Link>
													<Link to="#delete_modal" className="" data-bs-toggle="modal"
															data-bs-target="#delete_modal"><i
																className="ti ti-trash"></i></Link>
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
													<Link to="/invoice-details" className="tb-data">INV-6571</Link>
												</td>
												<td>
													<div className="d-flex align-items-center">
														<Link to="/invoice-details" className="avatar avatar-lg me-2">
															<img src="/assets/img/users/user-09.jpg"
																className="rounded-circle" alt="user" />
														</Link>
														<div>
															<h6 className="fw-medium"><Link to="/invoice-details">Brian
																	Villalobos</Link>
															</h6>
															<span className="fs-12"><Link to="cdn-cgi/l/email-protection"
																	className="__cf_email__"
																	data-cfemail="86e4f4efe7e8c6e3fee7ebf6eae3a8e5e9eb">[email&#160;protected]</Link></span>
														</div>
													</div>
												</td>
												<td>21 Jan 2024, 03:19 AM</td>
												<td>$547</td>
												<td>$200</td>
												<td>21 Jan 2024, 03:19 AM</td>
												<td>
													<span
														className="badge badge-soft-danger d-inline-flex align-items-center">
														<i className="ti ti-point-filled me-1"></i>Overdue
													</span>
												</td>
												<td>
													<div className="action-icon d-inline-flex">
														<Link to="/invoice-details" className="me-2"><i
																className="ti ti-eye"></i></Link>
														<Link to="/edit-invoices" className="me-2"><i
																className="ti ti-edit"></i></Link>
														<Link href="#delete_modal" className="" data-bs-toggle="modal"
															data-bs-target="#delete_modal"><i
																className="ti ti-trash"></i></Link>
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
													<Link to="/invoice-details" className="tb-data">INV-2245</Link>
												</td>
												<td>
													<div className="d-flex align-items-center">
														<Link to="/invoice-details" className="avatar avatar-lg me-2">
															<img src="/assets/img/users/user-01.jpg"
																className="rounded-circle" alt="user" />
														</Link>
														<div>
															<h6 className="fw-medium"><Link to="/invoice-details">Harvey
																	Smith</Link>
															</h6>
														<span className="fs-12"><Link to="cdn-cgi/l/email-protection"
																	className="__cf_email__"
																	data-cfemail="f29a938084978bb2978a939f829e97dc919d9f">[email&#160;protected]</Link></span>
														</div>
													</div>
												</td>
												<td>20 Feb 2024, 12:15 PM</td>
												<td>$325</td>
												<td>$65</td>
												<td>20 Feb 2024, 12:15 PM</td>
												<td>
													<span
														className="badge badge-soft-purple d-inline-flex align-items-center">
														<i className="ti ti-point-filled me-1"></i>Pending
													</span>
												</td>
												<td>
													<div className="action-icon d-inline-flex">
														<Link to="/invoice-details" className="me-2"><i
																className="ti ti-eye"></i></Link>
														<Link to="/edit-invoices" className="me-2"><i
																className="ti ti-edit"></i></Link>
														<Link href="#delete_modal" className="" data-bs-toggle="modal"
															data-bs-target="#delete_modal"><i
																className="ti ti-trash"></i></Link>
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
													<Link to="/invoice-details" className="tb-data">INV-1456</Link>
												</td>
												<td>
													<div className="d-flex align-items-center">
														<Link to="/invoice-details" className="avatar avatar-lg me-2">
															<img src="/assets/img/users/user-33.jpg"
																className="rounded-circle" alt="user" />
														</Link>
														<div>
															<h6 className="fw-medium"><Link to="/invoice-details">Stephan
																	Peralt</Link>
															</h6>
														<span className="fs-12"><Link to="cdn-cgi/l/email-protection"
																	className="__cf_email__"
																	data-cfemail="f3839681929fb3968b929e839f96dd909c9e">[email&#160;protected]</Link></span>
														</div>
													</div>
												</td>
												<td>15 Mar 2024, 12:11 AM</td>
												<td>$471</td>
												<td>$145</td>
												<td>15 Mar 2024, 12:11 AM</td>
												<td>
													<span
														className="badge badge-soft-purple d-inline-flex align-items-center">
														<i className="ti ti-point-filled me-1"></i>Pending
													</span>
												</td>
												<td>
													<div className="action-icon d-inline-flex">
														<Link to="/invoice-details" className="me-2"><i
																className="ti ti-eye"></i></Link>
														<Link to="#" className="me-2"><i className="ti ti-edit"></i></Link>
														<Link to="#" className="" data-bs-toggle="modal"
															data-bs-target="#delete_modal"><i
																className="ti ti-trash"></i></Link>
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
													<Link to="/invoice-details" className="tb-data">INV-0045</Link>
												</td>
												<td>
													<div className="d-flex align-items-center">
														<Link to="/invoice-details" className="avatar avatar-lg me-2">
															<img src="/assets/img/users/user-34.jpg"
																className="rounded-circle" alt="user" />
														</Link>
														<div>
															<h6 className="fw-medium"><Link to="/invoice-details">Doglas
																	Martini</Link>
															</h6>
														<span className="fs-12"><Link to="cdn-cgi/l/email-protection"
																	className="__cf_email__"
																	data-cfemail="3954584b4d57504e4b795c41585449555c175a5654">[email&#160;protected]</Link></span>
														</div>
													</div>
												</td>
												<td>12 Apr 2024, 05:48 PM</td>
												<td>$147</td>
												<td>$32</td>
												<td>12 Apr 2024, 05:48 PM</td>
												<td>
													<span
														className="badge badge-soft-danger d-inline-flex align-items-center">
														<i className="ti ti-point-filled me-1"></i>Overdue
													</span>
												</td>
												<td>
													<div className="action-icon d-inline-flex">
														<Link to="/invoice-details" className="me-2"><i
																className="ti ti-eye"></i></Link>
														<Link to="/edit-invoices" className="me-2"><i
																className="ti ti-edit"></i></Link>
														<Link href="#delete_modal" className="" data-bs-toggle="modal"
															data-bs-target="#delete_modal"><i
																className="ti ti-trash"></i></Link>
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
													<Link to="/invoice-details" className="tb-data">INV-6244</Link>
												</td>
												<td>
													<div className="d-flex align-items-center">
														<Link to="/invoice-details" className="avatar avatar-lg me-2">
															<img src="/assets/img/users/user-02.jpg"
																className="rounded-circle" alt="user" />
														</Link>
														<div>
															<h6 className="fw-medium"><Link to="/invoice-details">Linda
																	Ray</Link>
															</h6>
														<span className="fs-12"><Link to="cdn-cgi/l/email-protection"
																	className="__cf_email__"
																	data-cfemail="493b28307d7c7f092c31282439252c672a2624">[email&#160;protected]</Link></span>
														</div>
													</div>
												</td>
												<td>20 Apr 2024, 06:11 PM</td>
												<td>$654</td>
												<td>$140</td>
												<td>20 Apr 2024, 06:11 PM</td>
												<td>
													<span
														className="badge badge-soft-warning d-inline-flex align-items-center">
														<i className="ti ti-point-filled me-1"></i>Draft
													</span>
												</td>
												<td>
													<div className="action-icon d-inline-flex">
														<Link to="/invoice-details" className="me-2"><i
																className="ti ti-eye"></i></Link>
														<Link to="/edit-invoices" className="me-2"><i
																className="ti ti-edit"></i></Link>
														<Link href="#delete_modal" className="" data-bs-toggle="modal"
															data-bs-target="#delete_modal"><i
																className="ti ti-trash"></i></Link>
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
													<Link to="/invoice-details" className="tb-data">INV-9565</Link>
												</td>
												<td>
													<div className="d-flex align-items-center">
														<Link to="/invoice-details" className="avatar avatar-lg me-2">
															<img src="/assets/img/users/user-35.jpg"
																className="rounded-circle" alt="user" />
														</Link>
														<div>
															<h6 className="fw-medium"><Link to="/invoice-details">Elliot
																	Murray</Link>
															</h6>
												<span className="fs-12"><Link to="cdn-cgi/l/email-protection"
																	className="__cf_email__"
																	data-cfemail="0469717676657d44617c65697468612a676b69">[email&#160;protected]</Link></span>
														</div>
													</div>
												</td>
												<td>14 Jan 2024, 04:27 AM </td>
												<td>$300</td>
												<td>$0</td>
												<td>14 Jan 2024, 04:27 AM</td>
												<td>
													<span
														className="badge badge-soft-success d-inline-flex align-items-center">
														<i className="ti ti-point-filled me-1"></i>Paid
													</span>
												</td>
												<td>
													<div className="action-icon d-inline-flex">
														<Link to="/invoice-details" className="me-2"><i
																className="ti ti-eye"></i></Link>
														<Link to="/edit-invoices" className="me-2"><i
																className="ti ti-edit"></i></Link>
														<Link href="#delete_modal" className="" data-bs-toggle="modal"
															data-bs-target="#delete_modal"><i
																className="ti ti-trash"></i></Link>
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
													<Link to="/invoice-details" className="tb-data">INV-6874</Link>
												</td>
												<td>
													<div className="d-flex align-items-center">
														<Link to="/invoice-details" className="avatar avatar-lg me-2">
															<img src="/assets/img/users/user-36.jpg"
																className="rounded-circle" alt="user" />
														</Link>
														<div>
															<h6 className="fw-medium"><Link to="/invoice-details">Rebecca
																	Smtih</Link>
															</h6>
												<span className="fs-12"><Link to="cdn-cgi/l/email-protection"
																	className="__cf_email__"
																	data-cfemail="e7948a938e8fa7829f868a978b82c984888a">[email&#160;protected]</Link></span>
														</div>
													</div>
												</td>
												<td>02 Sep 2024, 09:21 PM</td>
												<td>$654</td>
												<td>$65</td>
												<td>02 Sep 2024, 09:21 PM</td>
												<td>
													<span
														className="badge badge-soft-success d-inline-flex align-items-center">
														<i className="ti ti-point-filled me-1"></i>Paid
													</span>
												</td>
												<td>
													<div className="action-icon d-inline-flex">
														<Link to="/invoice-details" className="me-2"><i
																className="ti ti-eye"></i></Link>
														<Link to="/edit-invoices" className="me-2"><i
																className="ti ti-edit"></i></Link>
														<Link href="#delete_modal" className="" data-bs-toggle="modal"
															data-bs-target="#delete_modal"><i
																className="ti ti-trash"></i></Link>
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
													<Link to="/invoice-details" className="tb-data">INV-1454</Link>
												</td>
												<td>
													<div className="d-flex align-items-center">
														<Link to="/invoice-details" className="avatar avatar-lg me-2">
															<img src="/assets/img/users/user-32.jpg"
																className="rounded-circle" alt="user" />
														</Link>
														<div>
															<h6 className="fw-medium"><Link to="/invoice-details">Anthony
																	Lewis</Link>
															</h6>
												<span className="fs-12"><Link to="cdn-cgi/l/email-protection"
																	className="__cf_email__"
																	data-cfemail="aecfc0dac6c1c0d7eecbd6cfc3dec2cb80cdc1c3">[email&#160;protected]</Link></span>
														</div>
													</div>
												</td>
												<td>14 Jan 2024, 04:27 AM </td>
												<td>$300</td>
												<td>$0</td>
												<td>14 Jan 2024, 04:27 AM</td>
												<td>
													<span
														className="badge badge-soft-warning d-inline-flex align-items-center">
														<i className="ti ti-point-filled me-1"></i>Draft
													</span>
												</td>
												<td>
													<div className="action-icon d-inline-flex">
														<Link to="/invoice-details" className="me-2"><i
																className="ti ti-eye"></i></Link>
														<Link to="/edit-invoices" className="me-2"><i
																className="ti ti-edit"></i></Link>
														<Link href="#delete_modal" className="" data-bs-toggle="modal"
															data-bs-target="#delete_modal"><i
																className="ti ti-trash"></i></Link>
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
													<Link to="/invoice-details" className="tb-data">INV-6587</Link>
												</td>
												<td>
													<div className="d-flex align-items-center">
														<Link to="/invoice-details" className="avatar avatar-lg me-2">
															<img src="/assets/img/users/user-37.jpg"
																className="rounded-circle" alt="user" />
														</Link>
														<div>
															<h6 className="fw-medium"><Link to="/invoice-details">Connie
																	Waters</Link>
															</h6>
														<span className="fs-12"><Link to="cdn-cgi/l/email-protection"
																	className="__cf_email__"
																	data-cfemail="86e5e9e8e8efe3c6e3fee7ebf6eae3a8e5e9eb">[email&#160;protected]</Link></span>
														</div>
													</div>
												</td>
												<td>15 Nov 2024, 12:44 PM</td>
												<td>$987</td>
												<td>$47</td>
												<td>15 Nov 2024, 12:44 PM</td>
												<td>
													<span
														className="badge badge-soft-purple d-inline-flex align-items-center">
														<i className="ti ti-point-filled me-1"></i>Pending
													</span>
												</td>
												<td>
													<div className="action-icon d-inline-flex">
														<Link to="/invoice-details" className="me-2"><i
																className="ti ti-eye"></i></Link>
														<Link to="/edit-invoices" className="me-2"><i
																className="ti ti-edit"></i></Link>
														<Link href="#delete_modal" className="" data-bs-toggle="modal"
															data-bs-target="#delete_modal"><i
																className="ti ti-trash"></i></Link>
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
													<Link to="/invoice-details" className="tb-data">INV-5879</Link>
												</td>
												<td>
													<div className="d-flex align-items-center">
														<Link to="/invoice-details" className="avatar avatar-lg me-2">
															<img src="/assets/img/users/user-38.jpg"
																className="rounded-circle" alt="user" />
														</Link>
														<div>
															<h6 className="fw-medium"><Link to="/invoice-details">Lori
																	Broaddus</Link>
															</h6>
														<span className="fs-12"><Link to="cdn-cgi/l/email-protection"
																	className="__cf_email__"
																	data-cfemail="492b3b26282d2d3c3a092c31282439252c672a2624">[email&#160;protected]</Link></span>
														</div>
													</div>
												</td>
												<td>10 Dec 2024, 11:23 PM</td>
												<td>$365</td>
												<td>$21</td>
												<td>10 Dec 2024, 11:23 PM</td>
												<td>
													<span
														className="badge badge-soft-danger d-inline-flex align-items-center">
														<i className="ti ti-point-filled me-1"></i>Overdue
													</span>
												</td>
												<td>
													<div className="action-icon d-inline-flex">
														<Link to="/invoice-details" className="me-2"><i
																className="ti ti-eye"></i></Link>
														<Link to="/edit-invoices" className="me-2"><i
																className="ti ti-edit"></i></Link>
														<Link href="#delete_modal" className="" data-bs-toggle="modal"
															data-bs-target="#delete_modal"><i
																className="ti ti-trash"></i></Link>
													</div>
												</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>
						</div>
					</div>
				</div>
				{/* /Invoice DataTable */}
      </div>

      {/* /Page Wrapper */}

			{/* Delete Modal */}
			<div className="modal fade" id="delete_modal">
				<div className="modal-dialog modal-dialog-centered">
					<div className="modal-content">
						<div className="modal-body text-center">
							<span className="avatar avatar-xl bg-transparent-danger text-danger mb-3">
								<i className="ti ti-trash-x fs-36"></i>
							</span>
							<h4 className="mb-1">Confirm Delete</h4>
							<p className="mb-3">You want to delete all the marked items, this cant be undone once you
								delete.
							</p>
							<div className="d-flex justify-content-center">
								<Link to="#" className="btn btn-light me-3"
									data-bs-dismiss="modal">Cancel</Link>
								<Link to="/invoice" className="btn btn-danger">Yes, Delete</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
			{/* /Delete Modal */}

    </>  );
};

export default InvoiceListPage;