import React, { useRef, useState, useEffect } from "react";

/**
 * ColumnVisibilityDropdown
 *
 * Props:
 *   columns      - array of { key: string, label: string }
 *   visible      - object { [key]: boolean }
 *   onChange     - (newVisible: object) => void
 */
export default function ColumnVisibilityDropdown({ columns, visible, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const toggleColumn = (key) => {
    const next = { ...visible, [key]: !visible[key] };
    onChange(next);
  };

  const visibleCount = columns.filter((c) => visible[c.key] !== false).length;
  const hasHidden = visibleCount < columns.length;

  return (
    <div className="dropdown" ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className={`btn d-flex align-items-center gap-2${hasHidden ? " btn-col-vis-active" : " btn-col-vis"}`}
        style={{
          height: 42,
          padding: "0 14px",
          borderRadius: 10,
          fontWeight: "500",
          fontSize: "0.9rem",
          border: hasHidden ? "1.5px solid #3b82f6" : "1.5px solid #e2e8f0",
          backgroundColor: hasHidden ? "#eff6ff" : "#f8fafc",
          color: hasHidden ? "#2563eb" : "#475569",
          transition: "all 0.18s",
          whiteSpace: "nowrap",
        }}
        title="Toggle column visibility"
        onClick={() => setOpen((p) => !p)}
      >
        <i className="ti ti-columns" style={{ fontSize: "1rem" }} />
        <span>Columns</span>
        {hasHidden && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              fontSize: "0.7rem",
              fontWeight: "700",
              backgroundColor: "#3b82f6",
              color: "#fff",
              padding: "0 4px",
            }}
          >
            {columns.length - visibleCount}
          </span>
        )}
        <i
          className={`ti ti-chevron-${open ? "up" : "down"}`}
          style={{ fontSize: "0.8rem", marginLeft: 2 }}
        />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 1050,
            minWidth: 210,
            backgroundColor: "#ffffff",
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(30,41,59,0.13), 0 2px 8px rgba(30,41,59,0.08)",
            border: "1px solid #e8edf5",
            padding: "10px 0",
            animation: "cvdFadeIn 0.15s ease",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "4px 14px 10px",
              borderBottom: "1px solid #f1f5f9",
              marginBottom: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                padding: 0,
                fontSize: "0.75rem",
                color: "#3b82f6",
                fontWeight: 600,
                cursor: "pointer",
              }}
              onClick={() => {
                const allVisible = {};
                columns.forEach((c) => { allVisible[c.key] = true; });
                onChange(allVisible);
              }}
            >
              Show all
            </button>
          </div>

          {/* Column list */}
          {columns.map((col) => {
            const isVisible = visible[col.key] !== false;
            return (
              <label
                key={col.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "7px 14px",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  color: isVisible ? "#0f172a" : "#94a3b8",
                  backgroundColor: "transparent",
                  transition: "background 0.12s",
                  userSelect: "none",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f8fafc"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 18,
                    height: 18,
                    borderRadius: 5,
                    border: isVisible ? "none" : "1.5px solid #cbd5e1",
                    backgroundColor: isVisible ? "#3b82f6" : "transparent",
                    flexShrink: 0,
                    transition: "all 0.15s",
                  }}
                >
                  {isVisible && (
                    <i className="ti ti-check" style={{ fontSize: "0.7rem", color: "#fff", fontWeight: 700 }} />
                  )}
                </span>
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={() => toggleColumn(col.key)}
                  style={{ display: "none" }}
                />
                <span>{col.label}</span>
              </label>
            );
          })}

          <style>{`
            @keyframes cvdFadeIn {
              from { opacity: 0; transform: translateY(-6px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
