import React from 'react';

const NotesPage = () => {
  return (
    <>
<div className="content pb-4">
				
				<div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
					<div className="my-auto mb-2">
						<h2 className="mb-1">Notes</h2>
						<nav>
							<ol className="breadcrumb mb-0">
								<li className="breadcrumb-item">
									<a href="admin-dashboard.php"><i className="ti ti-smart-home"></i></a>
								</li>
								<li className="breadcrumb-item">
									Application
								</li>
								<li className="breadcrumb-item active" aria-current="page">Notes</li>
							</ol>
						</nav>
					</div>
					<div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
						<div className="me-2 mb-2">
							<div className="dropdown">
								<a href="javascript:void(0);" className="dropdown-toggle btn btn-white d-inline-flex align-items-center" data-bs-toggle="dropdown">
									<i className="ti ti-file-export me-2"></i>Export
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
							<a href="#" className="btn btn-primary d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#add_note"><i className="ti ti-circle-plus me-2"></i>Add Notes</a>
						</div>
						<div className="ms-2 head-icons">
							<a href="javascript:void(0);" className="" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-original-title="Collapse" id="collapse-header">
								<i className="ti ti-chevrons-up"></i>
							</a>
						</div>
					</div>
				</div>

				<div className="row">
					<div className="col-xl-3 col-md-12 sidebars-right theiaStickySidebar section-bulk-widget">
						<div className="border rounded-3 bg-white p-3">
							<div className="mb-3 pb-3 border-bottom">
								<h4 className="d-flex align-items-center"><i className="ti ti-file-text me-2"></i>Notes List</h4>
							</div>
							<div className="border-bottom pb-3 ">
								<div className="nav flex-column nav-pills" id="v-pills-tab" role="tablist"
									aria-orientation="vertical">
									<button
										className="d-flex text-start align-items-center fw-medium fs-15 nav-link active mb-1"
										id="v-pills-profile-tab" data-bs-toggle="pill" data-bs-target="#v-pills-profile"
										type="button" role="tab" aria-controls="v-pills-profile" aria-selected="true"><i
											className="ti ti-inbox me-2"></i>All Notes<span className="ms-2">1</span></button>
									<button className="d-flex text-start align-items-center fw-medium fs-15 nav-link mb-1"
										id="v-pills-messages-tab" data-bs-toggle="pill"
										data-bs-target="#v-pills-messages" type="button" role="tab"
										aria-controls="v-pills-messages" aria-selected="false"><i
											className="ti ti-star me-2"></i>Important</button>
									<button className="d-flex text-start align-items-center fw-medium fs-15 nav-link mb-0"
										id="v-pills-settings-tab" data-bs-toggle="pill"
										data-bs-target="#v-pills-settings" type="button" role="tab"
										aria-controls="v-pills-settings" aria-selected="false"><i
											className="ti ti-trash me-2"></i>Trash</button>
								</div>
							</div>
							<div className="mt-3">
								<div className="border-bottom px-2 pb-3 mb-3">
									<h5 className="mb-2">Tags</h5>
									<div className="d-flex flex-column mt-2">
										<a href="javascript:void(0);" className="text-info mb-2"><span
												className="text-info me-2"><i
													className="fas fa-square square-rotate fs-10"></i></span>Pending</a>
										<a href="javascript:void(0);" className="text-danger mb-2"><span
												className="text-danger me-2"><i
													className="fas fa-square square-rotate fs-10"></i></span>Onhold</a>
										<a href="javascript:void(0);" className="text-warning mb-2"><span
												className="text-warning me-2"><i
													className="fas fa-square square-rotate fs-10"></i></span>Inprogress</a>
										<a href="javascript:void(0);" className="text-success"><span
												className="text-success me-2"><i
													className="fas fa-square square-rotate fs-10"></i></span>Done</a>
									</div>
								</div>
								<div className="px-2">
									<h5 className="mb-2">Priority</h5>
									<div className="d-flex flex-column mt-2">
										<a href="javascript:void(0);" className="text-warning mb-2"><span
												className="text-warning me-2"><i
													className="fas fa-square square-rotate fs-10"></i></span>Medium</a>
										<a href="javascript:void(0);" className="text-success mb-2"><span
												className="text-success me-2"><i
													className="fas fa-square square-rotate fs-10"></i></span>High</a>
										<a href="javascript:void(0);" className="text-danger"><span
												className="text-danger me-2"><i
													className="fas fa-square square-rotate fs-10"></i></span>Low</a>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className="col-xl-9 budget-role-notes">
						<div
							className="bg-white rounded-3 d-flex align-items-center justify-content-between flex-wrap mb-4 p-3 pb-0">
							<div className="d-flex align-items-center mb-3">
								<div className="me-3">
									<select className="select">
										<option>Bulk Actions</option>
										<option>Delete Marked</option>
										<option>Unmark All</option>
										<option>Mark All</option>
									</select>
								</div>
								<a href="#" className="btn btn-light">Apply</a>
							</div>
							<div className="form-sort mb-3">
								<i className="ti ti-filter feather-filter info-img"></i>
								<select className="select">
									<option>Recent</option>
									<option>Last Modified</option>
									<option>Last Modified by me</option>
								</select>
							</div>
						</div>
						<div className="tab-content" id="v-pills-tabContent2">
							<div className="tab-pane fade active show" id="v-pills-profile" role="tabpanel"
								aria-labelledby="v-pills-profile-tab">
								<div className="border-bottom mb-4 pb-4">
									<div className="row">
										<div className="col-md-12">
											<div
												className="d-flex align-items-center justify-content-between flex-wrap mb-2">
												<div className="d-flex align-items-center mb-3">
													<h4>Important Notes </h4>
													<div className="owl-nav slide-nav5 text-end nav-control ms-3"></div>
												</div>
												<div className="notes-close mb-3">
													<a href="javascript:void(0);" className="text-danger fs-15"><i
															className="fas fa-times me-1"></i> Close </a>
												</div>
											</div>
										</div>
										<div className="col-md-12">
											<div className="notes-slider owl-carousel">
												<div className="card rounded-3 mb-0">
													<div className="card-body p-4">
														<div className="d-flex align-items-center justify-content-between">
															<span
																className="badge bg-outline-warning d-inline-flex align-items-center"><i
																	className="fas fa-circle fs-6 me-1"></i>Medium</span>
															<div>
																<a href="javascript:void(0);" data-bs-toggle="dropdown"
																	aria-expanded="false">
																	<i className="fas fa-ellipsis-v"></i>
																</a>
																<div className="dropdown-menu notes-menu dropdown-menu-end">
																	<a href="#" className="dropdown-item"
																		data-bs-toggle="modal"
																		data-bs-target="#edit-note-units"><span><i
																				data-feather="edit"></i></span>Edit</a>
																	<a href="#" className="dropdown-item"
																		data-bs-toggle="modal"
																		data-bs-target="#delete_modal"><span><i
																				data-feather="trash-2"></i></span>Delete</a>
																	<a href="javascript:void(0);"
																		className="dropdown-item"><span><i
																				data-feather="star"></i></span>Not
																		Important</a>
																	<a href="#" className="dropdown-item"
																		data-bs-toggle="modal"
																		data-bs-target="#view-note-units"><span><i
																				data-feather="eye"></i></span>View</a>
																</div>
															</div>
														</div>
														<div className="my-3">
															<h5 className="text-truncate mb-1"><a
																	href="javascript:void(0);">Plan a trip to another
																	country</a></h5>
															<p className="mb-3 d-flex align-items-center text-dark"><i
																	className="ti ti-calendar me-1"></i>20 Jan 2024</p>
															<p className="text-truncate line-clamb-2 text-wrap">Space, the
																final frontier. These are the voyages of the Starship
																Enterprise.</p>
														</div>
														<div
															className="d-flex align-items-center justify-content-between border-top pt-3">
															<div className="d-flex align-items-center">
																<a href="javascript:void(0);"
																	className="avatar avatar-md me-2">
																	<img src="./assets/img/profiles/avatar-01.jpg"
																		alt="Profile" className="img-fluid rounded-circle" />
																</a>
																<span className="text-info d-flex align-items-center"><i
																		className="fas fa-square square-rotate fs-10 me-1"></i>Personal</span>
															</div>
															<div className="d-flex align-items-center">
																<a href="javascript:void(0);" className="me-2">
																	<span><i
																			className="fas fa-star text-warning"></i></span>
																</a>
																<a href="javascript:void(0);">
																	<span><i className="ti ti-trash text-danger"></i></span>
																</a>
															</div>
														</div>
													</div>
												</div>
												<div className="card rounded-3 mb-0">
													<div className="card-body p-4">
														<div className="d-flex align-items-center justify-content-between">
															<span
																className="badge bg-outline-danger d-inline-flex align-items-center"><i
																	className="fas fa-circle fs-6 me-1"></i>Low</span>
															<div>
																<a href="javascript:void(0);" data-bs-toggle="dropdown"
																	aria-expanded="false">
																	<i className="fas fa-ellipsis-v"></i>
																</a>
																<div className="dropdown-menu notes-menu dropdown-menu-end">
																	<a href="#" className="dropdown-item"
																		data-bs-toggle="modal"
																		data-bs-target="#edit-note-units"><span><i
																				data-feather="edit"></i></span>Edit</a>
																	<a href="#" className="dropdown-item"
																		data-bs-toggle="modal"
																		data-bs-target="#delete_modal"><span><i
																				data-feather="trash-2"></i></span>Delete</a>
																	<a href="javascript:void(0);"
																		className="dropdown-item"><span><i
																				data-feather="star"></i></span>Not
																		Important</a>
																	<a href="#" className="dropdown-item"
																		data-bs-toggle="modal"
																		data-bs-target="#view-note-units"><span><i
																				data-feather="eye"></i></span>View</a>
																</div>
															</div>
														</div>
														<div className="my-3">
															<h5 className="text-truncate mb-1"><a
																	href="javascript:void(0);">Improve touch typing</a>
															</h5>
															<p className="mb-3 d-flex align-items-center text-dark"><i
																	className="ti ti-calendar me-1"></i>22 Jan 2024</p>
															<p className="text-truncate line-clamb-2 text-wrap">Well, the
																way they make shows is, they make one show.</p>
														</div>
														<div
															className="d-flex align-items-center justify-content-between border-top pt-3">
															<div className="d-flex align-items-center">
																<a href="javascript:void(0);"
																	className="avatar avatar-md me-2">
																	<img src="./assets/img/profiles/avatar-02.jpg"
																		alt="Profile" className="img-fluid rounded-circle" />
																</a>
																<span className="text-success d-flex align-items-center"><i
																		className="fas fa-square square-rotate fs-10 me-1"></i>Work</span>
															</div>
															<div className="d-flex align-items-center">
																<a href="javascript:void(0);" className="me-2">
																	<span><i
																			className="fas fa-star text-warning"></i></span>
																</a>
																<a href="javascript:void(0);">
																	<span><i className="ti ti-trash text-danger"></i></span>
																</a>
															</div>
														</div>
													</div>
												</div>
												<div className="card rounded-3 mb-0">
													<div className="card-body p-4">
														<div className="d-flex align-items-center justify-content-between">
															<span
																className="badge bg-outline-danger d-inline-flex align-items-center"><i
																	className="fas fa-circle fs-6 me-1"></i>Low</span>
															<div>
																<a href="javascript:void(0);" data-bs-toggle="dropdown"
																	aria-expanded="false">
																	<i className="fas fa-ellipsis-v"></i>
																</a>
																<div className="dropdown-menu notes-menu dropdown-menu-end">
																	<a href="#" className="dropdown-item"
																		data-bs-toggle="modal"
																		data-bs-target="#edit-note-units"><span><i
																				data-feather="edit"></i></span>Edit</a>
																	<a href="#" className="dropdown-item"
																		data-bs-toggle="modal"
																		data-bs-target="#delete_modal"><span><i
																				data-feather="trash-2"></i></span>Delete</a>
																	<a href="javascript:void(0);"
																		className="dropdown-item"><span><i
																				data-feather="star"></i></span>Not
																		Important</a>
																	<a href="#" className="dropdown-item"
																		data-bs-toggle="modal"
																		data-bs-target="#view-note-units"><span><i
																				data-feather="eye"></i></span>View</a>
																</div>
															</div>
														</div>
														<div className="my-3">
															<h5 className="text-truncate mb-1"><a
																	href="javascript:void(0);">Learn calligraphy</a>
															</h5>
															<p className="mb-3 d-flex align-items-center text-dark"><i
																	className="ti ti-calendar me-1"></i>24 Jan 2024</p>
															<p className="text-truncate line-clamb-2 text-wrap">Calligraphy,
																the art of beautiful handwriting. The term may derive
																from the Greek words. </p>
														</div>
														<div
															className="d-flex align-items-center justify-content-between border-top pt-3">
															<div className="d-flex align-items-center">
																<a href="javascript:void(0);"
																	className="avatar avatar-md me-2">
																	<img src="./assets/img/profiles/avatar-03.jpg"
																		alt="Profile" className="img-fluid rounded-circle" />
																</a>
																<span className="text-info d-flex align-items-center"><i
																		className="fas fa-square square-rotate fs-10 me-1"></i>Social</span>
															</div>
															<div className="d-flex align-items-center">
																<a href="javascript:void(0);" className="me-2">
																	<span><i
																			className="fas fa-star text-warning"></i></span>
																</a>
																<a href="javascript:void(0);">
																	<span><i className="ti ti-trash text-danger"></i></span>
																</a>
															</div>
														</div>
													</div>
												</div>
												<div className="card rounded-3 mb-0">
													<div className="card-body p-4">
														<div className="d-flex align-items-center justify-content-between">
															<span
																className="badge bg-outline-warning d-inline-flex align-items-center"><i
																	className="fas fa-circle fs-6 me-1"></i>Medium</span>
															<div>
																<a href="javascript:void(0);" data-bs-toggle="dropdown"
																	aria-expanded="false">
																	<i className="fas fa-ellipsis-v"></i>
																</a>
																<div className="dropdown-menu notes-menu dropdown-menu-end">
																	<a href="#" className="dropdown-item"
																		data-bs-toggle="modal"
																		data-bs-target="#edit-note-units"><span><i
																				data-feather="edit"></i></span>Edit</a>
																	<a href="#" className="dropdown-item"
																		data-bs-toggle="modal"
																		data-bs-target="#delete_modal"><span><i
																				data-feather="trash-2"></i></span>Delete</a>
																	<a href="javascript:void(0);"
																		className="dropdown-item"><span><i
																				data-feather="star"></i></span>Not
																		Important</a>
																	<a href="#" className="dropdown-item"
																		data-bs-toggle="modal"
																		data-bs-target="#view-note-units"><span><i
																				data-feather="eye"></i></span>View</a>
																</div>
															</div>
														</div>
														<div className="my-3">
															<h5 className="text-truncate mb-1"><a
																	href="javascript:void(0);">Plan a trip to another
																	country</a></h5>
															<p className="mb-3 d-flex align-items-center text-dark"><i
																	className="ti ti-calendar me-1"></i>25 Jan 2024</p>
															<p className="text-truncate line-clamb-2 text-wrap">Space, the
																final frontier. These are the voyages of the Starship
																Enterprise.</p>
														</div>
														<div
															className="d-flex align-items-center justify-content-between border-top pt-3">
															<div className="d-flex align-items-center">
																<a href="javascript:void(0);"
																	className="avatar avatar-md me-2">
																	<img src="./assets/img/profiles/avatar-01.jpg"
																		alt="Profile" className="img-fluid rounded-circle" />
																</a>
																<span className="text-info d-flex align-items-center"><i
																		className="fas fa-square square-rotate fs-10 me-1"></i>Personal</span>
															</div>
															<div className="d-flex align-items-center">
																<a href="javascript:void(0);" className="me-2">
																	<span><i
																			className="fas fa-star text-warning"></i></span>
																</a>
																<a href="javascript:void(0);">
																	<span><i className="ti ti-trash text-danger"></i></span>
																</a>
															</div>
														</div>
													</div>
												</div>
												<div className="card rounded-3 mb-0">
													<div className="card-body p-4">
														<div className="d-flex align-items-center justify-content-between">
															<span
																className="badge bg-outline-danger d-inline-flex align-items-center"><i
																	className="fas fa-circle fs-6 me-1"></i>Low</span>
															<div>
																<a href="javascript:void(0);" data-bs-toggle="dropdown"
																	aria-expanded="false">
																	<i className="fas fa-ellipsis-v"></i>
																</a>
																<div className="dropdown-menu notes-menu dropdown-menu-end">
																	<a href="#" className="dropdown-item"
																		data-bs-toggle="modal"
																		data-bs-target="#edit-note-units"><span><i
																				data-feather="edit"></i></span>Edit</a>
																	<a href="#" className="dropdown-item"
																		data-bs-toggle="modal"
																		data-bs-target="#delete_modal"><span><i
																				data-feather="trash-2"></i></span>Delete</a>
																	<a href="javascript:void(0);"
																		className="dropdown-item"><span><i
																				data-feather="star"></i></span>Not
																		Important</a>
																	<a href="#" className="dropdown-item"
																		data-bs-toggle="modal"
																		data-bs-target="#view-note-units"><span><i
																				data-feather="eye"></i></span>View</a>
																</div>
															</div>
														</div>
														<div className="my-3">
															<h5 className="text-truncate mb-1"><a
																	href="javascript:void(0);">Improve touch typing</a>
															</h5>
															<p className="mb-3 d-flex align-items-center text-dark"><i
																	className="ti ti-calendar me-1"></i>26 Jan 2024</p>
															<p className="text-truncate line-clamb-2 text-wrap">Well, the
																way they make shows is, they make one show.</p>
														</div>
														<div
															className="d-flex align-items-center justify-content-between border-top pt-3">
															<div className="d-flex align-items-center">
																<a href="javascript:void(0);"
																	className="avatar avatar-md me-2">
																	<img src="./assets/img/profiles/avatar-02.jpg"
																		alt="Profile" className="img-fluid rounded-circle" />
																</a>
																<span className="text-success d-flex align-items-center"><i
																		className="fas fa-square square-rotate fs-10 me-1"></i>Work</span>
															</div>
															<div className="d-flex align-items-center">
																<a href="javascript:void(0);" className="me-2">
																	<span><i
																			className="fas fa-star text-warning"></i></span>
																</a>
																<a href="javascript:void(0);">
																	<span><i className="ti ti-trash text-danger"></i></span>
																</a>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div className="row">
									<div className="col-md-4 d-flex">
										<div className="card rounded-3 mb-4 flex-fill">
											<div className="card-body p-4">
												<div className="d-flex align-items-center justify-content-between">
													<span
														className="badge bg-outline-success d-inline-flex align-items-center"><i
															className="fas fa-circle fs-6 me-1"></i>High</span>
													<div>
														<a href="javascript:void(0);" data-bs-toggle="dropdown"
															aria-expanded="false">
															<i className="fas fa-ellipsis-v"></i>
														</a>
														<div className="dropdown-menu notes-menu dropdown-menu-end">
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#edit-note-units"><span><i
																		data-feather="edit"></i></span>Edit</a>
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#delete_modal"><span><i
																		data-feather="trash-2"></i></span>Delete</a>
															<a href="javascript:void(0);" className="dropdown-item"><span><i
																		data-feather="star"></i></span>Not Important</a>
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#view-note-units"><span><i
																		data-feather="eye"></i></span>View</a>
														</div>
													</div>
												</div>
												<div className="my-3">
													<h5 className="text-truncate mb-1"><a href="javascript:void(0);">Backup
															Files EOD</a></h5>
													<p className="mb-3 d-flex align-items-center text-dark"><i
															className="ti ti-calendar me-1"></i>20 Jan 2024</p>
													<p className="text-truncate line-clamb-2 text-wrap">Project files should
														be took backup before end of the day.</p>
												</div>
												<div
													className="d-flex align-items-center justify-content-between border-top pt-3">
													<div className="d-flex align-items-center">
														<a href="javascript:void(0);" className="avatar avatar-md me-2">
															<img src="./assets/img/profiles/avatar-05.jpg" alt="Profile"
																className="img-fluid rounded-circle" />
														</a>
														<span className="text-info d-flex align-items-center"><i
																className="fas fa-square square-rotate fs-10 me-1"></i>Personal</span>
													</div>
													<div className="d-flex align-items-center">
														<a href="javascript:void(0);" className="me-2">
															<span><i className="fas fa-star text-warning"></i></span>
														</a>
														<a href="javascript:void(0);">
															<span><i className="ti ti-trash text-danger"></i></span>
														</a>
													</div>
												</div>
											</div>
										</div>
									</div>
									<div className="col-md-4 d-flex">
										<div className="card rounded-3 mb-4 flex-fill">
											<div className="card-body p-4">
												<div className="d-flex align-items-center justify-content-between">
													<span
														className="badge bg-outline-danger d-inline-flex align-items-center"><i
															className="fas fa-circle fs-6 me-1"></i>Low</span>
													<div>
														<a href="javascript:void(0);" data-bs-toggle="dropdown"
															aria-expanded="false">
															<i className="fas fa-ellipsis-v"></i>
														</a>
														<div className="dropdown-menu notes-menu dropdown-menu-end">
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#edit-note-units"><span><i
																		data-feather="edit"></i></span>Edit</a>
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#delete_modal"><span><i
																		data-feather="trash-2"></i></span>Delete</a>
															<a href="javascript:void(0);" className="dropdown-item"><span><i
																		data-feather="star"></i></span>Not Important</a>
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#view-note-units"><span><i
																		data-feather="eye"></i></span>View</a>
														</div>
													</div>
												</div>
												<div className="my-3">
													<h5 className="text-truncate mb-1"><a
															href="javascript:void(0);">Download Server Logs</a></h5>
													<p className="mb-3 d-flex align-items-center text-dark"><i
															className="ti ti-calendar me-1"></i>25 Jan 2024</p>
													<p className="text-truncate line-clamb-2 text-wrap">Server log is a text
														document that contains a record of all activity.</p>
												</div>
												<div
													className="d-flex align-items-center justify-content-between border-top pt-3">
													<div className="d-flex align-items-center">
														<a href="javascript:void(0);" className="avatar avatar-md me-2">
															<img src="./assets/img/profiles/avatar-06.jpg" alt="Profile"
																className="img-fluid rounded-circle" />
														</a>
														<span className="text-success d-flex align-items-center"><i
																className="fas fa-square square-rotate fs-10 me-1"></i>Work</span>
													</div>
													<div className="d-flex align-items-center">
														<a href="javascript:void(0);" className="me-2">
															<span><i className="fas fa-star text-warning"></i></span>
														</a>
														<a href="javascript:void(0);">
															<span><i className="ti ti-trash text-danger"></i></span>
														</a>
													</div>
												</div>
											</div>
										</div>
									</div>
									<div className="col-md-4 d-flex">
										<div className="card rounded-3 mb-4 flex-fill">
											<div className="card-body p-4">
												<div className="d-flex align-items-center justify-content-between">
													<span
														className="badge bg-outline-warning d-inline-flex align-items-center"><i
															className="fas fa-circle fs-6 me-1"></i>Medium</span>
													<div>
														<a href="javascript:void(0);" data-bs-toggle="dropdown"
															aria-expanded="false">
															<i className="fas fa-ellipsis-v"></i>
														</a>
														<div className="dropdown-menu notes-menu dropdown-menu-end">
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#edit-note-units"><span><i
																		data-feather="edit"></i></span>Edit</a>
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#delete_modal"><span><i
																		data-feather="trash-2"></i></span>Delete</a>
															<a href="javascript:void(0);" className="dropdown-item"><span><i
																		data-feather="star"></i></span>Not Important</a>
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#view-note-units"><span><i
																		data-feather="eye"></i></span>View</a>
														</div>
													</div>
												</div>
												<div className="my-3">
													<h5 className="text-truncate mb-1"><a href="javascript:void(0);">Team
															meet at Starbucks</a></h5>
													<p className="mb-3 d-flex align-items-center text-dark"><i
															className="ti ti-calendar me-1"></i>26 Jan 2024</p>
													<p className="text-truncate line-clamb-2 text-wrap">Meeting all teamets
														at Starbucks for identifying them all.</p>
												</div>
												<div
													className="d-flex align-items-center justify-content-between border-top pt-3">
													<div className="d-flex align-items-center">
														<a href="javascript:void(0);" className="avatar avatar-md me-2">
															<img src="./assets/img/profiles/avatar-07.jpg" alt="Profile"
																className="img-fluid rounded-circle" />
														</a>
														<span className="text-warning d-flex align-items-center"><i
																className="fas fa-square square-rotate fs-10 me-1"></i>Social</span>
													</div>
													<div className="d-flex align-items-center">
														<a href="javascript:void(0);" className="me-2">
															<span><i className="fas fa-star text-warning"></i></span>
														</a>
														<a href="javascript:void(0);">
															<span><i className="ti ti-trash text-danger"></i></span>
														</a>
													</div>
												</div>
											</div>
										</div>
									</div>
									<div className="col-md-4 d-flex">
										<div className="card rounded-3 mb-4 flex-fill">
											<div className="card-body p-4">
												<div className="d-flex align-items-center justify-content-between">
													<span
														className="badge bg-outline-success d-inline-flex align-items-center"><i
															className="fas fa-circle fs-6 me-1"></i>High</span>
													<div>
														<a href="javascript:void(0);" data-bs-toggle="dropdown"
															aria-expanded="false">
															<i className="fas fa-ellipsis-v"></i>
														</a>
														<div className="dropdown-menu notes-menu dropdown-menu-end">
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#edit-note-units"><span><i
																		data-feather="edit"></i></span>Edit</a>
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#delete_modal"><span><i
																		data-feather="trash-2"></i></span>Delete</a>
															<a href="javascript:void(0);" className="dropdown-item"><span><i
																		data-feather="star"></i></span>Not Important</a>
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#view-note-units"><span><i
																		data-feather="eye"></i></span>View</a>
														</div>
													</div>
												</div>
												<div className="my-3">
													<h5 className="text-truncate mb-1"><a href="javascript:void(0);">Create
															a compost pile</a></h5>
													<p className="mb-3 d-flex align-items-center text-dark"><i
															className="ti ti-calendar me-1"></i>27 Jan 2024</p>
													<p className="text-truncate line-clamb-2 text-wrap">Compost pile refers
														to fruit and vegetable scraps, used tea, coffee grounds etc..
													</p>
												</div>
												<div
													className="d-flex align-items-center justify-content-between border-top pt-3">
													<div className="d-flex align-items-center">
														<a href="javascript:void(0);" className="avatar avatar-md me-2">
															<img src="./assets/img/profiles/avatar-08.jpg" alt="Profile"
																className="img-fluid rounded-circle" />
														</a>
														<span className="text-warning d-flex align-items-center"><i
																className="fas fa-square square-rotate fs-10 me-1"></i>Social</span>
													</div>
													<div className="d-flex align-items-center">
														<a href="javascript:void(0);" className="me-2">
															<span><i className="fas fa-star text-warning"></i></span>
														</a>
														<a href="javascript:void(0);">
															<span><i className="ti ti-trash text-danger"></i></span>
														</a>
													</div>
												</div>
											</div>
										</div>
									</div>
									<div className="col-md-4 d-flex">
										<div className="card rounded-3 mb-4 flex-fill">
											<div className="card-body p-4">
												<div className="d-flex align-items-center justify-content-between">
													<span
														className="badge bg-outline-danger d-inline-flex align-items-center"><i
															className="fas fa-circle fs-6 me-1"></i>Low</span>
													<div>
														<a href="javascript:void(0);" data-bs-toggle="dropdown"
															aria-expanded="false">
															<i className="fas fa-ellipsis-v"></i>
														</a>
														<div className="dropdown-menu notes-menu dropdown-menu-end">
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#edit-note-units"><span><i
																		data-feather="edit"></i></span>Edit</a>
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#delete_modal"><span><i
																		data-feather="trash-2"></i></span>Delete</a>
															<a href="javascript:void(0);" className="dropdown-item"><span><i
																		data-feather="star"></i></span>Not Important</a>
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#view-note-units"><span><i
																		data-feather="eye"></i></span>View</a>
														</div>
													</div>
												</div>
												<div className="my-3">
													<h5 className="text-truncate mb-1"><a href="javascript:void(0);">Take a
															hike at a local park</a></h5>
													<p className="mb-3 d-flex align-items-center text-dark"><i
															className="ti ti-calendar me-1"></i>28 Jan 2024</p>
													<p className="text-truncate line-clamb-2 text-wrap">Hiking involves a
														long energetic walk in a natural environment.</p>
												</div>
												<div
													className="d-flex align-items-center justify-content-between border-top pt-3">
													<div className="d-flex align-items-center">
														<a href="javascript:void(0);" className="avatar avatar-md me-2">
															<img src="./assets/img/profiles/avatar-09.jpg" alt="Profile"
																className="img-fluid rounded-circle" />
														</a>
														<span className="text-info d-flex align-items-center"><i
																className="fas fa-square square-rotate fs-10 me-1"></i>Personal</span>
													</div>
													<div className="d-flex align-items-center">
														<a href="javascript:void(0);" className="me-2">
															<span><i className="fas fa-star text-warning"></i></span>
														</a>
														<a href="javascript:void(0);">
															<span><i className="ti ti-trash text-danger"></i></span>
														</a>
													</div>
												</div>
											</div>
										</div>
									</div>
									<div className="col-md-4 d-flex">
										<div className="card rounded-3 mb-4 flex-fill">
											<div className="card-body p-4">
												<div className="d-flex align-items-center justify-content-between">
													<span
														className="badge bg-outline-info d-inline-flex align-items-center"><i
															className="fas fa-circle fs-6 me-1"></i>medium</span>
													<div>
														<a href="javascript:void(0);" data-bs-toggle="dropdown"
															aria-expanded="false">
															<i className="fas fa-ellipsis-v"></i>
														</a>
														<div className="dropdown-menu notes-menu dropdown-menu-end">
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#edit-note-units"><span><i
																		data-feather="edit"></i></span>Edit</a>
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#delete_modal"><span><i
																		data-feather="trash-2"></i></span>Delete</a>
															<a href="javascript:void(0);" className="dropdown-item"><span><i
																		data-feather="star"></i></span>Not Important</a>
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#view-note-units"><span><i
																		data-feather="eye"></i></span>View</a>
														</div>
													</div>
												</div>
												<div className="my-3">
													<h5 className="text-truncate mb-1"><a
															href="javascript:void(0);">Research a topic interested</a>
													</h5>
													<p className="mb-3 d-flex align-items-center text-dark"><i
															className="ti ti-calendar me-1"></i>28 Jan 2024</p>
													<p className="text-truncate line-clamb-2 text-wrap">Research a topic
														interested by listen actively and attentively.</p>
												</div>
												<div
													className="d-flex align-items-center justify-content-between border-top pt-3">
													<div className="d-flex align-items-center">
														<a href="javascript:void(0);" className="avatar avatar-md me-2">
															<img src="./assets/img/profiles/avatar-10.jpg" alt="Profile"
																className="img-fluid rounded-circle" />
														</a>
														<span className="text-success d-flex align-items-center"><i
																className="fas fa-square square-rotate fs-10 me-1"></i>Work</span>
													</div>
													<div className="d-flex align-items-center">
														<a href="javascript:void(0);" className="me-2">
															<span><i className="fas fa-star text-warning"></i></span>
														</a>
														<a href="javascript:void(0);">
															<span><i className="ti ti-trash text-danger"></i></span>
														</a>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
							<div className="tab-pane fade" id="v-pills-messages" role="tabpanel"
								aria-labelledby="v-pills-messages-tab">
								<div className="row">
									<div className="col-md-4 d-flex">
										<div className="card rounded-3 mb-4 flex-fill">
											<div className="card-body p-4">
												<div className="d-flex align-items-center justify-content-between">
													<span
														className="badge bg-outline-success d-inline-flex align-items-center"><i
															className="fas fa-circle fs-6 me-1"></i>High</span>
													<div>
														<a href="javascript:void(0);" data-bs-toggle="dropdown"
															aria-expanded="false">
															<i className="fas fa-ellipsis-v"></i>
														</a>
														<div className="dropdown-menu notes-menu dropdown-menu-end">
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#edit-note-units"><span><i
																		data-feather="edit"></i></span>Edit</a>
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#delete_modal"><span><i
																		data-feather="trash-2"></i></span>Delete</a>
															<a href="javascript:void(0);" className="dropdown-item"><span><i
																		data-feather="star"></i></span>Not Important</a>
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#view-note-units"><span><i
																		data-feather="eye"></i></span>View</a>
														</div>
													</div>
												</div>
												<div className="my-3">
													<h5 className="text-truncate mb-1"><a href="javascript:void(0);">Backup
															Files EOD</a></h5>
													<p className="mb-3 d-flex align-items-center text-dark"><i
															className="ti ti-calendar me-1"></i>20 Jan 2024</p>
													<p className="text-truncate line-clamb-2 text-wrap">Project files should
														be took backup before end of the day.</p>
												</div>
												<div
													className="d-flex align-items-center justify-content-between border-top pt-3">
													<div className="d-flex align-items-center">
														<a href="javascript:void(0);" className="avatar avatar-md me-2">
															<img src="./assets/img/profiles/avatar-05.jpg" alt="Profile"
																className="img-fluid rounded-circle" />
														</a>
														<span className="text-info d-flex align-items-center"><i
																className="fas fa-square square-rotate fs-10 me-1"></i>Personal</span>
													</div>
													<div className="d-flex align-items-center">
														<a href="javascript:void(0);" className="me-2">
															<span><i className="fas fa-star text-warning"></i></span>
														</a>
														<a href="javascript:void(0);">
															<span><i className="ti ti-trash text-danger"></i></span>
														</a>
													</div>
												</div>
											</div>
										</div>
									</div>
									<div className="col-md-4 d-flex">
										<div className="card rounded-3 mb-4 flex-fill">
											<div className="card-body p-4">
												<div className="d-flex align-items-center justify-content-between">
													<span
														className="badge bg-outline-danger d-inline-flex align-items-center"><i
															className="fas fa-circle fs-6 me-1"></i>Low</span>
													<div>
														<a href="javascript:void(0);" data-bs-toggle="dropdown"
															aria-expanded="false">
															<i className="fas fa-ellipsis-v"></i>
														</a>
														<div className="dropdown-menu notes-menu dropdown-menu-end">
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#edit-note-units"><span><i
																		data-feather="edit"></i></span>Edit</a>
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#delete_modal"><span><i
																		data-feather="trash-2"></i></span>Delete</a>
															<a href="javascript:void(0);" className="dropdown-item"><span><i
																		data-feather="star"></i></span>Not Important</a>
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#view-note-units"><span><i
																		data-feather="eye"></i></span>View</a>
														</div>
													</div>
												</div>
												<div className="my-3">
													<h5 className="text-truncate mb-1"><a
															href="javascript:void(0);">Download Server Logs</a></h5>
													<p className="mb-3 d-flex align-items-center text-dark"><i
															className="ti ti-calendar me-1"></i>25 Jan 2024</p>
													<p className="text-truncate line-clamb-2 text-wrap">Server log is a text
														document that contains a record of all activity.</p>
												</div>
												<div
													className="d-flex align-items-center justify-content-between border-top pt-3">
													<div className="d-flex align-items-center">
														<a href="javascript:void(0);" className="avatar avatar-md me-2">
															<img src="./assets/img/profiles/avatar-06.jpg" alt="Profile"
																className="img-fluid rounded-circle" />
														</a>
														<span className="text-success d-flex align-items-center"><i
																className="fas fa-square square-rotate fs-10 me-1"></i>Work</span>
													</div>
													<div className="d-flex align-items-center">
														<a href="javascript:void(0);" className="me-2">
															<span><i className="fas fa-star text-warning"></i></span>
														</a>
														<a href="javascript:void(0);">
															<span><i className="ti ti-trash text-danger"></i></span>
														</a>
													</div>
												</div>
											</div>
										</div>
									</div>
									<div className="col-md-4 d-flex">
										<div className="card rounded-3 mb-4 flex-fill">
											<div className="card-body p-4">
												<div className="d-flex align-items-center justify-content-between">
													<span
														className="badge bg-outline-warning d-inline-flex align-items-center"><i
															className="fas fa-circle fs-6 me-1"></i>Medium</span>
													<div>
														<a href="javascript:void(0);" data-bs-toggle="dropdown"
															aria-expanded="false">
															<i className="fas fa-ellipsis-v"></i>
														</a>
														<div className="dropdown-menu notes-menu dropdown-menu-end">
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#edit-note-units"><span><i
																		data-feather="edit"></i></span>Edit</a>
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#delete_modal"><span><i
																		data-feather="trash-2"></i></span>Delete</a>
															<a href="javascript:void(0);" className="dropdown-item"><span><i
																		data-feather="star"></i></span>Not Important</a>
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#view-note-units"><span><i
																		data-feather="eye"></i></span>View</a>
														</div>
													</div>
												</div>
												<div className="my-3">
													<h5 className="text-truncate mb-1"><a href="javascript:void(0);">Team
															meet at Starbucks</a></h5>
													<p className="mb-3 d-flex align-items-center text-dark"><i
															className="ti ti-calendar me-1"></i>26 Jan 2024</p>
													<p className="text-truncate line-clamb-2 text-wrap">Meeting all teamets
														at Starbucks for identifying them all.</p>
												</div>
												<div
													className="d-flex align-items-center justify-content-between border-top pt-3">
													<div className="d-flex align-items-center">
														<a href="javascript:void(0);" className="avatar avatar-md me-2">
															<img src="./assets/img/profiles/avatar-07.jpg" alt="Profile"
																className="img-fluid rounded-circle" />
														</a>
														<span className="text-warning d-flex align-items-center"><i
																className="fas fa-square square-rotate fs-10 me-1"></i>Social</span>
													</div>
													<div className="d-flex align-items-center">
														<a href="javascript:void(0);" className="me-2">
															<span><i className="fas fa-star text-warning"></i></span>
														</a>
														<a href="javascript:void(0);">
															<span><i className="ti ti-trash text-danger"></i></span>
														</a>
													</div>
												</div>
											</div>
										</div>
									</div>
									<div className="col-md-4 d-flex">
										<div className="card rounded-3 mb-4 flex-fill">
											<div className="card-body p-4">
												<div className="d-flex align-items-center justify-content-between">
													<span
														className="badge bg-outline-success d-inline-flex align-items-center"><i
															className="fas fa-circle fs-6 me-1"></i>High</span>
													<div>
														<a href="javascript:void(0);" data-bs-toggle="dropdown"
															aria-expanded="false">
															<i className="fas fa-ellipsis-v"></i>
														</a>
														<div className="dropdown-menu notes-menu dropdown-menu-end">
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#edit-note-units"><span><i
																		data-feather="edit"></i></span>Edit</a>
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#delete_modal"><span><i
																		data-feather="trash-2"></i></span>Delete</a>
															<a href="javascript:void(0);" className="dropdown-item"><span><i
																		data-feather="star"></i></span>Not Important</a>
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#view-note-units"><span><i
																		data-feather="eye"></i></span>View</a>
														</div>
													</div>
												</div>
												<div className="my-3">
													<h5 className="text-truncate mb-1"><a href="javascript:void(0);">Create
															a compost pile</a></h5>
													<p className="mb-3 d-flex align-items-center text-dark"><i
															className="ti ti-calendar me-1"></i>27 Jan 2024</p>
													<p className="text-truncate line-clamb-2 text-wrap">Compost pile refers
														to fruit and vegetable scraps, used tea, coffee grounds etc..
													</p>
												</div>
												<div
													className="d-flex align-items-center justify-content-between border-top pt-3">
													<div className="d-flex align-items-center">
														<a href="javascript:void(0);" className="avatar avatar-md me-2">
															<img src="./assets/img/profiles/avatar-08.jpg" alt="Profile"
																className="img-fluid rounded-circle" />
														</a>
														<span className="text-warning d-flex align-items-center"><i
																className="fas fa-square square-rotate fs-10 me-1"></i>Social</span>
													</div>
													<div className="d-flex align-items-center">
														<a href="javascript:void(0);" className="me-2">
															<span><i className="fas fa-star text-warning"></i></span>
														</a>
														<a href="javascript:void(0);">
															<span><i className="ti ti-trash text-danger"></i></span>
														</a>
													</div>
												</div>
											</div>
										</div>
									</div>
									<div className="col-md-4 d-flex">
										<div className="card rounded-3 mb-4 flex-fill">
											<div className="card-body p-4">
												<div className="d-flex align-items-center justify-content-between">
													<span
														className="badge bg-outline-danger d-inline-flex align-items-center"><i
															className="fas fa-circle fs-6 me-1"></i>Low</span>
													<div>
														<a href="javascript:void(0);" data-bs-toggle="dropdown"
															aria-expanded="false">
															<i className="fas fa-ellipsis-v"></i>
														</a>
														<div className="dropdown-menu notes-menu dropdown-menu-end">
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#edit-note-units"><span><i
																		data-feather="edit"></i></span>Edit</a>
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#delete_modal"><span><i
																		data-feather="trash-2"></i></span>Delete</a>
															<a href="javascript:void(0);" className="dropdown-item"><span><i
																		data-feather="star"></i></span>Not Important</a>
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#view-note-units"><span><i
																		data-feather="eye"></i></span>View</a>
														</div>
													</div>
												</div>
												<div className="my-3">
													<h5 className="text-truncate mb-1"><a href="javascript:void(0);">Take a
															hike at a local park</a></h5>
													<p className="mb-3 d-flex align-items-center text-dark"><i
															className="ti ti-calendar me-1"></i>28 Jan 2024</p>
													<p className="text-truncate line-clamb-2 text-wrap">Hiking involves a
														long energetic walk in a natural environment.</p>
												</div>
												<div
													className="d-flex align-items-center justify-content-between border-top pt-3">
													<div className="d-flex align-items-center">
														<a href="javascript:void(0);" className="avatar avatar-md me-2">
															<img src="./assets/img/profiles/avatar-09.jpg" alt="Profile"
																className="img-fluid rounded-circle" />
														</a>
														<span className="text-info d-flex align-items-center"><i
																className="fas fa-square square-rotate fs-10 me-1"></i>Personal</span>
													</div>
													<div className="d-flex align-items-center">
														<a href="javascript:void(0);" className="me-2">
															<span><i className="fas fa-star text-warning"></i></span>
														</a>
														<a href="javascript:void(0);">
															<span><i className="ti ti-trash text-danger"></i></span>
														</a>
													</div>
												</div>
											</div>
										</div>
									</div>
									<div className="col-md-4 d-flex">
										<div className="card rounded-3 mb-4 flex-fill">
											<div className="card-body p-4">
												<div className="d-flex align-items-center justify-content-between">
													<span
														className="badge bg-outline-info d-inline-flex align-items-center"><i
															className="fas fa-circle fs-6 me-1"></i>medium</span>
													<div>
														<a href="javascript:void(0);" data-bs-toggle="dropdown"
															aria-expanded="false">
															<i className="fas fa-ellipsis-v"></i>
														</a>
														<div className="dropdown-menu notes-menu dropdown-menu-end">
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#edit-note-units"><span><i
																		data-feather="edit"></i></span>Edit</a>
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#delete_modal"><span><i
																		data-feather="trash-2"></i></span>Delete</a>
															<a href="javascript:void(0);" className="dropdown-item"><span><i
																		data-feather="star"></i></span>Not Important</a>
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#view-note-units"><span><i
																		data-feather="eye"></i></span>View</a>
														</div>
													</div>
												</div>
												<div className="my-3">
													<h5 className="text-truncate mb-1"><a
															href="javascript:void(0);">Research a topic interested</a>
													</h5>
													<p className="mb-3 d-flex align-items-center text-dark"><i
															className="ti ti-calendar me-1"></i>28 Jan 2024</p>
													<p className="text-truncate line-clamb-2 text-wrap">Research a topic
														interested by listen actively and attentively.</p>
												</div>
												<div
													className="d-flex align-items-center justify-content-between border-top pt-3">
													<div className="d-flex align-items-center">
														<a href="javascript:void(0);" className="avatar avatar-md me-2">
															<img src="./assets/img/profiles/avatar-10.jpg" alt="Profile"
																className="img-fluid rounded-circle" />
														</a>
														<span className="text-success d-flex align-items-center"><i
																className="fas fa-square square-rotate fs-10 me-1"></i>Work</span>
													</div>
													<div className="d-flex align-items-center">
														<a href="javascript:void(0);" className="me-2">
															<span><i className="fas fa-star text-warning"></i></span>
														</a>
														<a href="javascript:void(0);">
															<span><i className="ti ti-trash text-danger"></i></span>
														</a>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
							<div className="tab-pane fade" id="v-pills-settings" role="tabpanel"
								aria-labelledby="v-pills-settings-tab">
								<div className="row">
									<div className="col-12 d-flex align-items-center justify-content-end">
										<a href="#" className="btn btn-danger mb-4">
											<span> <i className="ti ti-trash f-20 me-2"></i> </span>
											Restore all
										</a>
									</div>
								</div>
								<div className="row">
									<div className="col-md-4 d-flex">
										<div className="card rounded-3 mb-4 flex-fill">
											<div className="card-body p-4">
												<div className="d-flex align-items-center justify-content-between">
													<span
														className="badge bg-outline-success d-inline-flex align-items-center"><i
															className="fas fa-circle fs-6 me-1"></i>High</span>
													<div>
														<a href="javascript:void(0);" data-bs-toggle="dropdown"
															aria-expanded="false">
															<i className="fas fa-ellipsis-v"></i>
														</a>
														<div className="dropdown-menu notes-menu dropdown-menu-end">
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#edit-note-units"><span><i
																		data-feather="edit"></i></span>Edit</a>
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#delete_modal"><span><i
																		data-feather="trash-2"></i></span>Delete</a>
															<a href="javascript:void(0);" className="dropdown-item"><span><i
																		data-feather="star"></i></span>Not Important</a>
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#view-note-units"><span><i
																		data-feather="eye"></i></span>View</a>
														</div>
													</div>
												</div>
												<div className="my-3">
													<h5 className="text-truncate mb-1"><a href="javascript:void(0);">Create
															a compost pile</a></h5>
													<p className="mb-3 d-flex align-items-center text-dark"><i
															className="ti ti-calendar me-1"></i>27 Jan 2024</p>
													<p className="text-truncate line-clamb-2 text-wrap">Compost pile refers
														to fruit and vegetable scraps, used tea, coffee grounds etc..
													</p>
												</div>
												<div
													className="d-flex align-items-center justify-content-between border-top pt-3">
													<div className="d-flex align-items-center">
														<a href="javascript:void(0);" className="avatar avatar-md me-2">
															<img src="./assets/img/profiles/avatar-08.jpg" alt="Profile"
																className="img-fluid rounded-circle" />
														</a>
														<span className="text-warning d-flex align-items-center"><i
																className="fas fa-square square-rotate fs-10 me-1"></i>Social</span>
													</div>
													<div className="d-flex align-items-center">
														<a href="javascript:void(0);" className="me-2">
															<span><i className="fas fa-star text-warning"></i></span>
														</a>
														<a href="javascript:void(0);">
															<span><i className="ti ti-trash text-danger"></i></span>
														</a>
													</div>
												</div>
											</div>
										</div>
									</div>
									<div className="col-md-4 d-flex">
										<div className="card rounded-3 mb-4 flex-fill">
											<div className="card-body p-4">
												<div className="d-flex align-items-center justify-content-between">
													<span
														className="badge bg-outline-danger d-inline-flex align-items-center"><i
															className="fas fa-circle fs-6 me-1"></i>Low</span>
													<div>
														<a href="javascript:void(0);" data-bs-toggle="dropdown"
															aria-expanded="false">
															<i className="fas fa-ellipsis-v"></i>
														</a>
														<div className="dropdown-menu notes-menu dropdown-menu-end">
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#edit-note-units"><span><i
																		data-feather="edit"></i></span>Edit</a>
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#delete_modal"><span><i
																		data-feather="trash-2"></i></span>Delete</a>
															<a href="javascript:void(0);" className="dropdown-item"><span><i
																		data-feather="star"></i></span>Not Important</a>
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#view-note-units"><span><i
																		data-feather="eye"></i></span>View</a>
														</div>
													</div>
												</div>
												<div className="my-3">
													<h5 className="text-truncate mb-1"><a href="javascript:void(0);">Take a
															hike at a local park</a></h5>
													<p className="mb-3 d-flex align-items-center text-dark"><i
															className="ti ti-calendar me-1"></i>28 Jan 2024</p>
													<p className="text-truncate line-clamb-2 text-wrap">Hiking involves a
														long energetic walk in a natural environment.</p>
												</div>
												<div
													className="d-flex align-items-center justify-content-between border-top pt-3">
													<div className="d-flex align-items-center">
														<a href="javascript:void(0);" className="avatar avatar-md me-2">
															<img src="./assets/img/profiles/avatar-09.jpg" alt="Profile"
																className="img-fluid rounded-circle" />
														</a>
														<span className="text-info d-flex align-items-center"><i
																className="fas fa-square square-rotate fs-10 me-1"></i>Personal</span>
													</div>
													<div className="d-flex align-items-center">
														<a href="javascript:void(0);" className="me-2">
															<span><i className="fas fa-star text-warning"></i></span>
														</a>
														<a href="javascript:void(0);">
															<span><i className="ti ti-trash text-danger"></i></span>
														</a>
													</div>
												</div>
											</div>
										</div>
									</div>
									<div className="col-md-4 d-flex">
										<div className="card rounded-3 mb-4 flex-fill">
											<div className="card-body p-4">
												<div className="d-flex align-items-center justify-content-between">
													<span
														className="badge bg-outline-info d-inline-flex align-items-center"><i
															className="fas fa-circle fs-6 me-1"></i>medium</span>
													<div>
														<a href="javascript:void(0);" data-bs-toggle="dropdown"
															aria-expanded="false">
															<i className="fas fa-ellipsis-v"></i>
														</a>
														<div className="dropdown-menu notes-menu dropdown-menu-end">
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#edit-note-units"><span><i
																		data-feather="edit"></i></span>Edit</a>
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#delete_modal"><span><i
																		data-feather="trash-2"></i></span>Delete</a>
															<a href="javascript:void(0);" className="dropdown-item"><span><i
																		data-feather="star"></i></span>Not Important</a>
															<a href="#" className="dropdown-item" data-bs-toggle="modal"
																data-bs-target="#view-note-units"><span><i
																		data-feather="eye"></i></span>View</a>
														</div>
													</div>
												</div>
												<div className="my-3">
													<h5 className="text-truncate mb-1"><a
															href="javascript:void(0);">Research a topic interested</a>
													</h5>
													<p className="mb-3 d-flex align-items-center text-dark"><i
															className="ti ti-calendar me-1"></i>28 Jan 2024</p>
													<p className="text-truncate line-clamb-2 text-wrap">Research a topic
														interested by listen actively and attentively.</p>
												</div>
												<div
													className="d-flex align-items-center justify-content-between border-top pt-3">
													<div className="d-flex align-items-center">
														<a href="javascript:void(0);" className="avatar avatar-md me-2">
															<img src="./assets/img/profiles/avatar-10.jpg" alt="Profile"
																className="img-fluid rounded-circle" />
														</a>
														<span className="text-success d-flex align-items-center"><i
																className="fas fa-square square-rotate fs-10 me-1"></i>Work</span>
													</div>
													<div className="d-flex align-items-center">
														<a href="javascript:void(0);" className="me-2">
															<span><i className="fas fa-star text-warning"></i></span>
														</a>
														<a href="javascript:void(0);">
															<span><i className="ti ti-trash text-danger"></i></span>
														</a>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div className="row custom-pagination">
							<div className="col-md-12">
								<div className="paginations d-flex justify-content-end">
									<span><i className="fas fa-chevron-left"></i></span>
									<ul className="d-flex align-items-center page-wrap">
										<li>
											<a href="javascript:void(0);" className="active">
												1
											</a>
										</li>
										<li>
											<a href="javascript:void(0);">
												2
											</a>
										</li>
										<li>
											<a href="javascript:void(0);">
												3
											</a>
										</li>
										<li>
											<a href="javascript:void(0);">
												4
											</a>
										</li>
									</ul>
									<span><i className="fas fa-chevron-right"></i></span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
				<p className="mb-0">2014 - 2025 &copy; SmartHR.</p>
				<p>Designed &amp; Developed By <a href="javascript:void(0);" className="text-primary">Dreams</a></p>
			</div>

		<div className="modal fade" id="add_note">
			<div className="modal-dialog modal-dialog-centered">
				<div className="modal-content">
					<div className="modal-header">
						<h4 className="modal-title">Add Notes</h4>
						<button type="button" className="btn-close custom-btn-close" data-bs-dismiss="modal" aria-label="Close">
							<i className="ti ti-x"></i>
						</button>
					</div>
					<form action="notes.php">
						<div className="modal-body">
							<div className="row">
								<div className="col-12">
									<div className="mb-3">
										<label className="form-label">Note Title</label>
										<input type="text" className="form-control" />
									</div>
								</div>
								<div className="col-12">
									<div className="mb-3">
										<label className="form-label">Assignee</label>
										<select className="select">
											<option>Choose</option>
											<option>Kathleen</option>
											<option>Gifford</option>
										</select>
									</div>
								</div>
								<div className="col-6">
									<div className="mb-3">
										<label className="form-label">Tag</label>
										<input className="input-tags form-control" placeholder="Add new" type="text" data-role="tagsinput" name="Label" defaultValue="Pending,Done" />
									</div>
								</div>
								<div className="col-6">
									<div className="mb-3">
										<label className="form-label">Priority</label>
										<select className="select">
											<option>Select</option>
											<option>Medium</option>
											<option>High</option>
											<option>Low</option>
										</select>
									</div>
								</div>
								<div className="col-6">
									<div className="input-blocks todo-calendar">
										<label className="form-label">Due Date</label>
										<div className="input-groupicon calender-input">
											<input type="text" className="form-control  datetimepicker" placeholder="dd-mm-yyyy" />
										</div>
									</div>
								</div>
								<div className="col-6">
									<div className="mb-3">
										<label className="form-label">Status</label>
										<select className="select">
											<option>Select</option>
											<option>Active</option>
											<option>Inactive</option>
										</select>
									</div>
								</div>
								<div className="col-lg-12">
									<div className="mb-0 summer-description-box notes-summernote">
										<label className="form-label">Descriptions</label>
										<div className="summernote"></div>
										<small>Maximum 60 Characters</small>
									</div>
								</div>
							</div>
						</div>
						<div className="modal-footer">
							<button type="button" className="btn btn-light me-2" data-bs-dismiss="modal">Cancel</button>
							<button type="submit" className="btn btn-primary">Submit</button>
						</div>
					</form>
				</div>
			</div>
		</div>
		

		
		<div className="modal fade" id="edit-note-units">
			<div className="modal-dialog modal-dialog-centered">
				<div className="modal-content">
					<div className="modal-header">
						<h4 className="modal-title">Edit Notes</h4>
						<button type="button" className="btn-close custom-btn-close" data-bs-dismiss="modal" aria-label="Close">
							<i className="ti ti-x"></i>
						</button>
					</div>
					<form action="notes.php">
						<div className="modal-body">
							<div className="row">
								<div className="col-12">
									<div className="mb-3">
										<label className="form-label">Note Title</label>
										<input type="text" className="form-control" defaultValue="Team meet at Starbucks" />
									</div>
								</div>
								<div className="col-12">
									<div className="mb-3">
										<label className="form-label">Assignee</label>
										<select className="select" defaultValue="Kathleen">
											<option>Choose</option>
											<option>Kathleen</option>
											<option>Gifford</option>
										</select>
									</div>
								</div>
								<div className="col-6">
									<div className="mb-3">
										<label className="form-label">Tag</label>
										<input className="input-tags form-control" placeholder="Add new" type="text" data-role="tagsinput" name="Label" defaultValue="Pending,Done" />
									</div>
								</div>
								<div className="col-6">
									<div className="mb-3">
										<label className="form-label">Priority</label>
										<select className="select" defaultValue="Medium">
											<option>Select</option>
											<option>Medium</option>
											<option>High</option>
											<option>Low</option>
										</select>
									</div>
								</div>
								<div className="col-6">
									<div className="input-blocks todo-calendar">
										<label className="form-label">Due Date</label>
										<div className="input-groupicon calender-input">
											<input type="text" className="form-control datetimepicker" placeholder="Select"
												defaultValue="25-10-2025" />
										</div>
									</div>
								</div>
								<div className="col-6">
									<div className="mb-3">
										<label className="form-label">Status</label>
										<select className="select" defaultValue="Active">
											<option>Select</option>
											<option>Active</option>
											<option>Inactive</option>
										</select>
									</div>
								</div>
								<div className="col-lg-12">
									<div className="mb-0 summer-description-box notes-summernote">
										<label className="form-label">Descriptions</label>
										<div className="summernote mb-2"></div>
										<small>Maximum 60 Characters</small>
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
							<a href="notes.php" className="btn btn-danger">Yes, Delete</a>
						</div>
					</div>
				</div>
			</div>
		</div>
		

		
		<div className="modal fade" id="view-note-units">
			<div className="modal-dialog modal-dialog-centered">
				<div className="modal-content">
					<div className="page-wrapper-new p-0">
						<div className="content">
							<div className="modal-header">
								<div className="d-flex align-items-center">
									<h4 className="modal-title me-3">Notes</h4>
									<p className="text-info">Personal</p>
								</div>
								<button type="button" className="btn-close custom-btn-close" data-bs-dismiss="modal"
									aria-label="Close">
									<i className="ti ti-x"></i>
								</button>
							</div>
							<div className="modal-body">
								<div className="row">
									<div className="col-12">
										<div>
											<h4 className="mb-2">Meet Lisa to discuss project details</h4>
											<p>Hiking is a long, vigorous walk, usually on trails or footpaths in the
												countryside.
												Walking for pleasure developed in Europe during the eighteenth century.
												Religious pilgrimages have existed much longer but they involve walking long
												distances for a spiritual purpose associated with specific religions and
												also
												we achieve inner peace while we hike at a local park.</p>

											<p className="badge bg-outline-danger d-inline-flex align-items-center mb-0"><i
													className="fas fa-circle fs-6 me-1"></i> High</p>
										</div>
									</div>
								</div>
							</div>
							<div className="modal-footer">
								<a href="#" className="btn btn-danger" data-bs-dismiss="modal">Close</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		

    </>
  );
};

export default NotesPage;
