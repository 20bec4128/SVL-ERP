import React, { useEffect, useState, useMemo } from "react";
import { useToast } from "../../components/system/ToastProvider";
import { getCalendarEvents, createCalendarEvent, deleteCalendarEvent } from "../../api/calendarApi";

export default function CalendarPage() {
  const { showSuccess, showError } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Form states for new event
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventClass, setEventClass] = useState("bg-primary-transparent text-primary");

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await getCalendarEvents();
      setEvents(data);
    } catch (e) {
      showError("Failed to load calendar events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDate) {
      showError("Title and Start Date are required");
      return;
    }
    try {
      const payload = {
        title: eventTitle.trim(),
        startDate: new Date(eventDate).toISOString(),
        endDate: eventEndDate ? new Date(eventEndDate).toISOString() : new Date(eventDate).toISOString(),
        allDay: true,
        eventClassName: eventClass,
      };
      const created = await createCalendarEvent(payload);
      if (created) {
        setEvents((prev) => [...prev, created]);
        setEventTitle("");
        setEventDate("");
        setEventEndDate("");
        showSuccess("Event created successfully");
        // Close modal
        const modalEl = document.getElementById("add_event");
        if (modalEl) {
          const closeBtn = modalEl.querySelector('[data-bs-dismiss="modal"]');
          if (closeBtn) closeBtn.click();
        }
      }
    } catch (e) {
      showError("Failed to create event");
    }
  };

  const handleDeleteEvent = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this event?")) return;
    try {
      await deleteCalendarEvent(id);
      setEvents((prev) => prev.filter((ev) => ev.id !== id));
      showSuccess("Event deleted");
    } catch (e) {
      showError("Failed to delete event");
    }
  };

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const calendarCells = useMemo(() => {
    const cells = [];
    // Previous month padding
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ day: null, dateStr: null });
    }
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push({ day, dateStr });
    }
    return cells;
  }, [year, month, daysInMonth, firstDayIndex]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((ev) => new Date(ev.startDate) >= now)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .slice(0, 5);
  }, [events]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <div className="content">
      {/* Page Header */}
      <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: 12 }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="leads-header-title mb-1" style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a" }}>Calendar</h2>
            <nav className="mb-0">
              <ol className="breadcrumb mb-0" style={{ fontSize: "0.9rem" }}>
                <li className="breadcrumb-item">
                  <a href="/admin-dashboard" style={{ color: "#64748b", textDecoration: "none" }}>
                    <i className="ti ti-smart-home"></i>
                  </a>
                </li>
                <li className="breadcrumb-item" style={{ color: "#64748b" }}>Application</li>
                <li className="breadcrumb-item active" style={{ color: "#0f172a", fontWeight: "500" }}>Calendar</li>
              </ol>
            </nav>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-primary d-flex align-items-center gap-2"
              data-bs-toggle="modal"
              data-bs-target="#add_event"
              style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", fontWeight: "600", padding: "10px 20px", borderRadius: "10px" }}
            >
              <i className="ti ti-plus" style={{ fontSize: "1.1rem" }}></i>
              Create Event
            </button>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Sidebar */}
        <div className="col-xxl-3 col-xl-4 mb-4">
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom p-3">
              <h5 className="mb-0 fw-bold text-dark">Upcoming Events</h5>
            </div>
            <div className="card-body p-3">
              {upcomingEvents.length === 0 ? (
                <p className="text-muted small text-center my-3">No upcoming events</p>
              ) : (
                upcomingEvents.map((event) => (
                  <div key={event.id} className="d-flex align-items-start border-bottom pb-2 mb-2">
                    <div className="ps-2 flex-grow-1">
                      <h6 className="fw-semibold text-dark mb-1">{event.title}</h6>
                      <p className="fs-12 text-muted mb-0">
                        <i className="ti ti-calendar me-1"></i>
                        {new Date(event.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-danger p-0"
                      onClick={(e) => handleDeleteEvent(event.id, e)}
                    >
                      <i className="ti ti-trash"></i>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="col-xxl-9 col-xl-8">
          <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom p-3 d-flex align-items-center justify-content-between">
              <h5 className="mb-0 fw-bold text-dark">{monthNames[month]} {year}</h5>
              <div className="btn-group">
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={prevMonth}>
                  <i className="ti ti-chevron-left"></i>
                </button>
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setCurrentDate(new Date())}>
                  Today
                </button>
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={nextMonth}>
                  <i className="ti ti-chevron-right"></i>
                </button>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-bordered mb-0" style={{ tableLayout: "fixed" }}>
                  <thead>
                    <tr className="bg-light text-center">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                        <th key={day} style={{ width: "14.28%", fontSize: "0.85rem", color: "#64748b" }}>{day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: Math.ceil(calendarCells.length / 7) }).map((_, rowIndex) => (
                      <tr key={rowIndex} style={{ height: "100px" }}>
                        {calendarCells.slice(rowIndex * 7, rowIndex * 7 + 7).map((cell, colIndex) => {
                          const cellEvents = events.filter((ev) => {
                            if (!cell.dateStr) return false;
                            const evDate = new Date(ev.startDate).toISOString().split("T")[0];
                            return evDate === cell.dateStr;
                          });
                          return (
                            <td key={colIndex} className="p-1 position-relative" style={{ verticalAlign: "top" }}>
                              {cell.day && (
                                <span className="fw-semibold text-dark small m-1 d-inline-block">{cell.day}</span>
                              )}
                              <div style={{ maxHeight: "70px", overflowY: "auto" }}>
                                {cellEvents.map((ev) => (
                                  <div
                                    key={ev.id}
                                    className={`px-2 py-1 rounded small mb-1 border-0 d-flex align-items-center justify-content-between ${ev.eventClassName || "bg-primary-transparent text-primary"}`}
                                    style={{ fontSize: "0.75rem", cursor: "pointer" }}
                                    title={ev.title}
                                  >
                                    <span className="text-truncate flex-grow-1">{ev.title}</span>
                                    <button
                                      type="button"
                                      className="btn p-0 border-0 ms-1 text-danger"
                                      onClick={(e) => handleDeleteEvent(ev.id, e)}
                                      style={{ background: "none", fontSize: "0.7rem" }}
                                    >
                                      <i className="ti ti-x"></i>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      <div className="modal fade" id="add_event" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={{ borderRadius: 12 }}>
            <div className="modal-header border-bottom">
              <h5 className="modal-title fw-bold text-dark">Create Calendar Event</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form onSubmit={handleCreateEvent}>
              <div className="modal-body p-4">
                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark">Event Title</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter event name"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold text-dark">Start Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold text-dark">End Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={eventEndDate}
                      onChange={(e) => setEventEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark">Category / Color</label>
                  <select
                    className="form-select"
                    value={eventClass}
                    onChange={(e) => setEventClass(e.target.value)}
                  >
                    <option value="bg-primary-transparent text-primary">Blue (Work)</option>
                    <option value="bg-success-transparent text-success">Green (Meeting)</option>
                    <option value="bg-danger-transparent text-danger">Red (Important)</option>
                    <option value="bg-warning-transparent text-warning">Yellow (Personal)</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer border-top">
                <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6" }}>Save Event</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
