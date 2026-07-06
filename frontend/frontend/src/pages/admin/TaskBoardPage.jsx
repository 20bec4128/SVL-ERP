import React, { useEffect, useState, useMemo } from "react";
import { useToast } from "../../components/system/ToastProvider";
import { getTodos, createTodo, updateTodo, deleteTodo } from "../../api/todoApi";

const PRIORITY_CONFIG = {
  high: { label: "High", color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "#fca5a5" },
  medium: { label: "Medium", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "#fcd34d" },
  low: { label: "Low", color: "#22c55e", bg: "rgba(34,197,94,0.1)", border: "#86efac" },
};

const COLUMNS = [
  {
    key: "pending",
    label: "Pending",
    icon: "ti-clock",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    headerBg: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
    borderColor: "#fbbf24",
    check: (t) => !t.isCompleted,
  },
  {
    key: "completed",
    label: "Completed",
    icon: "ti-check-circle",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.08)",
    headerBg: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
    borderColor: "#4ade80",
    check: (t) => t.isCompleted,
  },
];

function isOverdue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function TaskModal({ show, onClose, onSave, editTask }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title || "");
      setPriority(editTask.priority || "medium");
      setDueDate(editTask.dueDate ? new Date(editTask.dueDate).toISOString().split("T")[0] : "");
    } else {
      setTitle("");
      setPriority("medium");
      setDueDate("");
    }
  }, [editTask, show]);

  if (!show) return null;

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={{ borderRadius: 18, border: "none", boxShadow: "0 32px 80px rgba(0,0,0,0.25)" }}>
          <div className="modal-header border-0 pb-0 px-4 pt-4">
            <div>
              <h5 className="modal-title fw-bold text-dark mb-0">
                {editTask ? "✏️ Edit Task" : "➕ New Task"}
              </h5>
              <p className="text-muted small mb-0 mt-1">
                {editTask ? "Update task details below" : "Add a new task to your board"}
              </p>
            </div>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); onSave({ title: title.trim(), priority, dueDate }); }}>
            <div className="modal-body px-4 py-3">
              <div className="mb-3">
                <label className="form-label fw-semibold text-dark small">Task Title *</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ borderRadius: 10, border: "1.5px solid #e2e8f0", padding: "10px 14px" }}
                  placeholder="What needs to be done?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-dark small">Priority</label>
                  <select
                    className="form-select"
                    style={{ borderRadius: 10, border: "1.5px solid #e2e8f0", padding: "10px 14px" }}
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="high">🔴 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-dark small">Due Date</label>
                  <input
                    type="date"
                    className="form-control"
                    style={{ borderRadius: 10, border: "1.5px solid #e2e8f0", padding: "10px 14px" }}
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer border-0 px-4 pb-4 pt-0 gap-2">
              <button type="button" className="btn btn-outline-secondary px-4" style={{ borderRadius: 10 }} onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary px-4" style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", borderRadius: 10 }}>
                {editTask ? "Save Changes" : "Add Task"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const priCfg = PRIORITY_CONFIG[task.priority?.toLowerCase()] || PRIORITY_CONFIG.medium;
  const overdue = !task.isCompleted && isOverdue(task.dueDate);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        border: "1.5px solid #e2e8f0",
        padding: "16px",
        marginBottom: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        transition: "all 0.2s ease",
        opacity: task.isCompleted ? 0.75 : 1,
        cursor: "default",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {/* Card Top Row */}
      <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
        <span
          style={{
            fontWeight: 600,
            fontSize: "0.9rem",
            color: task.isCompleted ? "#94a3b8" : "#0f172a",
            textDecoration: task.isCompleted ? "line-through" : "none",
            lineHeight: 1.4,
            flex: 1,
          }}
        >
          {task.title}
        </span>
        <div className="d-flex gap-1 flex-shrink-0">
          <button
            type="button"
            title="Edit"
            onClick={() => onEdit(task)}
            style={{ width: 28, height: 28, padding: 0, border: "1px solid #e2e8f0", borderRadius: 7, background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <i className="ti ti-edit" style={{ fontSize: "0.8rem", color: "#3b82f6" }} />
          </button>
          <button
            type="button"
            title="Delete"
            onClick={() => onDelete(task.id)}
            style={{ width: 28, height: 28, padding: 0, border: "1px solid #fee2e2", borderRadius: 7, background: "#fef2f2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <i className="ti ti-trash" style={{ fontSize: "0.8rem", color: "#ef4444" }} />
          </button>
        </div>
      </div>

      {/* Badges Row */}
      <div className="d-flex align-items-center gap-2 flex-wrap">
        {/* Priority */}
        <span
          style={{
            background: priCfg.bg,
            color: priCfg.color,
            border: `1px solid ${priCfg.border}`,
            padding: "2px 9px",
            borderRadius: 20,
            fontSize: "0.7rem",
            fontWeight: 600,
          }}
        >
          {priCfg.label}
        </span>

        {/* Due Date */}
        {task.dueDate && (
          <span
            style={{
              color: overdue ? "#ef4444" : "#64748b",
              fontSize: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <i className={`ti ${overdue ? "ti-alarm" : "ti-calendar"}`} style={{ fontSize: "0.7rem" }} />
            {new Date(task.dueDate).toLocaleDateString("en-GB")}
            {overdue && (
              <span style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid #fca5a5", padding: "1px 6px", borderRadius: 8, fontSize: "0.65rem", fontWeight: 600 }}>
                Overdue
              </span>
            )}
          </span>
        )}
      </div>

      {/* Move Button */}
      <div className="mt-3 pt-2" style={{ borderTop: "1px dashed #e2e8f0" }}>
        <button
          type="button"
          onClick={() => onToggle(task)}
          style={{
            width: "100%",
            background: task.isCompleted ? "rgba(245,158,11,0.08)" : "rgba(34,197,94,0.08)",
            border: `1px solid ${task.isCompleted ? "#fcd34d" : "#86efac"}`,
            color: task.isCompleted ? "#92400e" : "#166534",
            borderRadius: 10,
            padding: "5px 0",
            fontSize: "0.78rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            transition: "all 0.2s",
          }}
        >
          <i className={`ti ${task.isCompleted ? "ti-rotate-counterclockwise" : "ti-check"}`} style={{ fontSize: "0.85rem" }} />
          {task.isCompleted ? "Move to Pending" : "Mark Completed"}
        </button>
      </div>
    </div>
  );
}

export default function TaskBoardPage() {
  const { showSuccess, showError } = useToast();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);

  const loadTodos = async () => {
    setLoading(true);
    try {
      const data = await getTodos();
      setTodos(data);
    } catch {
      showError("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTodos(); }, []);

  const handleSave = async ({ title, priority, dueDate }) => {
    if (!title) { showError("Task title is required"); return; }
    try {
      const payload = {
        title,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        isCompleted: editTask?.isCompleted || false,
      };
      if (editTask) {
        const updated = await updateTodo(editTask.id, payload);
        if (updated) {
          setTodos((prev) => prev.map((t) => (t.id === editTask.id ? updated : t)));
          showSuccess("Task updated");
        }
      } else {
        const created = await createTodo(payload);
        if (created) {
          setTodos((prev) => [created, ...prev]);
          showSuccess("Task added");
        }
      }
      setShowModal(false);
      setEditTask(null);
    } catch {
      showError(editTask ? "Failed to update task" : "Failed to add task");
    }
  };

  const handleToggle = async (task) => {
    try {
      const updated = await updateTodo(task.id, { isCompleted: !task.isCompleted });
      if (updated) {
        setTodos((prev) => prev.map((t) => (t.id === task.id ? { ...t, isCompleted: updated.isCompleted } : t)));
        showSuccess(updated.isCompleted ? "Moved to Completed ✓" : "Moved to Pending");
      }
    } catch {
      showError("Failed to update task");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
      showSuccess("Task deleted");
    } catch {
      showError("Failed to delete task");
    }
  };

  const handleEdit = (task) => { setEditTask(task); setShowModal(true); };
  const handleAdd = () => { setEditTask(null); setShowModal(true); };

  const filteredTodos = useMemo(() => {
    return todos.filter((t) => {
      const matchSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPriority = priorityFilter === "all" || t.priority?.toLowerCase() === priorityFilter;
      return matchSearch && matchPriority;
    });
  }, [todos, searchTerm, priorityFilter]);

  const stats = useMemo(() => ({
    total: todos.length,
    pending: todos.filter((t) => !t.isCompleted).length,
    completed: todos.filter((t) => t.isCompleted).length,
  }), [todos]);

  return (
    <div className="content">
      {/* Header */}
      <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>
              Task Board
            </h2>
            <nav>
              <ol className="breadcrumb mb-0" style={{ fontSize: "0.9rem" }}>
                <li className="breadcrumb-item">
                  <a href="/admin-dashboard" style={{ color: "#64748b", textDecoration: "none" }}>
                    <i className="ti ti-smart-home" />
                  </a>
                </li>
                <li className="breadcrumb-item" style={{ color: "#64748b" }}>Application</li>
                <li className="breadcrumb-item active" style={{ color: "#0f172a", fontWeight: "500" }}>Task Board</li>
              </ol>
            </nav>
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* Priority Filter */}
            <div className="d-flex gap-1">
              {["all", "high", "medium", "low"].map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`btn btn-sm ${priorityFilter === p ? "btn-dark" : "btn-outline-secondary"}`}
                  style={{ borderRadius: 8, fontSize: "0.8rem", height: 36, textTransform: "capitalize" }}
                  onClick={() => setPriorityFilter(p)}
                >
                  {p === "all" ? "All Priority" : p}
                </button>
              ))}
            </div>
            <div className="input-group" style={{ maxWidth: 220 }}>
              <span className="input-group-text bg-white border-end-0">
                <i className="ti ti-search text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                style={{ height: 42, borderRadius: "0 8px 8px 0" }}
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn btn-primary d-flex align-items-center gap-2"
              onClick={handleAdd}
              style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px", height: 42, whiteSpace: "nowrap" }}
            >
              <i className="ti ti-plus" style={{ fontSize: "1.1rem" }} />
              New Task
            </button>
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
        {[
          { label: "Total", value: stats.total, color: "#3b82f6" },
          { label: "Pending", value: stats.pending, color: "#f59e0b" },
          { label: "Completed", value: stats.completed, color: "#22c55e" },
        ].map((s) => (
          <div key={s.label} className="d-flex align-items-center gap-2">
            <span className="fw-bold" style={{ color: s.color, fontSize: "1.1rem" }}>{s.value}</span>
            <span className="text-muted small">{s.label}</span>
            {s.label !== "Completed" && <span className="text-muted">·</span>}
          </div>
        ))}
      </div>

      {/* Board Columns */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" style={{ width: 40, height: 40 }} />
          <p className="text-muted mt-3">Loading tasks...</p>
        </div>
      ) : (
        <div className="row g-4">
          {COLUMNS.map((col) => {
            const colTasks = filteredTodos.filter(col.check);
            return (
              <div key={col.key} className="col-md-6">
                {/* Column Header */}
                <div
                  style={{
                    background: col.headerBg,
                    border: `1.5px solid ${col.borderColor}`,
                    borderRadius: "14px 14px 0 0",
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: col.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `1.5px solid ${col.borderColor}`,
                      }}
                    >
                      <i className={`ti ${col.icon}`} style={{ fontSize: "1.1rem", color: col.color }} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: "1rem", color: "#0f172a" }}>
                      {col.label}
                    </span>
                  </div>
                  <span
                    style={{
                      background: col.color,
                      color: "#fff",
                      borderRadius: 20,
                      padding: "2px 12px",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                    }}
                  >
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Body */}
                <div
                  style={{
                    background: col.bg,
                    border: `1.5px solid ${col.borderColor}`,
                    borderTop: "none",
                    borderRadius: "0 0 14px 14px",
                    padding: "16px",
                    minHeight: 300,
                  }}
                >
                  {colTasks.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "40px 20px",
                        border: "2px dashed #e2e8f0",
                        borderRadius: 12,
                        background: "rgba(255,255,255,0.5)",
                      }}
                    >
                      <i className={`ti ${col.icon} text-muted`} style={{ fontSize: "2.5rem", opacity: 0.3 }} />
                      <p className="text-muted mt-2 mb-0 small">No {col.label.toLowerCase()} tasks</p>
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggle={handleToggle}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TaskModal
        show={showModal}
        onClose={() => { setShowModal(false); setEditTask(null); }}
        onSave={handleSave}
        editTask={editTask}
      />
    </div>
  );
}
