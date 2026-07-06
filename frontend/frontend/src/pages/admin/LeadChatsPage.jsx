import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLeads } from "../../api/leadsApi";

function formatDate(value) {
  if (!value) return "-";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
  } catch {
    return String(value);
  }
}

function getLeadTitle(lead) {
  return (
    lead?.name ||
    lead?.enquiryName ||
    lead?.leadName ||
    lead?.projectName ||
    `Lead #${lead?.id ?? "-"}`
  );
}

export default function LeadChatsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getLeads({ search });
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRows = useMemo(() => rows, [rows]);

  return (
    <div className="card border">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
          <div>
            <h4 className="mb-1">Lead Chats</h4>
            <p className="text-muted mb-0">
              Open a lead to view internal and customer conversations.
            </p>
          </div>
          <div className="d-flex gap-2">
            <button
              className="btn btn-light"
              type="button"
              onClick={() => navigate(-1)}
            >
              Back
            </button>
            <input
              className="form-control"
              style={{ minWidth: "220px" }}
              placeholder="Search leads"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn btn-primary" type="button" onClick={loadData}>
              Search
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Status</th>
                <th>Owner</th>
                <th>Updated</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-muted">
                    Loading...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted">
                    No leads found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((lead) => (
                  <tr key={lead.id || lead.enquiryId}>
                    <td>
                      <div className="fw-medium">{getLeadTitle(lead)}</div>
                      <div className="text-muted fs-10">
                        {lead.enquiryId || lead.euid || "-"}
                      </div>
                    </td>
                    <td>{lead.status || "-"}</td>
                    <td>{lead.owner || lead.ownerName || "-"}</td>
                    <td>{formatDate(lead.updatedAt || lead.createdAt)}</td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => navigate(`/leads/${lead.id}/chat`)}
                      >
                        Open Chat
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
