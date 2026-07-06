import { useEffect, useState } from "react";
import {
  addBannedIp,
  addDisallowedUsername,
  getSecuritySettings,
  removeBannedIps,
  removeDisallowedUsernames,
} from "../../api/securitySettingsApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";

export default function SecurityPage() {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    disallowedUsernames: [],
    bannedIps: [],
  });
  const [username, setUsername] = useState("");
  const [ipAddress, setIpAddress] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await getSecuritySettings();
      setSettings(data);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to load security settings"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAddUsername = async () => {
    if (!username.trim()) return;
    setLoading(true);
    try {
      const data = await addDisallowedUsername(username.trim());
      setSettings(data);
      setUsername("");
      showSuccess("Username blocked");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to add username"));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUsername = async (value) => {
    setLoading(true);
    try {
      const data = await removeDisallowedUsernames([value]);
      setSettings(data);
      showSuccess("Username removed");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to remove username"));
    } finally {
      setLoading(false);
    }
  };

  const handleAddIp = async () => {
    if (!ipAddress.trim()) return;
    setLoading(true);
    try {
      const data = await addBannedIp(ipAddress.trim());
      setSettings(data);
      setIpAddress("");
      showSuccess("IP banned");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to ban IP"));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveIp = async (value) => {
    setLoading(true);
    try {
      const data = await removeBannedIps([value]);
      setSettings(data);
      showSuccess("IP unbanned");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to remove IP"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid">
      <div className="card mb-3">
        <div className="card-header">
          <h4 className="mb-0">Security</h4>
        </div>
        <div className="card-body">
          {loading && <div className="text-muted mb-3">Loading...</div>}
          <div className="row g-3">
            <div className="col-lg-6">
              <h6>Disallowed Usernames</h6>
              <div className="input-group mb-3">
                <input
                  className="form-control"
                  placeholder="Add username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleAddUsername}
                  disabled={loading}
                >
                  Add
                </button>
              </div>
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead className="table-light">
                    <tr>
                      <th>Username</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {settings.disallowedUsernames.length === 0 ? (
                      <tr>
                        <td colSpan={2}>No disallowed usernames</td>
                      </tr>
                    ) : (
                      settings.disallowedUsernames.map((value) => (
                        <tr key={value}>
                          <td>{value}</td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleRemoveUsername(value)}
                              disabled={loading}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="col-lg-6">
              <h6>Banned IPs</h6>
              <div className="input-group mb-3">
                <input
                  className="form-control"
                  placeholder="Add IP address"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleAddIp}
                  disabled={loading}
                >
                  Add
                </button>
              </div>
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead className="table-light">
                    <tr>
                      <th>IP Address</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {settings.bannedIps.length === 0 ? (
                      <tr>
                        <td colSpan={2}>No banned IPs</td>
                      </tr>
                    ) : (
                      settings.bannedIps.map((value) => (
                        <tr key={value}>
                          <td>{value}</td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleRemoveIp(value)}
                              disabled={loading}
                            >
                              Remove
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
        </div>
      </div>
    </div>
  );
}
