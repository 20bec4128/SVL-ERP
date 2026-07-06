import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  getLeadById,
  getLeadChatMessages,
  sendLeadChatAttachment,
  sendLeadChatMessage,
  downloadLeadChatAttachment,
  updateLeadDetails,
} from "../../api/leadsApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/system/ToastProvider";

const PAYMENT_THREAD_MARKER = "[[payment-thread]]";
const DESIGN_THREAD_MARKER = "[[design-thread]]";

function formatDateTime(value) {
  if (!value) return "-";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
  } catch {
    return String(value);
  }
}

function buildReplyPrefix(reply) {
  if (!reply) return "";
  const isFile = !!reply.attachmentName;
  const snippet = (reply.message || "").replace(/\s+/g, " ").trim().slice(0, 120);
  const meta = isFile
    ? `type=file|name=${reply.attachmentName}`
    : `type=text|text=${encodeURIComponent(snippet)}`;
  return `[[reply]]${meta}[[/reply]]\n`;
}

function parseReplyMessage(value) {
  const raw = value || "";
  if (!raw.startsWith("[[reply]]")) {
    return { reply: null, text: raw };
  }
  const end = raw.indexOf("[[/reply]]");
  if (end === -1) {
    return { reply: null, text: raw };
  }
  const meta = raw.slice(9, end);
  const text = raw.slice(end + 10).trimStart();
  const parts = {};
  meta.split("|").forEach((entry) => {
    const [key, ...rest] = entry.split("=");
    if (!key) return;
    parts[key] = rest.join("=");
  });
  const reply =
    parts.type === "file"
      ? { type: "file", name: parts.name || "File" }
      : { type: "text", text: decodeURIComponent(parts.text || "") };
  return { reply, text };
}

function buildChoiceMessage(choices = ["accept", "reject", "continue"], amount) {
  const options = Array.isArray(choices)
    ? choices.map((item) => String(item || "").trim()).filter(Boolean)
    : ["accept", "reject", "continue"];
  if (options.length === 0) {
    return "";
  }
  const labels = options.map((item) => item.charAt(0).toUpperCase() + item.slice(1));
  const amountLine = amount
    ? `Total amount for your products: ₹${Number(amount).toLocaleString("en-IN")}\n\n`
    : "";
  return `${amountLine}[[choice]]${options.join("|")}[[/choice]] Please choose: ${labels.join(" / ")}.`;
}

function parseChoiceMessage(value) {
  const raw = value || "";
  const start = raw.indexOf("[[choice]]");
  const end = raw.indexOf("[[/choice]]");
  if (start === -1 || end === -1 || end < start) {
    return { choices: null, text: raw };
  }
  const choiceText = raw.slice(start + 10, end).trim();
  const choices = choiceText
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
  const text = (raw.slice(0, start) + raw.slice(end + 11)).trim();
  return { choices, text };
}

function parseCustomerSelection(value) {
  const raw = String(value || "").trim();
  const match = raw.match(/^Customer selected:\s*(.+)$/i);
  if (!match) {
    return null;
  }
  return match[1].trim();
}

function hasPaymentThreadMarker(value) {
  return String(value || "").trimStart().startsWith(PAYMENT_THREAD_MARKER);
}

function hasDesignThreadMarker(value) {
  return String(value || "").trimStart().startsWith(DESIGN_THREAD_MARKER);
}

function stripPaymentThreadMarker(value) {
  const raw = String(value || "");
  if (!hasPaymentThreadMarker(raw)) return raw;
  const startTrimmed = raw.trimStart();
  const withoutMarker = startTrimmed.slice(PAYMENT_THREAD_MARKER.length);
  return withoutMarker.replace(/^\s+/, "");
}

function stripDesignThreadMarker(value) {
  const raw = String(value || "");
  if (!hasDesignThreadMarker(raw)) return raw;
  const startTrimmed = raw.trimStart();
  const withoutMarker = startTrimmed.slice(DESIGN_THREAD_MARKER.length);
  return withoutMarker.replace(/^\s+/, "");
}

function applyThreadViewFilter(rows, tab) {
  const normalized = (Array.isArray(rows) ? rows : []).map((item) => {
    const isPayment = hasPaymentThreadMarker(item?.message);
    const isDesign = hasDesignThreadMarker(item?.message);
    // strip whichever marker is present, priority payment over design
    let text = stripPaymentThreadMarker(item?.message || "");
    if (!isPayment) {
      text = stripDesignThreadMarker(item?.message || "");
    }
    return {
      ...item,
      _paymentThreadMessage: isPayment,
      _designThreadMessage: isDesign,
      message: text,
    };
  });
  if (tab === "PAYMENT") {
    return normalized.filter((item) => item._paymentThreadMessage);
  }
  if (tab === "DESIGN") {
    return normalized.filter((item) => item._designThreadMessage);
  }
  if (tab === "MANAGER") {
    return normalized.filter((item) => !item._paymentThreadMessage && !item._designThreadMessage);
  }
  // CUSTOMER tab shows only the plain customer thread, excluding payment/design
  return normalized.filter((item) => !item._paymentThreadMessage && !item._designThreadMessage);
}

export default function LeadChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [leadStatus, setLeadStatus] = useState("");
  const [leadOwnerUserId, setLeadOwnerUserId] = useState(null);
  const [leadData, setLeadData] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [modalTotal, setModalTotal] = useState("");
  const [modalPaid, setModalPaid] = useState("");
  const [modalRemaining, setModalRemaining] = useState("");
  const [modalDesignFrom, setModalDesignFrom] = useState("");
  const [modalDesignTo, setModalDesignTo] = useState("");
  const [chatTab, setChatTab] = useState("MANAGER");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatText, setChatText] = useState("");
  const [chatFile, setChatFile] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [menu, setMenu] = useState({ visible: false, x: 0, y: 0, message: null });
  const [saving, setSaving] = useState(false);
  const lastSeenRef = useRef({});
  const didInitRef = useRef({});
  const { showSuccess, showError } = useToast();
  const role = String(user?.role || "").toUpperCase();

  const normalizeChatTab = (value) => {
    const next = String(value || "").trim().toUpperCase();
    if (next === "INTERNAL") return "MANAGER";
    if (["MANAGER", "CUSTOMER", "PAYMENT", "DESIGN"].includes(next)) return next;
    return "MANAGER";
  };

  const requestedThread = searchParams.get("thread");
const apiThreadType =
        chatTab === "CUSTOMER" || chatTab === "PAYMENT" || chatTab === "DESIGN"
          ? "CUSTOMER"
          : "INTERNAL";

  useEffect(() => {
    if (!requestedThread) return;
    const nextTab = normalizeChatTab(requestedThread);
    setChatTab(nextTab);
  }, [requestedThread]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    const loadLead = async () => {
      try {
        const lead = await getLeadById(id);
        if (!active) return;
        const nextStatus = lead?.status || "";
        setLeadStatus(nextStatus);
        setLeadOwnerUserId(lead?.ownerUserId ?? null);
        setLeadData(lead); // <--- store full lead data for payment modal
        if (!requestedThread) {
          const isPayment = String(nextStatus).trim().toLowerCase() === "payment";
          const isDesign = String(nextStatus).trim().toLowerCase() === "design";
          if (isPayment) {
            setChatTab("PAYMENT");
          } else if (isDesign) {
            setChatTab("DESIGN");
          } else {
            setChatTab("MANAGER");
          }
        }
      } catch {
        if (!active) return;
        setLeadStatus("");
        setLeadOwnerUserId(null);
      }
    };
    loadLead();
    return () => {
      active = false;
    };
  }, [id, requestedThread]);

  useEffect(() => {
    const t = Number(modalTotal) || 0;
    const p = Number(modalPaid) || 0;
    setModalRemaining(t - p);
  }, [modalTotal, modalPaid]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    const loadMessages = async () => {
      setChatLoading(true);
      try {
        const rows = await getLeadChatMessages(id, apiThreadType);
        if (!active) return;
        const list = applyThreadViewFilter(rows, chatTab);
        setChatMessages(list);
        const latest = list[list.length - 1];
        const latestId = latest?.id || latest?.createdAt || null;
        const key = apiThreadType;
        if (latestId && didInitRef.current[key]) {
          const isIncoming = latest?.senderUserId
            ? String(latest.senderUserId) !== String(user?.id || "")
            : false;
          if (isIncoming && latestId !== lastSeenRef.current[key]) {
            showSuccess("New message received");
          }
        }
        if (latestId) {
          lastSeenRef.current[key] = latestId;
        }
        if (!didInitRef.current[key]) {
          didInitRef.current[key] = true;
        }
      } catch {
        if (active) setChatMessages([]);
      } finally {
        if (active) setChatLoading(false);
      }
    };
    loadMessages();
    const interval = setInterval(loadMessages, 8000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [id, apiThreadType, user?.id, chatTab]);

  const submitChatMessage = async () => {
    if (!id || (!chatText.trim() && !chatFile)) return;
    setSaving(true);
    try {
      const replyPrefix = buildReplyPrefix(replyTo);
      const paymentPrefix = chatTab === "PAYMENT" ? `${PAYMENT_THREAD_MARKER}\n` : "";
      const designPrefix = chatTab === "DESIGN" ? `${DESIGN_THREAD_MARKER}\n` : "";
      const finalMessage = `${paymentPrefix}${designPrefix}${replyPrefix}${chatText.trim()}`.trim();
      if (chatFile) {
        await sendLeadChatAttachment(id, {
          threadType: apiThreadType,
          message: finalMessage,
          file: chatFile,
        });
      } else {
        await sendLeadChatMessage(id, {
          threadType: apiThreadType,
          message: finalMessage,
        });
      }
      setChatText("");
      setChatFile(null);
      setReplyTo(null);
      const rows = await getLeadChatMessages(id, apiThreadType);
      const list = applyThreadViewFilter(rows, chatTab);
      setChatMessages(list);
    } finally {
      setSaving(false);
    }
  };

  const sendChoiceRequest = async () => {
    if (!id) return;
    // boq logic removed
    setSaving(true);
    try {
      // removed boq quantity update
      await sendLeadChatMessage(id, {
        threadType: "CUSTOMER",
        message,
      });
      const rows = await getLeadChatMessages(id, apiThreadType);
      const list = applyThreadViewFilter(rows, chatTab);
      setChatMessages(list);
      // removed boq amount reset
      showSuccess("Status options with amount sent.");
    } catch (error) {
      const apiMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to send status options";
      showError(apiMessage);
    } finally {
      setSaving(false);
    }
  };

  const sendDesignRequest = async () => {
    if (!id) return;
    setSaving(true);
    try {
      // choices include change as requested
      const message = buildChoiceMessage(["accept", "reject", "change", "continue"]);
      const prefixed = `${DESIGN_THREAD_MARKER}\n${message}`;
      await sendLeadChatMessage(id, {
        threadType: "CUSTOMER",
        message: prefixed,
      });
      const rows = await getLeadChatMessages(id, apiThreadType);
      const list = applyThreadViewFilter(rows, chatTab);
      setChatMessages(list);
      showSuccess("Status options sent to customer.");
    } catch (error) {
      const apiMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to send design status options";
      showError(apiMessage);
    } finally {
      setSaving(false);
    }
  };

  const sendPaymentChoiceRequest = async () => {
    if (!id) return;
    setSaving(true);
    try {
      // send payment options without requiring manual amount entry
      const message = `${PAYMENT_THREAD_MARKER}\n[[choice]]pay full amount|pay partial amount|continue[[/choice]] Please choose: Pay Full Amount / Pay Partial Amount / Continue.`;
      await sendLeadChatMessage(id, {
        threadType: "CUSTOMER",
        message,
      });
      const rows = await getLeadChatMessages(id, apiThreadType);
      const list = applyThreadViewFilter(rows, chatTab);
      setChatMessages(list);
      // no amount field to reset
      showSuccess("Payment options sent to customer.");
    } catch (error) {
      const apiMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to send payment options";
      showError(apiMessage);
    } finally {
      setSaving(false);
    }
  };

  const openPaymentModal = () => {
    if (leadData) {
      setModalTotal(leadData.totalAmount || "");
      setModalPaid(leadData.paidAmount || "");
      setModalDesignFrom(leadData.designStartAt || "");
      setModalDesignTo(leadData.designEndAt || "");
      // compute remaining from db, but effect also recalculates
    } else {
      setModalTotal("");
      setModalPaid("");
      setModalDesignFrom("");
      setModalDesignTo("");
    }
    setShowPaymentModal(true);
  };

  const submitPaymentStatus = async () => {
    const t = Number(modalTotal);
    const p = Number(modalPaid);
    if (!t || t <= 0) {
      showError("Total amount must be provided.");
      return;
    }
    if (p < 0 || p > t) {
      showError("Paid amount must be between 0 and total amount.");
      return;
    }
    setSaving(true);
    try {
      const remaining = t - p;
      const detailsPayload = { paidAmount: p, remainingAmount: remaining };
      if (!leadData?.totalAmount) {
        detailsPayload.totalAmount = t;
      }
      if (modalDesignFrom) {
        detailsPayload.designStartAt = modalDesignFrom;
      }
      if (modalDesignTo) {
        detailsPayload.designEndAt = modalDesignTo;
      }
      await updateLeadDetails(id, detailsPayload);
      const prefix = `${PAYMENT_THREAD_MARKER}\n`;
      const msg = `${prefix}Payment summary:\nTotal: \u20b9${t}\nPaid: \u20b9${p}\nRemaining: \u20b9${remaining}`;
      await sendLeadChatMessage(id, { threadType: apiThreadType, message: msg });
      setShowPaymentModal(false);
      const rows = await getLeadChatMessages(id, apiThreadType);
      const list = applyThreadViewFilter(rows, chatTab);
      setChatMessages(list);
      // update local leadData
      setLeadData((prev) =>
        prev
          ? {
              ...prev,
              totalAmount: t,
              paidAmount: p,
              remainingAmount: remaining,
              ...(modalDesignFrom ? { designStartAt: modalDesignFrom } : {}),
              ...(modalDesignTo ? { designEndAt: modalDesignTo } : {}),
            }
          : prev,
      );
    } catch (error) {
      console.error("Error sending payment status:", error);
    } finally {
      setSaving(false);
    }
  };

  const downloadAttachment = async (item) => {
    if (!id || !item?.id) return;
    const blob = await downloadLeadChatAttachment(id, item.id);
    if (!blob) return;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = item.attachmentName || "attachment";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const openMenu = (event, item) => {
    event.preventDefault();
    setMenu({ visible: true, x: event.clientX, y: event.clientY, message: item });
  };

  const closeMenu = () => {
    setMenu({ visible: false, x: 0, y: 0, message: null });
  };

  const handleReply = () => {
    if (menu.message) {
      setReplyTo(menu.message);
    }
    closeMenu();
  };

  const supportTitle = `Lead #${id}`;
  const statusKey = String(leadStatus || "").trim().toLowerCase();
  const isPaymentStatus = statusKey === "payment";
  const isDesignStatus = statusKey === "design";
  const isEmployee = role === "EMPLOYEE";
  const currentUserId = user?.id != null ? String(user.id) : "";
  const userScopeText = `${user?.departmentName || ""} ${user?.team || ""}`.trim().toLowerCase();
  const belongsToPaymentTeam =
    userScopeText.includes("payment") || role === "ACCOUNT";
  const belongsToDesignTeam = userScopeText.includes("design");
  const primaryOwnerUserId =
    leadData?.ownerUserId ?? leadData?.owner_user_id ?? leadOwnerUserId ?? null;
  const paymentOwnerUserId =
    leadData?.paymentOwnerId ?? leadData?.payment_owner_id ?? primaryOwnerUserId ?? null;
  const designOwnerUserId =
    leadData?.designOwnerId ?? leadData?.design_owner_id ?? primaryOwnerUserId ?? null;
  const isCurrentOwner =
    primaryOwnerUserId != null && String(primaryOwnerUserId) === currentUserId;
  const isCurrentPaymentOwner =
    paymentOwnerUserId != null && String(paymentOwnerUserId) === currentUserId;
  const isCurrentDesignOwner =
    designOwnerUserId != null && String(designOwnerUserId) === currentUserId;
  const employeeDesignOnly =
    isEmployee && isDesignStatus && (isCurrentDesignOwner || belongsToDesignTeam);
  const isPaymentEmployee =
    (isEmployee || role === "ACCOUNT") &&
    isPaymentStatus &&
    (isCurrentPaymentOwner || belongsToPaymentTeam);
  const employeeCustomerReadOnly =
    isEmployee &&
    (isCurrentOwner || isCurrentPaymentOwner || isCurrentDesignOwner) &&
    chatTab === "CUSTOMER" &&
    (isPaymentStatus || isDesignStatus);
  const visibleTabs = employeeDesignOnly
    ? ["DESIGN"]
    : isPaymentEmployee
      ? ["MANAGER", "PAYMENT"]
      : [
          "MANAGER",
          "CUSTOMER",
          ...(isPaymentStatus ? ["PAYMENT"] : []),
          ...((isPaymentStatus || isDesignStatus) ? ["DESIGN"] : []),
        ];
  const supportSubtitle =
    chatTab === "MANAGER"
      ? "Manager"
      : chatTab === "PAYMENT"
        ? "Payment Team"
        : chatTab === "DESIGN"
          ? "Design Team"
          : "Customer";
  const normalizedStatus = String(leadStatus || "").trim().toLowerCase();
  const canSendChoiceRequest = false;
  const canSendDesignRequest = normalizedStatus === "design";
  useEffect(() => {
    if (!visibleTabs.includes(chatTab)) {
      setChatTab(visibleTabs[0] || "MANAGER");
    }
  }, [chatTab, visibleTabs]);

  // any employee should be able to post in design thread when lead is in design status
  const canComposeDesign = chatTab !== "DESIGN" || isDesignStatus;

  // standard composer permission
  const canCompose =
    chatTab === "DESIGN"
      ? canComposeDesign
      : !employeeCustomerReadOnly;

  return (
    <div className="customer-chat" onClick={closeMenu}>
      <div className="customer-chat__grid">
        <aside className="customer-chat__list">
          <div className="customer-chat__list-header">
            <div>
              <h4>Lead Chat</h4>
              <p className="text-muted">Lead ID: {id}</p>
            </div>
            <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => navigate(`/leads/${id}`)}>
              Back
            </button>
          </div>
          <div className="btn-group w-100">
            {visibleTabs.includes("MANAGER") ? (
              <button
                type="button"
                className={`btn ${chatTab === "MANAGER" ? "btn-primary" : "btn-light"}`}
                onClick={() => setChatTab("MANAGER")}
              >
                Manager
              </button>
            ) : null}
            {visibleTabs.includes("CUSTOMER") ? (
              <button
                type="button"
                className={`btn ${chatTab === "CUSTOMER" ? "btn-primary" : "btn-light"}`}
                onClick={() => setChatTab("CUSTOMER")}
              >
                Customer
              </button>
            ) : null}
            {visibleTabs.includes("PAYMENT") ? (
              <button
                type="button"
                className={`btn ${chatTab === "PAYMENT" ? "btn-primary" : "btn-light"}`}
                onClick={() => setChatTab("PAYMENT")}
              >
                Payment
              </button>
            ) : null}
            {visibleTabs.includes("DESIGN") ? (
              <button
                type="button"
                className={`btn ${chatTab === "DESIGN" ? "btn-primary" : "btn-light"}`}
                onClick={() => setChatTab("DESIGN")}
              >
                Design
              </button>
            ) : null}
          </div>
          <div className="customer-chat__contact">
            <div className="customer-chat__avatar">
              <img src="/assets/img/profiles/avatar-02.jpg" alt="Lead" />
              <span className="customer-chat__status-dot" />
            </div>
            <div className="customer-chat__contact-info">
              <h6>{supportTitle}</h6>
              <span>{supportSubtitle}</span>
            </div>
            <div className="customer-chat__contact-state">Active</div>
          </div>
        </aside>

        <section className="customer-chat__panel">
          <div className="customer-chat__panel-header">
            <div className="customer-chat__panel-title">
              <div className="customer-chat__avatar customer-chat__avatar--lg">
                <img src="/assets/img/profiles/avatar-02.jpg" alt="Lead" />
                <span className="customer-chat__status-dot" />
              </div>
              <div>
                <h5>{supportTitle}</h5>
                <p>{supportSubtitle}</p>
              </div>
            </div>
            <div className="customer-chat__panel-actions">
              <button className="btn btn-icon btn-light" type="button" disabled>
                <i className="ti ti-dots-vertical" />
              </button>
            </div>
          </div>

          <div className="customer-chat__panel-body">
            {chatLoading ? (
              <div className="customer-chat__empty">Loading chat...</div>
            ) : chatMessages.length === 0 ? (
              <div className="customer-chat__empty">No messages yet.</div>
            ) : (
              <div className="customer-chat__messages">
                {chatMessages.map((item) => {
                  const isMine = item.senderUserId && user?.id
                    ? String(item.senderUserId) === String(user.id)
                    : false;
                  const parsedReply = parseReplyMessage(item.message || "");
                  const parsedChoice = parseChoiceMessage(parsedReply.text);
                  const customerSelection = parseCustomerSelection(parsedChoice.text || parsedReply.text);
                  const messageText = customerSelection ? "" : (parsedChoice.text || parsedReply.text);
                  return (
                    <div
                      key={item.id || `${item.message}-${item.createdAt}`}
                      className={`customer-msg ${isMine ? "customer-msg--mine" : "customer-msg--theirs"}`}
                    >
                      <div className="customer-msg__bubble" onContextMenu={(e) => openMenu(e, item)}>
                        {parsedReply.reply ? (
                          <div className="customer-msg__reply">
                            <span>Replying to</span>
                            <p>
                              {parsedReply.reply.type === "file"
                                ? `File: ${parsedReply.reply.name}`
                                : parsedReply.reply.text}
                            </p>
                          </div>
                        ) : null}
                        {messageText ? (
                          <div className="customer-msg__text">
                            {messageText}
                          </div>
                        ) : null}
                        {customerSelection ? (
                          <div className="mt-2">
                            <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle">
                              Customer selected: {customerSelection}
                            </span>
                          </div>
                        ) : null}
                        {item.attachmentName ? (
                          <button
                            type="button"
                            className="customer-msg__file"
                            onClick={() => downloadAttachment(item)}
                          >
                            <i className="ti ti-paperclip" />
                            <span>{item.attachmentName}</span>
                          </button>
                        ) : null}
                        <div className="customer-msg__time">{formatDateTime(item.createdAt)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="customer-chat__panel-footer">
            <div className="customer-chat__composer" style={{ opacity: canCompose ? 1 : 0.5, pointerEvents: canCompose ? "auto" : "none" }}>
              {replyTo ? (
                <div className="customer-chat__reply">
                  <div>
                    <strong>Replying to</strong>
                    <p>{(replyTo.message || "").slice(0, 120)}</p>
                  </div>
                  <button type="button" onClick={() => setReplyTo(null)}>
                    <i className="ti ti-x" />
                  </button>
                </div>
              ) : null}
              {/* Design status button shown on DESIGN tab when lead is in design */}
              {chatTab === "DESIGN" &&
              ([
                "EMPLOYEE", "ADMIN", "MANAGER", "SUPER_ADMIN",
              ].includes(String(user?.role || "").toUpperCase())) ? (
                <div className="d-flex align-items-center gap-2 me-2">
                  {canSendDesignRequest ? (
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm customer-chat__status-trigger"
                      disabled={saving}
                      onClick={sendDesignRequest}
                      title="Send design status options to customer"
                    >
                      Send Status
                    </button>
                  ) : null}
                </div>
              ) : null}
              {chatTab === "PAYMENT" &&
              (["EMPLOYEE", "ADMIN", "MANAGER", "SUPER_ADMIN"].includes(String(user?.role || "").toUpperCase())) ? (
                <div className="d-flex align-items-center gap-2 me-2">
                  <button
                    type="button"
                    className="btn btn-outline-success btn-sm"
                    style={{ whiteSpace: "nowrap" }}
                    disabled={saving}
                    onClick={sendPaymentChoiceRequest}
                    title="Send payment options to customer"
                  >
                    Send Payment Options
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    style={{ whiteSpace: "nowrap" }}
                    disabled={saving}
                    onClick={openPaymentModal}
                    title="Send payment summary to customer"
                  >
                    Send Status
                  </button>
                </div>
              ) : null}
              <input
                type="text"
                placeholder="Type your message"
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
              />
              <label className="customer-chat__attach">
                <input
                  type="file"
                  onChange={(e) => setChatFile(e.target.files?.[0] || null)}
                />
                <i className="ti ti-paperclip" />
              </label>
              <button
                className="btn btn-primary customer-chat__send-btn"
                type="button"
                onClick={submitChatMessage}
                disabled={saving || (!chatText.trim() && !chatFile)}
              >
                <i className="ti ti-send" />
                <span>Send</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {showPaymentModal ? (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50" style={{ zIndex: 1050 }} onClick={() => setShowPaymentModal(false)}>
          <div className="card shadow-lg" style={{ width: "100%", maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="mb-0">Payment Summary</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowPaymentModal(false)} />
            </div>
            <div className="card-body">
              <div className="card mb-3">
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label">Total Amount (₹)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={modalTotal}
                        onChange={(e) => setModalTotal(e.target.value)}
                        disabled={!!leadData?.totalAmount}
                        min="0"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Paid Amount (₹)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={modalPaid}
                        onChange={(e) => setModalPaid(e.target.value)}
                        min="0"
                        disabled={!!leadData?.totalAmount}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Remaining (₹)</label>
                      <input type="number" className="form-control" value={modalRemaining} readOnly />
                    </div>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end mt-3">
                <button className="btn btn-primary" onClick={submitPaymentStatus} disabled={
                  saving
                }>
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {menu.visible ? (
        <div
          className="chat-context-menu"
          style={{ top: menu.y, left: menu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" onClick={handleReply}>
            Reply
          </button>
          {menu.message?.attachmentName ? (
            <button type="button" onClick={() => downloadAttachment(menu.message)}>
              Download
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
