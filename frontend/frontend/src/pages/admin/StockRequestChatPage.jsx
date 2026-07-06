import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/admin/PageHeader";
import PageLoader from "../../components/common/PageLoader";
import {
  getStockRequestById,
  getStockRequestChatMessages,
  sendStockRequestChatMessage,
  sendStockRequestChatAttachment,
  downloadStockRequestChatAttachment,
} from "../../api/stocksApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/system/ToastProvider";

function formatDateTime(value) {
  if (!value) return "-";
  try {
    const d = new Date(value);
    return isNaN(d.getTime()) ? String(value) : d.toLocaleString();
  } catch {
    return String(value);
  }
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

export default function StockRequestChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [request, setRequest] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    setChatLoading(true);
    try {
      const [req, msgs] = await Promise.all([
        getStockRequestById(id),
        getStockRequestChatMessages(id),
      ]);
      setRequest(req);
      setChatMessages(Array.isArray(msgs) ? msgs : []);
    } catch (e) {
      console.error(e);
      showError("Failed to load chat");
    } finally {
      setLoading(false);
      setChatLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const postMessage = async () => {
    if (!text && !file) return;
    setSending(true);
    try {
      if (file) {
        await sendStockRequestChatAttachment(id, { message: text, file });
      } else {
        await sendStockRequestChatMessage(id, { message: text });
      }
      setText("");
      setFile(null);
      await load();
    } catch (e) {
      console.error(e);
      showError("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const downloadAttachment = async (msg) => {
    try {
      const blob = await downloadStockRequestChatAttachment(id, msg.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = msg.attachmentName || "file";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="container-fluid">
      <PageHeader
        title={`Chat for Request ${id}`}
        breadcrumb={[
          { label: "Dashboard", path: "/admin-dashboard" },
          { label: "Stock Requests", path: "/stock-requests" },
          { label: id, path: `/stock-requests/${id}` },
          { label: "Chat", path: "" },
        ]}
      />

      {/* use lead-style chat layout with tabs for production/accounts */}
      <div className="customer-chat" onClick={() => { /* close menu stub */ }}>
        <div className="customer-chat__grid">
          <aside className="customer-chat__list">
            <div className="customer-chat__list-header">
              <div>
                <h4>Stock-chat</h4>
                <p className="text-muted">Request ID: {id}</p>
              </div>
              <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => navigate(`/stock-requests/${id}`)}>
                Back
              </button>
            </div>
            <div className="customer-chat__contact">
              <div className="customer-chat__avatar">
                <img src="/assets/img/profiles/avatar-02.jpg" alt="Request" />
                <span className="customer-chat__status-dot" />
              </div>
              <div className="customer-chat__contact-info">
                <h6>Request {id}</h6>
                <span>{request?.leadDisplayId || request?.leadId}</span>
              </div>
              <div className="customer-chat__contact-state">Active</div>
            </div>
          </aside>

          <section className="customer-chat__panel">
            <div className="customer-chat__panel-header">
              <div className="customer-chat__panel-title">
                <div className="customer-chat__avatar customer-chat__avatar--lg">
                  <img src="/assets/img/profiles/avatar-02.jpg" alt="Request" />
                  <span className="customer-chat__status-dot" />
                </div>
                <div>
                  <h5>Stock Request Chat</h5>
                  <p>Request {id}</p>
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
                    const messageText = (parsedChoice.text || parsedReply.text);
                    const authorName = item.senderUserName || item.senderUserId;
                    return (
                      <div
                        key={item.id || `${item.message}-${item.createdAt}`}
                        className={`customer-msg ${isMine ? "customer-msg--mine" : "customer-msg--theirs"}`}
                      >
                        <div className="customer-msg__bubble">
                          <div className="small text-muted">
                            {authorName}
                          </div>
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
              <div className="customer-chat__composer" style={{ opacity: 1, pointerEvents: "auto" }}>
                <textarea
                  className="form-control mb-2"
                  rows={3}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type your message..."
                />
                <input
                  type="file"
                  className="form-control mb-2"
                  onChange={(e) => setFile(e.target.files[0] || null)}
                />
                <button
                  className="btn btn-primary"
                  onClick={postMessage}
                  disabled={sending}
                >
                  {sending ? "Sending…" : "Send"}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
