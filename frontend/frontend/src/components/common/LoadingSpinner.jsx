export default function LoadingSpinner({
  isLoading = true,
  size = "page",
  className = "",
  label = "Loading",
}) {
  if (!isLoading) return null;

  const classes = [
    "loading-spinner",
    size ? `loading-spinner--${size}` : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} role="status" aria-label={label}>
      <span className="visually-hidden">{label}</span>
    </span>
  );
}
