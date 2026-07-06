import React from 'react';

const SocialFeedPage = () => {
  return (
    <>
<div className="content">
				<div className="row">
					<div className="col-xl-3 theiaStickySidebar">
						<div className="card">
							<div className="card-body">
								<div className="bg-light rounded p-3 mb-4">
									<div className="text-center mb-3">
										<a href="javascript:void(0);" className="avatar avatar-xl online avatar-rounded">
											<img src="assets/img/users/user-11.jpg" alt="Img" />
										</a>
										<h5 className="mb-1"><a href="javascript:void(0);">James Hong </a></h5>
										<p className="fs-12">@James Hong324</p>
									</div>
									<div className="row g-1">
										<div className="col-sm-4">
											<div className="rounded bg-white text-center py-1">
												<h4 className="mb-1">89K</h4>
												<p className="fs-12">Followers</p>
											</div>
										</div>
										<div className="col-sm-4">
											<div className="rounded bg-white text-center py-1">
												<h4 className="mb-1">45</h4>
												<p className="fs-12">Follows</p>
											</div>
										</div>
										<div className="col-sm-4">
											<div className="rounded bg-white text-center py-1">
												<h4 className="mb-1">45</h4>
												<p className="fs-12">Post</p>
											</div>
										</div>
									</div>
								</div>
								<div className="mb-4">
									<a href="javascript:void(0);" className="btn btn-primary d-inline-flex align-items-center justify-content-center w-100"><i className="ti ti-circle-plus me-2"></i>Create Post</a>
								</div>
								<div className="files-list border-bottom pb-2 mb-4">
									<a href="javscript:void(0);" className="d-flex align-items-center justify-content-between active fw-medium p-2">
										<span><i className="ti ti-brand-feedly me-2"></i>All Feeds</span>
										<span className="badge badge-danger badge-xs rounded-pill">56</span>
									</a>
									<a href="javscript:void(0);" className="d-flex align-items-center fw-medium p-2"><i className="ti ti-mood-search me-2"></i>Explore</a>
									<a href="javscript:void(0);" className="d-flex align-items-center fw-medium p-2"><i className="ti ti-mail-check me-2"></i>Messages</a>
									<a href="javscript:void(0);" className="d-flex align-items-center fw-medium p-2"><i className="ti ti-list me-2"></i>Lists</a>
									<a href="javscript:void(0);" className="d-flex align-items-center fw-medium p-2"><i className="ti ti-bookmark me-2"></i>Bookmark</a>
									<a href="javscript:void(0);" className="d-flex align-items-center fw-medium p-2"><i className="ti ti-coffee me-2"></i>Marketplace</a>
									<a href="javscript:void(0);" className="d-flex align-items-center justify-content-between fw-medium p-2">
										<span><i className="ti ti-file-text me-2"></i>Files</span>
										<span className="badge badge-info badge-xs rounded-pill">14</span>
									</a>
									<a href="javscript:void(0);" className="d-flex align-items-center fw-medium p-2"><i className="ti ti-music me-2"></i>Media</a>
									<a href="javscript:void(0);" className="d-flex align-items-center fw-medium p-2"><i className="ti ti-user-share me-2"></i>Profile</a>
								</div>
								<div>
									<div className="mb-2">
										<h5>Pages You Liked</h5>
									</div>
									<div>
										<a href="javscript:void(0);" className="fw-medium d-flex align-items-center justify-content-between text-dark py-1 mb-2">
											<span className="d-inline-flex align-items-center">
												<img src="assets/img/icons/liked-page-01.svg" className="me-2" alt="Img" />Dribble
											</span>
											<span className="btn btn-icon btn-sm"><i className="ti ti-thumb-down"></i></span>
										</a>
										<a href="javscript:void(0);" className="fw-medium d-flex align-items-center justify-content-between text-dark py-1 mb-2">
											<span className="d-inline-flex align-items-center">
												<img src="assets/img/icons/liked-page-02.svg" className="me-2" alt="Img" />UI/UX Designs
											</span>
											<span className="btn btn-icon btn-sm"><i className="ti ti-thumb-down"></i></span>
										</a>
										<a href="javscript:void(0);" className="fw-medium d-flex align-items-center justify-content-between text-dark py-1">
											<span className="d-inline-flex align-items-center">
												<img src="assets/img/icons/liked-page-03.svg" className="me-2" alt="Img" />Figma Update
											</span>
											<span className="btn btn-icon btn-sm"><i className="ti ti-thumb-down"></i></span>
										</a>
										<div>
											<div className="more-menu-3">
												<a href="javscript:void(0);" className="fw-medium d-flex align-items-center justify-content-between text-dark py-1 mb-2">
													<span className="d-inline-flex align-items-center">
														<img src="assets/img/icons/liked-page-04.svg" className="me-2" alt="Img" />I Am Techie
													</span>
													<span className="btn btn-icon btn-sm"><i className="ti ti-thumb-down"></i></span>
												</a>
											</div>
											<div className="view-all mt-2">
												<a href="javascript:void(0);" className="viewall-button-3 fw-medium"><span>Show More</span><i className="fa fa-chevron-down fs-10 ms-2"></i></a>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className="col-xl-6">
						<div>
							<div className="card">
								<div className="card-body">
									<form action="social-feed.php">
										<div className="mb-3">
											<label className="form-label fs-16">Create Post</label>
											<div className="position-relative">
												<textarea className="form-control post-textarea" rows="3" placeholder="What's on your mind?"></textarea>
												<span className="avatar avatar-lg avatar-rounded text-area-avatar">
													<img src="assets/img/users/user-11.jpg" alt="Img" />
												</span>
											</div>
										</div>
										<div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3">
											<div className="d-flex align-items-center">
												<a href="javascript:void(0);" className="btn btn-icon btn-sm rounded-circle"><i className="ti ti-photo fs-16"></i></a>
												<a href="javascript:void(0);" className="btn btn-icon btn-sm rounded-circle"><i className="ti ti-link fs-16"></i></a>
												<a href="javascript:void(0);" className="btn btn-icon btn-sm rounded-circle"><i className="ti ti-paperclip fs-16"></i></a>
												<a href="javascript:void(0);" className="btn btn-icon btn-sm rounded-circle"><i className="ti ti-video fs-16"></i></a>
												<a href="javascript:void(0);" className="btn btn-icon btn-sm rounded-circle"><i className="ti ti-hash fs-16"></i></a>
												<a href="javascript:void(0);" className="btn btn-icon btn-sm rounded-circle"><i className="ti ti-map-pin-heart fs-16"></i></a>
												<a href="javascript:void(0);" className="btn btn-icon btn-sm rounded-circle"><i className="ti ti-mood-smile fs-16"></i></a>
											</div>
											<div className="d-flex align-items-center">
												<a href="javascript:void(0);" className="btn btn-icon btn-sm rounded-circle"><i className="ti ti-refresh fs-16"></i></a>
												<a href="javascript:void(0);" className="btn btn-icon btn-sm rounded-circle"><i className="ti ti-trash fs-16"></i></a>
												<a href="javascript:void(0);" className="btn btn-icon btn-sm rounded-circle"><i className="ti ti-world fs-16"></i></a>
												<button type="submit" className="btn btn-primary d-inline-flex align-items-center ms-2"><i className="ti ti-circle-plus fs-16 me-2"></i>Share Post</button>
											</div>
										</div>
									</form>
								</div>
							</div>
							<div className="card">
								<div className="card-body">
									<div className="d-flex align-items-center mb-3">
										<h5 className="me-2">Popular Channels</h5>
										<div className="owl-nav custom-nav nav-control"></div>
									</div>
									<div className="channels-slider owl-carousel">
										<a href="javascript:void(0);">
											<img src="assets/img/icons/channel-01.svg" alt="Img" />
										</a>
										<a href="javascript:void(0);">
											<img src="assets/img/icons/channel-02.svg" alt="Img" />
										</a>
										<a href="javascript:void(0);">
											<img src="assets/img/icons/channel-03.svg" alt="Img" />
										</a>
										<a href="javascript:void(0);">
											<img src="assets/img/icons/channel-04.svg" alt="Img" />
										</a>
										<a href="javascript:void(0);">
											<img src="assets/img/icons/channel-05.svg" alt="Img" />
										</a>
										<a href="javascript:void(0);">
											<img src="assets/img/icons/channel-06.svg" alt="Img" />
										</a>
										<a href="javascript:void(0);">
											<img src="assets/img/icons/channel-07.svg" alt="Img" />
										</a>
										<a href="javascript:void(0);">
											<img src="assets/img/icons/channel-08.svg" alt="Img" />
										</a>
									</div>
								</div>
							</div>
							<div className="card">
								<div className="card-header border-0 pb-0">
									<div className="d-flex align-items-center justify-content-between border-bottom flex-wrap row-gap-3 pb-3">
										<div className="d-flex align-items-center">
											<a href="javascript:void(0);" className="avatar avatar-lg avatar-rounded flex-shrink-0 me-2"><img src="assets/img/users/user-03.jpg" alt="Img" /></a>
											<div>
												<h5 className="mb-1"><a href="javascript:void(0);">Richard Smith <i className="ti ti-circle-check-filled text-success"></i></a></h5>
												<p className="d-flex align-items-center">
													<span className="text-info">@richard442</span>
													<i className="ti ti-circle-filled fs-5 mx-2"></i>
													United Kingdom
												</p>
											</div>
										</div>
										<div className="d-flex align-items-center">
											<p className="mb-0 text-dark">About 1 hr ago</p>
											<div className="dropdown ms-3 me-1">
												<button className="btn btn-icon dropdown-toggle bg-transparent d-flex align-items-center text-dark border-0 p-0 btn-sm" type="button" data-bs-toggle="dropdown" aria-expanded="false">
													<i className="ti ti-world pe-1"></i>
												</button>
												<ul className="dropdown-menu dropdown-menu-end">
													<li>
														<a className="dropdown-item" href="javascript:void(0);">Private</a>
													</li>
													<li>
														<a className="dropdown-item" href="javascript:void(0);">Public</a>
													</li>
												</ul>
											</div>
											<div className="dropdown">
												<a href="javascript:void(0);" className="d-inline-flex align-items-center show" data-bs-toggle="dropdown" aria-expanded="true">
													<i className="ti ti-dots-vertical"></i>
												</a>
												<ul className="dropdown-menu dropdown-menu-end p-3">
													<li>
														<a href="javascript:void(0);" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
													</li>
													<li>
														<a href="javascript:void(0);" className="dropdown-item rounded-1"><i className="ti ti-eye me-2"></i>Hide Post</a>
													</li>
													<li>
														<a href="javascript:void(0);" className="dropdown-item rounded-1"><i className="ti ti-report me-2"></i>Report</a>
													</li>
													<li>
														<a href="javascript:void(0);" className="dropdown-item rounded-1"><i className="ti ti-trash-x me-2"></i>Delete</a>
													</li>
												</ul>
											</div>
										</div>
									</div>
								</div>
								<div className="card-body">
									<div className="mb-2">
										<p className="text-dark fw-medium">"Believe in yourself and all that you are. Know that there is
											something inside you that is greater than any obstacle.
											<a href="javascript:void(0);" className="text-info link-hover">#MotivationMonday</a>
											<a href="javascript:void(0);" className="text-info link-hover">#Inspiration</a>
											🌟"
										</p>
									</div>
									<div className="mb-2">
										<img src="assets/img/social/social-feed-01.jpg" className="rounded" alt="Img" />
									</div>
									<div className="social-gallery-slider owl-carousel mb-3">
										<a href="assets/img/social/gallery-big-01.jpg" data-fancybox="gallery" className="gallery-item">
											<img src="assets/img/social/gallery-01.jpg" className="rounded" alt="img" />
											<span className="avatar avatar-md avatar-rounded"><i className="ti ti-eye"></i></span>
										</a>
										<a href="assets/img/social/gallery-big-02.jpg" data-fancybox="gallery" className="gallery-item">
											<img src="assets/img/social/gallery-02.jpg" className="rounded" alt="img" />
											<span className="avatar avatar-md avatar-rounded"><i className="ti ti-eye"></i></span>
										</a>
										<a href="assets/img/social/gallery-big-03.jpg" data-fancybox="gallery" className="gallery-item">
											<img src="assets/img/social/gallery-03.jpg" className="rounded" alt="img" />
											<span className="avatar avatar-md avatar-rounded"><i className="ti ti-eye"></i></span>
										</a>
										<a href="assets/img/social/gallery-big-04.jpg" data-fancybox="gallery" className="gallery-item">
											<img src="assets/img/social/gallery-04.jpg" className="rounded" alt="img" />
											<span className="avatar avatar-md avatar-rounded"><i className="ti ti-eye"></i></span>
										</a>
										<a href="assets/img/social/gallery-big-01.jpg" data-fancybox="gallery" className="gallery-item">
											<img src="assets/img/social/gallery-01.jpg" className="rounded" alt="img" />
											<span className="avatar avatar-md avatar-rounded"><i className="ti ti-eye"></i></span>
										</a>
									</div>
									<div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3 mb-3">
										<div className="d-flex align-items-center flex-wrap row-gap-3">
											<a href="javascript:void(0);" className="d-inline-flex align-items-center me-3">
												<i className="ti ti-heart me-2"></i>340K Likes
											</a>
											<a href="javascript:void(0);" className="d-inline-flex align-items-center me-3">
												<i className="ti ti-message-dots me-2"></i>45 Comments
											</a>
											<a href="javascript:void(0);" className="d-inline-flex align-items-center">
												<i className="ti ti-share-3 me-2"></i>28 Share
											</a>
										</div>
										<div className="d-flex align-items-center">
											<a href="javascript:void(0);" className="btn btn-icon btn-sm rounded-circle"><i className="ti ti-heart-filled text-danger"></i></a>
											<a href="javascript:void(0);" className="btn btn-icon btn-sm rounded-circle"><i className="ti ti-share"></i></a>
											<a href="javascript:void(0);" className="btn btn-icon btn-sm rounded-circle"><i className="ti ti-message-star"></i></a>
											<a href="javascript:void(0);" className="btn btn-icon btn-sm rounded-circle"><i className="ti ti-bookmark-filled text-warning"></i></a>
										</div>
									</div>
									<div className="d-flex align-items-start">
										<a href="javascript:void(0);" className="avatar avatar-rounded me-2 flex-shrink-0"><img src="assets/img/users/user-11.jpg" alt="Img" /></a>
										<input type="text" className="form-control" placeholder="Enter Comments" />
									</div>
								</div>
							</div>
							<div className="card">
								<div className="card-header border-0 pb-0">
									<div className="d-flex align-items-center justify-content-between border-bottom flex-wrap row-gap-3 pb-3">
										<div className="d-flex align-items-center">
											<a href="javascript:void(0);" className="avatar avatar-lg avatar-rounded flex-shrink-0 me-2"><img src="assets/img/users/user-05.jpg" alt="Img" /></a>
											<div>
												<h5 className="mb-1"><a href="javascript:void(0);">Jason Heier <i className="ti ti-circle-check-filled text-success"></i></a></h5>
												<p className="d-flex align-items-center">
													<span className="text-info">@jason118</span>
													<i className="ti ti-circle-filled fs-5 mx-2"></i>
													United Kingdom
												</p>
											</div>
										</div>
										<div className="d-flex align-items-center">
											<p className="mb-0 text-dark">About 1 hr ago</p>
											<div className="dropdown ms-3 me-1">
												<button className="btn btn-icon dropdown-toggle bg-transparent d-flex align-items-center text-dark border-0 p-0 btn-sm" type="button" data-bs-toggle="dropdown" aria-expanded="false">
													<i className="ti ti-world pe-1"></i>
												</button>
												<ul className="dropdown-menu dropdown-menu-end">
													<li>
														<a className="dropdown-item" href="javascript:void(0);">Private</a>
													</li>
													<li>
														<a className="dropdown-item" href="javascript:void(0);">Public</a>
													</li>
												</ul>
											</div>
											<div className="dropdown">
												<a href="javascript:void(0);" className="d-inline-flex align-items-center show" data-bs-toggle="dropdown" aria-expanded="true">
													<i className="ti ti-dots-vertical"></i>
												</a>
												<ul className="dropdown-menu dropdown-menu-end p-3">
													<li>
														<a href="javascript:void(0);" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
													</li>
													<li>
														<a href="javascript:void(0);" className="dropdown-item rounded-1"><i className="ti ti-eye me-2"></i>Hide Post</a>
													</li>
													<li>
														<a href="javascript:void(0);" className="dropdown-item rounded-1"><i className="ti ti-report me-2"></i>Report</a>
													</li>
													<li>
														<a href="javascript:void(0);" className="dropdown-item rounded-1"><i className="ti ti-trash-x me-2"></i>Delete</a>
													</li>
												</ul>
											</div>
										</div>
									</div>
								</div>
								<div className="card-body">
									<div className="mb-2">
										<p className="text-dark fw-medium">
											Drinking water boosts skin health and beauty. Stay hydrated!
											<a href="javascript:void(0);" className="text-info link-hover">#HealthTips </a>
											<a href="javascript:void(0);" className="text-info link-hover"> #Wellness</a>
											💧
										</p>
									</div>
									<div className="card shadow-none mb-3">
										<div className="card-img card-img-hover rounded-0">
											<a href="javascript:void(0);" className="rounded-top"><img src="assets/img/social/social-feed-02.jpg" className="rounded-top" alt="Img" /></a>
										</div>
										<div className="card-body p-2">
											<h6 className="mb-1 text-truncate"><a href="javascript:void(0);">Drinking water boosts skin health and beauty. Stay hydrated!💧</a></h6>
											<a href="javascript:void(0);">Health.com</a>
										</div>
									</div>
									<div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3">
										<div className="d-flex align-items-center flex-wrap row-gap-3">
											<a href="javascript:void(0);" className="d-inline-flex align-items-center me-3">
												<i className="ti ti-heart me-2"></i>340K Likes
											</a>
											<a href="javascript:void(0);" className="d-inline-flex align-items-center me-3">
												<i className="ti ti-message-dots me-2"></i>45 Comments
											</a>
											<a href="javascript:void(0);" className="d-inline-flex align-items-center">
												<i className="ti ti-share-3 me-2"></i>28 Share
											</a>
										</div>
										<div className="d-flex align-items-center">
											<a href="javascript:void(0);" className="btn btn-icon btn-sm rounded-circle"><i className="ti ti-heart"></i></a>
											<a href="javascript:void(0);" className="btn btn-icon btn-sm rounded-circle"><i className="ti ti-share"></i></a>
											<a href="javascript:void(0);" className="btn btn-icon btn-sm rounded-circle"><i className="ti ti-message-star"></i></a>
											<a href="javascript:void(0);" className="btn btn-icon btn-sm rounded-circle"><i className="ti ti-bookmark"></i></a>
										</div>
									</div>
								</div>
							</div>
							<div className="card">
								<div className="card-header border-0 pb-0">
									<div className="d-flex align-items-center justify-content-between border-bottom flex-wrap row-gap-3 pb-3">
										<div className="d-flex align-items-center">
											<span className="avatar avatar-lg avatar-rounded flex-shrink-0 me-2"><img src="assets/img/users/user-04.jpg" alt="Img" /></span>
											<div>
												<h5 className="mb-1"><a href="javascript:void(0);">Sophie Headrick <i className="ti ti-circle-check-filled text-success"></i></a></h5>
												<p className="d-flex align-items-center">
													<span className="text-info">@sophie241</span>
													<i className="ti ti-circle-filled fs-5 mx-2"></i>
													United Kingdom
												</p>
											</div>
										</div>
										<div className="d-flex align-items-center">
											<p className="mb-0 text-dark">About 1 hr ago</p>
											<div className="dropdown ms-3 me-1">
												<button className="btn btn-icon dropdown-toggle bg-transparent d-flex align-items-center text-dark border-0 p-0 btn-sm" type="button" data-bs-toggle="dropdown" aria-expanded="false">
													<i className="ti ti-world pe-1"></i>
												</button>
												<ul className="dropdown-menu dropdown-menu-end">
													<li>
														<a className="dropdown-item" href="javascript:void(0);">Private</a>
													</li>
													<li>
														<a className="dropdown-item" href="javascript:void(0);">Public</a>
													</li>
												</ul>
											</div>
											<div className="dropdown">
												<a href="javascript:void(0);" className="d-inline-flex align-items-center show" data-bs-toggle="dropdown" aria-expanded="true">
													<i className="ti ti-dots-vertical"></i>
												</a>
												<ul className="dropdown-menu dropdown-menu-end p-3">
													<li>
														<a href="javascript:void(0);" className="dropdown-item rounded-1"><i className="ti ti-edit me-2"></i>Edit</a>
													</li>
													<li>
														<a href="javascript:void(0);" className="dropdown-item rounded-1"><i className="ti ti-eye me-2"></i>Hide Post</a>
													</li>
													<li>
														<a href="javascript:void(0);" className="dropdown-item rounded-1"><i className="ti ti-report me-2"></i>Report</a>
													</li>
													<li>
														<a href="javascript:void(0);" className="dropdown-item rounded-1"><i className="ti ti-trash-x me-2"></i>Delete</a>
													</li>
												</ul>
											</div>
										</div>
									</div>
								</div>
								<div className="card-body">
									<div className="mb-2">
										<p className="text-dark fw-medium">
											Excited to announce the launch of our new product! Get yours now and enjoy a special discount.
											<a href="javascript:void(0);" className="text-info link-hover">#NewRelease </a>
											<a href="javascript:void(0);" className="text-info link-hover"> #Innovation</a>
											🎉
										</p>
									</div>
									<div className="mb-2">
										<img src="assets/img/social/social-feed-03.jpg" className="rounded" alt="Img" />
									</div>
									<div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3 mb-3">
										<div className="d-flex align-items-center flex-wrap row-gap-3">
											<a href="javascript:void(0);" className="d-inline-flex align-items-center me-3">
												<i className="ti ti-heart me-2"></i>340K Likes
											</a>
											<a href="javascript:void(0);" className="d-inline-flex align-items-center me-3">
												<i className="ti ti-message-dots me-2"></i>45 Comments
											</a>
											<a href="javascript:void(0);" className="d-inline-flex align-items-center">
												<i className="ti ti-share-3 me-2"></i>28 Share
											</a>
										</div>
										<div className="d-flex align-items-center">
											<a href="javascript:void(0);" className="btn btn-icon btn-sm rounded-circle"><i className="ti ti-heart-filled text-danger"></i></a>
											<a href="javascript:void(0);" className="btn btn-icon btn-sm rounded-circle"><i className="ti ti-share"></i></a>
											<a href="javascript:void(0);" className="btn btn-icon btn-sm rounded-circle"><i className="ti ti-message-star"></i></a>
											<a href="javascript:void(0);" className="btn btn-icon btn-sm rounded-circle"><i className="ti ti-bookmark-filled text-warning"></i></a>
										</div>
									</div>
									<div className="d-flex align-items-start mb-3">
										<a href="javascript:void(0);" className="avatar avatar-rounded flex-shrink-0 me-2">
											<img src="assets/img/profiles/avatar-02.jpg" alt="Img" />
										</a>
										<div className="bg-light rounded flex-fill p-2">
											<div className="d-flex align-items-center mb-1">
												<h5><a href="javascript:void(0);">Frank Hoffman</a></h5>
												<span className="ms-2">12:45 PM</span>
											</div>
											<p className="mb-1">Congratulations on the launch! I've been eagerly waiting for this
												product, and the special discount makes it even more exciting.
											</p>
											<a href="javascript:void(0);" className="d-inline-flex align-items-center"><i className="ti ti-share-3 me-2"></i>Reply</a>
										</div>
									</div>
									<div className="d-flex align-items-start mb-3 ms-4 ps-2">
										<a href="javascript:void(0);" className="avatar avatar-rounded flex-shrink-0 me-2">
											<img src="assets/img/profiles/avatar-01.jpg" alt="Img" />
										</a>
										<div className="bg-light rounded flex-fill p-2">
											<div className="d-flex align-items-center mb-1">
												<h5><a href="javascript:void(0);">Sophie Headrick</a></h5>
												<span className="ms-2">12:45 PM</span>
											</div>
											<p className="mb-1">
												Thank you so much for your enthusiasm and support!
											</p>
											<a href="javascript:void(0);" className="d-inline-flex align-items-center"><i className="ti ti-share-3 me-2"></i>Reply</a>
										</div>
									</div>
									<div className="d-flex align-items-start mb-3">
										<a href="javascript:void(0);" className="avatar avatar-rounded flex-shrink-0 me-2">
											<img src="assets/img/profiles/avatar-04.jpg" alt="Img" />
										</a>
										<div className="bg-light rounded flex-fill p-2">
											<div className="d-flex align-items-center mb-1">
												<h5><a href="javascript:void(0);">Samuel Butler</a></h5>
												<span className="ms-2">12:40 PM</span>
											</div>
											<p className="mb-1">
												So thrilled to see this product finally launched! I've heard
												amazing things about it and am excited to see how it lives up to the hype.
											</p>
											<a href="javascript:void(0);" className="d-inline-flex align-items-center"><i className="ti ti-share-3 me-2"></i>Reply</a>
										</div>
									</div>
									<div>
										<div className="more-menu">
											<div className="d-flex align-items-start mb-3">
												<a href="javascript:void(0);" className="avatar avatar-rounded flex-shrink-0 me-2">
													<img src="assets/img/profiles/avatar-05.jpg" alt="Img" />
												</a>
												<div className="bg-light rounded flex-fill p-2">
													<div className="d-flex align-items-center mb-1">
														<h5><a href="javascript:void(0);">Samuel Butler</a></h5>
														<span className="ms-2">12:40 PM</span>
													</div>
													<p className="mb-1">
														So thrilled to see this product finally launched! I've heard
														amazing things about it and am excited to see how it lives up to the hype.
													</p>
													<a href="javascript:void(0);" className="d-inline-flex align-items-center"><i className="ti ti-share-3 me-2"></i>Reply</a>
												</div>
											</div>
											<div className="d-flex align-items-start mb-3">
												<a href="javascript:void(0);" className="avatar avatar-rounded flex-shrink-0 me-2">
													<img src="assets/img/profiles/avatar-06.jpg" alt="Img" />
												</a>
												<div className="bg-light rounded flex-fill p-2">
													<div className="d-flex align-items-center mb-1">
														<h5><a href="javascript:void(0);">Samuel Butler</a></h5>
														<span className="ms-2">12:40 PM</span>
													</div>
													<p className="mb-1">
														So thrilled to see this product finally launched! I've heard
														amazing things about it and am excited to see how it lives up to the hype.
													</p>
													<a href="javascript:void(0);" className="d-inline-flex align-items-center"><i className="ti ti-share-3 me-2"></i>Reply</a>
												</div>
											</div>
										</div>
										<div className="view-all text-center mb-3">
											<a href="javascript:void(0);" className="viewall-button text-primary fw-medium"><span>View All 200 Comments</span><i className="fa fa-chevron-down fs-10 ms-2"></i></a>
										</div>
									</div>
									<div className="d-flex align-items-start">
										<span className="avatar avatar-rounded me-2 flex-shrink-0"><img src="assets/img/users/user-11.jpg" alt="Img" /></span>
										<input type="text" className="form-control" placeholder="Enter Comments" />
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className="col-xl-3 theiaStickySidebar">
						<div className="card">
							<div className="card-body">
								<h5 className="mb-3">Peoples</h5>
								<ul className="nav nav-pills border d-flex p-2 rounded mb-3" id="pills-tab" role="tablist">
									<li className="nav-item flex-fill" role="presentation">
										<button className="nav-link btn active w-100" data-bs-toggle="pill" data-bs-target="#pills-home" type="button" role="tab" aria-selected="true">
											General
										</button>
									</li>
									<li className="nav-item flex-fill" role="presentation">
										<button className="nav-link btn w-100" data-bs-toggle="pill" data-bs-target="#pills-profile" type="button" role="tab" aria-selected="false">
											Primary
										</button>
									</li>
								</ul>
								<div className="tab-content">
									<div className="tab-pane fade show active" id="pills-home" role="tabpanel">
										<div>
											<div className="d-flex align-items-center justify-content-between mb-3">
												<div className="d-flex align-items-center">
													<a href="javascript:void(0);" className="avatar avatar-rounded flex-shrink-0 me-2">
														<img src="assets/img/profiles/avatar-29.jpg" alt="Img" />
													</a>
													<div>
														<h6 className="d-inline-flex align-items-center fw-medium mb-1">
															<a href="javascript:void(0);">Anthony Lewis</a>
															<i className="ti ti-circle-check-filled text-success ms-1"></i>
														</h6>
														<span className="fs-12 d-block">United States</span>
													</div>
												</div>
												<a href="javascript:void(0);" className="btn btn-sm btn-icon"><i className="ti ti-user-x"></i></a>
											</div>
											<div className="d-flex align-items-center justify-content-between mb-3">
												<div className="d-flex align-items-center">
													<a href="javascript:void(0);" className="avatar avatar-rounded flex-shrink-0 me-2">
														<img src="assets/img/users/user-01.jpg" alt="Img" />
													</a>
													<div>
														<h6 className="d-inline-flex align-items-center fw-medium mb-1">
															<a href="javascript:void(0);">Harvey Smith</a>
														</h6>
														<span className="fs-12 d-block">Ukrain</span>
													</div>
												</div>
												<a href="javascript:void(0);" className="btn btn-sm btn-icon"><i className="ti ti-user-x"></i></a>
											</div>
											<div className="d-flex align-items-center justify-content-between mb-3">
												<div className="d-flex align-items-center">
													<a href="javascript:void(0);" className="avatar avatar-rounded flex-shrink-0 me-2">
														<img src="assets/img/users/user-33.jpg" alt="Img" />
													</a>
													<div>
														<h6 className="d-inline-flex align-items-center fw-medium mb-1">
															<a href="javascript:void(0);">Stephan Peralt</a>
														</h6>
														<span className="fs-12 d-block">Isreal</span>
													</div>
												</div>
												<a href="javascript:void(0);" className="btn btn-sm btn-icon"><i className="ti ti-user-x"></i></a>
											</div>
											<div className="d-flex align-items-center justify-content-between mb-3">
												<div className="d-flex align-items-center">
													<a href="javascript:void(0);" className="avatar avatar-rounded flex-shrink-0 me-2">
														<img src="assets/img/users/user-34.jpg" alt="Img" />
													</a>
													<div>
														<h6 className="d-inline-flex align-items-center fw-medium mb-1">
															<a href="javascript:void(0);">Doglas Martini</a>
														</h6>
														<span className="fs-12 d-block">Belgium</span>
													</div>
												</div>
												<a href="javascript:void(0);" className="btn btn-sm btn-icon"><i className="ti ti-user-x"></i></a>
											</div>
											<div className="d-flex align-items-center justify-content-between mb-3">
												<div className="d-flex align-items-center">
													<a href="javascript:void(0);" className="avatar avatar-rounded flex-shrink-0 me-2">
														<img src="assets/img/users/user-09.jpg" alt="Img" />
													</a>
													<div>
														<h6 className="d-inline-flex align-items-center fw-medium mb-1">
															<a href="javascript:void(0);">Brian Villalobos</a>
															<i className="ti ti-circle-check-filled text-success ms-1"></i>
														</h6>
														<span className="fs-12 d-block">United Kingdom</span>
													</div>
												</div>
												<a href="javascript:void(0);" className="btn btn-sm btn-icon"><i className="ti ti-user-x"></i></a>
											</div>
											<div className="d-flex align-items-center justify-content-between mb-3">
												<div className="d-flex align-items-center">
													<a href="javascript:void(0);" className="avatar avatar-rounded flex-shrink-0 me-2">
														<img src="assets/img/users/user-02.jpg" alt="Img" />
													</a>
													<div>
														<h6 className="d-inline-flex align-items-center fw-medium mb-1">
															<a href="javascript:void(0);">Linda Ray</a>
														</h6>
														<span className="fs-12 d-block">Argentina</span>
													</div>
												</div>
												<a href="javascript:void(0);" className="btn btn-sm btn-icon"><i className="ti ti-user-x"></i></a>
											</div>
										</div>
										<div>
											<a href="javascript:void(0);" className="btn btn-outline-light w-100 border">View All <i className="ti ti-arrow-right ms-2"></i></a>
										</div>
									</div>
									<div className="tab-pane fade" id="pills-profile" role="tabpanel">
										<div>
											<div className="d-flex align-items-center justify-content-between mb-3">
												<div className="d-flex align-items-center">
													<a href="javascript:void(0);" className="avatar avatar-rounded flex-shrink-0 me-2">
														<img src="assets/img/profiles/avatar-11.jpg" alt="Img" />
													</a>
													<div>
														<h6 className="d-inline-flex align-items-center fw-medium mb-1">
															<a href="javascript:void(0);">Anthony Lewis</a>
															<i className="ti ti-circle-check-filled text-success ms-1"></i>
														</h6>
														<span className="fs-12 d-block">United States</span>
													</div>
												</div>
												<a href="javascript:void(0);" className="btn btn-sm btn-icon"><i className="ti ti-user-x"></i></a>
											</div>
											<div className="d-flex align-items-center justify-content-between mb-3">
												<div className="d-flex align-items-center">
													<a href="javascript:void(0);" className="avatar avatar-rounded flex-shrink-0 me-2">
														<img src="assets/img/users/user-12.jpg" alt="Img" />
													</a>
													<div>
														<h6 className="d-inline-flex align-items-center fw-medium mb-1">
															<a href="javascript:void(0);">Harvey Smith</a>
														</h6>
														<span className="fs-12 d-block">Ukrain</span>
													</div>
												</div>
												<a href="javascript:void(0);" className="btn btn-sm btn-icon"><i className="ti ti-user-x"></i></a>
											</div>
											<div className="d-flex align-items-center justify-content-between mb-3">
												<div className="d-flex align-items-center">
													<a href="javascript:void(0);" className="avatar avatar-rounded flex-shrink-0 me-2">
														<img src="assets/img/users/user-13.jpg" alt="Img" />
													</a>
													<div>
														<h6 className="d-inline-flex align-items-center fw-medium mb-1">
															<a href="javascript:void(0);">Stephan Peralt</a>
														</h6>
														<span className="fs-12 d-block">Isreal</span>
													</div>
												</div>
												<a href="javascript:void(0);" className="btn btn-sm btn-icon"><i className="ti ti-user-x"></i></a>
											</div>
											<div className="d-flex align-items-center justify-content-between mb-3">
												<div className="d-flex align-items-center">
													<a href="javascript:void(0);" className="avatar avatar-rounded flex-shrink-0 me-2">
														<img src="assets/img/users/user-14.jpg" alt="Img" />
													</a>
													<div>
														<h6 className="d-inline-flex align-items-center fw-medium mb-1">
															<a href="javascript:void(0);">Doglas Martini</a>
														</h6>
														<span className="fs-12 d-block">Belgium</span>
													</div>
												</div>
												<a href="javascript:void(0);" className="btn btn-sm btn-icon"><i className="ti ti-user-x"></i></a>
											</div>
											<div className="d-flex align-items-center justify-content-between mb-3">
												<div className="d-flex align-items-center">
													<a href="javascript:void(0);" className="avatar avatar-rounded flex-shrink-0 me-2">
														<img src="assets/img/users/user-15.jpg" alt="Img" />
													</a>
													<div>
														<h6 className="d-inline-flex align-items-center fw-medium mb-1">
															<a href="javascript:void(0);">Brian Villalobos</a>
															<i className="ti ti-circle-check-filled text-success ms-1"></i>
														</h6>
														<span className="fs-12 d-block">United Kingdom</span>
													</div>
												</div>
												<a href="javascript:void(0);" className="btn btn-sm btn-icon"><i className="ti ti-user-x"></i></a>
											</div>
											<div className="d-flex align-items-center justify-content-between mb-3">
												<div className="d-flex align-items-center">
													<a href="javascript:void(0);" className="avatar avatar-rounded flex-shrink-0 me-2">
														<img src="assets/img/users/user-16.jpg" alt="Img" />
													</a>
													<div>
														<h6 className="d-inline-flex align-items-center fw-medium mb-1">
															<a href="javascript:void(0);">Linda Ray</a>
														</h6>
														<span className="fs-12 d-block">Argentina</span>
													</div>
												</div>
												<a href="javascript:void(0);" className="btn btn-sm btn-icon"><i className="ti ti-user-x"></i></a>
											</div>
										</div>
										<div>
											<a href="javascript:void(0);" className="btn btn-outline-light w-100 border">View All <i className="ti ti-arrow-right ms-2"></i></a>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div className="card">
							<div className="card-body">
								<h5 className="mb-3">Saved Feeds</h5>
								<div className="bg-light-500 rounded p-2 mb-2">
									<div className="d-flex align-items-center justify-content-between mb-1">
										<a href="javascript:void(0);" className="d-flex align-items-center">
											<span><img src="assets/img/icons/feeds-01.svg" className="me-2" alt="Img" /></span>
											<p className="fs-12 fw-medium">World Health</p>
										</a>
										<a href="javascript:void(0);"><i className="ti ti-bookmark-filled text-warning"></i></a>
									</div>
									<p className="text-dark fw-medium"><a href="javascript:void(0);">Retail investor party continues even as</a></p>
								</div>
								<div className="bg-light-500 rounded p-2 mb-2">
									<div className="d-flex align-items-center justify-content-between mb-1">
										<a href="javascript:void(0);" className="d-flex align-items-center">
											<span><img src="assets/img/icons/feeds-02.svg" className="me-2" alt="Img" /></span>
											<p className="fs-12 fw-medium">T3 Tech</p>
										</a>
										<a href="javascript:void(0);"><i className="ti ti-bookmark-filled text-warning"></i></a>
									</div>
									<p className="text-dark fw-medium"><a href="javascript:void(0);">Ipad Air (2020) vs Samsung Galaxy Tab</a></p>
								</div>
								<div className="bg-light-500 rounded p-2 mb-2">
									<div className="d-flex align-items-center justify-content-between mb-1">
										<a href="javascript:void(0);" className="d-flex align-items-center">
											<span><img src="assets/img/icons/feeds-03.svg" className="me-2" alt="Img" /></span>
											<p className="fs-12 fw-medium">Fstoppers</p>
										</a>
										<a href="javascript:void(0);"><i className="ti ti-bookmark-filled text-warning"></i></a>
									</div>
									<p className="text-dark fw-medium"><a href="javascript:void(0);">Beyond capital gains tax! Top 50 stock</a></p>
								</div>
								<div className="bg-light-500 rounded p-2">
									<div className="d-flex align-items-center justify-content-between mb-1">
										<a href="javascript:void(0);" className="d-flex align-items-center">
											<span><img src="assets/img/icons/feeds-04.svg" className="me-2" alt="Img" /></span>
											<p className="fs-12 fw-medium">Evernote</p>
										</a>
										<a href="javascript:void(0);"><i className="ti ti-bookmark-filled text-warning"></i></a>
									</div>
									<p className="text-dark fw-medium"><a href="javascript:void(0);">Sony Just Destroyed the Competition</a></p>
								</div>
								<div className="mt-3">
									<a href="javascript:void(0);" className="btn btn-outline-light w-100 border">View All <i className="ti ti-arrow-right ms-2"></i></a>
								</div>
							</div>
						</div>
						<div className="card">
							<div className="card-body">
								<h5 className="mb-3">Trending Hastags</h5>
								<div className="d-flex align-items-center flex-wrap gap-1">
									<a href="javascript:void(0);" className="text-info d-inline-flex link-hover">#HealthTips</a>
									<a href="javascript:void(0);" className="text-info d-inline-flex link-hover">#Wellness</a>
									<a href="javascript:void(0);" className="text-info d-inline-flex link-hover">#Motivation</a>
									<a href="javascript:void(0);" className="text-info d-inline-flex link-hover">#Inspiration </a>
								</div>
							</div>
						</div>
						<div className="card">
							<div className="card-body">
								<div className="card-img card-img-hover mb-3">
									<a href="javascript:void(0);" className="rounded"><img src="assets/img/social/social-feed-04.jpg" className="rounded" alt="Img" /></a>
								</div>
								<h6 className="text-center"><a href="javascript:void(0);">Enjoy Unlimited Access on a small price monthly.</a></h6>
								<div className="mt-3">
									<a href="javascript:void(0);" className="btn btn-outline-light w-100 border">Upgrade Now <i className="ti ti-arrow-right ms-2"></i></a>
								</div>
							</div>
						</div>
						<div className="d-flex align-items-center flex-wrap justify-content-center template-more-links mb-4">
							<a href="javascript:void(0);" className="d-inline-flex">About</a>
							<a href="javascript:void(0);" className="d-inline-flex">Privacy</a>
							<a href="javascript:void(0);" className="d-inline-flex">Terms</a>
							<a href="javascript:void(0);" className="d-inline-flex">Help</a>
						</div>
					</div>
				</div>
			</div>
			<div className="footer d-sm-flex align-items-center justify-content-between bg-white border-top p-3">
				<p className="mb-0">2014 - 2025 &copy; SmartHR.</p>
				<p>Designed &amp; Developed By <a href="javascript:void(0);" className="text-primary">Dreams</a></p>
			</div>
    </>
  );
};

export default SocialFeedPage;
