import api from "../utils/api";
import vendorApi, { setVendorAccessToken } from "../utils/vendorApi";
import { getVendorSession } from "../utils/vendorSession";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8082";

function buildVendorOrderFormData(order) {
  const formData = new FormData();
  formData.append(
    "data",
    new Blob(
      [
        JSON.stringify({
          projectName: order.projectName || "",
          categoryId: order.categoryId || null,
          categoryName: order.categoryName || "",
          typeId: order.typeId || null,
          typeName: order.typeName || "",
          subtypeId: order.subtypeId || null,
          subtypeName: order.subtypeName || "",
          materialName: order.materialName || "",
          vendorId: order.vendorId || null,
          vendorName: order.vendorName || "",
          quantity: order.quantity || "",
          requiredDate: order.requiredDate || null,
          notes: order.notes || "",
          vendorDeadline: order.vendorDeadline || null,
          quotationFileName: order.quotationFileName || "",
          status: order.status || "",
          paymentStatus: order.paymentStatus || "",
          accountsStatus: order.accountsStatus || "",
          vendorPrice: order.vendorPrice || "",
          advanceAmount: order.advanceAmount || "",
          sentToAccountsAt: order.sentToAccountsAt || null,
          advancePaidAt: order.advancePaidAt || null,
          advanceVerifiedAt: order.advanceVerifiedAt || null,
          advancePaidNotes: order.advancePaidNotes || "",
        }),
      ],
      { type: "application/json" },
    ),
  );

  if (order?.uploadDesignFile instanceof File) {
    formData.append("uploadDesignFile", order.uploadDesignFile);
  }
  if (order?.quotationFile instanceof File) {
    formData.append("quotationFile", order.quotationFile);
  }
  if (order?.advancePaidProofFile instanceof File) {
    formData.append("advancePaidProofFile", order.advancePaidProofFile);
  }

  return formData;
}

function toUrl(path) {
  return path ? `${API_BASE}/${String(path).replace(/^\/+/, "")}` : "";
}

function normalize(row) {
  if (!row) return row;
  return {
    ...row,
    uploadDesignUrl: toUrl(row.uploadDesignPath || row.upload_design_path || ""),
    quotationFileUrl: toUrl(row.quotationFilePath || row.quotation_file_path || ""),
    advancePaidProofUrl: toUrl(row.advancePaidProofPath || row.advance_paid_proof_path || ""),
  };
}

export async function getVendorOrders(vendorId) {
  const session = getVendorSession();
  const isVendorPortal =
    typeof window !== "undefined" &&
    String(window.location?.pathname || "").startsWith("/vendor") &&
    Boolean(session?.vendorId);

  if (isVendorPortal && session?.accessToken) {
    setVendorAccessToken(session.accessToken);
  }

  const client = isVendorPortal ? vendorApi : api;
  const response = await client.get("/api/vendor-orders", {
    params: vendorId ? { vendorId } : undefined,
  });
  return Array.isArray(response?.data) ? response.data.map(normalize) : [];
}

export async function createVendorOrder(order) {
  const session = getVendorSession();
  const isVendorPortal =
    typeof window !== "undefined" &&
    String(window.location?.pathname || "").startsWith("/vendor") &&
    Boolean(session?.vendorId);

  if (isVendorPortal && session?.accessToken) {
    setVendorAccessToken(session.accessToken);
  }

  const client = isVendorPortal ? vendorApi : api;
  const response = await client.post("/api/vendor-orders", buildVendorOrderFormData(order));
  return response?.data ? normalize(response.data) : null;
}

export async function updateVendorOrderApi(id, order) {
  const session = getVendorSession();
  const isVendorPortal =
    typeof window !== "undefined" &&
    String(window.location?.pathname || "").startsWith("/vendor") &&
    Boolean(session?.vendorId);

  if (isVendorPortal && session?.accessToken) {
    setVendorAccessToken(session.accessToken);
  }

  const client = isVendorPortal ? vendorApi : api;
  const response = await client.put(`/api/vendor-orders/${id}`, buildVendorOrderFormData(order));
  return response?.data ? normalize(response.data) : null;
}
