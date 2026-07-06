import React, { useEffect, useState, useMemo } from "react";
import { useToast } from "../../components/system/ToastProvider";
import { getTodos, createTodo, updateTodo, deleteTodo } from "../../api/todoApi";

export default function TodoPage() {
  const { showSuccess, showError } = useToast();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");

  // Form states for new task
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newDueDate, setNewDueDate] = useState("");

  const loadTodos = async () => {
    setLoading(true);
    try {
      const data = await getTodos();
      setTodos(data);
    } catch (e) {
      showError("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodos();
  }, []);

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showError("Task title is required");
      return;
    }
    try {
      const payload = {
        title: newTitle.trim(),
        priority: newPriority,
        dueDate: newDueDate ? new Date(newDueDate).toISOString() : null,
        isCompleted: false,
      };
      const created = await createTodo(payload);
      if (created) {
        setTodos((prev) => [created, ...prev]);
        setNewTitle("");
        setNewPriority("medium");
        setNewDueDate("");
        showSuccess("Task added successfully");
        // Close modal manually if bootstrap modal is used
        const modalEl = document.getElementById("add_todo");
        if (modalEl) {
          const closeBtn = modalEl.querySelector('[data-bs-dismiss="modal"]');
          if (closeBtn) closeBtn.click();
        }
      }
    } catch (e) {
      showError("Failed to add task");
    }
  };

  const handleToggleComplete = async (todo) => {
    try {
      const updated = await updateTodo(todo.id, {
        isCompleted: !todo.isCompleted,
      });
      if (updated) {
        setTodos((prev) =>
          prev.map((t) => (t.id === todo.id ? { ...t, isCompleted: updated.isCompleted } : t))
        );
        showSuccess(updated.isCompleted ? "Task marked completed" : "Task marked active");
      }
    } catch (e) {
      showError("Failed to update task");
    }
  };

  const handleDeleteTodo = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
      showSuccess("Task deleted successfully");
    } catch (e) {
      showError("Failed to delete task");
    }
  };

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.isCompleted).length;
    const pending = total - completed;
    return { total, completed, pending };
  }, [todos]);

  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority =
        priorityFilter === "All" ||
        todo.priority?.toLowerCase() === priorityFilter.toLowerCase();
      return matchesSearch && matchesPriority;
    });
  }, [todos, searchTerm, priorityFilter]);

  const getPriorityBadgeClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "badge bg-danger";
      case "medium":
        return "badge bg-warning text-dark";
      case "low":
        return "badge bg-info";
      default:
        return "badge bg-secondary";
    }
  };

  return (
    <div className="content">
      {/* Page Header */}
      <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Todo</h2>
            <nav className="mb-0">
              <ol className="breadcrumb mb-0" style={{ fontSize: "0.9rem" }}>
                <li className="breadcrumb-item">
                  <a href="/admin-dashboard" style={{ color: "#64748b", textDecoration: "none" }}>
                    <i className="ti ti-smart-home"></i>
                  </a>
                </li>
                <li className="breadcrumb-item" style={{ color: "#64748b" }}>Application</li>
                <li className="breadcrumb-item active" style={{ color: "#0f172a", fontWeight: "500" }}>Todo</li>
              </ol>
            </nav>
          </div>

          <div className="d-flex align-items-center gap-2">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <i className="ti ti-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0 animate-focus"
                style={{ borderRadius: "0 8px 8px 0", height: 42, maxWidth: 220 }}
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn btn-primary d-flex align-items-center gap-2"
              data-bs-toggle="modal"
              data-bs-target="#add_todo"
              style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px", height: 42, whiteSpace: "nowrap" }}
            >
              <i className="ti ti-plus" style={{ fontSize: "1.1rem" }}></i>
              New Task
            </button>
          </div>
        </div>
      </div>

      {/* Summary Statistics Card */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
        <div className="card-body p-4">
          <div className="row gy-3 text-center text-sm-start">
            <div className="col-sm-4 border-end">
              <div className="p-2">
                <span className="text-muted small fw-semibold">TOTAL TASKS</span>
                <h3 className="mb-0 fw-bold mt-1 text-dark">{stats.total}</h3>
              </div>
            </div>
            <div className="col-sm-4 border-end">
              <div className="p-2">
                <span className="text-muted small fw-semibold">PENDING</span>
                <h3 className="mb-0 fw-bold mt-1 text-warning">{stats.pending}</h3>
              </div>
            </div>
            <div className="col-sm-4">
              <div className="p-2">
                <span className="text-muted small fw-semibold">COMPLETED</span>
                <h3 className="mb-0 fw-bold mt-1 text-success">{stats.completed}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Todo Dashboard */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="card-header bg-white border-bottom p-3">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <span className="fw-semibold text-dark">Priority Filter:</span>
              <div className="btn-group" role="group">
                {["All", "High", "Medium", "Low"].map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    className={`btn btn-sm ${priorityFilter === filter ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => setPriorityFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">Loading tasks...</div>
          ) : filteredTodos.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="ti ti-checklist fs-1 mb-2 text-muted" style={{ opacity: 0.5 }}></i>
              <p className="mb-0">No tasks found</p>
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {filteredTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="list-group-item d-flex align-items-center justify-content-between p-3 border-bottom"
                  style={{ backgroundColor: todo.isCompleted ? "#f8fafc" : "#fff" }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={todo.isCompleted}
                      onChange={() => handleToggleComplete(todo)}
                      style={{ cursor: "pointer", width: "20px", height: "20px" }}
                    />
                    <div>
                      <span
                        className={`fw-medium text-dark ${todo.isCompleted ? "text-decoration-line-through text-muted" : ""}`}
                        style={{ fontSize: "1rem" }}
                      >
                        {todo.title}
                      </span>
                      <div className="d-flex align-items-center gap-2 mt-1">
                        <span className={getPriorityBadgeClass(todo.priority)}>
                          {todo.priority}
                        </span>
                        {todo.dueDate && (
                          <span className="text-muted small">
                            <i className="ti ti-calendar me-1"></i>
                            {new Date(todo.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: "32px", height: "32px", padding: 0 }}
                    onClick={() => handleDeleteTodo(todo.id)}
                  >
                    <i className="ti ti-trash"></i>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Todo Modal */}
      <div className="modal fade" id="add_todo" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={{ borderRadius: 12 }}>
            <div className="modal-header border-bottom">
              <h5 className="modal-title fw-bold text-dark">Add New Task</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form onSubmit={handleAddTodo}>
              <div className="modal-body p-4">
                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark">Task Title</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter task name"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold text-dark">Priority</label>
                    <select
                      className="form-select"
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value)}
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold text-dark">Due Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top">
                <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6" }}>Add Task</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
