import { useMemo, useCallback, memo } from "react";

const PaymentVerificationModal = memo(({
  show,
  onClose,
  saving,
  onSubmit,
  // Payment state
  verifyPaidAmount,
  onPaidAmountChange,
  verifyNotes,
  onNotesChange,
  verifyFileName,
  onFileChange,
  parsedInvoice,
  // Billing address
  selectedBillingAddressId,
  onBillingAddressChange,
  billingAddresses,
  onAddBillingAddress,
  addressLoading,
  // Shipping state
  shipSame,
  onShipSameChange,
  selectedShippingAddressId,
  onShippingAddressChange,
  shippingAddresses,
  onAddShippingAddress,
}) => {
  if (!show) return null;

  // Memoize disabled state to avoid recalculation
  const isSubmitDisabled = useMemo(
    () =>
      saving ||
      !selectedBillingAddressId ||
      (!shipSame && !selectedShippingAddressId),
    [saving, selectedBillingAddressId, shipSame, selectedShippingAddressId]
  );

  // Memoize billing address options
  const billingOptions = useMemo(
    () =>
      billingAddresses.map((addr) => (
        <option key={addr.id} value={addr.id}>
          {addr.contactPersonName} - {addr.city}
          {addr.isPrimary ? " (Primary)" : ""}
        </option>
      )),
    [billingAddresses]
  );

  // Memoize shipping address options
  const shippingOptions = useMemo(
    () =>
      shippingAddresses.map((addr) => (
        <option key={addr.id} value={addr.id}>
          {addr.contactPersonName} - {addr.city}
          {addr.isPrimary ? " (Primary)" : ""}
        </option>
      )),
    [shippingAddresses]
  );

  // Memoize billing address change handler
  const handleBillingChange = useCallback(
    (e) => {
      const id = e.target.value ? Number(e.target.value) : null;
      onBillingAddressChange(id);
      if (shipSame) {
        onShippingAddressChange(id);
      }
    },
    [onBillingAddressChange, onShippingAddressChange, shipSame]
  );

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50"
      style={{ zIndex: 1050 }}
    >
      <div
        className="card shadow-lg"
        style={{ width: "100%", maxWidth: "700px", maxHeight: "90vh", overflow: "auto" }}
      >
        <div className="card-header d-flex align-items-center justify-content-between sticky-top bg-white">
          <h5 className="mb-0">Verify Payment</h5>
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={onClose}
          />
        </div>
        <div className="card-body">
          {/* Payment Amount */}
          <div className="mb-3">
            <label className="form-label">
              <strong>Paid Amount</strong>
            </label>
            <input
              className="form-control"
              type="number"
              value={verifyPaidAmount}
              onChange={onPaidAmountChange}
              placeholder="Paid amount"
              min="0"
            />
          </div>

          {/* Payment Proof */}
          <div className="mb-3">
            <label className="form-label">
              <strong>Payment Proof Document</strong>
            </label>
            <div className="alert alert-info mb-2" role="alert">
              <small>
                {parsedInvoice
                  ? "Invoice will be automatically attached. Upload additional payment proof if needed."
                  : "Upload payment proof document for verification."}
              </small>
            </div>
            <input
              className="form-control"
              type="file"
              onChange={onFileChange}
            />
            {verifyFileName && <small className="text-muted">Selected: {verifyFileName}</small>}
          </div>

          {/* Payment Notes */}
          <div className="mb-3">
            <label className="form-label">
              <strong>Payment Notes</strong>
            </label>
            <textarea
              className="form-control"
              rows={2}
              value={verifyNotes}
              onChange={onNotesChange}
              placeholder="Payment notes"
            />
          </div>

          {/* Billing Address Section */}
          <div className="mb-4">
            <h6 className="border-bottom pb-2">
              <strong>Billing Address</strong>
            </h6>
            <div className="mb-3">
              <label className="form-label">Select Billing Address</label>
              <div className="d-flex gap-2">
                <select
                  className="form-select"
                  value={selectedBillingAddressId || ""}
                  onChange={handleBillingChange}
                  disabled={addressLoading || billingAddresses.length === 0}
                >
                  <option value="">-- Select Address --</option>
                  {billingOptions}
                </select>
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={onAddBillingAddress}
                  title="Add new billing address"
                >
                  <i className="ti ti-plus"></i> Add
                </button>
              </div>
              {billingAddresses.length === 0 && (
                <small className="text-warning">No billing addresses found. Please add one.</small>
              )}
            </div>
          </div>

          {/* Shipping Address Section */}
          <div className="mb-4">
            <div className="form-check mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="shipSame"
                checked={shipSame}
                onChange={onShipSameChange}
              />
              <label className="form-check-label" htmlFor="shipSame">
                <strong>Shipping address is same as billing</strong>
              </label>
              <div>
                <small className="text-muted">
                  Click this checkbox to use same shipping address as billing address. If unchecked,
                  select a separate shipping address.
                </small>
              </div>
            </div>

            {!shipSame && (
              <div>
                <h6 className="border-bottom pb-2">
                  <strong>Shipping Address</strong>
                </h6>
                <div className="mb-3">
                  <label className="form-label">Select Shipping Address</label>
                  <div className="d-flex gap-2">
                    <select
                      className="form-select"
                      value={selectedShippingAddressId || ""}
                      onChange={onShippingAddressChange}
                      disabled={addressLoading || shippingAddresses.length === 0}
                    >
                      <option value="">-- Select Address --</option>
                      {shippingOptions}
                    </select>
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={onAddShippingAddress}
                      title="Add new shipping address"
                    >
                      <i className="ti ti-plus"></i> Add
                    </button>
                  </div>
                  {shippingAddresses.length === 0 && (
                    <small className="text-warning">No shipping addresses found. Please add one.</small>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={onSubmit}
              disabled={isSubmitDisabled}
            >
              {saving ? "Saving..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

PaymentVerificationModal.displayName = "PaymentVerificationModal";

export default PaymentVerificationModal;
