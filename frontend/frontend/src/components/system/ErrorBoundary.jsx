import { Component } from "react";
import logger from "../../utils/logger";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    logger.error("Runtime UI error", { error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-md-8">
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center p-5">
                  <h4 className="mb-2">Something went wrong</h4>
                  <p className="text-muted mb-4">
                    An unexpected error occurred while rendering this page.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => window.location.reload()}
                  >
                    Reload Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
