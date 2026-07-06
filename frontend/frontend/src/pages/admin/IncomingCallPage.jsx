import { useQuery } from "@tanstack/react-query";
import PageHeader from "../../components/admin/PageHeader";
import ErrorState from "../../components/common/ErrorState";
import PageLoader from "../../components/common/PageLoader";
import { incomingCallData } from "../../mock/incomingCallData";
import callService from "../../services/callService";

export default function IncomingCallPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["incoming-call"],
    queryFn: callService.getIncomingCall,
    placeholderData: incomingCallData,
    keepPreviousData: true,
  });

  const pageData = {
    ...incomingCallData,
    ...(data || {}),
    header: {
      ...incomingCallData.header,
      ...(data?.header || {}),
      breadcrumbs: Array.isArray(data?.header?.breadcrumbs)
        ? data.header.breadcrumbs
        : incomingCallData.header.breadcrumbs,
    },
    caller: {
      ...incomingCallData.caller,
      ...(data?.caller || {}),
    },
  };

  const header = pageData?.header || incomingCallData.header;
  const caller = pageData?.caller || incomingCallData.caller;
  const pageTitle = header?.title || incomingCallData.header.title;
  const breadcrumbs = Array.isArray(header?.breadcrumbs)
    ? header.breadcrumbs
    : incomingCallData.header.breadcrumbs;

  if (isLoading && !data) {
    return <PageLoader />;
  }

  if (error && !data) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <>
      <PageHeader
        title={pageTitle}
        breadcrumbs={breadcrumbs}
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

      <div className="row">
        <div className="col-xxl-12">
          <div className="card incoming-call mb-0">
            <div className="card-body text-center d-flex flex-column justify-content-center">
              <div className="voice-call-img mb-3">
                <img src={caller.avatar} className="img-fluid rounded-circle" alt="img" />
              </div>
              <h4 className="display-4">{caller.name}</h4>
              <p>{caller.statusText}</p>
              <div className="d-flex align-items-center justify-content-center">
                <a
                  href="#"
                  className="btn btn-success call-item p-0 d-flex align-items-center justify-content-center me-3"
                >
                  <i className="ti ti-phone fs-20" />
                </a>
                <a
                  href="#"
                  className="btn btn-danger call-item p-0 d-flex align-items-center justify-content-center"
                >
                  <i className="ti ti-phone-off fs-20" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
