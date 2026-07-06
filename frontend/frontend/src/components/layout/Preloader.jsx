import { useEffect, useState } from "react";
import LoadingSpinner from "../common/LoadingSpinner";

export default function Preloader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 700);

    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="loading-overlay loading-overlay--soft" aria-hidden="true">
      <LoadingSpinner size="page" label="Loading application" />
    </div>
  );
}
