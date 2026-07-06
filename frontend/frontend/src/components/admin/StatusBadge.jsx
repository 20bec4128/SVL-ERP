export default function StatusBadge({ className, iconClass, children }) {
  return (
    <span className={className}>
      {iconClass ? <i className={iconClass} /> : null}
      {children}
    </span>
  );
}
