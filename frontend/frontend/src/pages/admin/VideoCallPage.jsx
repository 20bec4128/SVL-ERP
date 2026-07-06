export default function VideoCallPage() {
  return (
    <>
      <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
        <div className="my-auto mb-2">
          <h2 className="mb-1">Calls</h2>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a href="admin-dashboard.php">
                  <i className="ti ti-smart-home"></i>
                </a>
              </li>
              <li className="breadcrumb-item">Application</li>
              <li className="breadcrumb-item active" aria-current="page">
                Calls
              </li>
            </ol>
          </nav>
        </div>
        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
          <div className="me-2 mb-2">
            <div className="input-icon-start position-relative">
              <span className="input-icon-addon">
                <i className="ti ti-search"></i>
              </span>
              <input type="text" className="form-control" placeholder="Search" />
            </div>
          </div>
          <div className="mb-2">
            <a href="#" className="btn btn-primary d-flex align-items-center">
              <i className="ti ti-circle-plus me-2"></i>Add People
            </a>
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

      <div className="row">
        <div className="col-xxl-12">
          <div className="single-video d-flex">
            <div className="join-video flex-fill">
              <img src="/assets/img/video/video.jpg" className="img-fluid" alt="Logo" />
              <div className="chat-active-users">
                <div className="video-avatar">
                  <img src="/assets/img/video/user-01.jpg" className="img-fluid" alt="Logo" />
                  <div className="user-name">
                    <span>Joanne Conner</span>
                  </div>
                </div>
              </div>

              <div className="record-item d-flex align-items-center">
                <div className="record-time me-2">
                  <span>40:12</span>
                </div>
                <a href="javascript:void(0);" className="video-expand btnFullscreen">
                  <i className="ti ti-maximize"></i>
                </a>
              </div>
              <div className="more-icon">
                <a href="javascript:void(0);" className="mic-off">
                  <i className="bx bx-microphone-off"></i>
                </a>
              </div>
              <div className="call-overlay-bottom d-flex justify-content-sm-between align-items-center flex-wrap w-100">
                <a
                  href="javascript:void(0);"
                  className="options-icon d-flex align-items-center justify-content-center guest-off rounded"
                >
                  <i className="ti ti-user-off"></i>
                </a>
                <div className="call-option rounded-pill d-flex justify-content-center align-items-center">
                  <a
                    href="javascript:void(0);"
                    className="options-icon bg-light d-flex justify-content-center align-items-center rounded me-2"
                  >
                    <i className="ti ti-microphone"></i>
                  </a>
                  <a
                    href="javascript:void(0);"
                    className="options-icon bg-light d-flex justify-content-center align-items-center rounded me-2"
                  >
                    <i className="ti ti-video"></i>
                  </a>
                  <a
                    href="javascript:void(0);"
                    className="call-icon bg-danger d-flex justify-content-center align-items-center rounded"
                  >
                    <i className="ti ti-phone"></i>
                  </a>
                  <a
                    href="javascript:void(0);"
                    className="options-icon bg-light d-flex justify-content-center align-items-center rounded mx-2"
                  >
                    <i className="ti ti-volume"></i>
                  </a>
                  <a
                    href="javascript:void(0);"
                    className="options-icon bg-light d-flex justify-content-center align-items-center rounded"
                  >
                    <i className="ti ti-device-imac-share"></i>
                  </a>
                </div>
                <a
                  href="javascript:void(0);"
                  className="options-icon bg-light d-flex align-items-center justify-content-center rounded"
                  id="show-message"
                >
                  <i className="ti ti-dots"></i>
                </a>
              </div>
            </div>
            <div className="right-user-side chat-rooms" id="chat-room">
              <div className="card slime-grp border-0 mb-0">
                <div className="card-header p-3 pb-0 border-0">
                  <div className="d-flex align-items-center justify-content-between">
                    <h5>Chat</h5>
                    <a href="#" className="close_profile close_profile4 avatar avatar-sm mb-0 rounded-circle bg-danger">
                      <i className="ti ti-x"></i>
                    </a>
                  </div>
                </div>
                <div className="card-body slimscroll p-3">
                  <div>
                    <div className="chat-msg-blk p-0">
                      <div className="chats">
                        <div className="avatar avatar-md avatar-rounded flex-shrink-0 me-2">
                          <img src="/assets/img/users/user-01.jpg" alt="image" />
                        </div>
                        <div className="chat-content flex-fill">
                          <div className="message-content">
                            <h4>Hi Everyone.!</h4>
                          </div>
                          <div className="chat-profile-name d-flex justify-content-end">
                            <h6>10:00 AM</h6>
                          </div>
                        </div>
                      </div>
                      <div className="chats chats-right">
                        <div className="chat-content flex-fill">
                          <div className="message-content">
                            <h4>Good Morning..! Today we have meeting about the new policy.</h4>
                          </div>
                          <div className="chat-profile-name text-end">
                            <h6>
                              <i className="bx bx-check-double"></i> 10:00
                            </h6>
                          </div>
                        </div>
                        <div className="avatar avatar-md avatar-rounded flex-shrink-0 ms-2">
                          <img src="/assets/img/users/user-02.jpg" alt="image" />
                        </div>
                      </div>
                      <div className="chats">
                        <div className="avatar avatar-md avatar-rounded flex-shrink-0 me-2">
                          <img src="/assets/img/users/user-01.jpg" alt="image" />
                        </div>
                        <div className="chat-content flex-fill">
                          <div className="message-content">
                            <h4>Great.! This is the second new product that comes in this week.</h4>
                          </div>
                          <div className="chat-profile-name d-flex justify-content-end">
                            <h6>10:00 AM</h6>
                          </div>
                        </div>
                      </div>
                      <div className="chats">
                        <div className="avatar avatar-md avatar-rounded flex-shrink-0 me-2">
                          <img src="/assets/img/users/user-01.jpg" alt="image" />
                        </div>
                        <div className="chat-content flex-fill">
                          <div className="message-content">
                            <h4>Nice..which category it belongs to?</h4>
                          </div>
                          <div className="chat-profile-name d-flex justify-content-end">
                            <h6>10:00 AM</h6>
                          </div>
                        </div>
                      </div>
                      <div className="chats">
                        <div className="avatar avatar-md avatar-rounded flex-shrink-0 me-2">
                          <img src="/assets/img/users/user-01.jpg" alt="image" />
                        </div>
                        <div className="chat-content flex-fill">
                          <div className="message-content">
                            <h4>Great.! This is the second new product that comes in this week.</h4>
                          </div>
                          <div className="chat-profile-name d-flex justify-content-end">
                            <h6>10:00 AM</h6>
                          </div>
                        </div>
                      </div>
                      <div className="chats">
                        <div className="avatar avatar-md avatar-rounded flex-shrink-0 me-2">
                          <img src="/assets/img/users/user-01.jpg" alt="image" />
                        </div>
                        <div className="chat-content flex-fill">
                          <div className="message-content">
                            <h4>Hi.! Good Morning all.</h4>
                          </div>
                          <div className="chat-profile-name d-flex justify-content-end">
                            <h6>10:00 AM</h6>
                          </div>
                        </div>
                      </div>
                      <div className="chats">
                        <div className="avatar avatar-md avatar-rounded flex-shrink-0 me-2">
                          <img src="/assets/img/users/user-01.jpg" alt="image" />
                        </div>
                        <div className="chat-content flex-fill">
                          <div className="message-content">
                            <h4>Nice..which category it belongs to?</h4>
                          </div>
                          <div className="chat-profile-name d-flex justify-content-end">
                            <h6>10:00 AM</h6>
                          </div>
                        </div>
                      </div>
                      <div className="chats chats-right">
                        <div className="chat-content flex-fill">
                          <div className="message-content">
                            <h4>Good Morning..! Today we have meeting about the new product.</h4>
                          </div>
                          <div className="chat-profile-name text-end">
                            <h6>
                              <i className="bx bx-check-double"></i> 10:00
                            </h6>
                          </div>
                        </div>
                        <div className="avatar avatar-md avatar-rounded flex-shrink-0 ms-2">
                          <img src="/assets/img/users/user-02.jpg" alt="image" />
                        </div>
                      </div>
                      <div className="chats mb-0">
                        <div className="avatar avatar-md avatar-rounded flex-shrink-0 me-2">
                          <img src="/assets/img/users/user-01.jpg" alt="image" />
                        </div>
                        <div className="chat-content flex-fill">
                          <div className="message-content">
                            <h4>Great.! This is the second new product that comes in this week.</h4>
                          </div>
                          <div className="chat-profile-name d-flex justify-content-end">
                            <h6>10:00 AM</h6>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="chat-footer">
                      <form>
                        <div className="smile-col comman-icon">
                          <a href="#">
                            <i className="far fa-smile"></i>
                          </a>
                        </div>
                        <div className="attach-col comman-icon">
                          <a href="#">
                            <i className="fas fa-paperclip"></i>
                          </a>
                        </div>
                        <div className="micro-col comman-icon">
                          <a href="#">
                            <i className="bx bx-microphone"></i>
                          </a>
                        </div>
                        <input type="text" className="form-control chat_form" placeholder="Enter Message....." />
                        <div className="send-chat comman-icon">
                          <a href="#" className="rounded">
                            <i data-feather="send"></i>
                          </a>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

