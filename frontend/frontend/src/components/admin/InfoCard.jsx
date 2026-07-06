export default function InfoCard({ cardClass = "card", bodyClass = "card-body", header = null, children }) {
  return (
    <div className={cardClass}>
      {header}
      <div className={bodyClass}>{children}</div>
    </div>
  );
}
