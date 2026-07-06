import React from 'react';
import { Link } from 'react-router-dom';

const PurchaseTransactionPage = () => {
    return (
        <>
            <div className="content">

				{/* Breadcrumb */}
				<div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
					<div className="my-auto mb-2">
						<h2 className="mb-1">Purchase Transaction</h2>
						<nav>
							<ol className="breadcrumb mb-0">
								<li className="breadcrumb-item">
									<a href="dashboard.php"><i className="ti ti-smart-home"></i></a>
								</li>
								<li className="breadcrumb-item">
									Superadmin
								</li>
								<li className="breadcrumb-item active" aria-current="page">Purchase Transaction List</li>
							</ol>
						</nav>
					</div>
					<div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
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
						<div className="head-icons">
							<a href="javascript:void(0);" className="" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Collapse" id="collapse-header">
								<i className="ti ti-chevrons-up"></i>
							</a>
						</div>
					</div>
				</div>
				{/* /Breadcrumb */}

				<div className="card">
					<div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
						<h5>Transaction List</h5>
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
									Payment Method
								</a>
								<ul className="dropdown-menu  dropdown-menu-end p-3">
									<li>
										<a href="javascript:void(0);" className="dropdown-item rounded-1">Credit Card</a>
									</li>
									<li>
										<a href="javascript:void(0);" className="dropdown-item rounded-1">Paypal</a>
									</li>
									<li>
										<a href="javascript:void(0);" className="dropdown-item rounded-1">Debit Card</a>
									</li>
								</ul>
							</div>
							<div className="dropdown me-3">
								<a href="javascript:void(0);" className="dropdown-toggle btn btn-white d-inline-flex align-items-center" data-bs-toggle="dropdown">
									Select Status
								</a>
								<ul className="dropdown-menu  dropdown-menu-end p-3">
									<li>
										<a href="javascript:void(0);" className="dropdown-item rounded-1">Paid</a>
									</li>
									<li>
										<a href="javascript:void(0);" className="dropdown-item rounded-1">Unpaid</a>
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
										<th>Invoice ID</th>
										<th>Customer</th>
										<th>Email</th>
										<th>Created Date</th>
										<th>Amount</th>
										<th>Payment Method</th>
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
										<td><a href="javascript:void(0);" className="link-default">INV001</a></td>
										<td>
											<div className="d-flex align-items-center file-name-icon">
												<a href="#" className="avatar avatar-md border rounded-circle">
													<img src="assets/img/company/company-01.svg" className="img-fluid" alt="img" />
												</a>
												<div className="ms-2">
													<h6 className="fw-medium"><a href="#">BrightWave Innovations</a></h6>
												</div>
											</div>
										</td>
										<td><a href="cdn-cgi/l/email-protection" className="__cf_email__" data-cfemail="066b6f656e67636a46637e676b766a632865696b">[email&#160;protected]</a></td>
										<td>12 Sep 2024</td>
										<td>$200</td>
										<td>Credit Card</td>
										<td>
											<span className="badge badge-success d-flex align-items-center badge-xs">
												<i className="ti ti-point-filled me-1"></i>Paid
											</span>
										</td>
										<td>
											<div className="action-icon d-inline-flex">
												<a href="#" className="me-2" data-bs-toggle="modal" data-bs-target="#view_invoice"><i className="ti ti-file-invoice"></i></a>
												<a href="#" className="me-2"><i className="ti ti-download"></i></a>
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
										<td><a href="javascript:void(0);" className="link-default">INV002</a></td>
										<td>
											<div className="d-flex align-items-center file-name-icon">
												<a href="#" className="avatar avatar-md border rounded-circle">
													<img src="assets/img/company/company-02.svg" className="img-fluid" alt="img" />
												</a>
												<div className="ms-2">
													<h6 className="fw-medium"><a href="#">Stellar Dynamics</a></h6>
												</div>
											</div>
										</td>
										<td><a href="cdn-cgi/l/email-protection" className="__cf_email__" data-cfemail="cab9a5baa2a3af8aafb2aba7baa6afe4a9a5a7">[email&#160;protected]</a></td>
										<td>24 Oct 2024</td>
										<td>$600</td>
										<td>Paypal</td>
										<td>
											<span className="badge badge-success d-flex align-items-center badge-xs">
												<i className="ti ti-point-filled me-1"></i>Paid
											</span>
										</td>
										<td>
											<div className="action-icon d-inline-flex">
												<a href="#" className="me-2" data-bs-toggle="modal" data-bs-target="#view_invoice"><i className="ti ti-file-invoice"></i></a>
												<a href="#" className="me-2"><i className="ti ti-download"></i></a>
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
										<td><a href="javascript:void(0);" className="link-default">INV003</a></td>
										<td>
											<div className="d-flex align-items-center file-name-icon">
												<a href="#" className="avatar avatar-md border rounded-circle">
													<img src="assets/img/company/company-03.svg" className="img-fluid" alt="img" />
												</a>
												<div className="ms-2">
													<h6 className="fw-medium"><a href="#">Quantum Nexus</a></h6>
												</div>
											</div>
										</td>
										<td><a href="cdn-cgi/l/email-protection" className="__cf_email__" data-cfemail="91f2f0fcf4e3feffd1f4e9f0fce1fdf4bff2fefc">[email&#160;protected]</a></td>
										<td>18 Feb 2024</td>
										<td>$200</td>
										<td>Debit Card</td>
										<td>
											<span className="badge badge-success d-flex align-items-center badge-xs">
												<i className="ti ti-point-filled me-1"></i>Paid
											</span>
										</td>
										<td>
											<div className="action-icon d-inline-flex">
												<a href="#" className="me-2" data-bs-toggle="modal" data-bs-target="#view_invoice"><i className="ti ti-file-invoice"></i></a>
												<a href="#" className="me-2"><i className="ti ti-download"></i></a>
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
										<td><a href="javascript:void(0);" className="link-default">INV004</a></td>
										<td>
											<div className="d-flex align-items-center file-name-icon">
												<a href="#" className="avatar avatar-md border rounded-circle">
													<img src="assets/img/company/company-04.svg" className="img-fluid" alt="img" />
												</a>
												<div className="ms-2">
													<h6 className="fw-medium"><a href="#">EcoVision Enterprises</a></h6>
												</div>
											</div>
										</td>
										<td><a href="cdn-cgi/l/email-protection" className="__cf_email__" data-cfemail="01656e736872416479606c716d642f626e6c">[email&#160;protected]</a></td>
										<td>17 Oct 2024</td>
										<td>$200</td>
										<td>Paypal</td>
										<td>
											<span className="badge badge-success d-flex align-items-center badge-xs">
												<i className="ti ti-point-filled me-1"></i>Paid
											</span>
										</td>
										<td>
											<div className="action-icon d-inline-flex">
												<a href="#" className="me-2" data-bs-toggle="modal" data-bs-target="#view_invoice"><i className="ti ti-file-invoice"></i></a>
												<a href="#" className="me-2"><i className="ti ti-download"></i></a>
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
										<td><a href="javascript:void(0);" className="link-default">INV005</a></td>
										<td>
											<div className="d-flex align-items-center file-name-icon">
												<a href="#" className="avatar avatar-md border rounded-circle">
													<img src="assets/img/company/company-05.svg" className="img-fluid" alt="img" />
												</a>
												<div className="ms-2">
													<h6 className="fw-medium"><a href="#">Aurora Technologies</a></h6>
												</div>
											</div>
										</td>
										<td><a href="cdn-cgi/l/email-protection" className="__cf_email__" data-cfemail="52263a3d3f332112372a333f223e377c313d3f">[email&#160;protected]</a></td>
										<td>20 Jul 2024</td>
										<td>$400</td>
										<td>Credit Card</td>
										<td>
											<span className="badge badge-success d-flex align-items-center badge-xs">
												<i className="ti ti-point-filled me-1"></i>Paid
											</span>
										</td>
										<td>
											<div className="action-icon d-inline-flex">
												<a href="#" className="me-2" data-bs-toggle="modal" data-bs-target="#view_invoice"><i className="ti ti-file-invoice"></i></a>
												<a href="#" className="me-2"><i className="ti ti-download"></i></a>
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
										<td><a href="javascript:void(0);" className="link-default">INV006</a></td>
										<td>
											<div className="d-flex align-items-center file-name-icon">
												<a href="#" className="avatar avatar-md border rounded-circle">
													<img src="assets/img/company/company-06.svg" className="img-fluid" alt="img" />
												</a>
												<div className="ms-2">
													<h6 className="fw-medium"><a href="#">BlueSky Ventures</a></h6>
												</div>
											</div>
										</td>
										<td><a href="cdn-cgi/l/email-protection" className="__cf_email__" data-cfemail="6c070d1804000909022c09140d011c0009420f0301">[email&#160;protected]</a></td>
										<td>10 Apr 2024</td>
										<td>$200</td>
										<td>Paypal</td>
										<td>
											<span className="badge badge-success d-flex align-items-center badge-xs">
												<i className="ti ti-point-filled me-1"></i>Paid
											</span>
										</td>
										<td>
											<div className="action-icon d-inline-flex">
												<a href="#" className="me-2" data-bs-toggle="modal" data-bs-target="#view_invoice"><i className="ti ti-file-invoice"></i></a>
												<a href="#" className="me-2"><i className="ti ti-download"></i></a>
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
										<td><a href="javascript:void(0);" className="link-default">INV007</a></td>
										<td>
											<div className="d-flex align-items-center file-name-icon">
												<a href="#" className="avatar avatar-md border rounded-circle">
													<img src="assets/img/company/company-07.svg" className="img-fluid" alt="img" />
												</a>
												<div className="ms-2">
													<h6 className="fw-medium"><a href="#">TerraFusion Energy</a></h6>
												</div>
											</div>
										</td>
										<td><a href="cdn-cgi/l/email-protection" className="__cf_email__" data-cfemail="b1d3c3c4d2d4f1d4c9d0dcc1ddd49fd2dedc">[email&#160;protected]</a></td>
										<td>29 Aug 2024</td>
										<td>$4800</td>
										<td>Credit Card</td>
										<td>
											<span className="badge badge-success d-flex align-items-center badge-xs">
												<i className="ti ti-point-filled me-1"></i>Paid
											</span>
										</td>
										<td>
											<div className="action-icon d-inline-flex">
												<a href="#" className="me-2" data-bs-toggle="modal" data-bs-target="#view_invoice"><i className="ti ti-file-invoice"></i></a>
												<a href="#" className="me-2"><i className="ti ti-download"></i></a>
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
										<td><a href="javascript:void(0);" className="link-default">INV008</a></td>
										<td>
											<div className="d-flex align-items-center file-name-icon">
												<a href="#" className="avatar avatar-md border rounded-circle">
													<img src="assets/img/company/company-08.svg" className="img-fluid" alt="img" />
												</a>
												<div className="ms-2">
													<h6 className="fw-medium"><a href="#">UrbanPulse Design</a></h6>
												</div>
											</div>
										</td>
										<td><a href="cdn-cgi/l/email-protection" className="__cf_email__" data-cfemail="01647275646d6d64416479606c716d642f626e6c">[email&#160;protected]</a></td>
										<td>22 Feb 2024</td>
										<td>$50</td>
										<td>Credit Card</td>
										<td>
											<span className="badge badge-danger d-flex align-items-center badge-xs">
												<i className="ti ti-point-filled me-1"></i>Unpaid
											</span>
										</td>
										<td>
											<div className="action-icon d-inline-flex">
												<a href="#" className="me-2" data-bs-toggle="modal" data-bs-target="#view_invoice"><i className="ti ti-file-invoice"></i></a>
												<a href="#" className="me-2"><i className="ti ti-download"></i></a>
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
										<td><a href="javascript:void(0);" className="link-default">INV009</a></td>
										<td>
											<div className="d-flex align-items-center file-name-icon">
												<a href="#" className="avatar avatar-md border rounded-circle">
													<img src="assets/img/company/company-09.svg" className="img-fluid" alt="img" />
												</a>
												<div className="ms-2">
													<h6 className="fw-medium"><a href="#">Nimbus Networks</a></h6>
												</div>
											</div>
										</td>
										<td><a href="cdn-cgi/l/email-protection" className="__cf_email__" data-cfemail="93e0e7f6e3fbf6fdd3f6ebf2fee3fff6bdf0fcfe">[email&#160;protected]</a></td>
										<td>03 Nov 2024</td>
										<td>$600</td>
										<td>Paypal</td>
										<td>
											<span className="badge badge-success d-flex align-items-center badge-xs">
												<i className="ti ti-point-filled me-1"></i>Paid
											</span>
										</td>
										<td>
											<div className="action-icon d-inline-flex">
												<a href="#" className="me-2" data-bs-toggle="modal" data-bs-target="#view_invoice"><i className="ti ti-file-invoice"></i></a>
												<a href="#" className="me-2"><i className="ti ti-download"></i></a>
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
										<td><a href="javascript:void(0);" className="link-default">INV010</a></td>
										<td>
											<div className="d-flex align-items-center file-name-icon">
												<a href="#" className="avatar avatar-md border rounded-circle">
													<img src="assets/img/company/company-10.svg" className="img-fluid" alt="img" />
												</a>
												<div className="ms-2">
													<h6 className="fw-medium"><a href="#">Epicurean Delights</a></h6>
												</div>
											</div>
										</td>
										<td><a href="cdn-cgi/l/email-protection" className="__cf_email__" data-cfemail="ff9e91989a939ebf9a879e928f939ad19c9092">[email&#160;protected]</a></td>
										<td>17 Dec 2024</td>
										<td>$200</td>
										<td>Credit Card</td>
										<td>
											<span className="badge badge-success d-flex align-items-center badge-xs">
												<i className="ti ti-point-filled me-1"></i>Paid
											</span>
										</td>
										<td>
											<div className="action-icon d-inline-flex">
												<a href="#" className="me-2" data-bs-toggle="modal" data-bs-target="#view_invoice"><i className="ti ti-file-invoice"></i></a>
												<a href="#" className="me-2"><i className="ti ti-download"></i></a>
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

			

	

		
		<div className="modal fade" id="view_invoice">
			<div className="modal-dialog modal-dialog-centered modal-lg">
				<div className="modal-content">
					<div className="modal-body p-5">
						<div className="row justify-content-between align-items-center mb-3">
							<div className="col-md-6">
								<div className="mb-4">
									<img src="assets/img/logo.svg" className="img-fluid" alt="logo" />
								</div>
							</div>
							<div className="col-md-6">
								<div className=" text-end mb-3">
									<h5 className="text-dark mb-1">Invoice</h5>
									<p className="mb-1 fw-normal"><i className="ti ti-file-invoice me-1"></i>INV0287</p>
									<p className="mb-1 fw-normal"><i className="ti ti-calendar me-1"></i>Issue date : 12 Sep 2024 </p>
									<p className="fw-normal"><i className="ti ti-calendar me-1"></i>Due date : 12 Oct 2024 </p>
								</div>
							</div>
						</div>
						<div className="row mb-3 d-flex justify-content-between">
							<div className="col-md-7">
								<p className="text-dark mb-2 fw-medium fs-16">Invoice From :</p>
								<div>
									<p className="mb-1">infitoolz</p>
									<p className="mb-1">367 Hillcrest Lane, Irvine, California,
										United States</p>
									<p className="mb-1"><a href="cdn-cgi/l/email-protection" className="__cf_email__" data-cfemail="62110f0310160a1022071a030f120e074c010d0f">[email&#160;protected]</a></p>
								</div>
							</div>
							<div className="col-md-5">
								<p className="text-dark mb-2 fw-medium fs-16 text-end">Invoice To :</p>
								<div>
									<p className="mb-1 text-end">BrightWave Innovations</p>
									<p className="mb-1 text-end">367 Hillcrest Lane, Irvine, California,
										United States</p>
									<p className="mb-1 text-end"><a href="cdn-cgi/l/email-protection" className="__cf_email__" data-cfemail="4b262228232a2e270b2e332a263b272e65282426">[email&#160;protected]</a></p>
								</div>
							</div>
						</div>
						<div className="mb-4">
							<div className="table-responsive mb-3">
								<table className="table">
									<thead className="thead-light">
										<tr>
											<th>Plan</th>
											<th className="text-end">Billing Cycle</th>
											<th className="text-end">Created Date</th>
											<th className="text-end">Expiring On</th>
											<th className="text-end">Amount</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td>Advanced (Monthly)</td>
											<td className="text-end">30 Days</td>
											<td className="text-end">12 Sep 2024</td>
											<td className="text-end">12 Oct 2024</td>
											<td className="text-end">$200</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
						<div className="row mb-3 d-flex justify-content-between">
							<div className="col-md-4">
								<div>
									<h6 className="mb-4">Payment info:</h6>
									<p className="mb-0">Credit Card - 123***********789</p>
									<div className="d-flex justify-content-between align-items-center mb-2 pe-3">
										<p className="mb-0">Amount</p>
										<p className="text-dark fw-medium mb-2">$200.00</p>
									</div>
								</div>
							</div>
							<div className="col-md-4">
								<div className="d-flex justify-content-between align-items-center pe-3">
									<p className="text-dark fw-medium mb-0">Sub Total</p>
									<p className="mb-2">$200.00</p>
								</div>
								<div className="d-flex justify-content-between align-items-center pe-3">
									<p className="text-dark fw-medium mb-0">Tax </p>
									<p className="mb-2">$0.00</p>
								</div>
								<div className="d-flex justify-content-between align-items-center pe-3">
									<p className="text-dark fw-medium mb-0">Total</p>
									<p className="text-dark fw-medium mb-2">$200.00</p>
								</div>
							</div>
						</div>
						<div className="card border mb-0">
							<div className="card-body">
								<p className="text-dark fw-medium mb-2">Terms & Conditions:</p>
								<p className="fs-12 fw-normal d-flex align-items-baseline mb-2"><i className="ti ti-point-filled text-primary me-1"></i>All payments must be made according to the agreed schedule. Late payments may incur additional fees.</p>
								<p className="fs-12 fw-normal d-flex align-items-baseline"><i className="ti ti-point-filled text-primary me-1"></i>We are not liable for any indirect, incidental, or consequential damages, including loss of profits, revenue, or data.</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		{/* /Invoices */}

		{/* Delete Modal */}
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
							<a href="purchase-transaction.php" className="btn btn-danger">Yes, Delete</a>
						</div>
					</div>
				</div>
			</div>
		</div>
		{/* /Delete Modal */}
        </>
    );
};

export default PurchaseTransactionPage;
