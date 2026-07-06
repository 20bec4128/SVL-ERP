
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const KanbanViewPage = () => {
    return (
        <React.Fragment>
            <div className="content">
				
				<div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
					<div className="my-auto mb-2">
						<h2 className="mb-1">Kanban View</h2>
						<nav>
							<ol className="breadcrumb mb-0">
								<li className="breadcrumb-item">
									<a href="dashboard.php"><i className="ti ti-smart-home"></i></a>
								</li>
								<li className="breadcrumb-item">
									Application
								</li>
								<li className="breadcrumb-item active" aria-current="page">Kanban View</li>
							</ol>
						</nav>
					</div>
					<div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
						<div className="dropdown">
							<a href="#" className="dropdown-toggle btn btn-white d-inline-flex align-items-center" data-bs-toggle="dropdown">
								<i className="ti ti-file-export me-2"></i>
								Export
							</a>
							<ul className="dropdown-menu  dropdown-menu-end p-3">
								<li>
									<a href="#" className="dropdown-item rounded-1"><i className="ti ti-file-type-pdf me-1"></i>Export as PDF</a>
								</li>
								<li>
									<a href="#" className="dropdown-item rounded-1"><i className="ti ti-file-type-xls me-1"></i>Export as Excel </a>
								</li>
							</ul>
						</div>
						<div className="ms-2 mb-0 head-icons">
							<a href="#" className="" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Collapse" id="collapse-header">
								<i className="ti ti-chevrons-up"></i>
							</a>
						</div>
					</div>
				</div>
				<div className="card">
					<div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
						<h4>Projects</h4>
						<div className="d-flex align-items-center flex-wrap row-gap-3">
							<div className="avatar-list-stacked avatar-group-sm me-3">
								<span className="avatar avatar-rounded">
									<img className="border border-white" src="assets/img/profiles/avatar-19.jpg" alt="img" />
								</span>
								<span className="avatar avatar-rounded">
									<img className="border border-white" src="assets/img/profiles/avatar-29.jpg" alt="img" />
								</span>
								<span className="avatar avatar-rounded">
									<img className="border border-white" src="assets/img/profiles/avatar-16.jpg" alt="img" />
								</span>
								<span className="avatar avatar-rounded bg-primary fs-12">
									1+
								</span>
							</div>
							<div className="d-flex align-items-center me-3">
								<p className="mb-0 me-3 pe-3 border-end fs-14">Total Task : <span className="text-dark"> 55 </span></p>
								<p className="mb-0 me-3 pe-3 border-end fs-14">Pending : <span className="text-dark"> 15 </span></p>
								<p className="mb-0 fs-14">Completed : <span className="text-dark"> 40 </span></p>
							</div>
							<div className="input-icon-start position-relative">
								<span className="input-icon-addon">
									<i className="ti ti-search"></i>
								</span>
								<input type="text" className="form-control" placeholder="Search Project" />
							</div>
						</div>
					</div>
					<div className="card-body">
						<div className="row">
							<div className="col-lg-4">
								<div className="d-flex align-items-center flex-wrap row-gap-3 mb-3">
									<h6 className="me-2">Priority</h6>
									<ul className="nav nav-pills border d-inline-flex p-1 rounded bg-light todo-tabs" id="pills-tab" role="tablist">
										<li className="nav-item" role="presentation">
											<button className="nav-link btn btn-sm btn-icon py-3 d-flex align-items-center justify-content-center w-auto active" data-bs-toggle="pill" data-bs-target="#pills-home" type="button" role="tab" aria-selected="true">All</button>
										</li>
										<li className="nav-item" role="presentation">
											<button className="nav-link btn btn-sm btn-icon py-3 d-flex align-items-center justify-content-center w-auto" data-bs-toggle="pill" data-bs-target="#pills-contact" type="button" role="tab" aria-selected="false">High</button>
										</li>
										<li className="nav-item" role="presentation">
											<button className="nav-link btn btn-sm btn-icon py-3 d-flex align-items-center justify-content-center w-auto" data-bs-toggle="pill" data-bs-target="#pills-medium" type="button" role="tab" aria-selected="false">Medium</button>
										</li>
										<li className="nav-item" role="presentation">
											<button className="nav-link btn btn-sm btn-icon py-3 d-flex align-items-center justify-content-center w-auto" data-bs-toggle="pill" data-bs-target="#pills-low" type="button" role="tab" aria-selected="false">Low</button>
										</li>
									</ul>
								</div>
							</div>
							<div className="col-lg-8">
								<div className="d-flex align-items-center justify-content-lg-end flex-wrap row-gap-3 mb-3">
									<div className="dropdown me-2">
										<a href="#" className="dropdown-toggle btn btn-white d-inline-flex align-items-center" data-bs-toggle="dropdown">
											Clients
										</a>
										<ul className="dropdown-menu  dropdown-menu-end p-3">
											<li>
												<a href="#" className="dropdown-item rounded-1">Clients</a>
											</li>
											<li>
												<a href="#" className="dropdown-item rounded-1">Sophie</a>
											</li>
											<li>
												<a href="#" className="dropdown-item rounded-1">Cameron</a>
											</li>
											<li>
												<a href="#" className="dropdown-item rounded-1">Doris</a>
											</li>
										</ul>
									</div>
									<div className="input-icon w-120 position-relative me-2">
										<span className="input-icon-addon">
											<i className="ti ti-calendar text-gray-9"></i>
										</span>
										<input type="text" className="form-control datetimepicker" placeholder="Created Date" />
									</div>
									<div className="input-icon w-120 position-relative me-2">
										<span className="input-icon-addon">
											<i className="ti ti-calendar text-gray-9"></i>
										</span>
										<input type="text" className="form-control datetimepicker" placeholder="Due Date" />
									</div>
									<div className="dropdown me-2">
										<a href="#" className="dropdown-toggle btn btn-white d-inline-flex align-items-center" data-bs-toggle="dropdown">
											Select Status
										</a>
										<ul className="dropdown-menu  dropdown-menu-end p-3">
											<li>
												<a href="#" className="dropdown-item rounded-1">Inprogress</a>
											</li>
											<li>
												<a href="#" className="dropdown-item rounded-1">On-hold</a>
											</li>
											<li>
												<a href="#" className="dropdown-item rounded-1">Completed</a>
											</li>
										</ul>
									</div>
									<div className="d-flex align-items-center border p-2 rounded">
										<span className="d-inline-flex me-2">Sort By : </span>
										<div className="dropdown">
											<a href="#" className="dropdown-toggle btn btn-white d-inline-flex align-items-center border-0 bg-transparent p-0 text-dark" data-bs-toggle="dropdown">
												Created Date
											</a>
											<ul className="dropdown-menu  dropdown-menu-end p-3">
												<li>
													<a href="#" className="dropdown-item rounded-1">Created Date</a>
												</li>
												<li>
													<a href="#" className="dropdown-item rounded-1">Last 7 Days</a>
												</li>
												<li>
													<a href="#" className="dropdown-item rounded-1">Due Date</a>
												</li>
											</ul>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div className="tab-content" id="pills-tabContent">
							<div className="tab-pane fade show active" id="pills-home" role="tabpanel">
								<div className="d-flex align-items-start overflow-auto project-status pb-4">
									<div className="p-3 rounded bg-transparent-secondary w-100 me-3">
										<div className="bg-white p-2 rounded mb-2">
											<div className="d-flex align-items-center justify-content-between">
												<div className="d-flex align-items-center">
													<span className="bg-soft-pink p-1 d-flex rounded-circle me-2"><span className="bg-pink rounded-circle d-block p-1"></span></span>
													<h5 className="me-2">New</h5>
													<span className="badge bg-light rounded-pill">02</span>
												</div>
												<div className="dropdown">
													<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
														<i className="ti ti-dots-vertical"></i>
													</a>
													<ul className="dropdown-menu dropdown-menu-end p-3">
														<li>
															<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
														</li>
														<li>
															<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
														</li>
													</ul>
												</div>
											</div>
										</div>
										<div className="kanban-drag-wrap">
											<div>
												<div className="card kanban-card mb-2">
													<div className="card-body">
														<div className="d-flex align-items-center justify-content-between mb-3">
															<div className="d-flex align-items-center">
																<span className="badge bg-outline-dark me-2">Web Layout</span>
																<span className="badge bg-success badge-xs d-flex align-items-center justify-content-center"><i className="fas fa-circle fs-6 me-1"></i>Low</span>
															</div>
															<div className="dropdown">
																<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
																	<i className="ti ti-dots-vertical"></i>
																</a>
																<ul className="dropdown-menu dropdown-menu-end p-3">
																	<li>
																		<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
																	</li>
																	<li>
																		<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
																	</li>
																</ul>
															</div>
														</div>
														<div className="d-flex align-items-center mb-2">
															<span className="avatar avatar-xs rounded-circle bg-warning me-2">
																<img src="assets/img/icons/kanban-arrow.svg" className="w-auto h-auto" alt="Img" />
															</span>
															<h6 className="d-flex align-items-center">Project Title <span className="fs-12 ms-2 text-gray">PRJ-154</span></h6>
														</div>
														<div className="d-flex align-items-center border-bottom mb-3 pb-3">
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Budget</span>
																<p className="fs-12 text-dark">$24,000</p>
															</div>
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Tasks</span>
																<p className="fs-12 text-dark">12/15</p>
															</div>
															<div className="">
																<span className="fw-medium fs-12 d-block mb-1">Due on</span>
																<p className="fs-12 text-dark">15 Apr 2024</p>
															</div>
														</div>
														<div className="d-flex align-items-center justify-content-between">
															<div className="avatar-list-stacked avatar-group-sm me-3">
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-19.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-29.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-16.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-01.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-02.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-03.jpg" alt="img" />
																</span>
																<a href="#" className="avatar avatar-rounded bg-primary fs-12 text-white">
																	1+
																</a>
															</div>
															<div className="d-flex align-items-center">
																<a href="#" className="d-flex align-items-center text-dark me-2"><i className="ti ti-message-circle text-gray me-1"></i>14</a>
																<a href="#" className="d-flex align-items-center text-dark"><i className="ti ti-paperclip text-gray me-1"></i>14</a>
															</div>
														</div>
													</div>
												</div>
											</div>
											<div>
												<div className="card kanban-card mb-2">
													<div className="card-body">
														<div className="d-flex align-items-center justify-content-between mb-3">
															<div className="d-flex align-items-center">
																<span className="badge bg-outline-dark me-2">Web Layout</span>
																<span className="badge bg-purple badge-xs d-flex align-items-center justify-content-center"><i className="fas fa-circle fs-6 me-1"></i>High</span>
															</div>
															<div className="dropdown">
																<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
																	<i className="ti ti-dots-vertical"></i>
																</a>
																<ul className="dropdown-menu dropdown-menu-end p-3">
																	<li>
																		<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
																	</li>
																	<li>
																		<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
																	</li>
																</ul>
															</div>
														</div>
														<div className="d-flex align-items-center mb-2">
															<span className="avatar avatar-xs rounded-circle bg-warning me-2">
																<img src="assets/img/icons/kanban-arrow.svg" className="w-auto h-auto" alt="Img" />
															</span>
															<h6 className="d-flex align-items-center">Project Title <span className="fs-12 ms-2 text-gray">PRJ-155</span></h6>
														</div>
														<div className="d-flex align-items-center border-bottom mb-3 pb-3">
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Budget</span>
																<p className="fs-12 text-dark">$24,000</p>
															</div>
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Tasks</span>
																<p className="fs-12 text-dark">12/15</p>
															</div>
															<div className="">
																<span className="fw-medium fs-12 d-block mb-1">Due on</span>
																<p className="fs-12 text-dark">15 Apr 2024</p>
															</div>
														</div>
														<div className="d-flex align-items-center justify-content-between">
															<div className="avatar-list-stacked avatar-group-sm me-3">
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-19.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-29.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-16.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-01.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-02.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-03.jpg" alt="img" />
																</span>
																<a href="#" className="avatar avatar-rounded bg-primary fs-12 text-white">
																	1+
																</a>
															</div>
															<div className="d-flex align-items-center">
																<a href="#" className="d-flex align-items-center text-dark me-2"><i className="ti ti-message-circle text-gray me-1"></i>14</a>
																<a href="#" className="d-flex align-items-center text-dark"><i className="ti ti-paperclip text-gray me-1"></i>14</a>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
										<div className="pt-2">
											<a href="#" className="btn btn-white border border-dashed d-flex align-items-center justify-content-center">
												<i className="ti ti-plus me-2"></i>
												New Project
											</a>
										</div>
									</div>
									<div className="p-3 rounded bg-transparent-secondary w-100 me-3">
										<div className="bg-white p-2 rounded mb-2">
											<div className="d-flex align-items-center justify-content-between">
												<div className="d-flex align-items-center">
													<span className="bg-soft-skyblue p-1 d-flex rounded-circle me-2"><span className="bg-skyblue rounded-circle d-block p-1"></span></span>
													<h5 className="me-2">Inprogress</h5>
													<span className="badge bg-light rounded-pill">13</span>
												</div>
												<div className="dropdown">
													<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
														<i className="ti ti-dots-vertical"></i>
													</a>
													<ul className="dropdown-menu dropdown-menu-end p-3">
														<li>
															<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
														</li>
														<li>
															<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
														</li>
													</ul>
												</div>
											</div>
										</div>
										<div className="kanban-drag-wrap">
											<div>
												<div className="card kanban-card mb-2">
													<div className="card-body">
														<div className="d-flex align-items-center justify-content-between mb-3">
															<div className="d-flex align-items-center">
																<span className="badge bg-outline-dark me-2">Web Layout</span>
																<span className="badge bg-purple badge-xs d-flex align-items-center justify-content-center"><i className="fas fa-circle fs-6 me-1"></i>High</span>
															</div>
															<div className="dropdown">
																<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
																	<i className="ti ti-dots-vertical"></i>
																</a>
																<ul className="dropdown-menu dropdown-menu-end p-3">
																	<li>
																		<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
																	</li>
																	<li>
																		<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
																	</li>
																</ul>
															</div>
														</div>
														<div className="d-flex align-items-center mb-2">
															<span className="avatar avatar-xs rounded-circle bg-warning me-2">
																<img src="assets/img/icons/kanban-arrow.svg" className="w-auto h-auto" alt="Img" />
															</span>
															<h6 className="d-flex align-items-center">Project Title <span className="fs-12 ms-2 text-gray">PRJ-156</span></h6>
														</div>
														<div className="d-flex align-items-center border-bottom mb-3 pb-3">
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Budget</span>
																<p className="fs-12 text-dark">$24,000</p>
															</div>
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Tasks</span>
																<p className="fs-12 text-dark">12/15</p>
															</div>
															<div className="">
																<span className="fw-medium fs-12 d-block mb-1">Due on</span>
																<p className="fs-12 text-dark">15 Apr 2024</p>
															</div>
														</div>
														<div className="d-flex align-items-center justify-content-between">
															<div className="avatar-list-stacked avatar-group-sm me-3">
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-19.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-29.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-16.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-01.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-02.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-03.jpg" alt="img" />
																</span>
																<a href="#" className="avatar avatar-rounded bg-primary fs-12 text-white">
																	1+
																</a>
															</div>
															<div className="d-flex align-items-center">
																<a href="#" className="d-flex align-items-center text-dark me-2"><i className="ti ti-message-circle text-gray me-1"></i>14</a>
																<a href="#" className="d-flex align-items-center text-dark"><i className="ti ti-paperclip text-gray me-1"></i>14</a>
															</div>
														</div>
													</div>
												</div>
											</div>
											<div>
												<div className="card kanban-card mb-2">
													<div className="card-body">
														<div className="d-flex align-items-center justify-content-between mb-3">
															<div className="d-flex align-items-center">
																<span className="badge bg-outline-dark me-2">Web Layout</span>
																<span className="badge bg-warning badge-xs d-flex align-items-center justify-content-center"><i className="fas fa-circle fs-6 me-1"></i>Medium</span>
															</div>
															<div className="dropdown">
																<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
																	<i className="ti ti-dots-vertical"></i>
																</a>
																<ul className="dropdown-menu dropdown-menu-end p-3">
																	<li>
																		<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
																	</li>
																	<li>
																		<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
																	</li>
																</ul>
															</div>
														</div>
														<div className="d-flex align-items-center mb-2">
															<span className="avatar avatar-xs rounded-circle bg-warning me-2">
																<img src="assets/img/icons/kanban-arrow.svg" className="w-auto h-auto" alt="Img" />
															</span>
															<h6 className="d-flex align-items-center">Project Title <span className="fs-12 ms-2 text-gray">PRJ-157</span></h6>
														</div>
														<div className="d-flex align-items-center border-bottom mb-3 pb-3">
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Budget</span>
																<p className="fs-12 text-dark">$24,000</p>
															</div>
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Tasks</span>
																<p className="fs-12 text-dark">12/15</p>
															</div>
															<div className="">
																<span className="fw-medium fs-12 d-block mb-1">Due on</span>
																<p className="fs-12 text-dark">15 Apr 2024</p>
															</div>
														</div>
														<div className="d-flex align-items-center justify-content-between">
															<div className="avatar-list-stacked avatar-group-sm me-3">
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-19.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-29.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-16.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-01.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-02.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-03.jpg" alt="img" />
																</span>
																<a href="#" className="avatar avatar-rounded bg-primary fs-12 text-white">
																	1+
																</a>
															</div>
															<div className="d-flex align-items-center">
																<a href="#" className="d-flex align-items-center text-dark me-2"><i className="ti ti-message-circle text-gray me-1"></i>14</a>
																<a href="#" className="d-flex align-items-center text-dark"><i className="ti ti-paperclip text-gray me-1"></i>14</a>
															</div>
														</div>
													</div>
												</div>
											</div>
											<div>
												<div className="card kanban-card mb-2">
													<div className="card-body">
														<div className="d-flex align-items-center justify-content-between mb-3">
															<div className="d-flex align-items-center">
																<span className="badge bg-outline-dark me-2">Web Layout</span>
																<span className="badge bg-purple badge-xs d-flex align-items-center justify-content-center"><i className="fas fa-circle fs-6 me-1"></i>High</span>
															</div>
															<div className="dropdown">
																<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
																	<i className="ti ti-dots-vertical"></i>
																</a>
																<ul className="dropdown-menu dropdown-menu-end p-3">
																	<li>
																		<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
																	</li>
																	<li>
																		<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
																	</li>
																</ul>
															</div>
														</div>
														<div className="d-flex align-items-center mb-2">
															<span className="avatar avatar-xs rounded-circle bg-warning me-2">
																<img src="assets/img/icons/kanban-arrow.svg" className="w-auto h-auto" alt="Img" />
															</span>
															<h6 className="d-flex align-items-center">Project Title <span className="fs-12 ms-2 text-gray">PRJ-158</span></h6>
														</div>
														<div className="d-flex align-items-center border-bottom mb-3 pb-3">
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Budget</span>
																<p className="fs-12 text-dark">$24,000</p>
															</div>
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Tasks</span>
																<p className="fs-12 text-dark">12/15</p>
															</div>
															<div className="">
																<span className="fw-medium fs-12 d-block mb-1">Due on</span>
																<p className="fs-12 text-dark">15 Apr 2024</p>
															</div>
														</div>
														<div className="d-flex align-items-center justify-content-between">
															<div className="avatar-list-stacked avatar-group-sm me-3">
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-19.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-29.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-16.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-01.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-02.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-03.jpg" alt="img" />
																</span>
																<a href="#" className="avatar avatar-rounded bg-primary fs-12 text-white">
																	1+
																</a>
															</div>
															<div className="d-flex align-items-center">
																<a href="#" className="d-flex align-items-center text-dark me-2"><i className="ti ti-message-circle text-gray me-1"></i>14</a>
																<a href="#" className="d-flex align-items-center text-dark"><i className="ti ti-paperclip text-gray me-1"></i>14</a>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
										<div className="pt-2">
											<a href="#" className="btn btn-white border border-dashed d-flex align-items-center justify-content-center">
												<i className="ti ti-plus me-2"></i>
												New Project
											</a>
										</div>
									</div>
									<div className="p-3 rounded bg-transparent-secondary w-100 me-3">
										<div className="bg-white p-2 rounded mb-2">
											<div className="d-flex align-items-center justify-content-between">
												<div className="d-flex align-items-center">
													<span className="bg-soft-danger p-1 d-flex rounded-circle me-2"><span className="bg-danger rounded-circle d-block p-1"></span></span>
													<h5 className="me-2">On-hold</h5>
													<span className="badge bg-light rounded-pill">04</span>
												</div>
												<div className="dropdown">
													<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
														<i className="ti ti-dots-vertical"></i>
													</a>
													<ul className="dropdown-menu dropdown-menu-end p-3">
														<li>
															<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
														</li>
														<li>
															<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
														</li>
													</ul>
												</div>
											</div>
										</div>
										<div className="kanban-drag-wrap">
											<div>
												<div className="card kanban-card mb-2">
													<div className="card-body">
														<div className="d-flex align-items-center justify-content-between mb-3">
															<div className="d-flex align-items-center">
																<span className="badge bg-outline-dark me-2">Web Layout</span>
																<span className="badge bg-success badge-xs d-flex align-items-center justify-content-center"><i className="fas fa-circle fs-6 me-1"></i>Low</span>
															</div>
															<div className="dropdown">
																<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
																	<i className="ti ti-dots-vertical"></i>
																</a>
																<ul className="dropdown-menu dropdown-menu-end p-3">
																	<li>
																		<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
																	</li>
																	<li>
																		<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
																	</li>
																</ul>
															</div>
														</div>
														<div className="d-flex align-items-center mb-2">
															<span className="avatar avatar-xs rounded-circle bg-warning me-2">
																<img src="assets/img/icons/kanban-arrow.svg" className="w-auto h-auto" alt="Img" />
															</span>
															<h6 className="d-flex align-items-center">Project Title <span className="fs-12 ms-2 text-gray">PRJ-159</span></h6>
														</div>
														<div className="d-flex align-items-center border-bottom mb-3 pb-3">
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Budget</span>
																<p className="fs-12 text-dark">$24,000</p>
															</div>
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Tasks</span>
																<p className="fs-12 text-dark">12/15</p>
															</div>
															<div className="">
																<span className="fw-medium fs-12 d-block mb-1">Due on</span>
																<p className="fs-12 text-dark">15 Apr 2024</p>
															</div>
														</div>
														<div className="d-flex align-items-center justify-content-between">
															<div className="avatar-list-stacked avatar-group-sm me-3">
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-19.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-29.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-16.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-01.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-02.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-03.jpg" alt="img" />
																</span>
																<a href="#" className="avatar avatar-rounded bg-primary fs-12 text-white">
																	1+
																</a>
															</div>
															<div className="d-flex align-items-center">
																<a href="#" className="d-flex align-items-center text-dark me-2"><i className="ti ti-message-circle text-gray me-1"></i>14</a>
																<a href="#" className="d-flex align-items-center text-dark"><i className="ti ti-paperclip text-gray me-1"></i>14</a>
															</div>
														</div>
													</div>
												</div>
											</div>
											<div>
												<div className="card kanban-card mb-2">
													<div className="card-body">
														<div className="d-flex align-items-center justify-content-between mb-3">
															<div className="d-flex align-items-center">
																<span className="badge bg-outline-dark me-2">Web Layout</span>
																<span className="badge bg-success badge-xs d-flex align-items-center justify-content-center"><i className="fas fa-circle fs-6 me-1"></i>Low</span>
															</div>
															<div className="dropdown">
																<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
																	<i className="ti ti-dots-vertical"></i>
																</a>
																<ul className="dropdown-menu dropdown-menu-end p-3">
																	<li>
																		<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
																	</li>
																	<li>
																		<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
																	</li>
																</ul>
															</div>
														</div>
														<div className="d-flex align-items-center mb-2">
															<span className="avatar avatar-xs rounded-circle bg-warning me-2">
																<img src="assets/img/icons/kanban-arrow.svg" className="w-auto h-auto" alt="Img" />
															</span>
															<h6 className="d-flex align-items-center">Project Title <span className="fs-12 ms-2 text-gray">PRJ-160</span></h6>
														</div>
														<div className="d-flex align-items-center border-bottom mb-3 pb-3">
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Budget</span>
																<p className="fs-12 text-dark">$24,000</p>
															</div>
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Tasks</span>
																<p className="fs-12 text-dark">12/15</p>
															</div>
															<div className="">
																<span className="fw-medium fs-12 d-block mb-1">Due on</span>
																<p className="fs-12 text-dark">15 Apr 2024</p>
															</div>
														</div>
														<div className="d-flex align-items-center justify-content-between">
															<div className="avatar-list-stacked avatar-group-sm me-3">
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-19.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-29.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-16.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-01.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-02.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-03.jpg" alt="img" />
																</span>
																<a href="#" className="avatar avatar-rounded bg-primary fs-12 text-white">
																	1+
																</a>
															</div>
															<div className="d-flex align-items-center">
																<a href="#" className="d-flex align-items-center text-dark me-2"><i className="ti ti-message-circle text-gray me-1"></i>14</a>
																<a href="#" className="d-flex align-items-center text-dark"><i className="ti ti-paperclip text-gray me-1"></i>14</a>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
										<div className="pt-2">
											<a href="#" className="btn btn-white border border-dashed d-flex align-items-center justify-content-center">
												<i className="ti ti-plus me-2"></i>
												New Project
											</a>
										</div>
									</div>
									<div className="p-3 rounded bg-transparent-secondary w-100">
										<div className="bg-white p-2 rounded mb-2">
											<div className="d-flex align-items-center justify-content-between">
												<div className="d-flex align-items-center">
													<span className="bg-soft-success p-1 d-flex rounded-circle me-2"><span className="bg-success rounded-circle d-block p-1"></span></span>
													<h5 className="me-2">Completed</h5>
													<span className="badge bg-light rounded-pill">10</span>
												</div>
												<div className="dropdown">
													<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
														<i className="ti ti-dots-vertical"></i>
													</a>
													<ul className="dropdown-menu dropdown-menu-end p-3">
														<li>
															<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
														</li>
														<li>
															<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
														</li>
													</ul>
												</div>
											</div>
										</div>
										<div className="kanban-drag-wrap">
											<div>
												<div className="card kanban-card mb-2">
													<div className="card-body">
														<div className="d-flex align-items-center justify-content-between mb-3">
															<div className="d-flex align-items-center">
																<span className="badge bg-outline-dark me-2">Web Layout</span>
																<span className="badge bg-warning badge-xs d-flex align-items-center justify-content-center"><i className="fas fa-circle fs-6 me-1"></i>Medium</span>
															</div>
															<div className="dropdown">
																<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
																	<i className="ti ti-dots-vertical"></i>
																</a>
																<ul className="dropdown-menu dropdown-menu-end p-3">
																	<li>
																		<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
																	</li>
																	<li>
																		<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
																	</li>
																</ul>
															</div>
														</div>
														<div className="d-flex align-items-center mb-2">
															<span className="avatar avatar-xs rounded-circle bg-warning me-2">
																<img src="assets/img/icons/kanban-arrow.svg" className="w-auto h-auto" alt="Img" />
															</span>
															<h6 className="d-flex align-items-center">Project Title <span className="fs-12 ms-2 text-gray">PRJ-161</span></h6>
														</div>
														<div className="d-flex align-items-center border-bottom mb-3 pb-3">
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Budget</span>
																<p className="fs-12 text-dark">$24,000</p>
															</div>
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Tasks</span>
																<p className="fs-12 text-dark">12/15</p>
															</div>
															<div className="">
																<span className="fw-medium fs-12 d-block mb-1">Due on</span>
																<p className="fs-12 text-dark">15 Apr 2024</p>
															</div>
														</div>
														<div className="d-flex align-items-center justify-content-between">
															<div className="avatar-list-stacked avatar-group-sm me-3">
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-19.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-29.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-16.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-01.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-02.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-03.jpg" alt="img" />
																</span>
																<a href="#" className="avatar avatar-rounded bg-primary fs-12 text-white">
																	1+
																</a>
															</div>
															<div className="d-flex align-items-center">
																<a href="#" className="d-flex align-items-center text-dark me-2"><i className="ti ti-message-circle text-gray me-1"></i>14</a>
																<a href="#" className="d-flex align-items-center text-dark"><i className="ti ti-paperclip text-gray me-1"></i>14</a>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
										<div className="pt-2">
											<a href="#" className="btn btn-white border border-dashed d-flex align-items-center justify-content-center">
												<i className="ti ti-plus me-2"></i>
												New Project
											</a>
										</div>
									</div>
								</div>
							</div>
							<div className="tab-pane fade" id="pills-contact" role="tabpanel">
								<div className="d-flex align-items-start overflow-auto project-status pb-4">
									<div className="p-3 rounded bg-transparent-secondary w-100 me-3">
										<div className="bg-white p-2 rounded mb-2">
											<div className="d-flex align-items-center justify-content-between">
												<div className="d-flex align-items-center">
													<span className="bg-soft-pink p-1 d-flex rounded-circle me-2"><span className="bg-pink rounded-circle d-block p-1"></span></span>
													<h5 className="me-2">New</h5>
													<span className="badge bg-light rounded-pill">02</span>
												</div>
												<div className="dropdown">
													<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
														<i className="ti ti-dots-vertical"></i>
													</a>
													<ul className="dropdown-menu dropdown-menu-end p-3">
														<li>
															<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
														</li>
														<li>
															<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
														</li>
													</ul>
												</div>
											</div>
										</div>
										<div className="kanban-drag-wrap">
											<div>
												<div className="card kanban-card mb-2">
													<div className="card-body">
														<div className="d-flex align-items-center justify-content-between mb-3">
															<div className="d-flex align-items-center">
																<span className="badge bg-outline-dark me-2">Web Layout</span>
																<span className="badge bg-purple badge-xs d-flex align-items-center justify-content-center"><i className="fas fa-circle fs-6 me-1"></i>High</span>
															</div>
															<div className="dropdown">
																<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
																	<i className="ti ti-dots-vertical"></i>
																</a>
																<ul className="dropdown-menu dropdown-menu-end p-3">
																	<li>
																		<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
																	</li>
																	<li>
																		<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
																	</li>
																</ul>
															</div>
														</div>
														<div className="d-flex align-items-center mb-2">
															<span className="avatar avatar-xs rounded-circle bg-warning me-2">
																<img src="assets/img/icons/kanban-arrow.svg" className="w-auto h-auto" alt="Img" />
															</span>
															<h6 className="d-flex align-items-center">Project Title <span className="fs-12 ms-2 text-gray">PRJ-154</span></h6>
														</div>
														<div className="d-flex align-items-center border-bottom mb-3 pb-3">
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Budget</span>
																<p className="fs-12 text-dark">$24,000</p>
															</div>
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Tasks</span>
																<p className="fs-12 text-dark">12/15</p>
															</div>
															<div className="">
																<span className="fw-medium fs-12 d-block mb-1">Due on</span>
																<p className="fs-12 text-dark">15 Apr 2024</p>
															</div>
														</div>
														<div className="d-flex align-items-center justify-content-between">
															<div className="avatar-list-stacked avatar-group-sm me-3">
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-19.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-29.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-16.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-01.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-02.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-03.jpg" alt="img" />
																</span>
																<a href="#" className="avatar avatar-rounded bg-primary fs-12 text-white">
																	1+
																</a>
															</div>
															<div className="d-flex align-items-center">
																<a href="#" className="d-flex align-items-center text-dark me-2"><i className="ti ti-message-circle text-gray me-1"></i>14</a>
																<a href="#" className="d-flex align-items-center text-dark"><i className="ti ti-paperclip text-gray me-1"></i>14</a>
															</div>
														</div>
													</div>
												</div>
											</div>
											<div>
												<div className="card kanban-card mb-2">
													<div className="card-body">
														<div className="d-flex align-items-center justify-content-between mb-3">
															<div className="d-flex align-items-center">
																<span className="badge bg-outline-dark me-2">Web Layout</span>
																<span className="badge bg-purple badge-xs d-flex align-items-center justify-content-center"><i className="fas fa-circle fs-6 me-1"></i>High</span>
															</div>
															<div className="dropdown">
																<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
																	<i className="ti ti-dots-vertical"></i>
																</a>
																<ul className="dropdown-menu dropdown-menu-end p-3">
																	<li>
																		<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
																	</li>
																	<li>
																		<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
																	</li>
																</ul>
															</div>
														</div>
														<div className="d-flex align-items-center mb-2">
															<span className="avatar avatar-xs rounded-circle bg-warning me-2">
																<img src="assets/img/icons/kanban-arrow.svg" className="w-auto h-auto" alt="Img" />
															</span>
															<h6 className="d-flex align-items-center">Project Title <span className="fs-12 ms-2 text-gray">PRJ-155</span></h6>
														</div>
														<div className="d-flex align-items-center border-bottom mb-3 pb-3">
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Budget</span>
																<p className="fs-12 text-dark">$24,000</p>
															</div>
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Tasks</span>
																<p className="fs-12 text-dark">12/15</p>
															</div>
															<div className="">
																<span className="fw-medium fs-12 d-block mb-1">Due on</span>
																<p className="fs-12 text-dark">15 Apr 2024</p>
															</div>
														</div>
														<div className="d-flex align-items-center justify-content-between">
															<div className="avatar-list-stacked avatar-group-sm me-3">
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-19.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-29.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-16.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-01.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-02.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-03.jpg" alt="img" />
																</span>
																<a href="#" className="avatar avatar-rounded bg-primary fs-12 text-white">
																	1+
																</a>
															</div>
															<div className="d-flex align-items-center">
																<a href="#" className="d-flex align-items-center text-dark me-2"><i className="ti ti-message-circle text-gray me-1"></i>14</a>
																<a href="#" className="d-flex align-items-center text-dark"><i className="ti ti-paperclip text-gray me-1"></i>14</a>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
										<div className="pt-2">
											<a href="#" className="btn btn-white border border-dashed d-flex align-items-center justify-content-center">
												<i className="ti ti-plus me-2"></i>
												New Project
											</a>
										</div>
									</div>
									<div className="p-3 rounded bg-transparent-secondary w-100 me-3">
										<div className="bg-white p-2 rounded mb-2">
											<div className="d-flex align-items-center justify-content-between">
												<div className="d-flex align-items-center">
													<span className="bg-soft-skyblue p-1 d-flex rounded-circle me-2"><span className="bg-skyblue rounded-circle d-block p-1"></span></span>
													<h5 className="me-2">Inprogress</h5>
													<span className="badge bg-light rounded-pill">13</span>
												</div>
												<div className="dropdown">
													<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
														<i className="ti ti-dots-vertical"></i>
													</a>
													<ul className="dropdown-menu dropdown-menu-end p-3">
														<li>
															<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
														</li>
														<li>
															<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
														</li>
													</ul>
												</div>
											</div>
										</div>
										<div className="kanban-drag-wrap">
											<div>
												<div className="card kanban-card mb-2">
													<div className="card-body">
														<div className="d-flex align-items-center justify-content-between mb-3">
															<div className="d-flex align-items-center">
																<span className="badge bg-outline-dark me-2">Web Layout</span>
																<span className="badge bg-purple badge-xs d-flex align-items-center justify-content-center"><i className="fas fa-circle fs-6 me-1"></i>High</span>
															</div>
															<div className="dropdown">
																<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
																	<i className="ti ti-dots-vertical"></i>
																</a>
																<ul className="dropdown-menu dropdown-menu-end p-3">
																	<li>
																		<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
																	</li>
																	<li>
																		<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
																	</li>
																</ul>
															</div>
														</div>
														<div className="d-flex align-items-center mb-2">
															<span className="avatar avatar-xs rounded-circle bg-warning me-2">
																<img src="assets/img/icons/kanban-arrow.svg" className="w-auto h-auto" alt="Img" />
															</span>
															<h6 className="d-flex align-items-center">Project Title <span className="fs-12 ms-2 text-gray">PRJ-156</span></h6>
														</div>
														<div className="d-flex align-items-center border-bottom mb-3 pb-3">
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Budget</span>
																<p className="fs-12 text-dark">$24,000</p>
															</div>
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Tasks</span>
																<p className="fs-12 text-dark">12/15</p>
															</div>
															<div className="">
																<span className="fw-medium fs-12 d-block mb-1">Due on</span>
																<p className="fs-12 text-dark">15 Apr 2024</p>
															</div>
														</div>
														<div className="d-flex align-items-center justify-content-between">
															<div className="avatar-list-stacked avatar-group-sm me-3">
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-19.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-29.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-16.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-01.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-02.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-03.jpg" alt="img" />
																</span>
																<a href="#" className="avatar avatar-rounded bg-primary fs-12 text-white">
																	1+
																</a>
															</div>
															<div className="d-flex align-items-center">
																<a href="#" className="d-flex align-items-center text-dark me-2"><i className="ti ti-message-circle text-gray me-1"></i>14</a>
																<a href="#" className="d-flex align-items-center text-dark"><i className="ti ti-paperclip text-gray me-1"></i>14</a>
															</div>
														</div>
													</div>
												</div>
											</div>
											<div>
												<div className="card kanban-card mb-2">
													<div className="card-body">
														<div className="d-flex align-items-center justify-content-between mb-3">
															<div className="d-flex align-items-center">
																<span className="badge bg-outline-dark me-2">Web Layout</span>
																<span className="badge bg-purple badge-xs d-flex align-items-center justify-content-center"><i className="fas fa-circle fs-6 me-1"></i>High</span>
															</div>
															<div className="dropdown">
																<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
																	<i className="ti ti-dots-vertical"></i>
																</a>
																<ul className="dropdown-menu dropdown-menu-end p-3">
																	<li>
																		<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
																	</li>
																	<li>
																		<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
																	</li>
																</ul>
															</div>
														</div>
														<div className="d-flex align-items-center mb-2">
															<span className="avatar avatar-xs rounded-circle bg-warning me-2">
																<img src="assets/img/icons/kanban-arrow.svg" className="w-auto h-auto" alt="Img" />
															</span>
															<h6 className="d-flex align-items-center">Project Title <span className="fs-12 ms-2 text-gray">PRJ-157</span></h6>
														</div>
														<div className="d-flex align-items-center border-bottom mb-3 pb-3">
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Budget</span>
																<p className="fs-12 text-dark">$24,000</p>
															</div>
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Tasks</span>
																<p className="fs-12 text-dark">12/15</p>
															</div>
															<div className="">
																<span className="fw-medium fs-12 d-block mb-1">Due on</span>
																<p className="fs-12 text-dark">15 Apr 2024</p>
															</div>
														</div>
														<div className="d-flex align-items-center justify-content-between">
															<div className="avatar-list-stacked avatar-group-sm me-3">
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-19.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-29.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-16.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-01.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-02.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-03.jpg" alt="img" />
																</span>
																<a href="#" className="avatar avatar-rounded bg-primary fs-12 text-white">
																	1+
																</a>
															</div>
															<div className="d-flex align-items-center">
																<a href="#" className="d-flex align-items-center text-dark me-2"><i className="ti ti-message-circle text-gray me-1"></i>14</a>
																<a href="#" className="d-flex align-items-center text-dark"><i className="ti ti-paperclip text-gray me-1"></i>14</a>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
										<div className="pt-2">
											<a href="#" className="btn btn-white border border-dashed d-flex align-items-center justify-content-center">
												<i className="ti ti-plus me-2"></i>
												New Project
											</a>
										</div>
									</div>
									<div className="p-3 rounded bg-transparent-secondary w-100 me-3">
										<div className="bg-white p-2 rounded mb-2">
											<div className="d-flex align-items-center justify-content-between">
												<div className="d-flex align-items-center">
													<span className="bg-soft-danger p-1 d-flex rounded-circle me-2"><span className="bg-danger rounded-circle d-block p-1"></span></span>
													<h5 className="me-2">On-hold</h5>
													<span className="badge bg-light rounded-pill">04</span>
												</div>
												<div className="dropdown">
													<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
														<i className="ti ti-dots-vertical"></i>
													</a>
													<ul className="dropdown-menu dropdown-menu-end p-3">
														<li>
															<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
														</li>
														<li>
															<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
														</li>
													</ul>
												</div>
											</div>
										</div>
										<div className="kanban-drag-wrap">
											<div>
												<div className="card kanban-card mb-2">
													<div className="card-body">
														<div className="d-flex align-items-center justify-content-between mb-3">
															<div className="d-flex align-items-center">
																<span className="badge bg-outline-dark me-2">Web Layout</span>
																<span className="badge bg-purple badge-xs d-flex align-items-center justify-content-center"><i className="fas fa-circle fs-6 me-1"></i>High</span>
															</div>
															<div className="dropdown">
																<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
																	<i className="ti ti-dots-vertical"></i>
																</a>
																<ul className="dropdown-menu dropdown-menu-end p-3">
																	<li>
																		<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
																	</li>
																	<li>
																		<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
																	</li>
																</ul>
															</div>
														</div>
														<div className="d-flex align-items-center mb-2">
															<span className="avatar avatar-xs rounded-circle bg-warning me-2">
																<img src="assets/img/icons/kanban-arrow.svg" className="w-auto h-auto" alt="Img" />
															</span>
															<h6 className="d-flex align-items-center">Project Title <span className="fs-12 ms-2 text-gray">PRJ-159</span></h6>
														</div>
														<div className="d-flex align-items-center border-bottom mb-3 pb-3">
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Budget</span>
																<p className="fs-12 text-dark">$24,000</p>
															</div>
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Tasks</span>
																<p className="fs-12 text-dark">12/15</p>
															</div>
															<div className="">
																<span className="fw-medium fs-12 d-block mb-1">Due on</span>
																<p className="fs-12 text-dark">15 Apr 2024</p>
															</div>
														</div>
														<div className="d-flex align-items-center justify-content-between">
															<div className="avatar-list-stacked avatar-group-sm me-3">
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-19.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-29.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-16.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-01.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-02.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-03.jpg" alt="img" />
																</span>
																<a href="#" className="avatar avatar-rounded bg-primary fs-12 text-white">
																	1+
																</a>
															</div>
															<div className="d-flex align-items-center">
																<a href="#" className="d-flex align-items-center text-dark me-2"><i className="ti ti-message-circle text-gray me-1"></i>14</a>
																<a href="#" className="d-flex align-items-center text-dark"><i className="ti ti-paperclip text-gray me-1"></i>14</a>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
										<div className="pt-2">
											<a href="#" className="btn btn-white border border-dashed d-flex align-items-center justify-content-center">
												<i className="ti ti-plus me-2"></i>
												New Project
											</a>
										</div>
									</div>
									<div className="p-3 rounded bg-transparent-secondary w-100">
										<div className="bg-white p-2 rounded mb-2">
											<div className="d-flex align-items-center justify-content-between">
												<div className="d-flex align-items-center">
													<span className="bg-soft-success p-1 d-flex rounded-circle me-2"><span className="bg-success rounded-circle d-block p-1"></span></span>
													<h5 className="me-2">Completed</h5>
													<span className="badge bg-light rounded-pill">10</span>
												</div>
												<div className="dropdown">
													<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
														<i className="ti ti-dots-vertical"></i>
													</a>
													<ul className="dropdown-menu dropdown-menu-end p-3">
														<li>
															<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
														</li>
														<li>
															<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
														</li>
													</ul>
												</div>
											</div>
										</div>
										<div className="kanban-drag-wrap">
											<div>
												<div className="card kanban-card mb-2">
													<div className="card-body">
														<div className="d-flex align-items-center justify-content-between mb-3">
															<div className="d-flex align-items-center">
																<span className="badge bg-outline-dark me-2">Web Layout</span>
																<span className="badge bg-purple badge-xs d-flex align-items-center justify-content-center"><i className="fas fa-circle fs-6 me-1"></i>High</span>
															</div>
															<div className="dropdown">
																<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
																	<i className="ti ti-dots-vertical"></i>
																</a>
																<ul className="dropdown-menu dropdown-menu-end p-3">
																	<li>
																		<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
																	</li>
																	<li>
																		<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
																	</li>
																</ul>
															</div>
														</div>
														<div className="d-flex align-items-center mb-2">
															<span className="avatar avatar-xs rounded-circle bg-warning me-2">
																<img src="assets/img/icons/kanban-arrow.svg" className="w-auto h-auto" alt="Img" />
															</span>
															<h6 className="d-flex align-items-center">Project Title <span className="fs-12 ms-2 text-gray">PRJ-161</span></h6>
														</div>
														<div className="d-flex align-items-center border-bottom mb-3 pb-3">
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Budget</span>
																<p className="fs-12 text-dark">$24,000</p>
															</div>
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Tasks</span>
																<p className="fs-12 text-dark">12/15</p>
															</div>
															<div className="">
																<span className="fw-medium fs-12 d-block mb-1">Due on</span>
																<p className="fs-12 text-dark">15 Apr 2024</p>
															</div>
														</div>
														<div className="d-flex align-items-center justify-content-between">
															<div className="avatar-list-stacked avatar-group-sm me-3">
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-19.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-29.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-16.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-01.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-02.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-03.jpg" alt="img" />
																</span>
																<a href="#" className="avatar avatar-rounded bg-primary fs-12 text-white">
																	1+
																</a>
															</div>
															<div className="d-flex align-items-center">
																<a href="#" className="d-flex align-items-center text-dark me-2"><i className="ti ti-message-circle text-gray me-1"></i>14</a>
																<a href="#" className="d-flex align-items-center text-dark"><i className="ti ti-paperclip text-gray me-1"></i>14</a>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
										<div className="pt-2">
											<a href="#" className="btn btn-white border border-dashed d-flex align-items-center justify-content-center">
												<i className="ti ti-plus me-2"></i>
												New Project
											</a>
										</div>
									</div>
								</div>
							</div>
							<div className="tab-pane fade" id="pills-medium" role="tabpanel">
								<div className="d-flex align-items-start overflow-auto project-status pb-4">
									<div className="p-3 rounded bg-transparent-secondary w-100 me-3">
										<div className="bg-white p-2 rounded mb-2">
											<div className="d-flex align-items-center justify-content-between">
												<div className="d-flex align-items-center">
													<span className="bg-soft-pink p-1 d-flex rounded-circle me-2"><span className="bg-pink rounded-circle d-block p-1"></span></span>
													<h5 className="me-2">New</h5>
													<span className="badge bg-light rounded-pill">02</span>
												</div>
												<div className="dropdown">
													<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
														<i className="ti ti-dots-vertical"></i>
													</a>
													<ul className="dropdown-menu dropdown-menu-end p-3">
														<li>
															<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
														</li>
														<li>
															<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
														</li>
													</ul>
												</div>
											</div>
										</div>
										<div className="kanban-drag-wrap">
											<div>
												<div className="card kanban-card mb-2">
													<div className="card-body">
														<div className="d-flex align-items-center justify-content-between mb-3">
															<div className="d-flex align-items-center">
																<span className="badge bg-outline-dark me-2">Web Layout</span>
																<span className="badge bg-warning badge-xs d-flex align-items-center justify-content-center"><i className="fas fa-circle fs-6 me-1"></i>Medium</span>
															</div>
															<div className="dropdown">
																<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
																	<i className="ti ti-dots-vertical"></i>
																</a>
																<ul className="dropdown-menu dropdown-menu-end p-3">
																	<li>
																		<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
																	</li>
																	<li>
																		<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
																	</li>
																</ul>
															</div>
														</div>
														<div className="d-flex align-items-center mb-2">
															<span className="avatar avatar-xs rounded-circle bg-warning me-2">
																<img src="assets/img/icons/kanban-arrow.svg" className="w-auto h-auto" alt="Img" />
															</span>
															<h6 className="d-flex align-items-center">Project Title <span className="fs-12 ms-2 text-gray">PRJ-154</span></h6>
														</div>
														<div className="d-flex align-items-center border-bottom mb-3 pb-3">
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Budget</span>
																<p className="fs-12 text-dark">$24,000</p>
															</div>
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Tasks</span>
																<p className="fs-12 text-dark">12/15</p>
															</div>
															<div className="">
																<span className="fw-medium fs-12 d-block mb-1">Due on</span>
																<p className="fs-12 text-dark">15 Apr 2024</p>
															</div>
														</div>
														<div className="d-flex align-items-center justify-content-between">
															<div className="avatar-list-stacked avatar-group-sm me-3">
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-19.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-29.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-16.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-01.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-02.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-03.jpg" alt="img" />
																</span>
																<a href="#" className="avatar avatar-rounded bg-primary fs-12 text-white">
																	1+
																</a>
															</div>
															<div className="d-flex align-items-center">
																<a href="#" className="d-flex align-items-center text-dark me-2"><i className="ti ti-message-circle text-gray me-1"></i>14</a>
																<a href="#" className="d-flex align-items-center text-dark"><i className="ti ti-paperclip text-gray me-1"></i>14</a>
															</div>
														</div>
													</div>
												</div>
											</div>
											<div>
												<div className="card kanban-card mb-2">
													<div className="card-body">
														<div className="d-flex align-items-center justify-content-between mb-3">
															<div className="d-flex align-items-center">
																<span className="badge bg-outline-dark me-2">Web Layout</span>
																<span className="badge bg-warning badge-xs d-flex align-items-center justify-content-center"><i className="fas fa-circle fs-6 me-1"></i>Medium</span>
															</div>
															<div className="dropdown">
																<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
																	<i className="ti ti-dots-vertical"></i>
																</a>
																<ul className="dropdown-menu dropdown-menu-end p-3">
																	<li>
																		<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
																	</li>
																	<li>
																		<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
																	</li>
																</ul>
															</div>
														</div>
														<div className="d-flex align-items-center mb-2">
															<span className="avatar avatar-xs rounded-circle bg-warning me-2">
																<img src="assets/img/icons/kanban-arrow.svg" className="w-auto h-auto" alt="Img" />
															</span>
															<h6 className="d-flex align-items-center">Project Title <span className="fs-12 ms-2 text-gray">PRJ-155</span></h6>
														</div>
														<div className="d-flex align-items-center border-bottom mb-3 pb-3">
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Budget</span>
																<p className="fs-12 text-dark">$24,000</p>
															</div>
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Tasks</span>
																<p className="fs-12 text-dark">12/15</p>
															</div>
															<div className="">
																<span className="fw-medium fs-12 d-block mb-1">Due on</span>
																<p className="fs-12 text-dark">15 Apr 2024</p>
															</div>
														</div>
														<div className="d-flex align-items-center justify-content-between">
															<div className="avatar-list-stacked avatar-group-sm me-3">
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-19.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-29.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-16.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-01.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-02.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-03.jpg" alt="img" />
																</span>
																<a href="#" className="avatar avatar-rounded bg-primary fs-12 text-white">
																	1+
																</a>
															</div>
															<div className="d-flex align-items-center">
																<a href="#" className="d-flex align-items-center text-dark me-2"><i className="ti ti-message-circle text-gray me-1"></i>14</a>
																<a href="#" className="d-flex align-items-center text-dark"><i className="ti ti-paperclip text-gray me-1"></i>14</a>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
										<div className="pt-2">
											<a href="#" className="btn btn-white border border-dashed d-flex align-items-center justify-content-center">
												<i className="ti ti-plus me-2"></i>
												New Project
											</a>
										</div>
									</div>
									<div className="p-3 rounded bg-transparent-secondary w-100 me-3">
										<div className="bg-white p-2 rounded mb-2">
											<div className="d-flex align-items-center justify-content-between">
												<div className="d-flex align-items-center">
													<span className="bg-soft-skyblue p-1 d-flex rounded-circle me-2"><span className="bg-skyblue rounded-circle d-block p-1"></span></span>
													<h5 className="me-2">Inprogress</h5>
													<span className="badge bg-light rounded-pill">13</span>
												</div>
												<div className="dropdown">
													<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
														<i className="ti ti-dots-vertical"></i>
													</a>
													<ul className="dropdown-menu dropdown-menu-end p-3">
														<li>
															<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
														</li>
														<li>
															<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
														</li>
													</ul>
												</div>
											</div>
										</div>
										<div className="kanban-drag-wrap">
											<div>
												<div className="card kanban-card mb-2">
													<div className="card-body">
														<div className="d-flex align-items-center justify-content-between mb-3">
															<div className="d-flex align-items-center">
																<span className="badge bg-outline-dark me-2">Web Layout</span>
																<span className="badge bg-warning badge-xs d-flex align-items-center justify-content-center"><i className="fas fa-circle fs-6 me-1"></i>Medium</span>
															</div>
															<div className="dropdown">
																<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
																	<i className="ti ti-dots-vertical"></i>
																</a>
																<ul className="dropdown-menu dropdown-menu-end p-3">
																	<li>
																		<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
																	</li>
																	<li>
																		<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
																	</li>
																</ul>
															</div>
														</div>
														<div className="d-flex align-items-center mb-2">
															<span className="avatar avatar-xs rounded-circle bg-warning me-2">
																<img src="assets/img/icons/kanban-arrow.svg" className="w-auto h-auto" alt="Img" />
															</span>
															<h6 className="d-flex align-items-center">Project Title <span className="fs-12 ms-2 text-gray">PRJ-156</span></h6>
														</div>
														<div className="d-flex align-items-center border-bottom mb-3 pb-3">
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Budget</span>
																<p className="fs-12 text-dark">$24,000</p>
															</div>
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Tasks</span>
																<p className="fs-12 text-dark">12/15</p>
															</div>
															<div className="">
																<span className="fw-medium fs-12 d-block mb-1">Due on</span>
																<p className="fs-12 text-dark">15 Apr 2024</p>
															</div>
														</div>
														<div className="d-flex align-items-center justify-content-between">
															<div className="avatar-list-stacked avatar-group-sm me-3">
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-19.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-29.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-16.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-01.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-02.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-03.jpg" alt="img" />
																</span>
																<a href="#" className="avatar avatar-rounded bg-primary fs-12 text-white">
																	1+
																</a>
															</div>
															<div className="d-flex align-items-center">
																<a href="#" className="d-flex align-items-center text-dark me-2"><i className="ti ti-message-circle text-gray me-1"></i>14</a>
																<a href="#" className="d-flex align-items-center text-dark"><i className="ti ti-paperclip text-gray me-1"></i>14</a>
															</div>
														</div>
													</div>
												</div>
											</div>
											<div>
												<div className="card kanban-card mb-2">
													<div className="card-body">
														<div className="d-flex align-items-center justify-content-between mb-3">
															<div className="d-flex align-items-center">
																<span className="badge bg-outline-dark me-2">Web Layout</span>
																<span className="badge bg-warning badge-xs d-flex align-items-center justify-content-center"><i className="fas fa-circle fs-6 me-1"></i>Medium</span>
															</div>
															<div className="dropdown">
																<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
																	<i className="ti ti-dots-vertical"></i>
																</a>
																<ul className="dropdown-menu dropdown-menu-end p-3">
																	<li>
																		<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
																	</li>
																	<li>
																		<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
																	</li>
																</ul>
															</div>
														</div>
														<div className="d-flex align-items-center mb-2">
															<span className="avatar avatar-xs rounded-circle bg-warning me-2">
																<img src="assets/img/icons/kanban-arrow.svg" className="w-auto h-auto" alt="Img" />
															</span>
															<h6 className="d-flex align-items-center">Project Title <span className="fs-12 ms-2 text-gray">PRJ-157</span></h6>
														</div>
														<div className="d-flex align-items-center border-bottom mb-3 pb-3">
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Budget</span>
																<p className="fs-12 text-dark">$24,000</p>
															</div>
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Tasks</span>
																<p className="fs-12 text-dark">12/15</p>
															</div>
															<div className="">
																<span className="fw-medium fs-12 d-block mb-1">Due on</span>
																<p className="fs-12 text-dark">15 Apr 2024</p>
															</div>
														</div>
														<div className="d-flex align-items-center justify-content-between">
															<div className="avatar-list-stacked avatar-group-sm me-3">
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-19.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-29.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-16.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-01.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-02.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-03.jpg" alt="img" />
																</span>
																<a href="#" className="avatar avatar-rounded bg-primary fs-12 text-white">
																	1+
																</a>
															</div>
															<div className="d-flex align-items-center">
																<a href="#" className="d-flex align-items-center text-dark me-2"><i className="ti ti-message-circle text-gray me-1"></i>14</a>
																<a href="#" className="d-flex align-items-center text-dark"><i className="ti ti-paperclip text-gray me-1"></i>14</a>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
										<div className="pt-2">
											<a href="#" className="btn btn-white border border-dashed d-flex align-items-center justify-content-center">
												<i className="ti ti-plus me-2"></i>
												New Project
											</a>
										</div>
									</div>
									<div className="p-3 rounded bg-transparent-secondary w-100 me-3">
										<div className="bg-white p-2 rounded mb-2">
											<div className="d-flex align-items-center justify-content-between">
												<div className="d-flex align-items-center">
													<span className="bg-soft-danger p-1 d-flex rounded-circle me-2"><span className="bg-danger rounded-circle d-block p-1"></span></span>
													<h5 className="me-2">On-hold</h5>
													<span className="badge bg-light rounded-pill">04</span>
												</div>
												<div className="dropdown">
													<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
														<i className="ti ti-dots-vertical"></i>
													</a>
													<ul className="dropdown-menu dropdown-menu-end p-3">
														<li>
															<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
														</li>
														<li>
															<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
														</li>
													</ul>
												</div>
											</div>
										</div>
										<div className="kanban-drag-wrap">
											<div>
												<div className="card kanban-card mb-2">
													<div className="card-body">
														<div className="d-flex align-items-center justify-content-between mb-3">
															<div className="d-flex align-items-center">
																<span className="badge bg-outline-dark me-2">Web Layout</span>
																<span className="badge bg-warning badge-xs d-flex align-items-center justify-content-center"><i className="fas fa-circle fs-6 me-1"></i>Medium</span>
															</div>
															<div className="dropdown">
																<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
																	<i className="ti ti-dots-vertical"></i>
																</a>
																<ul className="dropdown-menu dropdown-menu-end p-3">
																	<li>
																		<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
																	</li>
																	<li>
																		<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
																	</li>
																</ul>
															</div>
														</div>
														<div className="d-flex align-items-center mb-2">
															<span className="avatar avatar-xs rounded-circle bg-warning me-2">
																<img src="assets/img/icons/kanban-arrow.svg" className="w-auto h-auto" alt="Img" />
															</span>
															<h6 className="d-flex align-items-center">Project Title <span className="fs-12 ms-2 text-gray">PRJ-159</span></h6>
														</div>
														<div className="d-flex align-items-center border-bottom mb-3 pb-3">
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Budget</span>
																<p className="fs-12 text-dark">$24,000</p>
															</div>
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Tasks</span>
																<p className="fs-12 text-dark">12/15</p>
															</div>
															<div className="">
																<span className="fw-medium fs-12 d-block mb-1">Due on</span>
																<p className="fs-12 text-dark">15 Apr 2024</p>
															</div>
														</div>
														<div className="d-flex align-items-center justify-content-between">
															<div className="avatar-list-stacked avatar-group-sm me-3">
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-19.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-29.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-16.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-01.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-02.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-03.jpg" alt="img" />
																</span>
																<a href="#" className="avatar avatar-rounded bg-primary fs-12 text-white">
																	1+
																</a>
															</div>
															<div className="d-flex align-items-center">
																<a href="#" className="d-flex align-items-center text-dark me-2"><i className="ti ti-message-circle text-gray me-1"></i>14</a>
																<a href="#" className="d-flex align-items-center text-dark"><i className="ti ti-paperclip text-gray me-1"></i>14</a>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
										<div className="pt-2">
											<a href="#" className="btn btn-white border border-dashed d-flex align-items-center justify-content-center">
												<i className="ti ti-plus me-2"></i>
												New Project
											</a>
										</div>
									</div>
									<div className="p-3 rounded bg-transparent-secondary w-100">
										<div className="bg-white p-2 rounded mb-2">
											<div className="d-flex align-items-center justify-content-between">
												<div className="d-flex align-items-center">
													<span className="bg-soft-success p-1 d-flex rounded-circle me-2"><span className="bg-success rounded-circle d-block p-1"></span></span>
													<h5 className="me-2">Completed</h5>
													<span className="badge bg-light rounded-pill">10</span>
												</div>
												<div className="dropdown">
													<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
														<i className="ti ti-dots-vertical"></i>
													</a>
													<ul className="dropdown-menu dropdown-menu-end p-3">
														<li>
															<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
														</li>
														<li>
															<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
														</li>
													</ul>
												</div>
											</div>
										</div>
										<div className="kanban-drag-wrap">
											<div>
												<div className="card kanban-card mb-2">
													<div className="card-body">
														<div className="d-flex align-items-center justify-content-between mb-3">
															<div className="d-flex align-items-center">
																<span className="badge bg-outline-dark me-2">Web Layout</span>
																<span className="badge bg-warning badge-xs d-flex align-items-center justify-content-center"><i className="fas fa-circle fs-6 me-1"></i>Medium</span>
															</div>
															<div className="dropdown">
																<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
																	<i className="ti ti-dots-vertical"></i>
																</a>
																<ul className="dropdown-menu dropdown-menu-end p-3">
																	<li>
																		<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
																	</li>
																	<li>
																		<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
																	</li>
																</ul>
															</div>
														</div>
														<div className="d-flex align-items-center mb-2">
															<span className="avatar avatar-xs rounded-circle bg-warning me-2">
																<img src="assets/img/icons/kanban-arrow.svg" className="w-auto h-auto" alt="Img" />
															</span>
															<h6 className="d-flex align-items-center">Project Title <span className="fs-12 ms-2 text-gray">PRJ-161</span></h6>
														</div>
														<div className="d-flex align-items-center border-bottom mb-3 pb-3">
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Budget</span>
																<p className="fs-12 text-dark">$24,000</p>
															</div>
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Tasks</span>
																<p className="fs-12 text-dark">12/15</p>
															</div>
															<div className="">
																<span className="fw-medium fs-12 d-block mb-1">Due on</span>
																<p className="fs-12 text-dark">15 Apr 2024</p>
															</div>
														</div>
														<div className="d-flex align-items-center justify-content-between">
															<div className="avatar-list-stacked avatar-group-sm me-3">
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-19.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-29.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-16.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-01.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-02.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-03.jpg" alt="img" />
																</span>
																<a href="#" className="avatar avatar-rounded bg-primary fs-12 text-white">
																	1+
																</a>
															</div>
															<div className="d-flex align-items-center">
																<a href="#" className="d-flex align-items-center text-dark me-2"><i className="ti ti-message-circle text-gray me-1"></i>14</a>
																<a href="#" className="d-flex align-items-center text-dark"><i className="ti ti-paperclip text-gray me-1"></i>14</a>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
										<div className="pt-2">
											<a href="#" className="btn btn-white border border-dashed d-flex align-items-center justify-content-center">
												<i className="ti ti-plus me-2"></i>
												New Project
											</a>
										</div>
									</div>
								</div>
							</div>
							<div className="tab-pane fade" id="pills-low" role="tabpanel">
								<div className="d-flex align-items-start overflow-auto project-status pb-4">
									<div className="p-3 rounded bg-transparent-secondary w-100 me-3">
										<div className="bg-white p-2 rounded mb-2">
											<div className="d-flex align-items-center justify-content-between">
												<div className="d-flex align-items-center">
													<span className="bg-soft-pink p-1 d-flex rounded-circle me-2"><span className="bg-pink rounded-circle d-block p-1"></span></span>
													<h5 className="me-2">New</h5>
													<span className="badge bg-light rounded-pill">02</span>
												</div>
												<div className="dropdown">
													<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
														<i className="ti ti-dots-vertical"></i>
													</a>
													<ul className="dropdown-menu dropdown-menu-end p-3">
														<li>
															<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
														</li>
														<li>
															<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
														</li>
													</ul>
												</div>
											</div>
										</div>
										<div className="kanban-drag-wrap">
											<div>
												<div className="card kanban-card mb-2">
													<div className="card-body">
														<div className="d-flex align-items-center justify-content-between mb-3">
															<div className="d-flex align-items-center">
																<span className="badge bg-outline-dark me-2">Web Layout</span>
																<span className="badge bg-success badge-xs d-flex align-items-center justify-content-center"><i className="fas fa-circle fs-6 me-1"></i>Low</span>
															</div>
															<div className="dropdown">
																<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
																	<i className="ti ti-dots-vertical"></i>
																</a>
																<ul className="dropdown-menu dropdown-menu-end p-3">
																	<li>
																		<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
																	</li>
																	<li>
																		<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
																	</li>
																</ul>
															</div>
														</div>
														<div className="d-flex align-items-center mb-2">
															<span className="avatar avatar-xs rounded-circle bg-warning me-2">
																<img src="assets/img/icons/kanban-arrow.svg" className="w-auto h-auto" alt="Img" />
															</span>
															<h6 className="d-flex align-items-center">Project Title <span className="fs-12 ms-2 text-gray">PRJ-154</span></h6>
														</div>
														<div className="d-flex align-items-center border-bottom mb-3 pb-3">
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Budget</span>
																<p className="fs-12 text-dark">$24,000</p>
															</div>
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Tasks</span>
																<p className="fs-12 text-dark">12/15</p>
															</div>
															<div className="">
																<span className="fw-medium fs-12 d-block mb-1">Due on</span>
																<p className="fs-12 text-dark">15 Apr 2024</p>
															</div>
														</div>
														<div className="d-flex align-items-center justify-content-between">
															<div className="avatar-list-stacked avatar-group-sm me-3">
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-19.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-29.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-16.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-01.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-02.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-03.jpg" alt="img" />
																</span>
																<a href="#" className="avatar avatar-rounded bg-primary fs-12 text-white">
																	1+
																</a>
															</div>
															<div className="d-flex align-items-center">
																<a href="#" className="d-flex align-items-center text-dark me-2"><i className="ti ti-message-circle text-gray me-1"></i>14</a>
																<a href="#" className="d-flex align-items-center text-dark"><i className="ti ti-paperclip text-gray me-1"></i>14</a>
															</div>
														</div>
													</div>
												</div>
											</div>
											<div>
												<div className="card kanban-card mb-2">
													<div className="card-body">
														<div className="d-flex align-items-center justify-content-between mb-3">
															<div className="d-flex align-items-center">
																<span className="badge bg-outline-dark me-2">Web Layout</span>
																<span className="badge bg-success badge-xs d-flex align-items-center justify-content-center"><i className="fas fa-circle fs-6 me-1"></i>Low</span>
															</div>
															<div className="dropdown">
																<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
																	<i className="ti ti-dots-vertical"></i>
																</a>
																<ul className="dropdown-menu dropdown-menu-end p-3">
																	<li>
																		<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
																	</li>
																	<li>
																		<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
																	</li>
																</ul>
															</div>
														</div>
														<div className="d-flex align-items-center mb-2">
															<span className="avatar avatar-xs rounded-circle bg-warning me-2">
																<img src="assets/img/icons/kanban-arrow.svg" className="w-auto h-auto" alt="Img" />
															</span>
															<h6 className="d-flex align-items-center">Project Title <span className="fs-12 ms-2 text-gray">PRJ-155</span></h6>
														</div>
														<div className="d-flex align-items-center border-bottom mb-3 pb-3">
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Budget</span>
																<p className="fs-12 text-dark">$24,000</p>
															</div>
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Tasks</span>
																<p className="fs-12 text-dark">12/15</p>
															</div>
															<div className="">
																<span className="fw-medium fs-12 d-block mb-1">Due on</span>
																<p className="fs-12 text-dark">15 Apr 2024</p>
															</div>
														</div>
														<div className="d-flex align-items-center justify-content-between">
															<div className="avatar-list-stacked avatar-group-sm me-3">
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-19.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-29.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-16.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-01.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-02.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-03.jpg" alt="img" />
																</span>
																<a href="#" className="avatar avatar-rounded bg-primary fs-12 text-white">
																	1+
																</a>
															</div>
															<div className="d-flex align-items-center">
																<a href="#" className="d-flex align-items-center text-dark me-2"><i className="ti ti-message-circle text-gray me-1"></i>14</a>
																<a href="#" className="d-flex align-items-center text-dark"><i className="ti ti-paperclip text-gray me-1"></i>14</a>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
										<div className="pt-2">
											<a href="#" className="btn btn-white border border-dashed d-flex align-items-center justify-content-center">
												<i className="ti ti-plus me-2"></i>
												New Project
											</a>
										</div>
									</div>
									<div className="p-3 rounded bg-transparent-secondary w-100 me-3">
										<div className="bg-white p-2 rounded mb-2">
											<div className="d-flex align-items-center justify-content-between">
												<div className="d-flex align-items-center">
													<span className="bg-soft-skyblue p-1 d-flex rounded-circle me-2"><span className="bg-skyblue rounded-circle d-block p-1"></span></span>
													<h5 className="me-2">Inprogress</h5>
													<span className="badge bg-light rounded-pill">13</span>
												</div>
												<div className="dropdown">
													<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
														<i className="ti ti-dots-vertical"></i>
													</a>
													<ul className="dropdown-menu dropdown-menu-end p-3">
														<li>
															<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
														</li>
														<li>
															<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
														</li>
													</ul>
												</div>
											</div>
										</div>
										<div className="kanban-drag-wrap">
											<div>
												<div className="card kanban-card mb-2">
													<div className="card-body">
														<div className="d-flex align-items-center justify-content-between mb-3">
															<div className="d-flex align-items-center">
																<span className="badge bg-outline-dark me-2">Web Layout</span>
																<span className="badge bg-success badge-xs d-flex align-items-center justify-content-center"><i className="fas fa-circle fs-6 me-1"></i>Low</span>
															</div>
															<div className="dropdown">
																<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
																	<i className="ti ti-dots-vertical"></i>
																</a>
																<ul className="dropdown-menu dropdown-menu-end p-3">
																	<li>
																		<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
																	</li>
																	<li>
																		<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
																	</li>
																</ul>
															</div>
														</div>
														<div className="d-flex align-items-center mb-2">
															<span className="avatar avatar-xs rounded-circle bg-warning me-2">
																<img src="assets/img/icons/kanban-arrow.svg" className="w-auto h-auto" alt="Img" />
															</span>
															<h6 className="d-flex align-items-center">Project Title <span className="fs-12 ms-2 text-gray">PRJ-156</span></h6>
														</div>
														<div className="d-flex align-items-center border-bottom mb-3 pb-3">
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Budget</span>
																<p className="fs-12 text-dark">$24,000</p>
															</div>
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Tasks</span>
																<p className="fs-12 text-dark">12/15</p>
															</div>
															<div className="">
																<span className="fw-medium fs-12 d-block mb-1">Due on</span>
																<p className="fs-12 text-dark">15 Apr 2024</p>
															</div>
														</div>
														<div className="d-flex align-items-center justify-content-between">
															<div className="avatar-list-stacked avatar-group-sm me-3">
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-19.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-29.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-16.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-01.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-02.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-03.jpg" alt="img" />
																</span>
																<a href="#" className="avatar avatar-rounded bg-primary fs-12 text-white">
																	1+
																</a>
															</div>
															<div className="d-flex align-items-center">
																<a href="#" className="d-flex align-items-center text-dark me-2"><i className="ti ti-message-circle text-gray me-1"></i>14</a>
																<a href="#" className="d-flex align-items-center text-dark"><i className="ti ti-paperclip text-gray me-1"></i>14</a>
															</div>
														</div>
													</div>
												</div>
											</div>
											<div>
												<div className="card kanban-card mb-2">
													<div className="card-body">
														<div className="d-flex align-items-center justify-content-between mb-3">
															<div className="d-flex align-items-center">
																<span className="badge bg-outline-dark me-2">Web Layout</span>
																<span className="badge bg-success badge-xs d-flex align-items-center justify-content-center"><i className="fas fa-circle fs-6 me-1"></i>Low</span>
															</div>
															<div className="dropdown">
																<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
																	<i className="ti ti-dots-vertical"></i>
																</a>
																<ul className="dropdown-menu dropdown-menu-end p-3">
																	<li>
																		<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
																	</li>
																	<li>
																		<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
																	</li>
																</ul>
															</div>
														</div>
														<div className="d-flex align-items-center mb-2">
															<span className="avatar avatar-xs rounded-circle bg-warning me-2">
																<img src="assets/img/icons/kanban-arrow.svg" className="w-auto h-auto" alt="Img" />
															</span>
															<h6 className="d-flex align-items-center">Project Title <span className="fs-12 ms-2 text-gray">PRJ-157</span></h6>
														</div>
														<div className="d-flex align-items-center border-bottom mb-3 pb-3">
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Budget</span>
																<p className="fs-12 text-dark">$24,000</p>
															</div>
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Tasks</span>
																<p className="fs-12 text-dark">12/15</p>
															</div>
															<div className="">
																<span className="fw-medium fs-12 d-block mb-1">Due on</span>
																<p className="fs-12 text-dark">15 Apr 2024</p>
															</div>
														</div>
														<div className="d-flex align-items-center justify-content-between">
															<div className="avatar-list-stacked avatar-group-sm me-3">
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-19.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-29.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-16.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-01.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-02.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-03.jpg" alt="img" />
																</span>
																<a href="#" className="avatar avatar-rounded bg-primary fs-12 text-white">
																	1+
																</a>
															</div>
															<div className="d-flex align-items-center">
																<a href="#" className="d-flex align-items-center text-dark me-2"><i className="ti ti-message-circle text-gray me-1"></i>14</a>
																<a href="#" className="d-flex align-items-center text-dark"><i className="ti ti-paperclip text-gray me-1"></i>14</a>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
										<div className="pt-2">
											<a href="#" className="btn btn-white border border-dashed d-flex align-items-center justify-content-center">
												<i className="ti ti-plus me-2"></i>
												New Project
											</a>
										</div>
									</div>
									<div className="p-3 rounded bg-transparent-secondary w-100 me-3">
										<div className="bg-white p-2 rounded mb-2">
											<div className="d-flex align-items-center justify-content-between">
												<div className="d-flex align-items-center">
													<span className="bg-soft-danger p-1 d-flex rounded-circle me-2"><span className="bg-danger rounded-circle d-block p-1"></span></span>
													<h5 className="me-2">On-hold</h5>
													<span className="badge bg-light rounded-pill">04</span>
												</div>
												<div className="dropdown">
													<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
														<i className="ti ti-dots-vertical"></i>
													</a>
													<ul className="dropdown-menu dropdown-menu-end p-3">
														<li>
															<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
														</li>
														<li>
															<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
														</li>
													</ul>
												</div>
											</div>
										</div>
										<div className="kanban-drag-wrap">
											<div>
												<div className="card kanban-card mb-2">
													<div className="card-body">
														<div className="d-flex align-items-center justify-content-between mb-3">
															<div className="d-flex align-items-center">
																<span className="badge bg-outline-dark me-2">Web Layout</span>
																<span className="badge bg-success badge-xs d-flex align-items-center justify-content-center"><i className="fas fa-circle fs-6 me-1"></i>Low</span>
															</div>
															<div className="dropdown">
																<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
																	<i className="ti ti-dots-vertical"></i>
																</a>
																<ul className="dropdown-menu dropdown-menu-end p-3">
																	<li>
																		<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
																	</li>
																	<li>
																		<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
																	</li>
																</ul>
															</div>
														</div>
														<div className="d-flex align-items-center mb-2">
															<span className="avatar avatar-xs rounded-circle bg-warning me-2">
																<img src="assets/img/icons/kanban-arrow.svg" className="w-auto h-auto" alt="Img" />
															</span>
															<h6 className="d-flex align-items-center">Project Title <span className="fs-12 ms-2 text-gray">PRJ-159</span></h6>
														</div>
														<div className="d-flex align-items-center border-bottom mb-3 pb-3">
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Budget</span>
																<p className="fs-12 text-dark">$24,000</p>
															</div>
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Tasks</span>
																<p className="fs-12 text-dark">12/15</p>
															</div>
															<div className="">
																<span className="fw-medium fs-12 d-block mb-1">Due on</span>
																<p className="fs-12 text-dark">15 Apr 2024</p>
															</div>
														</div>
														<div className="d-flex align-items-center justify-content-between">
															<div className="avatar-list-stacked avatar-group-sm me-3">
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-19.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-29.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-16.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-01.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-02.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-03.jpg" alt="img" />
																</span>
																<a href="#" className="avatar avatar-rounded bg-primary fs-12 text-white">
																	1+
																</a>
															</div>
															<div className="d-flex align-items-center">
																<a href="#" className="d-flex align-items-center text-dark me-2"><i className="ti ti-message-circle text-gray me-1"></i>14</a>
																<a href="#" className="d-flex align-items-center text-dark"><i className="ti ti-paperclip text-gray me-1"></i>14</a>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
										<div className="pt-2">
											<a href="#" className="btn btn-white border border-dashed d-flex align-items-center justify-content-center">
												<i className="ti ti-plus me-2"></i>
												New Project
											</a>
										</div>
									</div>
									<div className="p-3 rounded bg-transparent-secondary w-100">
										<div className="bg-white p-2 rounded mb-2">
											<div className="d-flex align-items-center justify-content-between">
												<div className="d-flex align-items-center">
													<span className="bg-soft-success p-1 d-flex rounded-circle me-2"><span className="bg-success rounded-circle d-block p-1"></span></span>
													<h5 className="me-2">Completed</h5>
													<span className="badge bg-light rounded-pill">10</span>
												</div>
												<div className="dropdown">
													<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
														<i className="ti ti-dots-vertical"></i>
													</a>
													<ul className="dropdown-menu dropdown-menu-end p-3">
														<li>
															<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
														</li>
														<li>
															<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
														</li>
													</ul>
												</div>
											</div>
										</div>
										<div className="kanban-drag-wrap">
											<div>
												<div className="card kanban-card mb-2">
													<div className="card-body">
														<div className="d-flex align-items-center justify-content-between mb-3">
															<div className="d-flex align-items-center">
																<span className="badge bg-outline-dark me-2">Web Layout</span>
																<span className="badge bg-success badge-xs d-flex align-items-center justify-content-center"><i className="fas fa-circle fs-6 me-1"></i>Low</span>
															</div>
															<div className="dropdown">
																<a href="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
																	<i className="ti ti-dots-vertical"></i>
																</a>
																<ul className="dropdown-menu dropdown-menu-end p-3">
																	<li>
																		<a href="#" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
																	</li>
																	<li>
																		<a href="#" className="dropdown-item rounded-1" data-bs-toggle="modal" data-bs-target="#delete_modal"><i className="ti ti-trash me-2"></i>Delete</a>
																	</li>
																</ul>
															</div>
														</div>
														<div className="d-flex align-items-center mb-2">
															<span className="avatar avatar-xs rounded-circle bg-warning me-2">
																<img src="assets/img/icons/kanban-arrow.svg" className="w-auto h-auto" alt="Img" />
															</span>
															<h6 className="d-flex align-items-center">Project Title <span className="fs-12 ms-2 text-gray">PRJ-161</span></h6>
														</div>
														<div className="d-flex align-items-center border-bottom mb-3 pb-3">
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Budget</span>
																<p className="fs-12 text-dark">$24,000</p>
															</div>
															<div className="me-3 pe-3 border-end">
																<span className="fw-medium fs-12 d-block mb-1">Tasks</span>
																<p className="fs-12 text-dark">12/15</p>
															</div>
															<div className="">
																<span className="fw-medium fs-12 d-block mb-1">Due on</span>
																<p className="fs-12 text-dark">15 Apr 2024</p>
															</div>
														</div>
														<div className="d-flex align-items-center justify-content-between">
															<div className="avatar-list-stacked avatar-group-sm me-3">
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-19.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-29.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-16.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-01.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-02.jpg" alt="img" />
																</span>
																<span className="avatar avatar-rounded">
																	<img className="border border-white" src="assets/img/profiles/avatar-03.jpg" alt="img" />
																</span>
																<a href="#" className="avatar avatar-rounded bg-primary fs-12 text-white">
																	1+
																</a>
															</div>
															<div className="d-flex align-items-center">
																<a href="#" className="d-flex align-items-center text-dark me-2"><i className="ti ti-message-circle text-gray me-1"></i>14</a>
																<a href="#" className="d-flex align-items-center text-dark"><i className="ti ti-paperclip text-gray me-1"></i>14</a>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
										<div className="pt-2">
											<a href="#" className="btn btn-white border border-dashed d-flex align-items-center justify-content-center">
												<i className="ti ti-plus me-2"></i>
												New Project
											</a>
										</div>
									</div>
								</div>
							</div>
						</div>

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
							<a href="#" className="btn btn-light me-3" data-bs-dismiss="modal">Cancel</a>
							<a href="kanban-view.php" className="btn btn-danger">Yes, Delete</a>
						</div>
					</div>
				</div>
			</div>
		</div>
		

	</React.Fragment>
    );
};

export default KanbanViewPage;
