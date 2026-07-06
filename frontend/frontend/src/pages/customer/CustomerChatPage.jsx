import React, { useEffect, useState, useRef } from "react";
import { useToast } from "../../components/system/ToastProvider";
import { useAuth } from "../../context/AuthContext";
import {
  getCustomerChatMessages,
  sendCustomerChatMessage,
  sendCustomerChatAttachment,
  downloadCustomerChatAttachment
} from "../../api/customerChatApi";

export default function CustomerChatPage() {
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [typedMessage, setTypedMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const messageEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const data = await getCustomerChatMessages();
      setMessages(data);
    } catch (e) {
      console.debug("Failed to fetch customer chat messages:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!typedMessage.trim() && !selectedFile) return;

    setSubmitting(true);
    try {
      if (selectedFile) {
        await sendCustomerChatAttachment({
          message: typedMessage.trim(),
          file: selectedFile
        });
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        await sendCustomerChatMessage(typedMessage.trim());
      }
      setTypedMessage("");
      fetchMessages();
    } catch (err) {
      showError("Failed to send message.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (msgId, fileName) => {
    try {
      const blob = await downloadCustomerChatAttachment(msgId);
      if (!blob) return;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "attachment";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showError("Failed to download attachment.");
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="card shadow-sm border-0 m-4" style={{ borderRadius: 16, height: "calc(100vh - 140px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Chat Header */}
      <div className="card-header bg-white border-0 py-3 px-4 d-flex align-items-center justify-content-between" style={{ borderBottom: "1px solid #f1f5f9" }}>
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle" style={{ width: 44, height: 44 }}>
            <i className="ti ti-headset" style={{ fontSize: "1.3rem" }} />
          </div>
          <div>
            <h5 className="mb-0 fw-bold text-dark">Support Chat</h5>
            <span className="small text-success d-flex align-items-center gap-1">
              <span className="bg-success rounded-circle d-inline-block" style={{ width: 6, height: 6 }} />
              Direct Support Agent Connected
            </span>
          </div>
        </div>
      </div>

      {/* Messages Body */}
      <div className="card-body p-4 bg-light flex-grow-1" style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
        {loading && messages.length === 0 ? (
          <div className="text-center py-5 text-muted">Loading chat history...</div>
        ) : messages.length === 0 ? (
          <div className="text-center my-auto text-muted">
            <i className="ti ti-message-2" style={{ fontSize: "3rem" }} />
            <h6 className="mt-3 fw-semibold">No messages yet</h6>
            <p className="small mb-0">Send a message below to start a conversation with our support team.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderRole?.toUpperCase() === "CUSTOMER";
            return (
              <div
                key={msg.messageId || msg.id}
                className={`d-flex flex-column ${isMe ? "align-items-end" : "align-items-start"}`}
              >
                <div className="small text-muted mb-1 px-2" style={{ fontSize: "0.75rem" }}>
                  {msg.senderName || msg.senderUsername || (isMe ? "You" : "Support")}
                </div>
                <div
                  className={`p-3 rounded-4 shadow-sm text-wrap`}
                  style={{
                    maxWidth: "75%",
                    backgroundColor: isMe ? "#3b82f6" : "#ffffff",
                    color: isMe ? "#ffffff" : "#1e293b",
                    borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  }}
                >
                  {msg.message && <p className="mb-0" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{msg.message}</p>}
                  
                  {msg.fileName && (
                    <div className={`d-flex align-items-center gap-2 mt-2 pt-2 border-top ${isMe ? "border-white-50" : "border-light"}`}>
                      <i className="ti ti-paperclip" />
                      <span className="small text-truncate" style={{ maxWidth: 180 }}>{msg.fileName}</span>
                      <button
                        type="button"
                        className={`btn btn-sm ${isMe ? "btn-light text-primary" : "btn-primary"} px-2 py-1`}
                        onClick={() => handleDownload(msg.messageId || msg.id, msg.fileName)}
                        style={{ fontSize: "0.75rem" }}
                      >
                        Download
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-muted px-2 mt-1" style={{ fontSize: "0.7rem" }}>
                  {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                </div>
              </div>
            );
          })
        )}
        <div ref={messageEndRef} />
      </div>

      {/* Selected File Indicator */}
      {selectedFile && (
        <div className="px-4 py-2 bg-light border-top d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2 small text-muted">
            <i className="ti ti-file" />
            <span>Selected File: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
          </div>
          <button
            type="button"
            className="btn-close"
            style={{ fontSize: "0.75rem" }}
            onClick={() => {
              setSelectedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          />
        </div>
      )}

      {/* Input Box Footer */}
      <div className="card-footer bg-white border-0 py-3 px-4" style={{ borderTop: "1px solid #f1f5f9" }}>
        <form onSubmit={handleSend} className="d-flex align-items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <button
            type="button"
            className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
            style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0 }}
            onClick={() => fileInputRef.current?.click()}
            title="Attach file"
          >
            <i className="ti ti-paperclip" style={{ fontSize: "1.1rem" }} />
          </button>
          
          <input
            type="text"
            className="form-control rounded-pill px-4 border-light"
            style={{ backgroundColor: "#f8fafc", height: 44 }}
            placeholder="Type your message here..."
            value={typedMessage}
            onChange={(e) => setTypedMessage(e.target.value)}
            disabled={submitting}
          />
          
          <button
            type="submit"
            className="btn btn-primary d-flex align-items-center justify-content-center"
            style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0 }}
            disabled={submitting || (!typedMessage.trim() && !selectedFile)}
          >
            {submitting ? (
              <span className="spinner-border spinner-border-sm" />
            ) : (
              <i className="ti ti-send" style={{ fontSize: "1.1rem" }} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
