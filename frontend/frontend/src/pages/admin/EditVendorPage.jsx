import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getVendors,
  updateVendor,
} from "../../api/vendorsApi";
import { getVendorTypes } from "../../api/vendorTypesApi";
import { getStockCategories } from "../../api/stocksApi";
import { getBrands } from "../../api/brandsApi";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import {
  COUNTRY_CODE_OPTIONS,
  defaultCountryOption,
  ensureCountryCodeValue,
  getCountryOptionByValue,
  getCountryAllowedLengths,
  getCountryDisplayMaxLength,
  sanitizePhoneDigits,
  validatePhoneNumber,
} from "../../utils/phoneUtils";
import { useToast } from "../../components/system/ToastProvider";
import PageLoader from "../../components/common/PageLoader";

const initialForm = {
  vendorName: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  countryCode: defaultCountryOption.value,
  officialEmail: "",
  secondaryEmail: "",
  vendorTypeIds: [],
  productIds: [],
  brandIds: [],
  dealsWith: "",
  internalRepresentative: "",
  relationshipSince: "",
  companyWebsite: "",
  countryOfRegistration: "",
  companyRegistrationNo: "",
  gstNumber: "",
  panNumber: "",
  companyAddress: "",
  status: "active",
  materialsSupplied: [],
  username: "",
  password: "",
};

export default function EditVendorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [mobileError, setMobileError] = useState("");
  
  // Lookup data
  const [vendorTypes, setVendorTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allBrands, setAllBrands] = useState([]);
  // Keep dropdowns as single-select "add to list" (no checklist UI)
  const [vendorTypePick, setVendorTypePick] = useState("");
  const [productPick, setProductPick] = useState("");
  const [brandPick, setBrandPick] = useState("");

  // Filtered lists for form
  const [formFilteredCategories, setFormFilteredCategories] = useState([]);
  const [formFilteredBrands, setFormFilteredBrands] = useState([]);

  // Load master data and vendor
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [types, cats, brands, vendors] = await Promise.all([
          getVendorTypes(),
          getStockCategories(),
          getBrands(),
          getVendors(),
        ]);
        setVendorTypes(Array.isArray(types) ? types : []);
        setCategories(Array.isArray(cats) ? cats : []);
        setAllBrands(Array.isArray(brands) ? brands : []);
        
        // Find vendor by id
        const vendor = Array.isArray(vendors) ? vendors.find((v) => v.id === Number(id)) : null;
        if (vendor) {
          setForm({
            vendorName: vendor.vendorName || "",
            contactPerson: vendor.contactPerson || "",
            phone: vendor.phone || "",
            email: vendor.email || "",
            address: vendor.address || "",
            countryCode: ensureCountryCodeValue(
              vendor.countryCode || defaultCountryOption.value
            ),
            officialEmail: vendor.officialEmail || "",
            secondaryEmail: vendor.secondaryEmail || "",
            vendorTypeIds: Array.isArray(vendor.vendorTypeIds) ? vendor.vendorTypeIds : [],
            productIds: Array.isArray(vendor.productIds) ? vendor.productIds : [],
            brandIds: Array.isArray(vendor.brandIds) ? vendor.brandIds : [],
            dealsWith: vendor.dealsWith || "",
            internalRepresentative: vendor.internalRepresentative || "",
            relationshipSince: vendor.relationshipSince || "",
            companyWebsite: vendor.companyWebsite || "",
            countryOfRegistration: vendor.countryOfRegistration || "",
            companyRegistrationNo: vendor.companyRegistrationNo || "",
            gstNumber: vendor.gstNumber || "",
            panNumber: vendor.panNumber || "",
            companyAddress: vendor.companyAddress || "",
            status: vendor.status || "active",
            materialsSupplied: vendor.materialsSupplied || [],
            username: vendor.username || "",
            password: "",
          });
        } else {
          showError("Vendor not found", { title: "Vendors" });
        }
      } catch (e) {
        showError(extractApiErrorMessage(e, "Failed to load vendor"), { title: "Vendors" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Filter categories based on selected vendor types
  const getFilteredCategories = (vendorTypeIds) => {
    if (!Array.isArray(vendorTypeIds) || vendorTypeIds.length === 0) return [];
    return categories.filter((cat) => {
      const allowedIds = Array.isArray(cat.allowedVendorTypeIds)
        ? cat.allowedVendorTypeIds
        : [];
      return vendorTypeIds.some((vtid) => allowedIds.includes(vtid));
    });
  };

  // Filter brands based on selected product categories
  const getFilteredBrands = (productIds) => {
    if (!Array.isArray(productIds) || productIds.length === 0) return [];
    return allBrands.filter((brand) =>
      productIds.includes(brand.stockCategoryId)
    );
  };

  // Update filtered categories when form vendor types change
  useEffect(() => {
    const filtered = getFilteredCategories(form.vendorTypeIds);
    setFormFilteredCategories(filtered);
    // Reset product IDs if they're no longer valid
    const validProductIds = form.productIds.filter((pid) =>
      filtered.some((cat) => cat.id === pid)
    );
    if (validProductIds.length !== form.productIds.length) {
      setForm((p) => ({ ...p, productIds: validProductIds, brandIds: [] }));
    }
  }, [form.vendorTypeIds, categories]);

  // Update filtered brands when form product IDs change
  useEffect(() => {
    const filtered = getFilteredBrands(form.productIds);
    setFormFilteredBrands(filtered);
    // Reset brand IDs if they're no longer valid
    const validBrandIds = form.brandIds.filter((bid) =>
      filtered.some((b) => b.id === bid)
    );
    if (validBrandIds.length !== form.brandIds.length) {
      setForm((p) => ({ ...p, brandIds: validBrandIds }));
    }
  }, [form.productIds, allBrands]);

  const handlePhoneChange = (value) => {
    const option = getCountryOptionByValue(form.countryCode);
    const lengths = getCountryAllowedLengths(form.countryCode);
    setForm((p) => ({
      ...p,
      phone: sanitizePhoneDigits(value, option?.maxLength, lengths),
    }));
    setMobileError("");
  };

  const handleCountryCodeChange = (value) => {
    setForm((p) => ({
      ...p,
      countryCode: ensureCountryCodeValue(value),
      phone: "",
    }));
    setMobileError("");
  };

  const normalizeWebsiteUrl = (raw) => {
    const v = (raw || "").trim();
    if (!v) return "";
    if (/^https?:\/\//i.test(v)) return v;
    return `https://${v}`;
  };

  const isValidWebsiteUrl = (url) => {
    if (!url) return true;
    try {
      // eslint-disable-next-line no-new
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const websiteUrl = normalizeWebsiteUrl(form.companyWebsite);
    if (!isValidWebsiteUrl(websiteUrl)) {
      showError("Invalid website URL", { title: "Vendors" });
      return;
    }
    if (!form.vendorName.trim()) {
      showError("Vendor Name is required", { title: "Vendors" });
      return;
    }
    if (!form.phone.trim()) {
      setMobileError("Mobile Number is required");
      return;
    }
    if (!form.officialEmail.trim()) {
      showError("Official Email is required", { title: "Vendors" });
      return;
    }
    if (!form.countryOfRegistration.trim()) {
      showError("Country of Registration is required", { title: "Vendors" });
      return;
    }
    if (!form.companyRegistrationNo.trim()) {
      showError("Company Registration No. is required", { title: "Vendors" });
      return;
    }
    if (!form.gstNumber.trim()) {
      showError("GST Number is required", { title: "Vendors" });
      return;
    }
    if (!form.panNumber.trim()) {
      showError("PAN Number is required", { title: "Vendors" });
      return;
    }

    const phoneValidation = validatePhoneNumber(form.phone, form.countryCode);
    if (phoneValidation) {
      setMobileError(phoneValidation);
      return;
    }

    setSaving(true);
    try {
      await updateVendor(id, {
        vendorName: form.vendorName.trim(),
        contactPerson: form.contactPerson.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        countryCode: form.countryCode,
        officialEmail: form.officialEmail.trim(),
        secondaryEmail: form.secondaryEmail.trim(),
        vendorTypeIds: form.vendorTypeIds,
        productIds: form.productIds,
        brandIds: form.brandIds,
        dealsWith: form.dealsWith.trim(),
        internalRepresentative: form.internalRepresentative.trim(),
        relationshipSince: form.relationshipSince,
        companyWebsite: websiteUrl,
        countryOfRegistration: form.countryOfRegistration.trim(),
        companyRegistrationNo: form.companyRegistrationNo.trim(),
        gstNumber: form.gstNumber.trim(),
        panNumber: form.panNumber.trim(),
        companyAddress: form.companyAddress.trim(),
        status: form.status,
        materialsSupplied: form.materialsSupplied,
        username: form.username.trim() || undefined,
        password: form.password || undefined,
      });
      showSuccess("Vendor updated successfully", { title: "Vendors" });
      navigate("/stocks/vendors");
    } catch (e2) {
      const msg = extractApiErrorMessage(e2, "Failed to update vendor");
      showError(msg, { title: "Vendors" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  const selectedCountry = getCountryOptionByValue(form.countryCode);
  const phoneMaxLen =
    getCountryDisplayMaxLength(form.countryCode) || selectedCountry?.maxLength;
  const phonePattern = phoneMaxLen ? `\\d{${phoneMaxLen}}` : "\\d*";

  const VendorTypeSelect = ({ selectedIds, onChange }) => (
    <>
      <select
        className="form-select"
        value={vendorTypePick}
        onChange={(e) => {
          const idNum = Number(e.target.value);
          if (!idNum) return;
          if (!selectedIds.includes(idNum)) onChange([...selectedIds, idNum]);
          setVendorTypePick("");
        }}
      >
        <option value="">-- select --</option>
        {vendorTypes.map((vt) => (
          <option key={vt.id} value={vt.id}>
            {vt.typeName}
          </option>
        ))}
      </select>
      {selectedIds.length > 0 && (
        <div className="mt-1">
          {selectedIds.map((id) => {
            const name = vendorTypes.find((v) => v.id === id)?.typeName;
            if (!name) return null;
            return (
              <span
                key={id}
                className="badge bg-light text-dark me-1"
                style={{ cursor: "default" }}
              >
                {name} <i
                  className="ti ti-x ms-1"
                  style={{ cursor: "pointer" }}
                  onClick={() => onChange(selectedIds.filter((x) => x !== id))}
                />
              </span>
            );
          })}
        </div>
      )}
    </>
  );

  const ProductSelect = ({ selectedIds, onChange, filteredList }) => (
    <>
      <select
        className="form-select"
        value={productPick}
        onChange={(e) => {
          const idNum = Number(e.target.value);
          if (!idNum) return;
          if (!selectedIds.includes(idNum)) onChange([...selectedIds, idNum]);
          setProductPick("");
        }}
      >
        <option value="">-- select --</option>
        {filteredList.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>
      {selectedIds.length > 0 && (
        <div className="mt-1">
          {selectedIds.map((id) => {
            const name = filteredList.find((c) => c.id === id)?.name;
            if (!name) return null;
            return (
              <span
                key={id}
                className="badge bg-light text-dark me-1"
                style={{ cursor: "default" }}
              >
                {name} <i
                  className="ti ti-x ms-1"
                  style={{ cursor: "pointer" }}
                  onClick={() => onChange(selectedIds.filter((x) => x !== id))}
                />
              </span>
            );
          })}
        </div>
      )}
    </>
  );

  const BrandSelect = ({ selectedIds, onChange, filteredList }) => (
    <>
      <select
        className="form-select"
        value={brandPick}
        onChange={(e) => {
          const idNum = Number(e.target.value);
          if (!idNum) return;
          if (!selectedIds.includes(idNum)) onChange([...selectedIds, idNum]);
          setBrandPick("");
        }}
      >
        <option value="">-- select --</option>
        {filteredList.map((brand) => (
          <option key={brand.id} value={brand.id}>
            {brand.brandName}
          </option>
        ))}
      </select>
      {selectedIds.length > 0 && (
        <div className="mt-1">
          {selectedIds.map((id) => {
            const name = filteredList.find((b) => b.id === id)?.brandName;
            if (!name) return null;
            return (
              <span
                key={id}
                className="badge bg-light text-dark me-1"
                style={{ cursor: "default" }}
              >
                {name} <i
                  className="ti ti-x ms-1"
                  style={{ cursor: "pointer" }}
                  onClick={() => onChange(selectedIds.filter((x) => x !== id))}
                />
              </span>
            );
          })}
        </div>
      )}
    </>
  );

  return (
    <>
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">Edit Vendor</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/admin-dashboard">
                    <i className="ti ti-smart-home"></i>
                  </Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to="/stocks/vendors">Vendor Management</Link>
                </li>
                <li className="breadcrumb-item active">Edit Vendor</li>
              </ol>
            </nav>
          </div>
          <div className="mb-2">
            <button
              type="button"
              className="btn btn-secondary d-flex align-items-center"
              onClick={() => navigate("/stocks/vendors")}
            >
              <i className="ti ti-arrow-left me-2"></i>Back
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">Vendor Information</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                {/* Basic Information Section */}
                <div className="col-md-12">
                  <h6 className="mb-3 fw-semibold">Basic Information</h6>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">
                      Vendor Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.vendorName}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, vendorName: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">
                      Status <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={form.status}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, status: e.target.value }))
                      }
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Vendor Types & Products Section */}
                <div className="col-md-12">
                  <h6 className="mb-3 fw-semibold mt-3">
                    Vendor Type & Products
                  </h6>
                </div>
                <div className="col-md-12">
                  <div className="mb-3">
                    <label className="form-label">Vendor Type / Comapany Name</label>
                    <VendorTypeSelect
                      selectedIds={form.vendorTypeIds}
                      onChange={(ids) =>
                        setForm((p) => ({ ...p, vendorTypeIds: ids }))
                      }
                    />
                  </div>
                </div>
                {form.vendorTypeIds.length > 0 && (
                  <>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">
                          Products (Categories)
                        </label>
                        <ProductSelect
                          selectedIds={form.productIds}
                          onChange={(ids) =>
                            setForm((p) => ({
                              ...p,
                              productIds: ids,
                              brandIds: [],
                            }))
                          }
                          filteredList={formFilteredCategories}
                        />
                      </div>
                    </div>
                    {form.productIds.length > 0 && (
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Brands</label>
                          <BrandSelect
                            selectedIds={form.brandIds}
                            onChange={(ids) =>
                              setForm((p) => ({ ...p, brandIds: ids }))
                            }
                            filteredList={formFilteredBrands}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Company Information Section */}
                <div className="col-md-12">
                  <h6 className="mb-3 fw-semibold mt-3">
                    Company Information
                  </h6>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">
                      Country of Registration{" "}
                      <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.countryOfRegistration}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          countryOfRegistration: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">
                      Company Registration No.{" "}
                      <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.companyRegistrationNo}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          companyRegistrationNo: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">
                      GST Number <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.gstNumber}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, gstNumber: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">
                      PAN Number <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.panNumber}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, panNumber: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="mb-3">
                    <label className="form-label">Company Address</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={form.companyAddress}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          companyAddress: e.target.value,
                        }))
                      }
                    ></textarea>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Company Website</label>
                    <input
                      type="text"
                      className="form-control"
                      inputMode="url"
                      placeholder="https://example.com"
                      value={form.companyWebsite}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          companyWebsite: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Deals With</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.dealsWith}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, dealsWith: e.target.value }))
                      }
                    />
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="col-md-12">
                  <h6 className="mb-3 fw-semibold mt-3">
                    Contact Information
                  </h6>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">
                      Main Contact Person
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.contactPerson}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          contactPerson: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">
                      Internal Representative
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.internalRepresentative}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          internalRepresentative: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">
                      Official Email <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      value={form.officialEmail}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          officialEmail: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Secondary Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={form.secondaryEmail}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          secondaryEmail: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Country Code</label>
                    <select
                      className="form-select"
                      value={form.countryCode}
                      onChange={(e) =>
                        handleCountryCodeChange(e.target.value)
                      }
                    >
                      {COUNTRY_CODE_OPTIONS.map((option) => (
                        <option
                          key={`${option.country}-${option.callingCode}`}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">
                      Mobile Number <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern={phonePattern}
                      minLength={phoneMaxLen || undefined}
                      title={
                        phoneMaxLen
                          ? `Enter exactly ${phoneMaxLen} digits`
                          : "Enter numeric value"
                      }
                      className="form-control"
                      value={form.phone}
                      maxLength={phoneMaxLen}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                    />
                    <div className="d-flex justify-content-between mt-1">
                      <small className="text-muted">
                        {phoneMaxLen
                          ? `${phoneMaxLen} digits required`
                          : "Numeric value"}
                      </small>
                      {mobileError && (
                        <small className="text-danger">{mobileError}</small>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">
                      Relationship Since
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={form.relationshipSince}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          relationshipSince: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={form.email}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, email: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="mb-3">
                    <label className="form-label">Address</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={form.address}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, address: e.target.value }))
                      }
                    ></textarea>
                  </div>
                </div>

                {/* Vendor Login Credentials */}
                <div className="col-md-12">
                  <h6 className="mb-3 fw-semibold mt-3">Vendor Portal Login</h6>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      className="form-control"
                      autoComplete="off"
                      value={form.username}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, username: e.target.value }))
                      }
                    />
                    <small className="text-muted">Used by vendor to log in to the vendor portal</small>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      autoComplete="new-password"
                      placeholder="Leave blank to keep current password"
                      value={form.password}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, password: e.target.value }))
                      }
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="col-md-12">
                  <div className="d-flex gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={saving}
                    >
                      {saving ? "Updating..." : "Update Vendor"}
                    </button>
                    <Link to="/stocks/vendors" className="btn btn-light">
                      Cancel
                    </Link>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
