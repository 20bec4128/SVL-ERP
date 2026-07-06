export default function DataTable({
  wrapperClass = "table-responsive",
  tableClass = "table",
  thead,
  tbody,
  columns,
  rows,
  renderRow,
}) {
  const hasStructuredRows = Array.isArray(columns) && Array.isArray(rows);

  return (
    <div className={wrapperClass}>
      <table className={tableClass}>
        {hasStructuredRows ? (
          <>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key || col.label}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id || index}>{renderRow ? renderRow(row, index) : null}</tr>
              ))}
            </tbody>
          </>
        ) : (
          <>
            {thead}
            {tbody}
          </>
        )}
      </table>
    </div>
  );
}
