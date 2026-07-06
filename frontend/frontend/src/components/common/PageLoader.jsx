import LoadingSpinner from "./LoadingSpinner";

const DEFAULT_MIN_HEIGHT = "60vh";

export default function PageLoader({ minHeight = DEFAULT_MIN_HEIGHT }) {
  return (
    <div
      className="d-flex align-items-center justify-content-center w-100 py-5"
      style={{ minHeight }}
    >
      <LoadingSpinner size="page" label="Loading page" />
    </div>
  );
}
