import { useNavigate, useParams } from "react-router-dom";
import ProductionDetailPage from "./ProductionDetailPage";

export default function ProductionWorkPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div>
      <div className="content">
        <div className="card mb-3 border-primary">
          <div className="card-body d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h5 className="mb-1">Production Work</h5>
              <div className="text-muted">This is the production workspace for the assigned employee.</div>
            </div>
            <button className="btn btn-primary" onClick={() => navigate(`/production-detail/${id}`)}>
              <i className="ti ti-eye me-1"></i>Open View Page
            </button>
          </div>
        </div>
      </div>
      <ProductionDetailPage />
    </div>
  );
}
