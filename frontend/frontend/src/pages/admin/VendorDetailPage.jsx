import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getVendors } from "../../api/vendorsApi";
import { getVendorTypes } from "../../api/vendorTypesApi";
import { getServiceCategories } from "../../api/serviceCategoriesApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { useToast } from "../../components/system/ToastProvider";
import PageLoader from "../../components/common/PageLoader";
import EditVendorModal from "./EditVendorModal";
import "./VendorDetailPage.css";

const val = (v) =>
  v !== null && v !== undefined && String(v).trim() !== "" ? String(v) : null;

function Field({ label, value, full }) {
  const display = val(value);
  return (
    <div className={`vd-field${full ? " full" : ""}`}>
      <span className="vd-field-label">{label}</span>
      {display ? (
        <span className="vd-field-value">{display}</span>
      ) : (
        <span className="vd-field-value empty">—</span>
      )}
    </div>
  );
}

function BankBlock({ bank, index }) {
  const hasQrImage = val(bank.upiQrImage);
  const handleViewQr = async () => {
    if (!hasQrImage) return;
    const qrWindow = window.open("", "_blank");
    if (!qrWindow) return;
    qrWindow.document.title = `UPI QR - Bank ${index + 1}`;
    qrWindow.document.body.innerHTML = "<p style='font-family: Arial, sans-serif; padding: 24px;'>Loading QR image...</p>";

    try {
      const response = await fetch(bank.upiQrImage);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      qrWindow.location.replace(blobUrl);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (_) {
      qrWindow.location.replace(bank.upiQrImage);
    }
  };

  return (
    <div className="vd-info-card bank">
      <div className="vd-card-title">Bank {index + 1}</div>
      <div className="vd-fields">
        <Field label="Account Holder Name" value={bank.bankAccountHolderName} />
        <Field label="Bank Name" value={bank.bankName} />
        <Field label="Account Number" value={bank.bankAccountNumber} />
        <Field label="IFSC Code" value={bank.bankIfscCode} />
        <Field label="Branch Name" value={bank.bankBranchName} />
        <Field label="Account Type" value={bank.bankAccountType} />
        <Field label="UPI ID" value={bank.upiId} />
        <Field label="UPI Number" value={bank.upiNumber || bank.upiNo || bank.upi_number} />
        <div className="vd-field full">
          <span className="vd-field-label">UPI QR Image</span>
          {hasQrImage ? (
            <button type="button" className="vd-btn light" onClick={handleViewQr}>
              View QR Image
            </button>
          ) : (
            <span className="vd-field-value empty">—</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VendorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError } = useToast();

  const [vendor, setVendor] = useState(null);
  const [vendorTypes, setVendorTypes] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [vendors, types, cats] = await Promise.all([
          getVendors(),
          getVendorTypes(),
          getServiceCategories(),
        ]);
        const found = Array.isArray(vendors)
          ? vendors.find((v) => v.id === Number(id))
          : null;
        setVendor(found || null);
        setVendorTypes(Array.isArray(types) ? types : []);
        setServiceCategories(Array.isArray(cats) ? cats : []);
      } catch (e) {
        showError(extractApiErrorMessage(e, "Failed to load vendor details"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <PageLoader />;

  if (!vendor) {
    return (
      <div className="content">
        <div className="vd-empty-state">
          <p>Vendor not found.</p>
          <button
            type="button"
            className="vd-btn light"
            onClick={() => navigate("/stocks/vendors")}
          >
            <i className="ti ti-arrow-left"></i> Back to Vendors
          </button>
        </div>
      </div>
    );
  }

  const isActive = (vendor.status || "active").toLowerCase() === "active";
  const avatarLetter = (vendor.vendorName || "V").charAt(0).toUpperCase();

  const typeChips =
    vendor?.vendorTypeIds?.length > 0
      ? vendor.vendorTypeIds.map((tid) => {
          const t = vendorTypes.find((vt) => vt.id === tid || vt.id === Number(tid));
          return { id: tid, label: t?.name || t?.vendorTypeName || t?.typeName || String(tid) };
        })
      : [];

  const categoryChips =
    vendor?.productIds?.length > 0
      ? vendor.productIds.map((cid) => {
          const c = serviceCategories.find((sc) => sc.id === cid || sc.id === Number(cid));
          return { id: cid, label: c?.name || c?.categoryName || String(cid) };
        })
      : [];

  const phoneDisplay = [vendor.countryCode, vendor.phone].filter(Boolean).join(" ") || null;
  const bankDetails = Array.isArray(vendor.bankDetails) ? vendor.bankDetails : [];

  return (
    <div className="content vd-page">
      {/* Hero */}
      <div className="vd-hero">
        <div className="vd-hero-left">
          <div className="vd-hero-avatar">{avatarLetter}</div>
          <div className="vd-hero-info">
            <div className="vd-hero-name">{vendor.vendorName}</div>
            <div className="vd-hero-meta">
              <span className={`vd-status-badge ${isActive ? "active" : "inactive"}`}>
                {isActive ? "Active" : "Inactive"}
              </span>
              {vendor.email && (
                <span className="vd-hero-email">{vendor.email}</span>
              )}
            </div>
          </div>
        </div>
        <div className="vd-hero-actions">
          <button
            type="button"
            className="vd-btn light"
            onClick={() => navigate("/stocks/vendors")}
          >
            <i className="ti ti-arrow-left"></i> Back
          </button>
          <button
            type="button"
            className="vd-btn primary"
            onClick={() => setShowEditModal(true)}
          >
            <i className="ti ti-edit"></i> Edit
          </button>
        </div>
      </div>

      {/* Two-column grid: Basic Info + Type & Services */}
      <div className="vd-section-grid">
        {/* Basic Info */}
        <div className="vd-info-card">
          <div className="vd-card-title">Basic Info</div>
          <div className="vd-fields cols-1">
            <Field label="Vendor / Company Name" value={vendor.vendorName} />
            <Field label="Contact Person" value={vendor.contactPerson} />
            <Field label="Phone" value={phoneDisplay} />
            <Field label="Username" value={vendor.username} />
            <Field
              label="Portal Access"
              value={vendor.hasPassword ? "Password set" : "No password"}
            />
          </div>
        </div>

        {/* Type & Services */}
        <div className="vd-info-card">
          <div className="vd-card-title">Type & Services</div>
          <div className="vd-fields cols-1">
            <div className="vd-field">
              <span className="vd-field-label">Vendor / Company Types</span>
              {typeChips.length > 0 ? (
                <div className="vd-chip-wrap">
                  {typeChips.map((c) => (
                    <span key={c.id} className="vd-chip">{c.label}</span>
                  ))}
                </div>
              ) : (
                <span className="vd-field-value empty">—</span>
              )}
            </div>
            <div className="vd-field">
              <span className="vd-field-label">Service Categories</span>
              {categoryChips.length > 0 ? (
                <div className="vd-chip-wrap">
                  {categoryChips.map((c) => (
                    <span key={c.id} className="vd-chip">{c.label}</span>
                  ))}
                </div>
              ) : (
                <span className="vd-field-value empty">—</span>
              )}
            </div>
            <Field label="Deals With" value={vendor.dealsWith} />
          </div>
        </div>
      </div>

      {/* Company Information */}
      <div className="vd-info-card">
        <div className="vd-card-title">Company Information</div>
        <div className="vd-fields">
          <Field label="Country of Registration" value={vendor.countryOfRegistration} />
          <Field label="MSME / Udyam Registration Number" value={vendor.companyRegistrationNo} />
          <Field label="GST Number" value={vendor.gstNumber} />
          <Field label="PAN Number" value={vendor.panNumber} />
          <Field
            label="Company Website"
            value={vendor.companyWebsite}
          />
          <Field label="Country Code" value={vendor.countryCode} />
          <Field label="Company Address" value={vendor.companyAddress} full />
        </div>
      </div>

      {/* Bank Details */}
      {bankDetails.length > 0 ? (
        bankDetails.map((bank, index) => <BankBlock key={`bank-${index}`} bank={bank} index={index} />)
      ) : (
        <div className="vd-info-card bank">
          <div className="vd-card-title">Bank Details</div>
          <div className="vd-fields">
            <span className="vd-field-value empty">—</span>
          </div>
        </div>
      )}

      {/* Contact Information */}
      <div className="vd-info-card">
        <div className="vd-card-title">Contact Information</div>
        <div className="vd-fields">
          <Field label="Official Email" value={vendor.officialEmail} />
          <Field label="Secondary Email" value={vendor.secondaryEmail} />
          <Field label="Internal Representative" value={vendor.internalRepresentative} />
          <Field label="Relationship Since" value={vendor.relationshipSince} />
          <Field label="Address" value={vendor.address} full />
        </div>
      </div>

      <EditVendorModal
        open={showEditModal}
        vendor={vendor}
        onClose={() => setShowEditModal(false)}
        onUpdated={async () => {
          setShowEditModal(false);
          try {
            const vendors = await getVendors();
            const found = Array.isArray(vendors) ? vendors.find((v) => v.id === Number(id)) : null;
            if (found) setVendor(found);
          } catch (_) {}
        }}
      />
    </div>
  );
}
