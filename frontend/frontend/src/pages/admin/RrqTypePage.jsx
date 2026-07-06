import { useEffect } from "react";
import { loadLegacyUiScripts } from "../../utils/loadLegacyUiScripts";
import "../../assets/css/LeadsDashboard.css";

function LeadsDashboardPage() {
  useEffect(() => {
    let timer = null;
    loadLegacyUiScripts([
      "/assets/js/jquery-3.7.1.min.js",
      "/assets/js/bootstrap.bundle.min.js",
      "/assets/plugins/apexchart/apexcharts.min.js",
      "/assets/js/leads-dashboard.js",
    ])
      .then(() => {
        timer = window.setTimeout(() => {
          if (typeof window.__nexorLeadsDashboardInit === "function") {
            window.__nexorLeadsDashboardInit();
          }
        }, 80);
      })
      .catch(() => {});

    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
      if (typeof window.__nexorLeadsDashboardDestroy === "function") {
        window.__nexorLeadsDashboardDestroy();
      }
    };
  }, []);

  return (
    <div className="content">
      <div className="content">
        <div className="content">
          <h2 className="content">Leads Dashboard</h2>

          <nav>
            <ol className="content">
              <li className="content">
                <a href="index.html">
                  <i className="content"></i>
                </a>
              </li>

              <li className="content">Dashboard</li>

              <li className="content" aria-current="page">
                Leads Dashboard
              </li>
            </ol>
          </nav>
        </div>

        <div className="content">
          <div className="content">
            <div className="content">
              <a href="#" className="content" data-bs-toggle="dropdown">
                <i className="content"></i>Export
              </a>

              <ul className="content">
                <li>
                  <a href="#" className="content">
                    <i className="content"></i>Export as PDF
                  </a>
                </li>

                <li>
                  <a href="#" className="content">
                    <i className="content"></i>Export as Excel{" "}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="content">
            <span className="content">
              <i className="content"></i>
            </span>

            <input
              type="text"
              className="content"
              placeholder="dd/mm/yyyy - dd/mm/yyyy"
            />
          </div>

          <div className="content">
            <a
              href="#"
              className="content"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              data-bs-original-title="Collapse"
              id="collapse-header"
            >
              <i className="content"></i>
            </a>
          </div>
        </div>
      </div>

      <div className="content">
        <div className="content">
          <div className="content">
            <div className="content">
              <div className="content">
                <div className="content">
                  <span className="content">
                    <i className="content"></i>
                  </span>
                </div>

                <div className="content">
                  <p className="content">Total No of Leads</p>

                  <h5>6000</h5>
                </div>
              </div>

              <div className="content">
                <div
                  className="content"
                  role="progressbar"
                  style={{ width: "40%" }}
                ></div>
              </div>

              <p className="content">
                <span className="content">
                  <i className="content"></i>-4.01%{" "}
                </span>{" "}
                from last week
              </p>

              <span className="content">
                <img src="/core-assets/images/bg/card-bg-04.png" alt="Img" />
              </span>
            </div>
          </div>
        </div>

        <div className="content">
          <div className="content">
            <div className="content">
              <div className="content">
                <div className="content">
                  <span className="content">
                    <i className="content"></i>
                  </span>
                </div>

                <div className="content">
                  <p className="content">No of New Leads</p>

                  <h5>120</h5>
                </div>
              </div>

              <div className="content">
                <div
                  className="content"
                  role="progressbar"
                  style={{ width: "40%" }}
                ></div>
              </div>

              <p className="content">
                <span className="content">
                  <i className="content"></i>+20.01%{" "}
                </span>{" "}
                from last week
              </p>

              <span className="content">
                <img src="/core-assets/images/bg/card-bg-04.png" alt="Img" />
              </span>
            </div>
          </div>
        </div>

        <div className="content">
          <div className="content">
            <div className="content">
              <div className="content">
                <div className="content">
                  <span className="content">
                    <i className="content"></i>
                  </span>
                </div>

                <div className="content">
                  <p className="content">No of Lost Leads</p>

                  <h5>30</h5>
                </div>
              </div>

              <div className="content">
                <div
                  className="content"
                  role="progressbar"
                  style={{ width: "40%" }}
                ></div>
              </div>

              <p className="content">
                <span className="content">
                  <i className="content"></i>+55%{" "}
                </span>{" "}
                from last week
              </p>

              <span className="content">
                <img src="/core-assets/images/bg/card-bg-04.png" alt="Img" />
              </span>
            </div>
          </div>
        </div>

        <div className="content">
          <div className="content">
            <div className="content">
              <div className="content">
                <div className="content">
                  <span className="content">
                    <i className="content"></i>
                  </span>
                </div>

                <div className="content">
                  <p className="content">No of Total Customers</p>

                  <h5>9895</h5>
                </div>
              </div>

              <div className="content">
                <div
                  className="content"
                  role="progressbar"
                  style={{ width: "40%" }}
                ></div>
              </div>

              <p className="content">
                <span className="content">
                  <i className="content"></i>+55%{" "}
                </span>{" "}
                from last week
              </p>

              <span className="content">
                <img src="/core-assets/images/bg/card-bg-04.png" alt="Img" />
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="content">
        <div className="content">
          <div className="content">
            <div className="content">
              <div className="content">
                <h5>Pipeline Stages</h5>

                <div className="content">
                  <a href="#" className="content" data-bs-toggle="dropdown">
                    <i className="content"></i>2023 - 2024
                  </a>

                  <ul className="content">
                    <li>
                      <a href="#" className="content">
                        2023 - 2024
                      </a>
                    </li>

                    <li>
                      <a href="#" className="content">
                        2022 - 2023
                      </a>
                    </li>

                    <li>
                      <a href="#" className="content">
                        2021 - 2023
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="content">
              <div className="content">
                <div className="content">
                  <div className="content">
                    <p className="content">
                      <i className="content"></i>Contacted
                    </p>

                    <h6>50000</h6>
                  </div>
                </div>

                <div className="content">
                  <div className="content">
                    <p className="content">
                      <i className="content"></i>Oppurtunity
                    </p>

                    <h6>25985</h6>
                  </div>
                </div>

                <div className="content">
                  <div className="content">
                    <p className="content">
                      <i className="content"></i>Not Contacted
                    </p>

                    <h6>12566</h6>
                  </div>
                </div>

                <div className="content">
                  <div className="content">
                    <p className="content">
                      <i className="content"></i>Closed
                    </p>

                    <h6>8965</h6>
                  </div>
                </div>

                <div className="content">
                  <div className="content">
                    <p className="content">
                      <i className="content"></i>Lost
                    </p>

                    <h6>2452</h6>
                  </div>
                </div>
              </div>

              <div id="revenue-income"></div>
            </div>
          </div>
        </div>

        <div className="content">
          <div className="content">
            <div className="content">
              <div className="content">
                <h5>New Leads</h5>

                <div className="content">
                  <a href="#" className="content" data-bs-toggle="dropdown">
                    <i className="content"></i>This Week
                  </a>

                  <ul className="content">
                    <li>
                      <a href="#" className="content">
                        This Week
                      </a>
                    </li>

                    <li>
                      <a href="#" className="content">
                        This Month
                      </a>
                    </li>

                    <li>
                      <a href="#" className="content">
                        This Year
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="content">
              <div id="heat_chart"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="content">
        <div className="content">
          <div className="content">
            <div className="content">
              <div className="content">
                <h5>Lost Leads By Reason</h5>

                <div className="content">
                  <a
                    href="#"
                    className="content"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    Sales Pipeline
                  </a>

                  <ul className="content">
                    <li>
                      <a href="#" className="content">
                        This Month
                      </a>
                    </li>

                    <li>
                      <a href="#" className="content">
                        This Week
                      </a>
                    </li>

                    <li>
                      <a href="#" className="content">
                        Last Week
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="content">
              <div>
                <div id="leads_stage"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="content">
          <div className="content">
            <div className="content">
              <div className="content">
                <h5>Leads By Companies</h5>

                <div className="content">
                  <a href="#" className="content" data-bs-toggle="dropdown">
                    <i className="content"></i>This Week
                  </a>

                  <ul className="content">
                    <li>
                      <a href="#" className="content">
                        This Month
                      </a>
                    </li>

                    <li>
                      <a href="#" className="content">
                        This Week
                      </a>
                    </li>

                    <li>
                      <a href="#" className="content">
                        Last Week
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="content">
              <div>
                <div className="content">
                  <div className="content">
                    <div className="content">
                      <a href="#" className="content">
                        <img
                          src="/core-assets/images/company/company-24.svg"
                          className="content"
                          alt="Img"
                        />
                      </a>

                      <div>
                        <h6 className="content">Pitch</h6>

                        <p className="content">Value : $45,985</p>
                      </div>
                    </div>

                    <span className="content">
                      <i className="content"></i> Not Contacted
                    </span>
                  </div>
                </div>

                <div className="content">
                  <div className="content">
                    <div className="content">
                      <a href="#" className="content">
                        <img
                          src="/core-assets/images/company/company-25.svg"
                          className="content"
                          alt="Img"
                        />
                      </a>

                      <div>
                        <h6 className="content">Initech</h6>

                        <p className="content">Value : $21,145</p>
                      </div>
                    </div>

                    <span className="content">
                      <i className="content"></i>Closed
                    </span>
                  </div>
                </div>

                <div className="content">
                  <div className="content">
                    <div className="content">
                      <a href="#" className="content">
                        <img
                          src="/core-assets/images/company/company-26.svg"
                          className="content"
                          alt="Img"
                        />
                      </a>

                      <div>
                        <h6 className="content">Umbrella Corp</h6>

                        <p className="content">Value : $15,685</p>
                      </div>
                    </div>

                    <span className="content">
                      <i className="content"></i>Contacted
                    </span>
                  </div>
                </div>

                <div className="content">
                  <div className="content">
                    <div className="content">
                      <a href="#" className="content">
                        <img
                          src="/core-assets/images/company/company-27.svg"
                          className="content"
                          alt="Img"
                        />
                      </a>

                      <div>
                        <h6 className="content">Capital Partners</h6>

                        <p className="content">Value : $12,105</p>
                      </div>
                    </div>

                    <span className="content">
                      <i className="content"></i>Contacted
                    </span>
                  </div>
                </div>

                <div className="content">
                  <div className="content">
                    <div className="content">
                      <a href="#" className="content">
                        <img
                          src="/core-assets/images/company/company-28.svg"
                          className="content"
                          alt="Img"
                        />
                      </a>

                      <div>
                        <h6 className="content">Massive Dynamic</h6>

                        <p className="content">Value : $2,546</p>
                      </div>
                    </div>

                    <span className="content">
                      <i className="content"></i>Lost
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="content">
          <div className="content">
            <div className="content">
              <div className="content">
                <h5>Leads by Source</h5>

                <div className="content">
                  <a href="#" className="content" data-bs-toggle="dropdown">
                    <i className="content"></i>This Week
                  </a>

                  <ul className="content">
                    <li>
                      <a href="#" className="content">
                        This Month
                      </a>
                    </li>

                    <li>
                      <a href="#" className="content">
                        This Week
                      </a>
                    </li>

                    <li>
                      <a href="#" className="content">
                        Last Week
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="content">
              <div id="donut-chart-2"></div>

              <div>
                <h6 className="content">Status</h6>

                <div className="content">
                  <p className="content">
                    <i className="content"></i>Google
                  </p>

                  <p className="content">40%</p>
                </div>

                <div className="content">
                  <p className="content">
                    <i className="content"></i>Paid
                  </p>

                  <p className="content">35%</p>
                </div>

                <div className="content">
                  <p className="content">
                    <i className="content"></i>Campaigns
                  </p>

                  <p className="content">15%</p>
                </div>

                <div className="content">
                  <p className="content">
                    <i className="content"></i>Referals
                  </p>

                  <p className="content">10%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="content">
        <div className="content">
          <div className="content">
            <div className="content">
              <div className="content">
                <h5>Recent Follow Up</h5>

                <div>
                  <a href="#" className="content">
                    View All
                  </a>
                </div>
              </div>
            </div>

            <div className="content">
              <div className="content">
                <div className="content">
                  <a href="#" className="content">
                    <img
                      src="/core-assets/images/users/user-27.jpg"
                      className="content"
                      alt="img"
                    />
                  </a>

                  <div className="content">
                    <h6 className="content">
                      <a href="#">Alexander Jermai</a>
                    </h6>

                    <p className="content">UI/UX Designer</p>
                  </div>
                </div>

                <div className="content">
                  <a href="#" className="content">
                    <i className="content"></i>
                  </a>
                </div>
              </div>

              <div className="content">
                <div className="content">
                  <a href="#" className="content">
                    <img
                      src="/core-assets/images/users/user-42.jpg"
                      className="content"
                      alt="img"
                    />
                  </a>

                  <div className="content">
                    <h6 className="content">
                      <a href="#">Doglas Martini</a>
                    </h6>

                    <p className="content">Product Designer</p>
                  </div>
                </div>

                <div className="content">
                  <a href="#" className="content">
                    <i className="content"></i>
                  </a>
                </div>
              </div>

              <div className="content">
                <div className="content">
                  <a href="#" className="content">
                    <img
                      src="/core-assets/images/users/user-43.jpg"
                      className="content"
                      alt="img"
                    />
                  </a>

                  <div className="content">
                    <h6 className="content">
                      <a href="#">Daniel Esbella</a>
                    </h6>

                    <p className="content">Project Manager</p>
                  </div>
                </div>

                <div className="content">
                  <a href="#" className="content">
                    <i className="content"></i>
                  </a>
                </div>
              </div>

              <div className="content">
                <div className="content">
                  <a href="#" className="content">
                    <img
                      src="/core-assets/images/users/user-11.jpg"
                      className="content"
                      alt="img"
                    />
                  </a>

                  <div className="content">
                    <h6 className="content">
                      <a href="#">Daniel Esbella</a>
                    </h6>

                    <p className="content">Team Lead</p>
                  </div>
                </div>

                <div className="content">
                  <a href="#" className="content">
                    <i className="content"></i>
                  </a>
                </div>
              </div>

              <div className="content">
                <div className="content">
                  <a href="#" className="content">
                    <img
                      src="/core-assets/images/users/user-45.jpg"
                      className="content"
                      alt="img"
                    />
                  </a>

                  <div className="content">
                    <h6 className="content">
                      <a href="#">Doglas Martini</a>
                    </h6>

                    <p className="content">Team Lead</p>
                  </div>
                </div>

                <div className="content">
                  <a href="#" className="content">
                    <i className="content"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="content">
          <div className="content">
            <div className="content">
              <div className="content">
                <h5>Recent Activities</h5>

                <div>
                  <a href="activity.html" className="content">
                    View All
                  </a>
                </div>
              </div>
            </div>

            <div className="content">
              <div className="content">
                <div className="content">
                  <i className="content"></i>
                </div>

                <div className="content">
                  <p className="content">
                    <a href="activity.html">
                      Drain responded to your appointment schedule question.
                    </a>
                  </p>

                  <span>09:25 PM</span>
                </div>
              </div>

              <div className="content">
                <div className="content">
                  <i className="content"></i>
                </div>

                <div className="content">
                  <p className="content">
                    <a href="activity.html">You sent 1 Message to the James.</a>
                  </p>

                  <span>10:25 PM</span>
                </div>
              </div>

              <div className="content">
                <div className="content">
                  <i className="content"></i>
                </div>

                <div className="content">
                  <p className="content">
                    <a href="activity.html">
                      Denwar responded to your appointment on 25 Jan 2025, 08:15
                      PM
                    </a>
                  </p>

                  <span>09:25 PM</span>
                </div>
              </div>

              <div className="content">
                <div className="content">
                  <i className="content"></i>
                </div>

                <div className="content">
                  <p className="content">
                    <a href="activity.html" className="content">
                      Meeting With{" "}
                      <img
                        src="/core-assets/images/users/user-58.jpg"
                        className="content"
                        alt="Img"
                      />
                      Abraham
                    </a>
                  </p>

                  <span>09:25 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="content">
          <div className="content">
            <div className="content">
              <div className="content">
                <h5>Notifications</h5>

                <div>
                  <a href="#" className="content">
                    View All
                  </a>
                </div>
              </div>
            </div>

            <div className="content">
              <div className="content">
                <a href="#" className="content">
                  <img
                    src="/core-assets/images/users/user-27.jpg"
                    className="content"
                    alt="img"
                  />
                </a>

                <div className="content">
                  <h6 className="content">
                    Lex Murphy requested access to UNIX{" "}
                  </h6>

                  <p className="content">Today at 9:42 AM</p>

                  <div className="content">
                    <a href="#" className="content">
                      <img
                        src="/core-assets/images/social/pdf-icon.svg"
                        className="content"
                        alt="Img"
                      />
                    </a>

                    <h6 className="content">
                      <a href="#">EY_review.pdf</a>
                    </h6>
                  </div>
                </div>
              </div>

              <div className="content">
                <a href="#" className="content">
                  <img
                    src="/core-assets/images/users/user-28.jpg"
                    className="content"
                    alt="img"
                  />
                </a>

                <div className="content">
                  <h6 className="content">
                    Lex Murphy requested access to UNIX{" "}
                  </h6>

                  <p className="content">Today at 10:00 AM</p>
                </div>
              </div>

              <div className="content">
                <a href="#" className="content">
                  <img
                    src="/core-assets/images/users/user-29.jpg"
                    className="content"
                    alt="img"
                  />
                </a>

                <div className="content">
                  <h6 className="content">
                    Lex Murphy requested access to UNIX{" "}
                  </h6>

                  <p className="content">Today at 10:50 AM</p>

                  <div className="content">
                    <a href="#" className="content">
                      Approve
                    </a>

                    <a href="#" className="content">
                      Decline
                    </a>
                  </div>
                </div>
              </div>

              <div className="content">
                <a href="#" className="content">
                  <img
                    src="/core-assets/images/users/user-33.jpg"
                    className="content"
                    alt="img"
                  />
                </a>

                <div className="content">
                  <h6 className="content">
                    Lex Murphy requested access to UNIX{" "}
                  </h6>

                  <p className="content">Today at 05:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="content">
        <div className="content">
          <div className="content">
            <div className="content">
              <div className="content">
                <h5>Top Countries</h5>

                <div className="content">
                  <a
                    href="#"
                    className="content"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    Referrals
                  </a>

                  <ul className="content">
                    <li>
                      <a href="#" className="content">
                        Referrals
                      </a>
                    </li>

                    <li>
                      <a href="#" className="content">
                        Sales Pipeline
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="content">
              <div className="content">
                <div className="content">
                  <div className="content">
                    <div className="content">
                      <span className="content">
                        <i className="content"></i>
                      </span>

                      <a href="countries.html" className="content">
                        <img
                          src="/core-assets/images/payment-gateway/country-03.svg"
                          className="content"
                          alt="img"
                        />
                      </a>

                      <div className="content">
                        <h6 className="content">
                          <a href="countries.html">Singapore</a>
                        </h6>

                        <span className="content">Leads : 236</span>
                      </div>
                    </div>

                    <div className="content">
                      <span className="content">
                        <i className="content"></i>
                      </span>

                      <a href="countries.html" className="content">
                        <img
                          src="/core-assets/images/payment-gateway/country-04.svg"
                          className="content"
                          alt="img"
                        />
                      </a>

                      <div className="content">
                        <h6 className="content">
                          <a href="countries.html">France</a>
                        </h6>

                        <span className="content">Leads : 589</span>
                      </div>
                    </div>

                    <div className="content">
                      <span className="content">
                        <i className="content"></i>
                      </span>

                      <a href="countries.html" className="content">
                        <img
                          src="/core-assets/images/payment-gateway/country-05.svg"
                          className="content"
                          alt="img"
                        />
                      </a>

                      <div className="content">
                        <h6 className="content">
                          <a href="countries.html">Norway</a>
                        </h6>

                        <span className="content">Leads : 221</span>
                      </div>
                    </div>

                    <div className="content">
                      <span className="content">
                        <i className="content"></i>
                      </span>

                      <a href="countries.html" className="content">
                        <img
                          src="/core-assets/images/payment-gateway/country-01.svg"
                          className="content"
                          alt="img"
                        />
                      </a>

                      <div className="content">
                        <h6 className="content">
                          <a href="countries.html">USA</a>
                        </h6>

                        <span className="content">Leads : 350</span>
                      </div>
                    </div>

                    <div className="content">
                      <span className="content">
                        <i className="content"></i>
                      </span>

                      <a href="countries.html" className="content">
                        <img
                          src="/core-assets/images/payment-gateway/country-02.svg"
                          className="content"
                          alt="img"
                        />
                      </a>

                      <div className="content">
                        <h6 className="content">
                          <a href="countries.html">UAE</a>
                        </h6>

                        <span className="content">Leads : 221</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="content">
                  <div id="donut-chart-3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="content">
          <div className="content">
            <div className="content">
              <h5>Recent Leads</h5>

              <div className="content">
                <div>
                  <a href="leads.html" className="content">
                    View All
                  </a>
                </div>
              </div>
            </div>

            <div className="content">
              <div className="content">
                <table className="content">
                  <thead>
                    <tr>
                      <th>Lead Name</th>

                      <th>Company Name</th>

                      <th>Stage</th>

                      <th>Created Date</th>

                      <th>Lead Owner</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr>
                      <td>
                        <h6 className="content">
                          <a href="leads-details.html">Collins</a>
                        </h6>
                      </td>

                      <td>
                        <div className="content">
                          <a href="company-details.html" className="content">
                            <img
                              src="/core-assets/images/company/company-01.svg"
                              className="content"
                              alt="img"
                            />
                          </a>

                          <div className="content">
                            <h6 className="content">
                              <a href="company-details.html">
                                BrightWave Innovations
                              </a>
                            </h6>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="content">
                          <i className="content"></i>
                          Contacted
                        </span>
                      </td>

                      <td>14 Jan 2024</td>

                      <td>Hendry</td>
                    </tr>

                    <tr>
                      <td>
                        <h6 className="content">
                          <a href="leads-details.html">Konopelski</a>
                        </h6>
                      </td>

                      <td>
                        <div className="content">
                          <a href="company-details.html" className="content">
                            <img
                              src="/core-assets/images/company/company-02.svg"
                              className="content"
                              alt="img"
                            />
                          </a>

                          <div className="content">
                            <h6 className="content">
                              <a href="company-details.html">
                                Stellar Dynamics
                              </a>
                            </h6>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="content">
                          <i className="content"></i>
                          Closed
                        </span>
                      </td>

                      <td>21 Jan 2024</td>

                      <td>Guilory</td>
                    </tr>

                    <tr>
                      <td>
                        <h6 className="content">
                          <a href="leads-details.html">Adams</a>
                        </h6>
                      </td>

                      <td>
                        <div className="content">
                          <a href="company-details.html" className="content">
                            <img
                              src="/core-assets/images/company/company-03.svg"
                              className="content"
                              alt="img"
                            />
                          </a>

                          <div className="content">
                            <h6 className="content">
                              <a href="company-details.html">Quantum Nexus</a>
                            </h6>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="content">
                          <i className="content"></i>
                          Lost
                        </span>
                      </td>

                      <td>20 Feb 2024</td>

                      <td>Jami</td>
                    </tr>

                    <tr>
                      <td>
                        <h6 className="content">
                          <a href="leads-details.html">Schumm</a>
                        </h6>
                      </td>

                      <td>
                        <div className="content">
                          <a href="company-details.html" className="content">
                            <img
                              src="/core-assets/images/company/company-04.svg"
                              className="content"
                              alt="img"
                            />
                          </a>

                          <div className="content">
                            <h6 className="content">
                              <a href="company-details.html">
                                EcoVision Enterprises
                              </a>
                            </h6>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="content">
                          <i className="content"></i>
                          Not Contacted
                        </span>
                      </td>

                      <td>15 Mar 2024</td>

                      <td>Theresa</td>
                    </tr>

                    <tr>
                      <td>
                        <h6 className="content">
                          <a href="leads-details.html">Wisozk</a>
                        </h6>
                      </td>

                      <td>
                        <div className="content">
                          <a href="company-details.html" className="content">
                            <img
                              src="/core-assets/images/company/company-05.svg"
                              className="content"
                              alt="img"
                            />
                          </a>

                          <div className="content">
                            <h6 className="content">
                              <a href="company-details.html">
                                Aurora Technologies
                              </a>
                            </h6>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="content">
                          <i className="content"></i>
                          Closed
                        </span>
                      </td>

                      <td>12 Apr 2024</td>

                      <td>Smith</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="content">
        <div className="content">
          <div className="content">
            <div className="content">
              <div className="content">
                <h4>Project Status</h4>
                <div className="content">
                  <select className="content" defaultValue="">
                    <option value="">All Projects</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="content">
              <div className="content">
                <div className="content">
                  <a href="#">
                    <div className="content">
                      <div className="content">
                        <i className="content"></i>
                        <h6>Today Leads</h6>
                        <p>0</p>
                      </div>
                    </div>
                  </a>
                </div>
                <div className="content">
                  <a href="#">
                    <div className="content">
                      <div className="content">
                        <i className="content"></i>
                        <h6>New Lead</h6>
                        <p>20</p>
                      </div>
                    </div>
                  </a>
                </div>
                <div className="content">
                  <a href="#">
                    <div className="content">
                      <div className="content">
                        <i className="content"></i>
                        <h6>Attempted</h6>
                        <p>73</p>
                      </div>
                    </div>
                  </a>
                </div>
                <div className="content">
                  <a href="#">
                    <div className="content">
                      <div className="content">
                        <i className="content"></i>
                        <h6>Interested</h6>
                        <p>41</p>
                      </div>
                    </div>
                  </a>
                </div>
                <div className="content">
                  <a href="#">
                    <div className="content">
                      <div className="content">
                        <i className="content"></i>
                        <h6>Allocate</h6>
                        <p>0</p>
                      </div>
                    </div>
                  </a>
                </div>
                <div className="content">
                  <a href="#">
                    <div className="content">
                      <div className="content">
                        <i className="content"></i>
                        <h6>Site Visit</h6>
                        <p>8</p>
                      </div>
                    </div>
                  </a>
                </div>
                <div className="content">
                  <a href="#">
                    <div className="content">
                      <div className="content">
                        <i className="content"></i>
                        <h6>Rejected</h6>
                        <p>31</p>
                      </div>
                    </div>
                  </a>
                </div>
                <div className="content">
                  <a href="#">
                    <div className="content">
                      <div className="content">
                        <i className="content"></i>
                        <h6>Duplicate</h6>
                        <p>12</p>
                      </div>
                    </div>
                  </a>
                </div>
                <div className="content">
                  <a href="#">
                    <div className="content">
                      <div className="content">
                        <i className="content"></i>
                        <h6>Opportunity</h6>
                        <p>0</p>
                      </div>
                    </div>
                  </a>
                </div>
                <div className="content">
                  <a href="#">
                    <div className="content">
                      <div className="content">
                        <i className="content"></i>
                        <h6>Missed Follow Up</h6>
                        <p>117</p>
                      </div>
                    </div>
                  </a>
                </div>
                <div className="content">
                  <a href="#">
                    <div className="content">
                      <div className="content">
                        <i className="content"></i>
                        <h6>Site Visit Done</h6>
                        <p>6</p>
                      </div>
                    </div>
                  </a>
                </div>
                <div className="content">
                  <a href="#">
                    <div className="content">
                      <div className="content">
                        <i className="content"></i>
                        <h6>Site Visit Confirmed</h6>
                        <p>0</p>
                      </div>
                    </div>
                  </a>
                </div>
                <div className="content">
                  <a href="#">
                    <div className="content">
                      <div className="content">
                        <i className="content"></i>
                        <h6>Re Scheduled Visit</h6>
                        <p>0</p>
                      </div>
                    </div>
                  </a>
                </div>
                <div className="content">
                  <a href="#">
                    <div className="content">
                      <div className="content">
                        <i className="content"></i>
                        <h6>Site Visit Scheduled</h6>
                        <p>2</p>
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeadsDashboardPage;
