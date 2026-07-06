import React from "react";

export default function LeadExportDropdown({ exportExcel, exportCsv, exportPdf }) {
  return (
    <div className="dropdown">
      <button
        className="btn btn-outline-export dropdown-toggle d-flex align-items-center gap-2"
        type="button"
        id="exportDropdown"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        style={{ height: 42, padding: "0 18px", borderRadius: 10, fontWeight: "500", fontSize: "0.9rem" }}
      >
        <i className="ti ti-download" style={{ fontSize: "1rem" }} />
        Export
      </button>
      <ul className="dropdown-menu shadow border-0" aria-labelledby="exportDropdown">
        <li>
          <button className="dropdown-item py-2 text-start" onClick={exportExcel}>
            Excel
          </button>
        </li>
        <li>
          <button className="dropdown-item py-2 text-start" onClick={exportCsv}>
            CSV
          </button>
        </li>
        <li>
          <button className="dropdown-item py-2 text-start" onClick={exportPdf}>
            PDF
          </button>
        </li>
      </ul>
    </div>
  );
}
