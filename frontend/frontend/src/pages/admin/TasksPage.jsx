import React, { useEffect, useState, useMemo } from "react";
import { useToast } from "../../components/system/ToastProvider";
import { getTodos, createTodo, updateTodo, deleteTodo } from "../../api/todoApi";

const PRIORITY_CONFIG = {
  high: { label: "High", color: "#ef4444", bg: "rgba(239,68,68,0.1)", icon: "ti-urgent" },
  medium: { label: "Medium", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", icon: "ti-trending-up" },
  low: { label: "Low", color: "#22c55e", bg: "rgba(34,197,94,0.1)", icon: "ti-trending-down" },
};

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority?.toLowerCase()] || PRIORITY_CONFIG.medium;
  return (
    <span
      style={{
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.color}40`,
        padding: "2px 10px",
        borderRadius: 20,
        fontSize: "0.75rem",
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      <i className={`ti ${cfg.icon}`} style={{ fontSize: "0.7rem" }} />
      {cfg.label}
    </span>
  );
}

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
      setDueDate(
        editTask.dueDate
          ? new Date(editTask.dueDate).toISOString().split("T")[0]
          : ""
      );
    } else {
      setTitle("");
      setPriority("medium");
      setDueDate("");
    }
  }, [editTask, show]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ title: title.trim(), priority, dueDate });
  };

  if (!show) return null;

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={{ borderRadius: 16, border: "none", boxShadow: "0 25px 60px rgba(0,0,0,0.2)" }}>
          <div className="modal-header border-0 pb-0 px-4 pt-4">
            <div>
              <h5 className="modal-title fw-bold text-dark mb-0">
                {editTask ? "Edit Task" : "Add New Task"}
              </h5>
              <p className="text-muted small mb-0 mt-1">
                {editTask ? "Update task details below" : "Fill in the task details below"}
              </p>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body px-4 py-3">
              <div className="mb-3">
                <label className="form-label fw-semibold text-dark small">Task Title *</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ borderRadius: 10, border: "1.5px solid #e2e8f0", padding: "10px 14px" }}
                  placeholder="Enter task name..."
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
            <div className="modal-footer border-0 px-4 pb-4 pt-2 gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary px-4"
                style={{ borderRadius: 10 }}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary px-4"
                style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", borderRadius: 10 }}
              >
                {editTask ? "Update Task" : "Add Task"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { showSuccess, showError } = useToast();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
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

  useEffect(() => {
    loadTodos();
  }, []);

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
          showSuccess("Task updated successfully");
        }
      } else {
        const created = await createTodo(payload);
        if (created) {
          setTodos((prev) => [created, ...prev]);
          showSuccess("Task added successfully");
        }
      }
      setShowModal(false);
      setEditTask(null);
    } catch {
      showError(editTask ? "Failed to update task" : "Failed to add task");
    }
  };

  const handleToggleComplete = async (todo) => {
    try {
      const updated = await updateTodo(todo.id, { isCompleted: !todo.isCompleted });
      if (updated) {
        setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, isCompleted: updated.isCompleted } : t)));
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

  const handleEdit = (task) => {
    setEditTask(task);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditTask(null);
    setShowModal(true);
  };

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.isCompleted).length;
    const pending = total - completed;
    const overdue = todos.filter((t) => !t.isCompleted && isOverdue(t.dueDate)).length;
    return { total, completed, pending, overdue };
  }, [todos]);

  const filtered = useMemo(() => {
    return todos.filter((t) => {
      const matchSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPriority = priorityFilter === "all" || t.priority?.toLowerCase() === priorityFilter;
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "pending" && !t.isCompleted) ||
        (statusFilter === "completed" && t.isCompleted);
      return matchSearch && matchPriority && matchStatus;
    });
  }, [todos, searchTerm, priorityFilter, statusFilter]);

  const statsCards = [
    { label: "Total Tasks", value: stats.total, icon: "ti-checklist", color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
    { label: "Pending", value: stats.pending, icon: "ti-clock", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    { label: "Completed", value: stats.completed, icon: "ti-check-circle", color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
    { label: "Overdue", value: stats.overdue, icon: "ti-alarm", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  ];

  return (
    <div className="content">
      {/* Header */}
      <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>
              Tasks
            </h2>
            <nav className="mb-0">
              <ol className="breadcrumb mb-0" style={{ fontSize: "0.9rem" }}>
                <li className="breadcrumb-item">
                  <a href="/admin-dashboard" style={{ color: "#64748b", textDecoration: "none" }}>
                    <i className="ti ti-smart-home" />
                  </a>
                </li>
                <li className="breadcrumb-item" style={{ color: "#64748b" }}>Application</li>
                <li className="breadcrumb-item active" style={{ color: "#0f172a", fontWeight: "500" }}>Tasks</li>
              </ol>
            </nav>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="input-group" style={{ maxWidth: 240 }}>
              <span className="input-group-text bg-white border-end-0">
                <i className="ti ti-search text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                style={{ borderRadius: "0 8px 8px 0", height: 42 }}
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

      {/* Stats */}
      <div className="row g-3 mb-4">
        {statsCards.map((s) => (
          <div key={s.label} className="col-6 col-md-3">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14 }}>
              <div className="card-body d-flex align-items-center gap-3 p-3">
                <div
                  style={{ width: 52, height: 52, borderRadius: 14, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                >
                  <i className={`ti ${s.icon}`} style={{ fontSize: "1.5rem", color: s.color }} />
                </div>
                <div>
                  <div className="text-muted small fw-semibold" style={{ fontSize: "0.72rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    {s.label}
                  </div>
                  <div className="fw-bold" style={{ fontSize: "1.6rem", color: "#0f172a", lineHeight: 1.1 }}>
                    {s.value}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
        <div className="card-header bg-white border-0 p-4 pb-3" style={{ borderRadius: "14px 14px 0 0" }}>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <div className="d-flex align-items-center gap-1">
              {[
                { key: "all", label: "All" },
                { key: "pending", label: "Pending" },
                { key: "completed", label: "Completed" },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={`btn btn-sm ${statusFilter === f.key ? "btn-primary" : "btn-outline-secondary"}`}
                  style={{ borderRadius: 8, fontSize: "0.8rem" }}
                  onClick={() => setStatusFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="vr mx-1" />
            {/* Priority Filter */}
            <div className="d-flex align-items-center gap-1">
              {[
                { key: "all", label: "All Priority" },
                { key: "high", label: "High" },
                { key: "medium", label: "Medium" },
                { key: "low", label: "Low" },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={`btn btn-sm ${priorityFilter === f.key ? "btn-dark" : "btn-outline-secondary"}`}
                  style={{ borderRadius: 8, fontSize: "0.8rem" }}
                  onClick={() => setPriorityFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="ms-auto text-muted small">
              {filtered.length} task{filtered.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" style={{ width: 36, height: 36 }} />
              <p className="text-muted mt-3 mb-0">Loading tasks...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5">
              <i className="ti ti-checklist text-muted" style={{ fontSize: "3rem", opacity: 0.3 }} />
              <p className="text-muted mt-2 mb-0">No tasks found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ background: "#f8fafc" }}>
                  <tr>
                    <th style={{ color: "#64748b", fontWeight: 600, fontSize: "0.82rem", padding: "12px 20px", borderBottom: "1px solid #e2e8f0" }}>
                      TASK
                    </th>
                    <th style={{ color: "#64748b", fontWeight: 600, fontSize: "0.82rem", padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>
                      PRIORITY
                    </th>
                    <th style={{ color: "#64748b", fontWeight: 600, fontSize: "0.82rem", padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>
                      DUE DATE
                    </th>
                    <th style={{ color: "#64748b", fontWeight: 600, fontSize: "0.82rem", padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>
                      STATUS
                    </th>
                    <th style={{ color: "#64748b", fontWeight: 600, fontSize: "0.82rem", padding: "12px 20px", borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((task) => {
                    const overdue = !task.isCompleted && isOverdue(task.dueDate);
                    return (
                      <tr
                        key={task.id}
                        style={{
                          background: task.isCompleted ? "#f8fafc" : "#fff",
                          transition: "background 0.2s",
                        }}
                      >
                        <td style={{ padding: "14px 20px" }}>
                          <div className="d-flex align-items-center gap-3">
                            <div
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 6,
                                border: task.isCompleted ? "2px solid #22c55e" : "2px solid #cbd5e1",
                                background: task.isCompleted ? "#22c55e" : "transparent",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                transition: "all 0.2s",
                              }}
                              onClick={() => handleToggleComplete(task)}
                            >
                              {task.isCompleted && <i className="ti ti-check text-white" style={{ fontSize: "0.75rem" }} />}
                            </div>
                            <span
                              className="fw-medium"
                              style={{
                                color: task.isCompleted ? "#94a3b8" : "#0f172a",
                                textDecoration: task.isCompleted ? "line-through" : "none",
                                fontSize: "0.95rem",
                              }}
                            >
                              {task.title}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <PriorityBadge priority={task.priority} />
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          {task.dueDate ? (
                            <span
                              className="d-flex align-items-center gap-1"
                              style={{ color: overdue ? "#ef4444" : "#64748b", fontSize: "0.875rem" }}
                            >
                              <i className={`ti ${overdue ? "ti-alarm" : "ti-calendar"}`} />
                              {new Date(task.dueDate).toLocaleDateString("en-GB")}
                              {overdue && (
                                <span className="badge ms-1" style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid #fca5a5", fontSize: "0.65rem" }}>
                                  Overdue
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              background: task.isCompleted ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)",
                              color: task.isCompleted ? "#22c55e" : "#f59e0b",
                              border: `1px solid ${task.isCompleted ? "#22c55e" : "#f59e0b"}40`,
                              padding: "3px 12px",
                              borderRadius: 20,
                              fontSize: "0.75rem",
                              fontWeight: 600,
                            }}
                          >
                            {task.isCompleted ? "✓ Completed" : "⏳ Pending"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 20px", textAlign: "right" }}>
                          <div className="d-flex align-items-center justify-content-end gap-2">
                            <button
                              type="button"
                              className="btn btn-sm"
                              style={{ width: 32, height: 32, padding: 0, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc" }}
                              onClick={() => handleEdit(task)}
                              title="Edit"
                            >
                              <i className="ti ti-edit" style={{ color: "#3b82f6" }} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm"
                              style={{ width: 32, height: 32, padding: 0, borderRadius: 8, border: "1px solid #fee2e2", background: "#fef2f2" }}
                              onClick={() => handleDelete(task.id)}
                              title="Delete"
                            >
                              <i className="ti ti-trash" style={{ color: "#ef4444" }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Task Modal */}
      <TaskModal
        show={showModal}
        onClose={() => { setShowModal(false); setEditTask(null); }}
        onSave={handleSave}
        editTask={editTask}
      />
    </div>
  );
}
