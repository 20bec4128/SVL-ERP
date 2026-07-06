import React from "react";

export default function LeadSearch({ search, setSearch, applyFilters, placeholder = "Search leads..." }) {
  return (
    <div className="search-leads-container position-relative flex-grow-1 flex-md-grow-0" style={{ minWidth: "260px" }}>
      <input
        className="form-control search-leads-input"
        style={{ height: 42, borderRadius: 10, paddingLeft: 38, fontSize: "0.95rem" }}
        value={search}
        placeholder={placeholder}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") applyFilters();
        }}
      />
      <i className="ti ti-search position-absolute text-muted" style={{ left: 14, top: "50%", transform: "translateY(-50%)", fontSize: "1.1rem" }} />
    </div>
  );
}
