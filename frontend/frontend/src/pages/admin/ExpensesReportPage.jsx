import React from "react";
import { Link } from "react-router-dom";

const ExpensesReportPage = () => {
  return (
    <>
      <div className="content">
        {/* Breadcrumb */}
				<div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
					<div className="my-auto mb-2">
						<h2 className="mb-1">Expense Report</h2>
						<nav>
							<ol className="breadcrumb mb-0">
								<li className="breadcrumb-item">
									<Link to="/dashboard"><i className="ti ti-smart-home"></i></Link>
								</li>
								<li className="breadcrumb-item">
									HR
								</li>
								<li className="breadcrumb-item active" aria-current="page">Expense Report</li>
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
					<div className="col-xl-6 d-flex">
						<div className="row flex-fill">
							<div className="col-md-6 d-flex">
								<div className="card flex-fill position-relative">
									<span className="position-absolute start-0 bottom-0">
										<img src="/assets/img/reports-img/total-expense.svg" alt="img" className="img-fluid" />
									</span>
									<div className="card-body">
										<div className="d-flex align-items-center justify-content-between mb-2">
											<div>
												<span className="fs-14 fw-normal text-truncate mb-1">Total Expense</span>
												<h5>$45,221</h5>
											</div>
											<Link to="#" className="avatar avatar-md avatar-rounded bg-transparent-primary border border-primary">
												<span className="text-primary"><i className="ti ti-brand-shopee"></i></span>
											</Link>
										</div>
										<p className="fs-12 fw-normal d-flex align-items-center text-truncate">
											<span className="text-success fs-12 d-flex align-items-center me-1">
												<i className="ti ti-arrow-wave-right-up me-1"></i>+20.01%
											</span> from last week
										</p>
									</div>
								</div>
							</div>
							<div className="col-md-6 d-flex">
								<div className="card flex-fill position-relative">
									<span className="position-absolute start-0 bottom-0">
										<img src="/assets/img/reports-img/approved-expense.svg" alt="img" className="img-fluid" />
									</span>
									<div className="card-body">
										<div className="d-flex align-items-center justify-content-between mb-2">
											<div>
												<span className="fs-14 fw-normal text-truncate mb-1">Approved Expense</span>
												<h5>$45,221</h5>
											</div>
											<Link to="#" className="avatar avatar-md avatar-rounded bg-transparent-success border border-success">
												<span className="text-success"><i className="ti ti-brand-shopee"></i></span>
											</Link>
										</div>
										<p className="fs-12 fw-normal d-flex align-items-center text-truncate">
											<span className="text-success fs-12 d-flex align-items-center me-1">
												<i className="ti ti-arrow-wave-right-up me-1"></i>+17.01%
											</span> from last week
										</p>
									</div>
								</div>
							</div>
							<div className="col-md-6 d-flex">
								<div className="card flex-fill position-relative">
									<span className="position-absolute start-0 bottom-0">
										<img src="/assets/img/reports-img/pending-expense.svg" alt="img" className="img-fluid" />
									</span>
									<div className="card-body">
										<div className="d-flex align-items-center justify-content-between mb-2">
											<div>
												<span className="fs-14 fw-normal text-truncate mb-1">Net Pay</span>
												<h5>$45,221,45</h5>
											</div>
											<Link to="#" className="avatar avatar-md avatar-rounded bg-transparent-skyblue border border-skyblue">
												<span className="text-skyblue"><i className="ti ti-brand-shopee"></i></span>
											</Link>
										</div>
										<p className="fs-12 fw-normal d-flex align-items-center text-truncate">
											<span className="text-success fs-12 d-flex align-items-center me-1">
												<i className="ti ti-arrow-wave-right-up me-1"></i>+10.13%
											</span> from last week
										</p>
									</div>
								</div>
							</div>
							<div className="col-md-6 d-flex">
								<div className="card flex-fill position-relative">
									<span className="position-absolute start-0 bottom-0">
										<img src="/assets/img/reports-img/reject-expense.svg" alt="img" className="img-fluid" />
									</span>
									<div className="card-body">
										<div className="d-flex align-items-center justify-content-between mb-2">
											<div>
												<span className="fs-14 fw-normal text-truncate mb-1">Allowances</span>
												<h5>$45,221,45</h5>
											</div>
											<Link to="#" className="avatar avatar-md avatar-rounded bg-transparent-danger border border-danger">
												<span className="text-danger"><i className="ti ti-brand-shopee"></i></span>
											</Link>
										</div>
										<p className="fs-12 fw-normal d-flex align-items-center text-truncate">
											<span className="text-danger fs-12 d-flex align-items-center me-1">
												<i className="ti ti-arrow-wave-right-up me-1"></i>-10.17%
											</span> from last week
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
					{/* /Total Exponses */}

					{/* Total Exponses */}
					<div className="col-xl-6 d-flex">
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
								<div id="expense-analysis"></div>
							</div>
						</div>
					</div>
					{/* /Total Exponses */}

				</div>
				<div className="card">
					<div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
						<h5>Expense List</h5>
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
										<Link to="#" className="dropdown-item rounded-1">$3800</Link>
									</li>
									<li>
										<Link to="#" className="dropdown-item rounded-1">$4500</Link>
									</li>
									<li>
										<Link to="#" className="dropdown-item rounded-1">$3400</Link>
									</li>
								</ul>
							</div>
							<div className="dropdown me-3">
								<Link to="#" className="dropdown-toggle btn btn-white d-inline-flex align-items-center" data-bs-toggle="dropdown">
									Payment Type
								</Link>
								<ul className="dropdown-menu  dropdown-menu-end p-3">
									<li>
										<Link to="#" className="dropdown-item rounded-1">Cash</Link>
									</li>
									<li>
										<Link to="#" className="dropdown-item rounded-1">Cheque</Link>
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
										<th>Expense Name</th>
										<th>Date</th>
										<th>Payment Method</th>
										<th>Amount</th>
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
											<h6 className="fs-14 fw-medium">Online Course</h6>
										</td>
										<td>14 Jan 2024</td>
										<td>Cash</td>
										<td>
											$3000
										</td>
									</tr>
									<tr>
										<td>
											<div className="form-check form-check-md">
												<input className="form-check-input" type="checkbox" />
											</div>
										</td>
										<td>
											<h6 className="fs-14 fw-medium">Travel</h6>
										</td>
										<td>20 Feb 2024</td>
										<td>Cheque</td>
										<td>
											$2800
										</td>
									</tr>
									<tr>
										<td>
											<div className="form-check form-check-md">
												<input className="form-check-input" type="checkbox" />
											</div>
										</td>
										<td>
											<h6 className="fs-14 fw-medium">Office Supplies</h6>
										</td>
										<td>15 Mar 2024</td>
										<td>Cash</td>
										<td>
											$3300
										</td>
									</tr>
									<tr>
										<td>
											<div className="form-check form-check-md">
												<input className="form-check-input" type="checkbox" />
											</div>
										</td>
										<td>
											<h6 className="fs-14 fw-medium">Welcome Kit</h6>
										</td>
										<td>12 Apr 2024</td>
										<td>Cheque</td>
										<td>
											$3600
										</td>
									</tr>
									<tr>
										<td>
											<div className="form-check form-check-md">
												<input className="form-check-input" type="checkbox" />
											</div>
										</td>
										<td>
											<h6 className="fs-14 fw-medium">Equipment</h6>
										</td>
										<td>20 Apr 2024</td>
										<td>Cheque</td>
										<td>
											$2000
										</td>
									</tr>
									<tr>
										<td>
											<div className="form-check form-check-md">
												<input className="form-check-input" type="checkbox" />
											</div>
										</td>
										<td>
											<h6 className="fs-14 fw-medium">Miscellaneous</h6>
										</td>
										<td>06 Jul 2024</td>
										<td>Cash</td>
										<td>
											$3400
										</td>
									</tr>
									<tr>
										<td>
											<div className="form-check form-check-md">
												<input className="form-check-input" type="checkbox" />
											</div>
										</td>
										<td>
											<h6 className="fs-14 fw-medium">Payroll</h6>
										</td>
										<td>02 Sep 2024</td>
										<td>Cheque</td>
										<td>
											$4000
										</td>
									</tr>
									<tr>
										<td>
											<div className="form-check form-check-md">
												<input className="form-check-input" type="checkbox" />
											</div>
										</td>
										<td>
											<h6 className="fs-14 fw-medium">Cafeteria</h6>
										</td>
										<td>15 Nov 2024</td>
										<td>Cash</td>
										<td>
											$4500
										</td>
									</tr>
									<tr>
										<td>
											<div className="form-check form-check-md">
												<input className="form-check-input" type="checkbox" />
											</div>
										</td>
										<td>
											<h6 className="fs-14 fw-medium">Cleaning Supplies</h6>
										</td>
										<td>10 Dec 2024</td>
										<td>Cheque</td>
										<td>
											$3800
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

export default ExpensesReportPage;
