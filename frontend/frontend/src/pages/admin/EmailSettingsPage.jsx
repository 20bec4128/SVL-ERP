import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMailSettings, saveMailSettings, sendTestMail } from "../../api/mailSettingsApi";
import { useToast } from "../../components/system/ToastProvider";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import "./LeadsPage.css";

const DEFAULT_FORM = {
  enabled: true,
  host: "",
  port: 587,
  username: "",
  password: "",
  smtpAuth: true,
  starttls: true,
  fromAddress: "",
  fromName: "SVL",
  cc: "",
  bcc: "",
};

export default function EmailSettingsPage() {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [testTo, setTestTo] = useState("");
  const [ccList, setCcList] = useState([]);
  const [bccList, setBccList] = useState([]);
  const [ccInput, setCcInput] = useState("");
  const [bccInput, setBccInput] = useState("");

  const canSave = useMemo(() => {
    if (!form.enabled) return true;
    return String(form.host || "").trim() !== "" && Number(form.port) > 0;
  }, [form.enabled, form.host, form.port]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getMailSettings();
        if (!isMounted) return;
        if (!data) {
          setForm(DEFAULT_FORM);
          setHasPassword(false);
          return;
        }
        setForm((prev) => ({
          ...prev,
          enabled: !!data.enabled,
          host: data.host || "",
          port: data.port ?? 587,
          username: data.username || "",
          password: "",
          smtpAuth: data.smtpAuth ?? true,
          starttls: data.starttls ?? true,
          fromAddress: data.fromAddress || "",
          fromName: data.fromName || "SVL",
          cc: data.cc || "",
          bcc: data.bcc || "",
        }));
        setCcList(data.cc ? data.cc.split(",").map(s => s.trim()).filter(Boolean) : []);
        setBccList(data.bcc ? data.bcc.split(",").map(s => s.trim()).filter(Boolean) : []);
        setHasPassword(!!data.hasPassword);
      } catch (e) {
        if (isMounted) showError(extractApiErrorMessage(e, "Failed to load mail settings"));
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [showError]);

  async function handleSave() {
    if (!canSave) {
      showError("Host and port are required when mail is enabled");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        enabled: !!form.enabled,
        host: form.host,
        port: Number(form.port),
        username: form.username,
        password: String(form.password || "").trim() ? form.password : undefined,
        smtpAuth: !!form.smtpAuth,
        starttls: !!form.starttls,
        fromAddress: form.fromAddress,
        fromName: form.fromName,
        cc: ccList.join(","),
        bcc: bccList.join(","),
      };
      const res = await saveMailSettings(payload);
      setHasPassword(!!res?.hasPassword || (hasPassword && !String(form.password || "").trim()));
      setForm((p) => ({ ...p, password: "" }));
      showSuccess("Mail settings saved");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to save mail settings"));
    } finally {
      setSaving(false);
    }
  }

  const addCc = () => {
    const val = ccInput.trim();
    if (val) {
      if (!ccList.includes(val)) {
        setCcList([...ccList, val]);
      }
      setCcInput("");
    }
  };

  const removeCc = (index) => {
    setCcList(ccList.filter((_, i) => i !== index));
  };

  const editCc = (index) => {
    setCcInput(ccList[index]);
    setCcList(ccList.filter((_, i) => i !== index));
  };

  const addBcc = () => {
    const val = bccInput.trim();
    if (val) {
      if (!bccList.includes(val)) {
        setBccList([...bccList, val]);
      }
      setBccInput("");
    }
  };

  const removeBcc = (index) => {
    setBccList(bccList.filter((_, i) => i !== index));
  };

  const editBcc = (index) => {
    setBccInput(bccList[index]);
    setBccList(bccList.filter((_, i) => i !== index));
  };

  async function handleTest() {
    const to = String(testTo || "").trim();
    if (!to) {
      showError("Enter a test recipient email");
      return;
    }
    setTesting(true);
    try {
      await sendTestMail(to);
      showSuccess("Test email sent");
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to send test email"));
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="content">
      {/* Styled Header Card */}
      <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Email Settings</h2>
            <nav className="mb-0">
              <ol className="breadcrumb mb-0" style={{ fontSize: "0.9rem" }}>
                <li className="breadcrumb-item">
                  <Link to="/admin-dashboard" style={{ color: "#64748b", textDecoration: "none" }}>
                    <i className="ti ti-smart-home"></i>
                  </Link>
                </li>
                <li className="breadcrumb-item" style={{ color: "#64748b" }}>Settings</li>
                <li className="breadcrumb-item active" style={{ color: "#0f172a", fontWeight: "500" }}>Email Settings</li>
              </ol>
            </nav>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-primary create-lead-btn d-flex align-items-center gap-2"
              onClick={handleSave}
              disabled={loading || saving || !canSave}
              style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px" }}
            >
              <i className="ti ti-device-floppy" style={{ fontSize: "1.1rem" }}></i>
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
        <div className="card-header bg-white border-bottom p-3">
          <h5 className="mb-0" style={{ fontWeight: "600", color: "#0f172a" }}>SMTP Server Configuration</h5>
          <p className="text-muted small mb-0">Configure the SMTP server settings used by the system to dispatch notifications and emails.</p>
        </div>
        <div className="card-body p-4">
          {loading ? (
            <div className="text-center py-4">Loading settings...</div>
          ) : (
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label fw-semibold text-dark" style={{ fontSize: "0.9rem" }}>Enabled</label>
                <div className="form-check form-switch m-0 pt-1">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={!!form.enabled}
                    onChange={(e) => setForm((p) => ({ ...p, enabled: e.target.checked }))}
                    id="smtpEnabledSwitch"
                  />
                  <label className="form-check-label text-muted small" htmlFor="smtpEnabledSwitch">Send emails</label>
                </div>
              </div>

              <div className="col-md-5">
                <label className="form-label fw-semibold text-dark" style={{ fontSize: "0.9rem" }}>SMTP Host</label>
                <input
                  className="form-control animate-focus"
                  style={{ borderRadius: 8, height: 42 }}
                  value={form.host}
                  onChange={(e) => setForm((p) => ({ ...p, host: e.target.value }))}
                  placeholder="smtp.gmail.com"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold text-dark" style={{ fontSize: "0.9rem" }}>Port</label>
                <input
                  type="number"
                  className="form-control animate-focus"
                  style={{ borderRadius: 8, height: 42 }}
                  value={form.port}
                  onChange={(e) => setForm((p) => ({ ...p, port: e.target.value }))}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold text-dark" style={{ fontSize: "0.9rem" }}>Username</label>
                <input
                  className="form-control animate-focus"
                  style={{ borderRadius: 8, height: 42 }}
                  value={form.username}
                  onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                  placeholder="e.g. user@gmail.com"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold text-dark" style={{ fontSize: "0.9rem" }}>Password</label>
                <input
                  type="password"
                  className="form-control animate-focus"
                  style={{ borderRadius: 8, height: 42 }}
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder={hasPassword ? "•••••••• (enter to change)" : "Enter password"}
                  autoComplete="new-password"
                />
                <div className="text-muted small mt-1" style={{ fontSize: "0.8rem" }}>
                  {hasPassword ? "Password is set. Leave blank to keep existing." : "Password is not configured."}
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold text-dark" style={{ fontSize: "0.9rem" }}>SMTP Auth</label>
                <select
                  className="form-select animate-focus"
                  style={{ borderRadius: 8, height: 42 }}
                  value={String(!!form.smtpAuth)}
                  onChange={(e) => setForm((p) => ({ ...p, smtpAuth: e.target.value === "true" }))}
                >
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold text-dark" style={{ fontSize: "0.9rem" }}>STARTTLS</label>
                <select
                  className="form-select animate-focus"
                  style={{ borderRadius: 8, height: 42 }}
                  value={String(!!form.starttls)}
                  onChange={(e) => setForm((p) => ({ ...p, starttls: e.target.value === "true" }))}
                >
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold text-dark" style={{ fontSize: "0.9rem" }}>From Email Address</label>
                <input
                  className="form-control animate-focus"
                  style={{ borderRadius: 8, height: 42 }}
                  value={form.fromAddress}
                  onChange={(e) => setForm((p) => ({ ...p, fromAddress: e.target.value }))}
                  placeholder="no-reply@yourdomain.com"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold text-dark" style={{ fontSize: "0.9rem" }}>From Sender Name</label>
                <input
                  className="form-control animate-focus"
                  style={{ borderRadius: 8, height: 42 }}
                  value={form.fromName}
                  onChange={(e) => setForm((p) => ({ ...p, fromName: e.target.value }))}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold text-dark" style={{ fontSize: "0.9rem" }}>Default CC Recipients</label>
                <div className="input-group">
                  <input
                    type="email"
                    className="form-control animate-focus"
                    style={{ borderRadius: "8px 0 0 8px", height: 42 }}
                    value={ccInput}
                    onChange={(e) => setCcInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCc();
                      }
                    }}
                    placeholder="Enter email and press Enter or Add"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    style={{ borderRadius: "0 8px 8px 0", height: 42 }}
                    onClick={addCc}
                  >
                    Add
                  </button>
                </div>
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {ccList.map((email, index) => (
                    <div
                      key={index}
                      className="d-flex align-items-center gap-2 px-3 py-1 bg-light border rounded-pill shadow-sm"
                      style={{ fontSize: "0.85rem", color: "#334155", borderColor: "#cbd5e1" }}
                    >
                      <span className="text-truncate" style={{ maxWidth: "200px" }}>{email}</span>
                      <button
                        type="button"
                        className="btn p-0 border-0 text-primary d-flex align-items-center justify-content-center"
                        onClick={() => editCc(index)}
                        title="Edit"
                        style={{ background: "none", fontSize: "0.9rem" }}
                      >
                        <i className="ti ti-edit"></i>
                      </button>
                      <button
                        type="button"
                        className="btn p-0 border-0 text-danger d-flex align-items-center justify-content-center"
                        onClick={() => removeCc(index)}
                        title="Remove"
                        style={{ background: "none", fontSize: "0.9rem" }}
                      >
                        <i className="ti ti-x"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold text-dark" style={{ fontSize: "0.9rem" }}>Default BCC Recipients</label>
                <div className="input-group">
                  <input
                    type="email"
                    className="form-control animate-focus"
                    style={{ borderRadius: "8px 0 0 8px", height: 42 }}
                    value={bccInput}
                    onChange={(e) => setBccInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addBcc();
                      }
                    }}
                    placeholder="Enter email and press Enter or Add"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    style={{ borderRadius: "0 8px 8px 0", height: 42 }}
                    onClick={addBcc}
                  >
                    Add
                  </button>
                </div>
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {bccList.map((email, index) => (
                    <div
                      key={index}
                      className="d-flex align-items-center gap-2 px-3 py-1 bg-light border rounded-pill shadow-sm"
                      style={{ fontSize: "0.85rem", color: "#334155", borderColor: "#cbd5e1" }}
                    >
                      <span className="text-truncate" style={{ maxWidth: "200px" }}>{email}</span>
                      <button
                        type="button"
                        className="btn p-0 border-0 text-primary d-flex align-items-center justify-content-center"
                        onClick={() => editBcc(index)}
                        title="Edit"
                        style={{ background: "none", fontSize: "0.9rem" }}
                      >
                        <i className="ti ti-edit"></i>
                      </button>
                      <button
                        type="button"
                        className="btn p-0 border-0 text-danger d-flex align-items-center justify-content-center"
                        onClick={() => removeBcc(index)}
                        title="Remove"
                        style={{ background: "none", fontSize: "0.9rem" }}
                      >
                        <i className="ti ti-x"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Test Connection Card */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="card-header bg-white border-bottom p-3">
          <h5 className="mb-0" style={{ fontWeight: "600", color: "#0f172a" }}>Test Connection</h5>
          <p className="text-muted small mb-0">Verify your configuration settings by sending a test email to any recipient.</p>
        </div>
        <div className="card-body p-4">
          <div className="row g-3 align-items-end">
            <div className="col-md-8">
              <label className="form-label fw-semibold text-dark" style={{ fontSize: "0.9rem" }}>Recipient Email Address</label>
              <input
                className="form-control animate-focus"
                style={{ borderRadius: 8, height: 42 }}
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                placeholder="test-recipient@example.com"
              />
            </div>
            <div className="col-md-4">
              <button
                className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2"
                style={{ height: 42, borderRadius: 8, fontWeight: "600" }}
                onClick={handleTest}
                disabled={loading || testing}
              >
                <i className="ti ti-mail-forward"></i>
                {testing ? "Sending..." : "Send Test Email"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
