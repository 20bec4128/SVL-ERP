import React, { useEffect, useState, useRef, useMemo } from "react";
import { useToast } from "../../components/system/ToastProvider";
import { useAuth } from "../../context/AuthContext";
import {
  getChatUsers,
  getChatRooms,
  createChatRoom,
  getChatMessages,
  sendChatMessage,
  pinChatRoom,
  muteChatRoom,
  archiveChatRoom,
  blockUser
} from "../../api/chatApi";

const EMOJI_LIST = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", 
  "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", 
  "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", 
  "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", 
  "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", 
  "👍", "👎", "✊", "👊", "👏", "🙌", "🙏", "👋", "❤️", "🔥"
];

export default function ChatPage() {
  const { showSuccess, showError } = useToast();
  const { user: currentUser } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typedMessage, setTypedMessage] = useState("");
  
  // Sidebar view: "active" or "archived"
  const [sidebarFilter, setSidebarFilter] = useState("active");

  // Search state
  const [userSearch, setUserSearch] = useState("");
  const [msgSearch, setMsgSearch] = useState("");
  const [showMsgSearchInput, setShowMsgSearchInput] = useState(false);

  // Emojis state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messageEndRef = useRef(null);

  // Load user directory and rooms list
  const loadInitialData = async () => {
    try {
      const [usrList, rmList] = await Promise.all([getChatUsers(), getChatRooms()]);
      setUsers(usrList);
      setRooms(rmList);
    } catch (e) {
      showError("Failed to initialize chat");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Poll messages and rooms
  useEffect(() => {
    if (!activeRoom) {
      const pollRooms = setInterval(async () => {
        try {
          const rmList = await getChatRooms();
          setRooms(rmList);
        } catch {}
      }, 5000);
      return () => clearInterval(pollRooms);
    }

    let active = true;
    const fetchMsgs = async () => {
      try {
        const [data, rmList] = await Promise.all([
          getChatMessages(activeRoom.id),
          getChatRooms()
        ]);
        if (!active) return;
        setMessages(data);
        setRooms(rmList);
      } catch (e) {
        console.debug("Failed to poll chat messages:", e);
      }
    };

    fetchMsgs();
    const interval = setInterval(fetchMsgs, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [activeRoom]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStartChat = async (user) => {
    setLoadingMessages(true);
    try {
      const payload = {
        name: `${currentUser?.username}-${user.username}`,
        isGroup: false,
        memberUserIds: [user.id],
      };
      const room = await createChatRoom(payload);
      if (room) {
        const latestRooms = await getChatRooms();
        setRooms(latestRooms);
        const resolvedRoom = latestRooms.find(r => r.id === room.id) || room;
        setActiveRoom(resolvedRoom);
        setMessages([]);
      }
    } catch (e) {
      showError("Failed to initiate chat conversation");
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!typedMessage.trim() || !activeRoom) return;

    try {
      const payload = { message: typedMessage.trim() };
      const created = await sendChatMessage(activeRoom.id, payload);
      if (created) {
        setMessages((prev) => [...prev, created]);
        setTypedMessage("");
        setShowEmojiPicker(false);
      }
    } catch (e) {
      showError("Failed to send message");
    }
  };

  // Chat Actions
  const handleTogglePin = async (roomId, e) => {
    e.stopPropagation();
    try {
      const res = await pinChatRoom(roomId);
      setRooms(rooms.map(r => r.id === roomId ? { ...r, isPinned: res.isPinned } : r));
      if (activeRoom && activeRoom.id === roomId) {
        setActiveRoom({ ...activeRoom, isPinned: res.isPinned });
      }
      showSuccess(res.isPinned ? "Chat pinned" : "Chat unpinned");
    } catch {
      showError("Failed to toggle pin");
    }
  };

  const handleToggleMute = async (roomId, e) => {
    e.stopPropagation();
    try {
      const res = await muteChatRoom(roomId);
      setRooms(rooms.map(r => r.id === roomId ? { ...r, isMuted: res.isMuted } : r));
      if (activeRoom && activeRoom.id === roomId) {
        setActiveRoom({ ...activeRoom, isMuted: res.isMuted });
      }
      showSuccess(res.isMuted ? "Chat muted" : "Chat unmuted");
    } catch {
      showError("Failed to toggle mute");
    }
  };

  const handleToggleArchive = async (roomId, e) => {
    e.stopPropagation();
    try {
      const res = await archiveChatRoom(roomId);
      setRooms(rooms.map(r => r.id === roomId ? { ...r, isArchived: res.isArchived } : r));
      if (activeRoom && activeRoom.id === roomId) {
        setActiveRoom(null); // Clear active chat room if archived
      }
      showSuccess(res.isArchived ? "Chat archived" : "Chat unarchived");
    } catch {
      showError("Failed to toggle archive");
    }
  };

  const handleBlockUser = async () => {
    if (!activeRoom || activeRoom.isGroup) return;
    
    // Find other member user id in the DM
    const otherId = activeRoom.memberUserIds.find(id => id !== currentUser?.id);
    if (!otherId) return;

    if (!window.confirm("Are you sure you want to block this user?")) return;
    
    try {
      await blockUser(otherId);
      showSuccess("User blocked successfully");
      setActiveRoom(null);
      loadInitialData(); // Reload directory
    } catch {
      showError("Failed to block user");
    }
  };

  // Add emoji to message input
  const addEmoji = (emoji) => {
    setTypedMessage((prev) => prev + emoji);
  };

  // Filter users by search
  const filteredUsers = useMemo(() => {
    return users.filter(u =>
      (u.firstName || "").toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.lastName || "").toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [users, userSearch]);

  // Filter messages by search
  const filteredMessages = useMemo(() => {
    if (!msgSearch.trim()) return messages;
    return messages.filter(m => m.message.toLowerCase().includes(msgSearch.toLowerCase()));
  }, [messages, msgSearch]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups = {};
    filteredMessages.forEach((msg) => {
      const dateStr = new Date(msg.createdAt).toLocaleDateString([], {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(msg);
    });
    return groups;
  }, [filteredMessages]);

  // Filter & Sort rooms in Sidebar (Pinned first, excluding archived based on active filter)
  const sortedRooms = useMemo(() => {
    const isArchiveFilter = sidebarFilter === "archived";
    const filtered = rooms.filter(r => isArchiveFilter ? r.isArchived : !r.isArchived);
    return [...filtered].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.latestMessageTime || 0) - new Date(a.latestMessageTime || 0);
    });
  }, [rooms, sidebarFilter]);

  return (
    <div className="content p-0" style={{ height: "calc(100vh - 100px)", overflow: "hidden" }}>
      <div className="d-flex h-100 bg-white">
        
        {/* Sidebar Panel */}
        <div className="border-end d-flex flex-column" style={{ width: "320px", minWidth: "300px" }}>
          
          {/* Header */}
          <div className="p-3 border-bottom bg-light">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="mb-0 fw-bold text-dark">Direct Messages</h5>
              <select 
                className="form-select form-select-sm w-auto animate-focus"
                value={sidebarFilter}
                onChange={(e) => setSidebarFilter(e.target.value)}
                style={{ height: 30, fontSize: "0.8rem" }}
              >
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0">
                <i className="ti ti-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0 animate-focus"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Directory Listings */}
          <div className="flex-grow-1 overflow-auto">
            {loading ? (
              <div className="text-center py-5 small text-muted">Loading conversations...</div>
            ) : (
              <>
                {/* Active Chat Rooms */}
                {sortedRooms.length > 0 && (
                  <div className="p-2 border-bottom">
                    <span className="text-muted small fw-semibold px-2 py-1 d-block mb-1">
                      {sidebarFilter === "archived" ? "ARCHIVED CHATS" : "RECENT CHATS"}
                    </span>
                    {sortedRooms.map((room) => {
                      const isActive = activeRoom?.id === room.id;
                      return (
                        <button
                          key={room.id}
                          type="button"
                          className={`btn w-100 text-start px-3 py-2 rounded mb-1 d-flex align-items-center justify-content-between border-0 ${isActive ? "bg-primary text-white" : "hover-bg-light text-dark"}`}
                          onClick={() => setActiveRoom(room)}
                          style={{ fontSize: "0.95rem" }}
                        >
                          <div className="d-flex align-items-center gap-2 text-truncate flex-grow-1">
                            <i className={`ti ti-message-2 ${isActive ? "text-white" : "text-primary"}`}></i>
                            <span className="text-truncate flex-grow-1">{room.name || "Chat Room"}</span>
                          </div>
                          
                          <div className="d-flex align-items-center gap-1 ms-2">
                            {room.isPinned && <i className="ti ti-pin fs-6"></i>}
                            {room.isMuted && <i className="ti ti-bell-off fs-6 opacity-75"></i>}
                            {room.unreadCount > 0 && (
                              <span className="badge bg-danger rounded-pill px-2 py-1" style={{ fontSize: "0.7rem" }}>
                                {room.unreadCount}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* User Directory */}
                {sidebarFilter === "active" && (
                  <div className="p-2">
                    <span className="text-muted small fw-semibold px-2 py-1 d-block mb-1">ALL USERS</span>
                    {filteredUsers.length === 0 ? (
                      <div className="text-center py-4 small text-muted">No users found</div>
                    ) : (
                      filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          className="btn w-100 text-start px-3 py-2 rounded mb-1 d-flex align-items-center gap-2 border-0 text-dark hover-bg-light"
                          onClick={() => handleStartChat(user)}
                          style={{ fontSize: "0.95rem" }}
                        >
                          <span className="avatar avatar-xs rounded-circle bg-info-subtle text-info d-flex align-items-center justify-content-center fw-bold" style={{ width: 28, height: 28, fontSize: "0.75rem" }}>
                            {user.firstName ? user.firstName[0].toUpperCase() : user.username[0].toUpperCase()}
                          </span>
                          <div className="flex-grow-1 text-truncate">
                            <div className="fw-medium text-truncate">{user.firstName ? `${user.firstName} ${user.lastName || ""}` : user.username}</div>
                            <div className="text-muted small text-truncate" style={{ fontSize: "0.75rem" }}>{user.role}</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Chat Window Panel */}
        <div className="flex-grow-1 d-flex flex-column bg-light">
          {activeRoom ? (
            <>
              {/* Header */}
              <div className="p-3 border-bottom bg-white d-flex align-items-center justify-content-between shadow-sm">
                <div>
                  <h6 className="mb-0 fw-bold text-dark">{activeRoom.name || "Conversation"}</h6>
                  <span className="text-muted small" style={{ fontSize: "0.8rem" }}>Direct Messaging Room</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {showMsgSearchInput && (
                    <input
                      type="text"
                      className="form-control form-control-sm animate-focus"
                      placeholder="Search messages..."
                      style={{ width: "160px" }}
                      value={msgSearch}
                      onChange={(e) => setMsgSearch(e.target.value)}
                    />
                  )}
                  <button
                    type="button"
                    className={`btn btn-sm btn-icon ${showMsgSearchInput ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => {
                      setShowMsgSearchInput(!showMsgSearchInput);
                      if (showMsgSearchInput) setMsgSearch("");
                    }}
                    title="Search Messages"
                  >
                    <i className="ti ti-search"></i>
                  </button>
                  
                  {/* Actions Popover / Buttons */}
                  <div className="btn-group">
                    <button
                      type="button"
                      className={`btn btn-sm btn-outline-secondary ${activeRoom.isPinned ? "active" : ""}`}
                      onClick={(e) => handleTogglePin(activeRoom.id, e)}
                      title="Pin Conversation"
                    >
                      <i className="ti ti-pin"></i>
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm btn-outline-secondary ${activeRoom.isMuted ? "active" : ""}`}
                      onClick={(e) => handleToggleMute(activeRoom.id, e)}
                      title="Mute Notifications"
                    >
                      <i className="ti ti-bell-off"></i>
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm btn-outline-secondary ${activeRoom.isArchived ? "active" : ""}`}
                      onClick={(e) => handleToggleArchive(activeRoom.id, e)}
                      title="Archive Chat"
                    >
                      <i className="ti ti-archive"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={handleBlockUser}
                      title="Block User"
                    >
                      <i className="ti ti-ban"></i>
                    </button>
                  </div>
                </div>
              </div>

              {/* Message Board */}
              <div className="flex-grow-1 p-4 overflow-auto d-flex flex-column gap-3" style={{ backgroundColor: "#f8fafc" }}>
                {loadingMessages ? (
                  <div className="text-center py-5 text-muted">Opening conversation...</div>
                ) : Object.keys(groupedMessages).length === 0 ? (
                  <div className="text-center my-auto py-5 text-muted">
                    <i className="ti ti-message-chatbot fs-1 mb-2 text-muted" style={{ opacity: 0.5 }}></i>
                    <p className="mb-0">Say Hello! Send your first message below.</p>
                  </div>
                ) : (
                  Object.keys(groupedMessages).map((dateStr) => (
                    <React.Fragment key={dateStr}>
                      {/* Date Separator */}
                      <div className="d-flex align-items-center justify-content-center my-3">
                        <div className="border-bottom w-25"></div>
                        <span className="mx-3 text-muted small fw-semibold bg-white px-3 py-1 rounded-pill border" style={{ fontSize: "0.75rem" }}>{dateStr}</span>
                        <div className="border-bottom w-25"></div>
                      </div>
                      
                      {groupedMessages[dateStr].map((msg) => {
                        const isOwn = msg.senderId === currentUser?.id;
                        return (
                          <div
                            key={msg.id}
                            className={`d-flex flex-column ${isOwn ? "align-items-end" : "align-items-start"}`}
                          >
                            <div
                              className={`px-3 py-2 rounded-3 shadow-sm text-wrap small`}
                              style={{
                                maxWidth: "70%",
                                backgroundColor: isOwn ? "#3b82f6" : "#ffffff",
                                color: isOwn ? "#ffffff" : "#1e293b",
                                borderBottomRightRadius: isOwn ? "0" : "8px",
                                borderBottomLeftRadius: isOwn ? "8px" : "0",
                              }}
                            >
                              {msg.message}
                            </div>
                            <span className="text-muted mt-1 px-1" style={{ fontSize: "0.65rem" }}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))
                )}
                <div ref={messageEndRef} />
              </div>

              {/* Send Form with Emoji Picker */}
              <div className="p-3 bg-white border-top shadow-sm position-relative">
                {showEmojiPicker && (
                  <div 
                    className="position-absolute shadow-lg border p-2 bg-white rounded-3 d-flex flex-wrap gap-1"
                    style={{ 
                      bottom: "75px", 
                      right: "20px", 
                      width: "260px", 
                      maxHeight: "150px", 
                      overflowY: "auto", 
                      zIndex: 1000 
                    }}
                  >
                    {EMOJI_LIST.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className="btn btn-link p-1 fs-5 border-0 hover-bg-light"
                        onClick={() => addEmoji(emoji)}
                        style={{ width: "36px", height: "36px", textDecoration: "none" }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="d-flex gap-2">
                  <button
                    type="button"
                    className={`btn ${showEmojiPicker ? "btn-primary" : "btn-outline-secondary"} d-flex align-items-center justify-content-center`}
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    style={{ width: "42px", height: "42px", padding: 0 }}
                    title="Insert Emoji"
                  >
                    <i className="ti ti-mood-smile fs-4"></i>
                  </button>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type message here..."
                    value={typedMessage}
                    onChange={(e) => setTypedMessage(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn-primary px-4 d-flex align-items-center gap-1" style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6" }}>
                    <i className="ti ti-brand-telegram fs-5"></i>
                    Send
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
              <i className="ti ti-messages fs-1 mb-3 text-muted" style={{ opacity: 0.4 }}></i>
              <h5 className="fw-semibold text-dark">No Conversation Selected</h5>
              <p className="mb-0 small text-center" style={{ maxWidth: 300 }}>Select a user from the directory sidebar to start messaging.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
