export default function ErrorState({
  title = "Unable to load data",
  message = "Please try again. If the problem persists, contact support.",
  onRetry,
}) {
  return (
    <div className="card border-0">
      <div className="card-body">
        <div className="alert alert-danger mb-0 d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h6 className="mb-1">{title}</h6>
            <p className="mb-0">{message}</p>
          </div>
          <button type="button" className="btn btn-outline-danger btn-sm" onClick={onRetry}>
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

