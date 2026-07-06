import { useQuery } from "@tanstack/react-query";
import PageHeader from "../../components/admin/PageHeader";
import ErrorState from "../../components/common/ErrorState";
import PageLoader from "../../components/common/PageLoader";
import { voiceCallData } from "../../mock/voiceCallData";
import callService from "../../services/callService";

export default function VoiceCallPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["voice-call"],
    queryFn: callService.getVoiceCall,
    placeholderData: voiceCallData,
    keepPreviousData: true,
  });

  const pageData = {
    ...voiceCallData,
    ...(data || {}),
    header: {
      ...voiceCallData.header,
      ...(data?.header || {}),
      breadcrumbs: Array.isArray(data?.header?.breadcrumbs)
        ? data.header.breadcrumbs
        : voiceCallData.header.breadcrumbs,
    },
    call: {
      ...voiceCallData.call,
      ...(data?.call || {}),
    },
    footerButtons: Array.isArray(data?.footerButtons)
      ? data.footerButtons
      : voiceCallData.footerButtons,
  };

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
          <div className="head-icons">
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

      <div className="row">
        <div className="col-xxl-12">
          <div className="card incoming-call mb-0">
            <div className="card-header">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <span className="avatar avatar-lg avatar-rounded me-2">
                    <img src={pageData.call.avatar} className="img-fluid rounded-circle" alt="img" />
                  </span>
                  <div>
                    <h5 className="mb-1"><a href="#">{pageData.call.userName}</a></h5>
                    <span className="d-block">{pageData.call.statusText}</span>
                  </div>
                </div>
                <a href="#" className="avatar avatar-md rounded-circle bg-gray-200 text-dark">
                  <i className="ti ti-user-plus fs-20" />
                </a>
              </div>
            </div>
            <div className="card-body position-relative text-center d-flex flex-column justify-content-center">
              <div className="voice-call-img mb-3">
                <img src={pageData.call.avatar} className="img-fluid rounded-circle" alt="img" />
              </div>
              <h4 className="display-4">{pageData.call.userName}</h4>
              <p>{pageData.call.duration}</p>
              <a href="#" className="avatar avatar-xl position-absolute end-0 bottom-0 m-3">
                <img src={pageData.call.miniAvatar} alt="Img" />
              </a>
            </div>
            <div className="card-footer">
              <div className="d-flex align-items-center justify-content-center">
                {pageData.footerButtons.map((button) => (
                  <a
                    key={button.id}
                    href="#"
                    className={`${button.buttonClass} call-item p-0 d-flex align-items-center justify-content-center me-3`}
                  >
                    <i className={button.iconClass} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
