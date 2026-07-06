import { useEffect, useState } from 'react';
import { updateLeadDetails } from '../../api/leadsApi';
import { getPrimarySources } from '../../api/primarySourceApi';
import { getSecondarySources } from '../../api/secondarySourceApi';

export default function DuplicateLeadEditModal({ lead, onClose, onSaved }) {
  const [form, setForm] = useState({});
  const [primarySources, setPrimarySources] = useState([]);
  const [secondarySources, setSecondarySources] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!lead) return;
    setForm({
      mobile: lead.mobile || '',
      email: lead.email || '',
      primarySource: lead.primarySource || '',
      secondarySource: lead.secondarySource || '',
      alternatePhone: lead.alternatePhone || '',
      alternateEmail: lead.alternateEmail || '',
      companyName: lead.companyName || '',
      productType: lead.productType || '',
      variant: lead.variant || '',
      quantity: lead.quantity != null ? String(lead.quantity) : '',
      streetAddress: lead.streetAddress || '',
      leadState: lead.leadState || '',
      leadCity: lead.leadCity || '',
      leadPincode: lead.leadPincode || '',
    });
    setError('');
  }, [lead]);

  useEffect(() => {
    getPrimarySources().then((data) => setPrimarySources(Array.isArray(data) ? data : [])).catch(() => {});
    getSecondarySources().then((data) => setSecondarySources(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!lead?.id) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        mobile: form.mobile || null,
        email: form.email || null,
        primarySource: form.primarySource || null,
        secondarySource: form.secondarySource || null,
        alternatePhone: form.alternatePhone || null,
        alternateEmail: form.alternateEmail || null,
        companyName: form.companyName || null,
        productType: form.productType || null,
        variant: form.variant || null,
        quantity: form.quantity ? Number(form.quantity) : null,
        streetAddress: form.streetAddress || null,
        leadState: form.leadState || null,
        leadCity: form.leadCity || null,
        leadPincode: form.leadPincode || null,
      };
      const updated = await updateLeadDetails(lead.id, payload);
      onSaved(updated);
      onClose();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!lead) return null;

  return (
    <>
      <div className="modal fade show" style={{ display: 'block', zIndex: 1070 }} tabIndex="-1">
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content">

            <div className="modal-header">
              <div>
                <h5 className="modal-title mb-0">Edit Lead — {lead.name}</h5>
                <div className="mt-1">
                  <span className="badge bg-warning text-dark me-2">Duplicate</span>
                  {lead.duplicateOfLeadName && (
                    <span className="text-muted small">
                      Matches: <strong>{lead.duplicateOfLeadName}</strong>
                      {lead.duplicateOfLeadRef && <span className="ms-1">({lead.duplicateOfLeadRef})</span>}
                    </span>
                  )}
                </div>
              </div>
              <button className="btn-close" onClick={onClose} />
            </div>

            <div className="modal-body">
              {error && <div className="alert alert-danger py-2">{error}</div>}

              <div className="row g-3">
                {/* Col 1 */}
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">Enquiry Name</label>
                    <input className="form-control" value={lead.name || ''} readOnly />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Mobile Number</label>
                    <input
                      className="form-control"
                      value={form.mobile}
                      onChange={(e) => set('mobile', e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      className="form-control"
                      type="email"
                      value={form.email}
                      onChange={(e) => set('email', e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Type of Product</label>
                    <input
                      className="form-control"
                      placeholder="e.g. Software, Hardware"
                      value={form.productType}
                      onChange={(e) => set('productType', e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Variant</label>
                    <input
                      className="form-control"
                      placeholder="e.g. Size, Color"
                      value={form.variant}
                      onChange={(e) => set('variant', e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Quantity</label>
                    <input
                      className="form-control"
                      type="number"
                      value={form.quantity}
                      onChange={(e) => set('quantity', e.target.value)}
                    />
                  </div>
                </div>

                {/* Col 2 */}
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">Lead Owner</label>
                    <input className="form-control" value={lead.owner || lead.ownerName || '-'} readOnly />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Primary Source</label>
                    <select
                      className="form-select"
                      value={form.primarySource}
                      onChange={(e) => set('primarySource', e.target.value)}
                    >
                      <option value="">Select Primary Source</option>
                      {primarySources.map((s) => (
                        <option key={s.id} value={s.primarySource || s.name}>{s.primarySource || s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Secondary Source</label>
                    <select
                      className="form-select"
                      value={form.secondarySource}
                      onChange={(e) => set('secondarySource', e.target.value)}
                    >
                      <option value="">Select Secondary Source</option>
                      {secondarySources.map((s) => (
                        <option key={s.id} value={s.secondarySource || s.name}>{s.secondarySource || s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Alternate Phone</label>
                    <input
                      className="form-control"
                      value={form.alternatePhone}
                      onChange={(e) => set('alternatePhone', e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Alternate Email</label>
                    <input
                      className="form-control"
                      type="email"
                      value={form.alternateEmail}
                      onChange={(e) => set('alternateEmail', e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Company Name</label>
                    <input
                      className="form-control"
                      value={form.companyName}
                      onChange={(e) => set('companyName', e.target.value)}
                    />
                  </div>
                </div>

                {/* Col 3 */}
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">Street Address</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={form.streetAddress}
                      onChange={(e) => set('streetAddress', e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">State</label>
                    <input
                      className="form-control"
                      value={form.leadState}
                      onChange={(e) => set('leadState', e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">City</label>
                    <input
                      className="form-control"
                      value={form.leadCity}
                      onChange={(e) => set('leadCity', e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Pin Code</label>
                    <input
                      className="form-control"
                      value={form.leadPincode}
                      onChange={(e) => set('leadPincode', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline-secondary" onClick={onClose}>
                Back
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <span className="spinner-border spinner-border-sm me-1" /> : null}
                Save Changes
              </button>
            </div>

          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" style={{ zIndex: 1065 }} />
    </>
  );
}
