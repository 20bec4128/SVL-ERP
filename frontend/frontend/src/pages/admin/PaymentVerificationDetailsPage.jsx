import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { downloadLeadPaymentProofFile, downloadLeadRequirementFile, getLeadById } from "../../api/leadsApi";
import { getAddressById } from "../../api/addressApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";

export default function PaymentVerificationDetailsPage() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState(null);
  const [billingAddress, setBillingAddress] = useState(null);
  const [shippingAddress, setShippingAddress] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      
      try {
        // Fetch lead details
        const leadData = await getLeadById(leadId);
        if (!leadData) {
          showError("Lead not found");
          setLoading(false);
          return;
        }
        setLead(leadData);
        
        // Fetch billing address if available
        setLoadingAddresses(true);
        if (leadData.paymentVerificationBillingAddressId) {
          try {
            const billing = await getAddressById(leadData.id, leadData.paymentVerificationBillingAddressId);
            console.log("Billing address:", billing);
            setBillingAddress(billing || null);
          } catch (e) {
            console.error("Failed to fetch billing address:", e);
          }
        }
        
        // Fetch shipping address if available
        if (leadData.paymentVerificationShippingAddressId) {
          try {
            const shipping = await getAddressById(leadData.id, leadData.paymentVerificationShippingAddressId);
            console.log("Shipping address:", shipping);
            setShippingAddress(shipping || null);
          } catch (e) {
            console.error("Failed to fetch shipping address:", e);
          }
        }
      } catch (e) {
        console.error("Failed to fetch payment verification details:", e);
        showError(extractApiErrorMessage(e, "Failed to load payment verification details"));
      } finally {
        setLoadingAddresses(false);
        setLoading(false);
      }
    };

    if (leadId) {
      fetchDetails();
    }
  }, [leadId]);

  const downloadRequirementFileForLead = async () => {
    if (!lead?.id) return;
    try {
      const { blob, contentDisposition } = await downloadLeadRequirementFile(lead.id);
      if (!blob) return;
      const match = /filename\*?=(?:UTF-8''|\")?([^\";]+)/i.exec(contentDisposition || "");
      const fallback = lead.requirementFileName || `requirement-${lead.id}`;
      const fileName = decodeURIComponent((match?.[1] || fallback).replace(/\"/g, "").trim());
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to download requirement file"));
    }
  };

  const downloadPaymentProofForLead = async () => {
    if (!lead?.id) return;
    try {
      const { blob, contentDisposition } = await downloadLeadPaymentProofFile(lead.id);
      if (!blob) return;
      const match = /filename\*?=(?:UTF-8''|\")?([^\";]+)/i.exec(contentDisposition || "");
      const fallback = lead.paymentProofFileName || `payment-proof-${lead.id}`;
      const fileName = decodeURIComponent((match?.[1] || fallback).replace(/\"/g, "").trim());
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      showError(extractApiErrorMessage(e, "Failed to download payment proof file"));
    }
  };

  if (loading) {
    return (
      <>
        <div className="page-header">
          <div className="page-title">
            <h4>Payment Verification Details</h4>
            <p className="text-muted">Loading payment verification details</p>
          </div>
        </div>
        <div className="text-center py-5">
          <LoadingSpinner size="page" label="Loading payment verification details" />
        </div>
      </>
    );
  }

  if (!lead) {
    return (
      <>
        <div className="page-header">
          <div className="page-title">
            <h4>Payment Verification Details</h4>
            <p className="text-muted">Error</p>
          </div>
        </div>
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error Loading Details</h4>
          <p>Lead not found</p>
          <hr />
          <button 
            className="btn btn-outline-danger"
            onClick={() => navigate("/payment-verifications")}
          >
            Back to Payment Verifications
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h4>Payment Verification Details</h4>
          <p className="text-muted">Lead: <strong>{lead.name}</strong> (ID: #{lead.id})</p>
        </div>
        <div className="d-flex gap-2">
          {lead.paymentVerificationStatus === "PENDING" && (
            <button
              className="btn btn-success"
              onClick={() => navigate(`/payment-verifications/${lead.id}/approve`)}
            >
              <i className="ti ti-check me-1"></i> Approve
            </button>
          )}
          <button 
            className="btn btn-outline-secondary"
            onClick={() => navigate("/payment-verifications")}
          >
            <i className="ti ti-arrow-left me-1"></i> Back
          </button>
        </div>
      </div>

      {loadingAddresses && (
        <div className="alert alert-info">
          <LoadingSpinner size="sm" className="me-2" label="Loading address details" />
          Loading address details...
        </div>
      )}

      {/* Main Content */}
      <div className="row">
        {/* Payment Information */}
        <div className="col-lg-8 mb-4">
          <div className="card shadow-sm">
            <div className="card-header bg-light">
              <h6 className="mb-0"><i className="ti ti-receipt me-2"></i>Payment Information</h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="text-muted small">Payment Verification Amount</label>
                  <p className="mb-0">
                    <strong className="text-success fs-3">₹{Number(lead.paymentVerificationAmount || 0).toLocaleString()}</strong>
                  </p>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="text-muted small">Verification Status</label>
                  <p className="mb-0">
                    <span className={`badge ${
                      lead.paymentVerificationStatus === "APPROVED" ? "bg-success" :
                      lead.paymentVerificationStatus === "REJECTED" ? "bg-danger" :
                      "bg-warning"
                    }`}>
                      {lead.paymentVerificationStatus || "PENDING"}
                    </span>
                  </p>
                </div>
                {lead.paymentProofNotes && (
                  <div className="col-md-12 mb-3">
                    <label className="text-muted small">Payment Notes</label>
                    <div className="p-2 bg-light rounded border">
                      <p className="mb-0" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {lead.paymentProofNotes}
                      </p>
                    </div>
                  </div>
                )}
                {lead.paymentProofFileName && (
                  <div className="col-md-12 mb-3">
                    <label className="text-muted small">Proof Document</label>
                    <div>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={downloadPaymentProofForLead}
                      >
                        <i className="ti ti-download me-1"></i> Download {lead.paymentProofFileName}
                      </button>
                    </div>
                  </div>
                )}
                {lead.requirementFileName && (
                  <div className="col-md-12 mb-3">
                    <label className="text-muted small">Requirement File</label>
                    <div>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={downloadRequirementFileForLead}
                      >
                        <i className="ti ti-download me-1"></i> Download {lead.requirementFileName}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status Info */}
        <div className="col-lg-4 mb-4">
          <div className="card shadow-sm">
            <div className="card-header bg-light">
              <h6 className="mb-0"><i className="ti ti-info-circle me-2"></i>Lead Information</h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="text-muted small">Lead ID</label>
                <p className="mb-0"><strong>#{lead.id}</strong></p>
              </div>
              <div className="mb-3">
                <label className="text-muted small">Lead Name</label>
                <p className="mb-0"><strong>{lead.name}</strong></p>
              </div>
              {lead.email && (
                <div className="mb-3">
                  <label className="text-muted small">Email</label>
                  <p className="mb-0"><strong>{lead.email}</strong></p>
                </div>
              )}
              {lead.phone && (
                <div className="mb-3">
                  <label className="text-muted small">Phone</label>
                  <p className="mb-0"><strong>{lead.phone}</strong></p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Billing Address */}
      {!loadingAddresses && billingAddress && (
        <div className="row mb-4">
          <div className="col-lg-8">
            <div className="card shadow-sm">
              <div className="card-header bg-light">
                <h6 className="mb-0"><i className="ti ti-map-pin me-2"></i>Billing Address</h6>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small">Contact Person</label>
                    <p className="mb-0"><strong>{billingAddress.contactPersonName || "-"}</strong></p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small">Company Name</label>
                    <p className="mb-0"><strong>{billingAddress.companyName || "-"}</strong></p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small">GSTIN</label>
                    <p className="mb-0"><strong>{billingAddress.gstin || "-"}</strong></p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small">Phone</label>
                    <p className="mb-0"><strong>{billingAddress.countryCode}{billingAddress.phone}</strong></p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small">Email</label>
                    <p className="mb-0"><strong>{billingAddress.email || "-"}</strong></p>
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="text-muted small">Address Line 1</label>
                    <p className="mb-0"><strong>{billingAddress.addressLine1 || "-"}</strong></p>
                  </div>
                  {billingAddress.addressLine2 && (
                    <div className="col-md-12 mb-3">
                      <label className="text-muted small">Address Line 2</label>
                      <p className="mb-0"><strong>{billingAddress.addressLine2}</strong></p>
                    </div>
                  )}
                  <div className="col-md-4 mb-3">
                    <label className="text-muted small">City</label>
                    <p className="mb-0"><strong>{billingAddress.city || "-"}</strong></p>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="text-muted small">State</label>
                    <p className="mb-0"><strong>{billingAddress.state || "-"}</strong></p>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="text-muted small">Pincode</label>
                    <p className="mb-0"><strong>{billingAddress.pincode || "-"}</strong></p>
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="text-muted small">Country</label>
                    <p className="mb-0"><strong>{billingAddress.country || "-"}</strong></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Address */}
      {!loadingAddresses && shippingAddress && (
        <div className="row mb-4">
          <div className="col-lg-8">
            <div className="card shadow-sm">
              <div className="card-header bg-light">
                <h6 className="mb-0"><i className="ti ti-truck me-2"></i>Shipping Address</h6>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small">Contact Person</label>
                    <p className="mb-0"><strong>{shippingAddress.contactPersonName || "-"}</strong></p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small">Company Name</label>
                    <p className="mb-0"><strong>{shippingAddress.companyName || "-"}</strong></p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small">Phone</label>
                    <p className="mb-0"><strong>{shippingAddress.countryCode}{shippingAddress.phone}</strong></p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small">Email</label>
                    <p className="mb-0"><strong>{shippingAddress.email || "-"}</strong></p>
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="text-muted small">Address Line 1</label>
                    <p className="mb-0"><strong>{shippingAddress.addressLine1 || "-"}</strong></p>
                  </div>
                  {shippingAddress.addressLine2 && (
                    <div className="col-md-12 mb-3">
                      <label className="text-muted small">Address Line 2</label>
                      <p className="mb-0"><strong>{shippingAddress.addressLine2}</strong></p>
                    </div>
                  )}
                  <div className="col-md-4 mb-3">
                    <label className="text-muted small">City</label>
                    <p className="mb-0"><strong>{shippingAddress.city || "-"}</strong></p>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="text-muted small">State</label>
                    <p className="mb-0"><strong>{shippingAddress.state || "-"}</strong></p>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="text-muted small">Pincode</label>
                    <p className="mb-0"><strong>{shippingAddress.pincode || "-"}</strong></p>
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="text-muted small">Country</label>
                    <p className="mb-0"><strong>{shippingAddress.country || "-"}</strong></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Addresses Message */}
      {!loadingAddresses && !billingAddress && !shippingAddress && (
        <div className="alert alert-info">
          <i className="ti ti-info-circle me-2"></i>
          No address information available for this payment verification.
        </div>
      )}
    </>
  );
}
