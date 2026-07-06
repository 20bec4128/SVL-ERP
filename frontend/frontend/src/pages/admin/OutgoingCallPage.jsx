import { useQuery } from "@tanstack/react-query";
import PageHeader from "../../components/admin/PageHeader";
import ErrorState from "../../components/common/ErrorState";
import PageLoader from "../../components/common/PageLoader";
import { outgoingCallData } from "../../mock/outgoingCallData";
import callService from "../../services/callService";

export default function OutgoingCallPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["outgoing-call"],
    queryFn: callService.getOutgoingCall,
    placeholderData: outgoingCallData,
    keepPreviousData: true,
  });

  const pageData = {
    ...outgoingCallData,
    ...(data || {}),
    header: {
      ...outgoingCallData.header,
      ...(data?.header || {}),
      breadcrumbs: Array.isArray(data?.header?.breadcrumbs)
        ? data.header.breadcrumbs
        : outgoingCallData.header.breadcrumbs,
    },
    caller: {
      ...outgoingCallData.caller,
      ...(data?.caller || {}),
    },
    actionButtons: Array.isArray(data?.actionButtons)
      ? data.actionButtons
      : outgoingCallData.actionButtons,
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
            <div className="card-body text-center d-flex flex-column justify-content-center">
              <div className="voice-call-img mb-3">
                <img
                  src={pageData.caller.avatar}
                  className="img-fluid rounded-circle"
                  alt="img"
                />
              </div>
              <h4 className="display-4">{pageData.caller.name}</h4>
              <p>{pageData.caller.statusText}</p>
              <div className="d-flex align-items-center justify-content-center">
                {pageData.actionButtons.map((button) => (
                  <a
                    key={button.id}
                    href="javascript:void(0);"
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
