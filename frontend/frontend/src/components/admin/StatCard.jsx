export default function StatCard({ colClass = "col-md-3 d-flex", cardClass = "card flex-fill", children }) {
  return (
    <div className={colClass}>
      <div className={cardClass}>
        <div className="card-body">{children}</div>
      </div>
    </div>
  );
}
