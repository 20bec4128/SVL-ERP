import { useQuery } from "@tanstack/react-query";
import PageHeader from "../../components/admin/PageHeader";
import ErrorState from "../../components/common/ErrorState";
import PageLoader from "../../components/common/PageLoader";
import { otpSettingsData } from "../../mock/otpSettingsData";
import settingsService from "../../services/settingsService";

export default function OtpSettingsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["otp-settings"],
    queryFn: settingsService.getOtpSettings,
    placeholderData: otpSettingsData,
    keepPreviousData: true,
  });

  const pageData = data ?? otpSettingsData;

  if (isLoading && !pageData) {
    return <PageLoader />;
  }

  if (error && !pageData) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <>
      <PageHeader
        title={pageData.header.title}
        breadcrumbs={pageData.header.breadcrumbs}
        actions={
          <div className="head-icons ms-2">
            <a
              href="javascript:void(0);"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              data-bs-original-title="Collapse"
              id="collapse-header"
            >
              <i className="ti ti-chevrons-up" />
            </a>
          </div>
        }
      />

      <ul className="nav nav-tabs nav-tabs-solid bg-transparent border-bottom mb-3">
        {pageData.topTabs.map((tab) => (
          <li key={tab.label} className="nav-item">
            <a className={`nav-link${tab.active ? " active" : ""}`} href={tab.href}>
              <i className={tab.iconClass} />
              {tab.label}
            </a>
          </li>
        ))}
      </ul>

      <div className="row">
        <div className="col-xl-3 theiaStickySidebar">
          <div className="card">
            <div className="card-body">
              <div className="d-flex flex-column list-group settings-list">
                {pageData.sideLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className={`d-inline-flex align-items-center rounded py-2 px-3${link.active ? " active" : ""}`}
                  >
                    {link.active ? <i className="ti ti-arrow-badge-right me-2" /> : null}
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-9">
          <div className="card">
            <div className="card-body">
              <div className="border-bottom mb-3 pb-3">
                <h4>{pageData.form.title}</h4>
              </div>

              <form action="otp-settings.php">
                <div className="border-bottom mb-3">
                  <div className="row">
                    <div className="col-md-8">
                      {pageData.form.fields.map((field) => (
                        <div key={field.id} className="row align-items-center">
                          <div className="col-lg-6">
                            <div className="mb-3">
                              <h6 className="mb-2 fw-medium">{field.label}</h6>
                            </div>
                          </div>
                          <div className="col-lg-5">
                            <div className="mb-3">
                              <select className="select">
                                {field.options.map((option) => (
                                  <option key={option}>{option}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center justify-content-end">
                  <button type="button" className="btn btn-outline-light border me-3">Cancel</button>
                  <button type="submit" className="btn btn-primary">Save</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
