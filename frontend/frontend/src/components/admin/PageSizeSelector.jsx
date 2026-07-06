import React from "react";

export default function PageSizeSelector({ pageSize, setPageSize, setPage }) {
  const defaultOptions = [10, 25, 50, 100];
  const renderOptions = [...defaultOptions];
  if (!defaultOptions.includes(pageSize)) {
    renderOptions.push(pageSize);
    renderOptions.sort((a, b) => a - b);
  }

  const handlePageSizeChange = (e) => {
    const val = e.target.value;
    if (val === "custom") {
      const num = window.prompt("Enter custom rows per page:", pageSize);
      const parsed = parseInt(num, 10);
      if (!isNaN(parsed) && parsed > 0) {
        setPageSize(parsed);
      }
    } else {
      setPageSize(Number(val));
    }
    setPage(1);
  };

  return (
    <div className="d-flex align-items-center gap-2">
      <span className="text-muted small">Show</span>
      <select
        className="form-select show-entries-select"
        style={{ width: 95, height: 36, padding: "0 8px", borderRadius: 8, fontSize: "0.85rem" }}
        value={pageSize}
        onChange={handlePageSizeChange}
      >
        {renderOptions.map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
        <option value="custom">Custom...</option>
      </select>
      <span className="text-muted small">entries</span>
    </div>
  );
}
