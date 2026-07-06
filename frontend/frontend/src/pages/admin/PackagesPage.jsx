import React from 'react';
import { Link } from 'react-router-dom';

const PackagesPage = () => {
    return (
        <>
			<div className="content">

				<div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
					<div className="my-auto mb-2">
						<h2 className="mb-1">Packages</h2>
						<nav>
							<ol className="breadcrumb mb-0">
								<li className="breadcrumb-item">
									<a href="dashboard.php"><i className="ti ti-smart-home"></i></a>
								</li>
								<li className="breadcrumb-item">
									Superadmin
								</li>
								<li className="breadcrumb-item active" aria-current="page">Packages List</li>
							</ol>
						</nav>
					</div>
					<div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
						<div className="me-2 mb-2">
							<div className="d-flex align-items-center border bg-white rounded p-1 me-2 icon-list">
								<a href="packages.php" className="btn btn-icon btn-sm active bg-primary text-white me-1"><i className="ti ti-list-tree"></i></a>
								<a href="packages-grid.php" className="btn btn-icon btn-sm"><i className="ti ti-layout-grid"></i></a>
							</div>
						</div>
						<div className="me-2 mb-2">
							<div className="dropdown">
								<a href="javascript:void(0);" className="dropdown-toggle btn btn-white d-inline-flex align-items-center" data-bs-toggle="dropdown">
									<i className="ti ti-file-export me-1"></i>Export
								</a>
								<ul className="dropdown-menu  dropdown-menu-end p-3">
									<li>
										<a href="javascript:void(0);" className="dropdown-item rounded-1"><i className="ti ti-file-type-pdf me-1"></i>Export as PDF</a>
									</li>
									<li>
										<a href="javascript:void(0);" className="dropdown-item rounded-1"><i className="ti ti-file-type-xls me-1"></i>Export as Excel </a>
									</li>
								</ul>
							</div>
						</div>
						<div className="mb-2">
							<a href="#" data-bs-toggle="modal" data-bs-target="#add_plans" className="btn btn-primary d-flex align-items-center"><i className="ti ti-circle-plus me-2"></i>Add New Plan</a>
						</div>
						<div className="ms-2 head-icons">
							<a href="javascript:void(0);" className="" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Collapse" id="collapse-header">
								<i className="ti ti-chevrons-up"></i>
							</a>
						</div>
					</div>
				</div>

				<div className="row">

					<div className="col-lg-3 col-md-6 d-flex">
						<div className="card flex-fill">
							<div className="card-body d-flex align-items-center justify-content-between">
								<div className="d-flex align-items-center overflow-hidden">
									<div>
										<p className="fs-12 fw-medium mb-1 text-truncate">Total Plans</p>
										<h4>08</h4>
									</div>
								</div>
								<div>
									<span className="avatar avatar-lg bg-primary flex-shrink-0">
										<i className="ti ti-box fs-16"></i>
									</span>
								</div>
							</div>
						</div>
					</div>

					<div className="col-lg-3 col-md-6 d-flex">
						<div className="card flex-fill">
							<div className="card-body d-flex align-items-center justify-content-between">
								<div className="d-flex align-items-center overflow-hidden">
									<div>
										<p className="fs-12 fw-medium mb-1 text-truncate">Active Plans</p>
										<h4>08</h4>
									</div>
								</div>
								<div>
									<span className="avatar avatar-lg bg-success flex-shrink-0">
										<i className="ti ti-activity-heartbeat fs-16"></i>
									</span>
								</div>
							</div>
						</div>
					</div>

					<div className="col-lg-3 col-md-6 d-flex">
						<div className="card flex-fill">
							<div className="card-body d-flex align-items-center justify-content-between">
								<div className="d-flex align-items-center overflow-hidden">
									<div>
										<p className="fs-12 fw-medium mb-1 text-truncate">Inactive Plans</p>
										<h4>0</h4>
									</div>
								</div>
								<div>
									<span className="avatar avatar-lg bg-danger flex-shrink-0">
										<i className="ti ti-player-pause fs-16"></i>
									</span>
								</div>
							</div>
						</div>
					</div>

					<div className="col-lg-3 col-md-6 d-flex">
						<div className="card flex-fill">
							<div className="card-body d-flex align-items-center justify-content-between">
								<div className="d-flex align-items-center overflow-hidden">
									<div>
										<p className="fs-12 fw-medium mb-1 text-truncate">No of Plan Types</p>
										<h4>02</h4>
									</div>
								</div>
								<div>
									<span className="avatar avatar-lg bg-skyblue flex-shrink-0">
										<i className="ti ti-mask fs-16"></i>
									</span>
								</div>
							</div>
						</div>
					</div>

				</div>

				<div className="card">
					<div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
						<h5>Plan List</h5>
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
								<a href="javascript:void(0);" className="dropdown-toggle btn btn-white d-inline-flex align-items-center" data-bs-toggle="dropdown">
									Select Plan
								</a>
								<ul className="dropdown-menu  dropdown-menu-end p-3">
									<li>
										<a href="javascript:void(0);" className="dropdown-item rounded-1">Monthly</a>
									</li>
									<li>
										<a href="javascript:void(0);" className="dropdown-item rounded-1">Yearly</a>
									</li>
								</ul>
							</div>
							<div className="dropdown me-3">
								<a href="javascript:void(0);" className="dropdown-toggle btn btn-white d-inline-flex align-items-center" data-bs-toggle="dropdown">
									Select Status
								</a>
								<ul className="dropdown-menu  dropdown-menu-end p-3">
									<li>
										<a href="javascript:void(0);" className="dropdown-item rounded-1">Active</a>
									</li>
									<li>
										<a href="javascript:void(0);" className="dropdown-item rounded-1">Inactive</a>
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
						<div className="custom-datatable-filter table-responsive">
							<table className="table datatable">
								<thead className="thead-light">
									<tr>
										<th className="no-sort">
											<div className="form-check form-check-md">
												<input className="form-check-input" type="checkbox" id="select-all" />
											</div>
										</th>
										<th>Plan Name</th>
										<th>Plan Type</th>
										<th>Total Subscribers</th>
										<th>Price</th>
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
											<h6 className="fw-medium"><a href="#">Basic</a></h6>
										</td>
										<td>Monthly</td>
										<td>56</td>
										<td>$50</td>
										<td>14 Jan 2024</td>
										<td>
											<span className="badge badge-success d-inline-flex align-items-center badge-sm">
												<i className="ti ti-point-filled me-1"></i>Active
											</span>
										</td>
										<td>
											<div className="action-icon d-inline-flex">
												<a href="#" className="me-2" data-bs-toggle="modal" data-bs-target="#edit_plans"><i className="ti ti-edit"></i></a>
												<a href="#" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash"></i></a>
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
											<h6 className="fw-medium"><a href="#">Advanced</a></h6>
										</td>
										<td>Monthly</td>
										<td>99</td>
										<td>$200</td>
										<td>21 Jan 2024</td>
										<td>
											<span className="badge badge-success d-inline-flex align-items-center badge-sm">
												<i className="ti ti-point-filled me-1"></i>Active
											</span>
										</td>
										<td>
											<div className="action-icon d-inline-flex">
												<a href="#" className="me-2" data-bs-toggle="modal" data-bs-target="#edit_plans"><i className="ti ti-edit"></i></a>
												<a href="#" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash"></i></a>
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
											<h6 className="fw-medium"><a href="#">Premium</a></h6>
										</td>
										<td>Monthly</td>
										<td>58</td>
										<td>$300</td>
										<td>10 Feb 2024</td>
										<td>
											<span className="badge badge-success d-inline-flex align-items-center badge-sm">
												<i className="ti ti-point-filled me-1"></i>Active
											</span>
										</td>
										<td>
											<div className="action-icon d-inline-flex">
												<a href="#" className="me-2" data-bs-toggle="modal" data-bs-target="#edit_plans"><i className="ti ti-edit"></i></a>
												<a href="#" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash"></i></a>
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
											<h6 className="fw-medium"><a href="#">Enterprise</a></h6>
										</td>
										<td>Monthly</td>
										<td>67</td>
										<td>$400</td>
										<td>18 Feb 2024</td>
										<td>
											<span className="badge badge-success d-inline-flex align-items-center badge-sm">
												<i className="ti ti-point-filled me-1"></i>Active
											</span>
										</td>
										<td>
											<div className="action-icon d-inline-flex">
												<a href="#" className="me-2" data-bs-toggle="modal" data-bs-target="#edit_plans"><i className="ti ti-edit"></i></a>
												<a href="#" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash"></i></a>
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
											<h6 className="fw-medium"><a href="#">Basic</a></h6>
										</td>
										<td>Yearly</td>
										<td>78</td>
										<td>$600</td>
										<td>15 Mar 2024</td>
										<td>
											<span className="badge badge-success d-inline-flex align-items-center badge-sm">
												<i className="ti ti-point-filled me-1"></i>Active
											</span>
										</td>
										<td>
											<div className="action-icon d-inline-flex">
												<a href="#" className="me-2" data-bs-toggle="modal" data-bs-target="#edit_plans"><i className="ti ti-edit"></i></a>
												<a href="#" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash"></i></a>
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
											<h6 className="fw-medium"><a href="#">Advanced</a></h6>
										</td>
										<td>Yearly</td>
										<td>99</td>
										<td>$2400</td>
										<td>26 Mar 2024</td>
										<td>
											<span className="badge badge-success d-inline-flex align-items-center badge-sm">
												<i className="ti ti-point-filled me-1"></i>Active
											</span>
										</td>
										<td>
											<div className="action-icon d-inline-flex">
												<a href="#" className="me-2" data-bs-toggle="modal" data-bs-target="#edit_plans"><i className="ti ti-edit"></i></a>
												<a href="#" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash"></i></a>
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
											<h6 className="fw-medium"><a href="#">Premium</a></h6>
										</td>
										<td>Yearly</td>
										<td>48</td>
										<td>$3600</td>
										<td>05 Apr 2024</td>
										<td>
											<span className="badge badge-success d-inline-flex align-items-center badge-sm">
												<i className="ti ti-point-filled me-1"></i>Active
											</span>
										</td>
										<td>
											<div className="action-icon d-inline-flex">
												<a href="#" className="me-2" data-bs-toggle="modal" data-bs-target="#edit_plans"><i className="ti ti-edit"></i></a>
												<a href="#" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash"></i></a>
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
											<h6 className="fw-medium"><a href="#">Enterprise</a></h6>
										</td>
										<td>Yearly</td>
										<td>17</td>
										<td>$4800</td>
										<td>16 Apr 2024</td>
										<td>
											<span className="badge badge-success d-inline-flex align-items-center badge-sm">
												<i className="ti ti-point-filled me-1"></i>Active
											</span>
										</td>
										<td>
											<div className="action-icon d-inline-flex">
												<a href="#" className="me-2" data-bs-toggle="modal" data-bs-target="#edit_plans"><i className="ti ti-edit"></i></a>
												<a href="#" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash"></i></a>
											</div>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>

			</div>

			

		<div className="modal fade" id="add_plans">
			<div className="modal-dialog modal-dialog-centered modal-lg">
				<div className="modal-content">
					<div className="modal-header">
						<h4 className="modal-title">Add New Plan</h4>
						<button type="button" className="btn-close custom-btn-close" data-bs-dismiss="modal" aria-label="Close">
							<i className="ti ti-x"></i>
						</button>
					</div>
					<form action="packages.php">
						<div className="modal-body pb-0">
							<div className="row">
								<div className="col-md-12">
									<div className="d-flex align-items-center flex-wrap row-gap-3 bg-light w-100 rounded p-3 mb-4">
										<div className="d-flex align-items-center justify-content-center avatar avatar-xxl rounded-circle border border-dashed me-2 flex-shrink-0 text-dark frames">
											<img src="assets/img/profiles/avatar-30.jpg" alt="img" className="rounded-circle" />
										</div>
										<div className="profile-upload">
											<div className="mb-2">
												<h6 className="mb-1">Upload Profile Image</h6>
												<p className="fs-12">Image should be below 4 mb</p>
											</div>
											<div className="profile-uploader d-flex align-items-center">
												<div className="drag-upload-btn btn btn-sm btn-primary me-2">
													Upload
													<input type="file" className="form-control image-sign" multiple="" />
												</div>
												<a href="javascript:void(0);" className="btn btn-light btn-sm">Cancel</a>
											</div>

										</div>
									</div>
								</div>
								<div className="col-md-6">
									<div className="mb-3 ">
										<label className="form-label">Plan Name<span className="text-danger"> *</span></label>
										<select className="select">
											<option>Select</option>
											<option>Advanced</option>
											<option>Basic</option>
											<option>Enterprise</option>
										</select>
									</div>
								</div>
								<div className="col-md-6">
									<div className="mb-3 ">
										<label className="form-label">Plan Type<span className="text-danger"> *</span></label>
										<select className="select">
											<option>Select</option>
											<option>Monthly</option>
											<option>Yearly</option>
										</select>
									</div>
								</div>
								<div className="col-md-6">
									<div className="mb-3 ">
										<label className="form-label">Plan Position<span className="text-danger"> *</span></label>
										<select className="select">
											<option>Select</option>
											<option>1</option>
											<option>2</option>
											<option>3</option>
										</select>
									</div>
								</div>
								<div className="col-md-6">
									<div className="mb-3 ">
										<label className="form-label">Plan Currency<span className="text-danger"> *</span></label>
										<select className="select">
											<option>Select</option>
											<option>USD</option>
											<option>EURO</option>
										</select>
									</div>
								</div>
								<div className="col-md-6">
									<div className="mb-3">
										<div className="d-flex justify-content-between">
											<label className="form-label">Plan Currency<span className="text-danger"> *</span></label>
											<span className="text-primary"><i className="fa-solid fa-circle-exclamation me-2"></i>Set 0 for free</span>
										</div>
										<select className="select">
											<option>Select</option>
											<option>Fixed</option>
											<option>Percentage</option>
										</select>
									</div>
								</div>
								<div className="col-md-3">
									<div className="mb-3 ">
										<label className="form-label">Discount Type<span className="text-danger"> *</span></label>
										<div className="pass-group">
											<select className="select">
												<option>Select</option>
												<option>Fixed</option>
												<option>Percentage</option>
											</select>
										</div>
									</div>
								</div>
								<div className="col-md-3">
									<div className="mb-3 ">
										<label className="form-label">Discount<span className="text-danger"> *</span></label>
										<div className="pass-group">
											<input type="text" className="form-control" />
										</div>
									</div>
								</div>
								<div className="col-lg-3">
									<div className="mb-3">
										<label className="form-label">Limitations Invoices</label>
										<input type="text" className="form-control" />
									</div>
								</div>
								<div className="col-lg-3">
									<div className="mb-3">
										<label className="form-label">Max Customers</label>
										<input type="text" className="form-control" />
									</div>
								</div>
								<div className="col-lg-3">
									<div className="mb-3">
										<label className="form-label">Product</label>
										<input type="text" className="form-control" />
									</div>
								</div>
								<div className="col-lg-3">
									<div className="mb-3">
										<label className="form-label">Supplier</label>
										<input type="text" className="form-control" />
									</div>
								</div>
								<div className="col-lg-12">
									<div className="d-flex align-items-center justify-content-between mb-3">
										<h6>Plan Modules</h6>
										<div className="form-check d-flex align-items-center">
											<label className="form-check-label mt-0 text-dark fw-medium">
												<input className="form-check-input" type="checkbox" />
												Select All
											</label>
										</div>
									</div>
								</div>
								<div className="row">
									<div className="col-lg-3 col-sm-6">
										<div className="form-check d-flex align-items-center mb-3">
											<label className="form-check-label mt-0 text-dark fw-medium">
												<input className="form-check-input" type="checkbox" />
												Employees
											</label>
										</div>
									</div>
									<div className="col-lg-3 col-sm-6">
										<div className="form-check d-flex align-items-center mb-3">
											<label className="form-check-label mt-0 text-dark fw-medium">
												<input className="form-check-input" type="checkbox" />
												Invoices
											</label>
										</div>
									</div>
									<div className="col-lg-3 col-sm-6">
										<div className="form-check d-flex align-items-center mb-3">
											<label className="form-check-label mt-0 text-dark fw-medium">
												<input className="form-check-input" type="checkbox" />
												Reports
											</label>
										</div>
									</div>
									<div className="col-lg-3 col-sm-6">
										<div className="form-check d-flex align-items-center mb-3">
											<label className="form-check-label mt-0 text-dark fw-medium">
												<input className="form-check-input" type="checkbox" />
												Contacts
											</label>
										</div>
									</div>
									<div className="col-lg-3 col-sm-6">
										<div className="form-check d-flex align-items-center mb-3">
											<label className="form-check-label mt-0 text-dark fw-medium">
												<input className="form-check-input" type="checkbox" />
												Clients
											</label>
										</div>
									</div>
									<div className="col-lg-3 col-sm-6">
										<div className="form-check d-flex align-items-center mb-3">
											<label className="form-check-label mt-0 text-dark fw-medium">
												<input className="form-check-input" type="checkbox" />
												Estimates
											</label>
										</div>
									</div>
									<div className="col-lg-3 col-sm-6">
										<div className="form-check d-flex align-items-center mb-3">
											<label className="form-check-label mt-0 text-dark fw-medium">
												<input className="form-check-input" type="checkbox" />
												Goals
											</label>
										</div>
									</div>
									<div className="col-lg-3 col-sm-6">
										<div className="form-check d-flex align-items-center mb-3">
											<label className="form-check-label mt-0 text-dark fw-medium">
												<input className="form-check-input" type="checkbox" />
												Deals
											</label>
										</div>
									</div>
									<div className="col-lg-3 col-sm-6">
										<div className="form-check d-flex align-items-center mb-3">
											<label className="form-check-label mt-0 text-dark fw-medium">
												<input className="form-check-input" type="checkbox" />
												Projects
											</label>
										</div>
									</div>
									<div className="col-lg-3 col-sm-6">
										<div className="form-check d-flex align-items-center mb-3">
											<label className="form-check-label mt-0 text-dark fw-medium">
												<input className="form-check-input" type="checkbox" />
												Payments
											</label>
										</div>
									</div>
									<div className="col-lg-3 col-sm-6">
										<div className="form-check d-flex align-items-center mb-3">
											<label className="form-check-label mt-0 text-dark fw-medium">
												<input className="form-check-input" type="checkbox" />
												Assets
											</label>
										</div>
									</div>
									<div className="col-lg-3 col-sm-6">
										<div className="form-check d-flex align-items-center mb-3">
											<label className="form-check-label mt-0 text-dark fw-medium">
												<input className="form-check-input" type="checkbox" />
												Leads
											</label>
										</div>
									</div>
									<div className="col-lg-3 col-sm-6">
										<div className="form-check d-flex align-items-center mb-3">
											<label className="form-check-label mt-0 text-dark fw-medium">
												<input className="form-check-input" type="checkbox" />
												Tickets
											</label>
										</div>
									</div>
									<div className="col-lg-3 col-sm-6">
										<div className="form-check d-flex align-items-center mb-3">
											<label className="form-check-label mt-0 text-dark fw-medium">
												<input className="form-check-input" type="checkbox" />
												Taxes
											</label>
										</div>
									</div>
									<div className="col-lg-3 col-sm-6">
										<div className="form-check d-flex align-items-center mb-3">
											<label className="form-check-label mt-0 text-dark fw-medium">
												<input className="form-check-input" type="checkbox" />
												Activities
											</label>
										</div>
									</div>
									<div className="col-lg-3 col-sm-6">
										<div className="form-check d-flex align-items-center mb-3">
											<label className="form-check-label mt-0 text-dark fw-medium">
												<input className="form-check-input" type="checkbox" />
												Pipelines
											</label>
										</div>
									</div>
									<div className="col-md-6">
										<div className="d-flex align-items-center mb-3">
											<label className="form-check-label mt-0 me-2 text-dark fw-medium">
												Access Trial
											</label>
											<div className="form-check form-switch me-2">
												<input className="form-check-input me-2" type="checkbox" role="switch" />
											</div>
										</div>
									</div>
								</div>
								<div className="row align-items-center gx-3">
									<div className="col-md-4">
										<div className="d-flex align-items-center mb-3">
											<div className="flex-fill">
												<label className="form-label">Trial Days</label>
												<input type="text" className="form-control" />
											</div>

										</div>
									</div>
									<div className="col-md-3">
										<div className="d-block align-items-center ms-3">
											<label className="form-check-label mt-0 me-2 text-dark">
												Is Recommended
											</label>
											<div className="form-check form-switch me-2">
												<input className="form-check-input me-2" type="checkbox" role="switch" />
											</div>
										</div>
									</div>
									<div className="col-md-5">
										<div className="mb-3 ">
											<label className="form-label">Status<span className="text-danger"> *</span></label>
											<select className="select">
												<option>Select</option>
												<option>Active</option>
												<option>Inactive</option>
											</select>
										</div>
									</div>
								</div>
								<div className="col-md-12">
									<div className="mb-3">
										<label className="form-label">Description</label>
										<textarea className="form-control"></textarea>
									</div>
								</div>
							</div>
						</div>
						<div className="modal-footer">
							<button type="button" className="btn btn-light me-2" data-bs-dismiss="modal">Cancel</button>
							<button type="submit" className="btn btn-primary">Add Plan</button>
						</div>
					</form>
				</div>
			</div>
		</div>

		<div className="modal fade" id="edit_plans">
			<div className="modal-dialog modal-dialog-centered modal-lg">
				<div className="modal-content">
					<div className="modal-header">
						<h4 className="modal-title">Edit Plan</h4>
						<button type="button" className="btn-close custom-btn-close" data-bs-dismiss="modal" aria-label="Close">
							<i className="ti ti-x"></i>
						</button>
					</div>
					<form action="packages.php">
						<div className="modal-body pb-0">
							<div className="row">
								<div className="col-md-12">
									<div className="d-flex align-items-center flex-wrap row-gap-3 bg-light w-100 rounded p-3 mb-4">
										<div className="d-flex align-items-center justify-content-center avatar avatar-xxl rounded-circle border border-dashed me-2 flex-shrink-0 text-dark frames">
											<img src="assets/img/profiles/avatar-30.jpg" alt="img" className="rounded-circle" />
										</div>
										<div className="profile-upload">
											<div className="mb-2">
												<h6 className="mb-1">Upload Profile Image</h6>
												<p className="fs-12">Image should be below 4 mb</p>
											</div>
											<div className="profile-uploader d-flex align-items-center">
												<div className="drag-upload-btn btn btn-sm btn-primary me-2">
													Upload
													<input type="file" className="form-control image-sign" multiple="" />
												</div>
												<a href="javascript:void(0);" className="btn btn-light btn-sm">Cancel</a>
											</div>

										</div>
									</div>
								</div>
								<div className="col-md-6">
									<div className="mb-3 ">
										<label className="form-label">Plan Name<span className="text-danger"> *</span></label>
										<select className="select">
											<option>Select</option>
											<option>Advanced</option>
											<option>Basic</option>
											<option>Enterprise</option>
										</select>
									</div>
								</div>
								<div className="col-md-6">
									<div className="mb-3 ">
										<label className="form-label">Plan Type<span className="text-danger"> *</span></label>
										<select className="select">
											<option>Select</option>
											<option>Monthly</option>
											<option>Yearly</option>
										</select>
									</div>
								</div>
								<div className="col-md-6">
									<div className="mb-3 ">
										<label className="form-label">Plan Position<span className="text-danger"> *</span></label>
										<select className="select">
											<option>Select</option>
											<option>1</option>
											<option>2</option>
											<option>3</option>
										</select>
									</div>
								</div>
								<div className="col-md-6">
									<div className="mb-3 ">
										<label className="form-label">Plan Currency<span className="text-danger"> *</span></label>
										<select className="select">
											<option>Select</option>
											<option>USD</option>
											<option>EURO</option>
										</select>
									</div>
								</div>
								<div className="col-md-6">
									<div className="mb-3">
										<div className="d-flex justify-content-between">
											<label className="form-label">Plan Currency<span className="text-danger"> *</span></label>
											<span className="text-primary"><i className="fa-solid fa-circle-exclamation me-2"></i>Set 0 for free</span>
										</div>
										<select className="select">
											<option>Select</option>
											<option>Fixed</option>
											<option>Percentage</option>
										</select>
									</div>
								</div>
								<div className="col-md-3">
									<div className="mb-3 ">
										<label className="form-label">Discount Type<span className="text-danger"> *</span></label>
										<div className="pass-group">
											<select className="select">
												<option>Select</option>
												<option>Fixed</option>
												<option>Percentage</option>
											</select>
										</div>
									</div>
								</div>
								<div className="col-md-3">
									<div className="mb-3 ">
										<label className="form-label">Discount<span className="text-danger"> *</span></label>
										<div className="pass-group">
											<input type="text" className="form-control" />
										</div>
									</div>
								</div>
								<div className="col-lg-3">
									<div className="mb-3">
										<label className="form-label">Limitations Invoices</label>
										<input type="text" className="form-control" />
									</div>
								</div>
								<div className="col-lg-3">
									<div className="mb-3">
										<label className="form-label">Max Customers</label>
										<input type="text" className="form-control" />
									</div>
								</div>
								<div className="col-lg-3">
									<div className="mb-3">
										<label className="form-label">Product</label>
										<input type="text" className="form-control" />
									</div>
								</div>
								<div className="col-lg-3">
									<div className="mb-3">
										<label className="form-label">Supplier</label>
										<input type="text" className="form-control" />
									</div>
								</div>
								<div className="col-lg-12">
									<div className="d-flex align-items-center justify-content-between mb-3">
										<h6>Plan Modules</h6>
										<div className="form-check d-flex align-items-center">
											<label className="form-check-label mt-0 text-dark fw-medium">
												<input className="form-check-input" type="checkbox" />
												Select All
											</label>
										</div>
									</div>
								</div>
								<div className="row">
									<div className="col-lg-3 col-sm-6">
										<div className="form-check d-flex align-items-center mb-3">
											<label className="form-check-label mt-0 text-dark fw-medium">
												<input className="form-check-input" type="checkbox" />
												Employees
											</label>
										</div>
									</div>
									<div className="col-lg-3 col-sm-6">
										<div className="form-check d-flex align-items-center mb-3">
											<label className="form-check-label mt-0 text-dark fw-medium">
												<input className="form-check-input" type="checkbox" />
												Invoices
											</label>
										</div>
									</div>
									<div className="col-lg-3 col-sm-6">
										<div className="form-check d-flex align-items-center mb-3">
											<label className="form-check-label mt-0 text-dark fw-medium">
												<input className="form-check-input" type="checkbox" />
												Reports
											</label>
										</div>
									</div>
									<div className="col-lg-3 col-sm-6">
										<div className="form-check d-flex align-items-center mb-3">
											<label className="form-check-label mt-0 text-dark fw-medium">
												<input className="form-check-input" type="checkbox" />
												Contacts
											</label>
										</div>
									</div>
									<div className="col-lg-3 col-sm-6">
										<div className="form-check d-flex align-items-center mb-3">
											<label className="form-check-label mt-0 text-dark fw-medium">
												<input className="form-check-input" type="checkbox" />
												Clients
											</label>
										</div>
									</div>
									<div className="col-lg-3 col-sm-6">
										<div className="form-check d-flex align-items-center mb-3">
											<label className="form-check-label mt-0 text-dark fw-medium">
												<input className="form-check-input" type="checkbox" />
												Estimates
											</label>
										</div>
									</div>
									<div className="col-lg-3 col-sm-6">
										<div className="form-check d-flex align-items-center mb-3">
											<label className="form-check-label mt-0 text-dark fw-medium">
												<input className="form-check-input" type="checkbox" />
												Goals
											</label>
										</div>
									</div>
									<div className="col-lg-3 col-sm-6">
										<div className="form-check d-flex align-items-center mb-3">
											<label className="form-check-label mt-0 text-dark fw-medium">
												<input className="form-check-input" type="checkbox" />
												Deals
											</label>
										</div>
									</div>
									<div className="col-lg-3 col-sm-6">
										<div className="form-check d-flex align-items-center mb-3">
											<label className="form-check-label mt-0 text-dark fw-medium">
												<input className="form-check-input" type="checkbox" />
												Projects
											</label>
										</div>
									</div>
									<div className="col-lg-3 col-sm-6">
										<div className="form-check d-flex align-items-center mb-3">
											<label className="form-check-label mt-0 text-dark fw-medium">
												<input className="form-check-input" type="checkbox" />
												Payments
											</label>
										</div>
									</div>
									<div className="col-lg-3 col-sm-6">
										<div className="form-check d-flex align-items-center mb-3">
											<label className="form-check-label mt-0 text-dark fw-medium">
												<input className="form-check-input" type="checkbox" />
												Assets
											</label>
										</div>
									</div>
									<div className="col-lg-3 col-sm-6">
										<div className="form-check d-flex align-items-center mb-3">
											<label className="form-check-label mt-0 text-dark fw-medium">
												<input className="form-check-input" type="checkbox" />
												Leads
											</label>
										</div>
									</div>
									<div className="col-lg-3 col-sm-6">
										<div className="form-check d-flex align-items-center mb-3">
											<label className="form-check-label mt-0 text-dark fw-medium">
												<input className="form-check-input" type="checkbox" />
												Tickets
											</label>
										</div>
									</div>
									<div className="col-lg-3 col-sm-6">
										<div className="form-check d-flex align-items-center mb-3">
											<label className="form-check-label mt-0 text-dark fw-medium">
												<input className="form-check-input" type="checkbox" />
												Taxes
											</label>
										</div>
									</div>
									<div className="col-lg-3 col-sm-6">
										<div className="form-check d-flex align-items-center mb-3">
											<label className="form-check-label mt-0 text-dark fw-medium">
												<input className="form-check-input" type="checkbox" />
												Activities
											</label>
										</div>
									</div>
									<div className="col-lg-3 col-sm-6">
										<div className="form-check d-flex align-items-center mb-3">
											<label className="form-check-label mt-0 text-dark fw-medium">
												<input className="form-check-input" type="checkbox" />
												Pipelines
											</label>
										</div>
									</div>
									<div className="col-md-6">
										<div className="d-flex align-items-center mb-3">
											<label className="form-check-label mt-0 me-2 text-dark fw-medium">
												Access Trial
											</label>
											<div className="form-check form-switch me-2">
												<input className="form-check-input me-2" type="checkbox" role="switch" />
											</div>
										</div>
									</div>
								</div>
								<div className="row align-items-center gx-3">
									<div className="col-md-4">
										<div className="d-flex align-items-center mb-3">
											<div className="flex-fill">
												<label className="form-label">Trial Days</label>
												<input type="text" className="form-control" />
											</div>

										</div>
									</div>
									<div className="col-md-3">
										<div className="d-block align-items-center ms-3">
											<label className="form-check-label mt-0 me-2  text-dark">
												Is Recommended
											</label>
											<div className="form-check form-switch me-2">
												<input className="form-check-input me-2" type="checkbox" role="switch" />
											</div>
										</div>
									</div>
									<div className="col-md-5">
										<div className="mb-3 ">
											<label className="form-label">Status<span className="text-danger"> *</span></label>
											<select className="select">
												<option>Select</option>
												<option>Active</option>
												<option>Inactive</option>
											</select>
										</div>
									</div>
								</div>
								<div className="col-md-12">
									<div className="mb-3">
										<label className="form-label">Description</label>
										<textarea className="form-control"></textarea>
									</div>
								</div>
							</div>
						</div>
						<div className="modal-footer">
							<button type="button" className="btn btn-light me-2" data-bs-dismiss="modal">Cancel</button>
							<button type="submit" className="btn btn-primary">Save Changes</button>
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
						<p className="mb-3">You want to delete all the marked items, this cant be undone once you delete.</p>
						<div className="d-flex justify-content-center">
							<a href="javascript:void(0);" className="btn btn-light me-3" data-bs-dismiss="modal">Cancel</a>
							<a href="packages.php" className="btn btn-danger">Yes, Delete</a>
						</div>
					</div>
				</div>
			</div>
		</div>
		
        </>
    );
};

export default PackagesPage;
