import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { createPortal } from "react-dom";

import {
  FaCalendarAlt,
  FaCheckCircle,
  FaClipboardList,
  FaEnvelope,
  FaHistory,
  FaPhone,
  FaStickyNote,
  FaTimes,
} from "react-icons/fa";

import {
  scheduleGoogleMeeting,
} from "../../services/integrationService";

import "./TicketActionBar.css";

const INITIAL_CALL = {
  outcome: "Connected",
  duration: "",
  notes: "",
};

const INITIAL_TASK = {
  title: "",
  dueDate: "",
  dueTime: "",
  notes: "",
};

const INITIAL_MEETING = {
  title: "",
  date: "",
  startTime: "",
  endTime: "",
  attendeeEmail: "",
  description: "",
};

const getTicketNumber = (ticket) =>
  ticket?.ticketNumber ||
  ticket?.ticket_number ||
  `Ticket #${ticket?.id || ""}`;

const getCustomerName = (ticket) =>
  ticket?.customer?.name ||
  ticket?.customer_name ||
  ticket?.customerName ||
  "Customer";

const normalizePhone = (value) =>
  String(value || "").replace(/[^\d+]/g, "");

const formatGoogleDate = (date) =>
  date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  size = "normal",
}) {
  const handleBackdrop = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="crm-action-overlay"
      onMouseDown={handleBackdrop}
      role="presentation"
    >
      <section
        className={`crm-action-modal crm-action-modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="crm-action-modal-header">
          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>

          <button
            type="button"
            className="crm-action-close"
            onClick={onClose}
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </header>

        {children}
      </section>
    </div>,
    document.body,
  );
}

export default function TicketActionBar({
  ticket,
  currentUserName = "Current Agent",
  customerEmail = "",
  customerPhone = "",
  onEmail,
  onNote,
  onCallSaved,
  onTaskSaved,
  onMeetingSaved,
  onViewActivity,
  onCloseTicket,
}) {
  const [activeModal, setActiveModal] =
    useState("");

  const [error, setError] = useState("");

  const [callForm, setCallForm] =
    useState(INITIAL_CALL);

  const [taskForm, setTaskForm] =
    useState(INITIAL_TASK);

  const [meetingForm, setMeetingForm] =
    useState(INITIAL_MEETING);

  const ticketNumber = useMemo(
    () => getTicketNumber(ticket),
    [ticket],
  );

  const customerName = useMemo(
    () => getCustomerName(ticket),
    [ticket],
  );

  const callablePhone = useMemo(
    () => normalizePhone(customerPhone),
    [customerPhone],
  );

  const isClosed =
    String(ticket?.status || "")
      .trim()
      .toLowerCase() === "closed";

  const resetState = () => {
    setError("");
    setCallForm(INITIAL_CALL);
    setTaskForm(INITIAL_TASK);
    setMeetingForm(INITIAL_MEETING);
  };

  const closeModal = () => {
    setActiveModal("");
    resetState();
  };

  const openModal = (name) => {
    setError("");

    if (name === "email") {
      if (typeof onEmail === "function") {
        onEmail();
      }

      return;
    }

    if (name === "activity") {
      if (
        typeof onViewActivity === "function"
      ) {
        onViewActivity();
      }

      return;
    }

    if (name === "meeting") {
      setMeetingForm({
        ...INITIAL_MEETING,
        title: `Follow-up: ${ticketNumber}`,
        attendeeEmail: customerEmail || "",
      });
    }

    setActiveModal(name);
  };

  useEffect(() => {
    if (!activeModal) {
      return undefined;
    }

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    const previousOverflow =
      document.body.style.overflow;

    document.addEventListener(
      "keydown",
      closeOnEscape,
    );

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        closeOnEscape,
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [activeModal]);

  const handleCallChange = (event) => {
    const { name, value } = event.target;

    setCallForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  };

  const handleTaskChange = (event) => {
    const { name, value } = event.target;

    setTaskForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  };

  const handleMeetingChange = (event) => {
    const { name, value } = event.target;

    setMeetingForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  };

  const handleSaveCall = async (event) => {
    event.preventDefault();

    if (!callForm.outcome) {
      setError("Please choose a call outcome.");
      return;
    }

    try {
      if (
        typeof onCallSaved === "function"
      ) {
        await onCallSaved({
          outcome: callForm.outcome,
          duration:
            callForm.duration.trim() ||
            "Not recorded",
          notes: callForm.notes.trim(),
          customerPhone,
          customerName,
        });
      }

      closeModal();
    } catch (saveError) {
      console.error(
        "Unable to save call:",
        saveError,
      );

      setError(
        saveError?.message ||
          "The call record could not be saved.",
      );
    }
  };

  const handleSaveTask = async (event) => {
    event.preventDefault();

    if (
      !taskForm.title.trim() ||
      !taskForm.dueDate ||
      !taskForm.dueTime
    ) {
      setError(
        "Task title, due date and due time are required.",
      );

      return;
    }

    const task = {
      id: Date.now(),
      ticketId: ticket?.id,
      ticketNumber,
      title: taskForm.title.trim(),
      dueDate: taskForm.dueDate,
      dueTime: taskForm.dueTime,
      notes: taskForm.notes.trim(),
      createdBy: currentUserName,
      createdAt: new Date().toISOString(),
      completed: false,
      reminded: false,
    };

    try {
      const savedTasks = JSON.parse(
        localStorage.getItem(
          "servicewise_ticket_tasks",
        ) || "[]",
      );

      localStorage.setItem(
        "servicewise_ticket_tasks",
        JSON.stringify([...savedTasks, task]),
      );
    } catch (storageError) {
      console.error(
        "Unable to save task:",
        storageError,
      );
    }

    try {
      if (
        typeof onTaskSaved === "function"
      ) {
        await onTaskSaved(task);
      }

      closeModal();
    } catch (saveError) {
      console.error(
        "Unable to save task:",
        saveError,
      );

      setError(
        saveError?.message ||
          "The task could not be saved.",
      );
    }
  };

  const handleScheduleMeeting = async (event) => {
  event.preventDefault();
  setError("");

  if (
    !meetingForm.title.trim() ||
    !meetingForm.date ||
    !meetingForm.startTime ||
    !meetingForm.endTime
  ) {
    setError(
      "Meeting title, date, start time and end time are required.",
    );
    return;
  }

  const startDate = new Date(
    `${meetingForm.date}T${meetingForm.startTime}`,
  );

  const endDate = new Date(
    `${meetingForm.date}T${meetingForm.endTime}`,
  );

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime())
  ) {
    setError(
      "Please enter a valid meeting date and time.",
    );
    return;
  }

  if (endDate <= startDate) {
    setError(
      "End time must be later than start time.",
    );
    return;
  }

  try {
    const calendarEvent =
      await scheduleGoogleMeeting({
        title: meetingForm.title.trim(),
        date: meetingForm.date,
        startTime: meetingForm.startTime,
        endTime: meetingForm.endTime,
        attendees:
          meetingForm.attendeeEmail.trim()
            ? [
                meetingForm.attendeeEmail.trim(),
              ]
            : [],
        description:
          meetingForm.description.trim(),
        ticketNumber,
        timeZone: "Asia/Karachi",
        createGoogleMeet: true,
      });

    const meeting = {
      id:
        calendarEvent?.id ||
        `meeting-${Date.now()}`,
      ticketId: ticket?.id,
      ticketNumber,
      title: meetingForm.title.trim(),
      date: meetingForm.date,
      startTime: meetingForm.startTime,
      endTime: meetingForm.endTime,
      attendees:
        calendarEvent?.attendees || [],
      attendeeEmail:
        meetingForm.attendeeEmail.trim(),
      description:
        meetingForm.description.trim(),
      createdBy: currentUserName,
      createdAt:
        calendarEvent?.createdAt ||
        new Date().toISOString(),

      googleEventId:
        calendarEvent?.id || "",
      googleCalendarLink:
        calendarEvent?.htmlLink || "",
      googleMeetLink:
        calendarEvent?.meetLink || "",
      calendarStatus:
        calendarEvent?.status ||
        "confirmed",
      calendarStart:
        calendarEvent?.start || null,
      calendarEnd:
        calendarEvent?.end || null,
    };

    try {
      const savedMeetings = JSON.parse(
        localStorage.getItem(
          "servicewise_ticket_meetings",
        ) || "[]",
      );

      localStorage.setItem(
        "servicewise_ticket_meetings",
        JSON.stringify([
          ...savedMeetings,
          meeting,
        ]),
      );
    } catch (storageError) {
      console.error(
        "Google Calendar meeting was created, but the CRM copy could not be saved:",
        storageError,
      );
    }

    if (
      typeof onMeetingSaved === "function"
    ) {
      await onMeetingSaved(meeting);
    }

    closeModal();
  } catch (calendarError) {
    console.error(
      "Unable to schedule Google Calendar meeting:",
      calendarError,
    );

    setError(
      calendarError?.message ||
        "The meeting could not be added to Google Calendar.",
    );
  }
};

  const handleCloseTicket = () => {
    if (
      isClosed ||
      typeof onCloseTicket !== "function"
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Close ${ticketNumber}?`,
    );

    if (confirmed) {
      onCloseTicket();
    }
  };

  return (
    <>
      <div className="crm-ticket-action-strip">
        <button
          type="button"
          className="crm-ticket-action-button"
          onClick={() => {
            if (typeof onNote === "function") {
              onNote();
            }
          }}
        >
          <span>
            <FaStickyNote />
          </span>
          Note
        </button>

        <button
          type="button"
          className="crm-ticket-action-button"
          onClick={() => openModal("email")}
          disabled={!customerEmail}
        >
          <span>
            <FaEnvelope />
          </span>
          Email
        </button>

        <button
          type="button"
          className="crm-ticket-action-button"
          onClick={() => openModal("call")}
        >
          <span>
            <FaPhone />
          </span>
          Call
        </button>

        <button
          type="button"
          className="crm-ticket-action-button"
          onClick={() => openModal("task")}
        >
          <span>
            <FaClipboardList />
          </span>
          Task
        </button>

        <button
          type="button"
          className="crm-ticket-action-button"
          onClick={() =>
            openModal("meeting")
          }
        >
          <span>
            <FaCalendarAlt />
          </span>
          Meeting
        </button>

        <button
          type="button"
          className="crm-ticket-action-button"
          onClick={() =>
            openModal("activity")
          }
        >
          <span>
            <FaHistory />
          </span>
          Activity
        </button>

        <button
          type="button"
          className="crm-ticket-action-button danger"
          onClick={handleCloseTicket}
          disabled={isClosed}
        >
          <span>
            <FaCheckCircle />
          </span>
          {isClosed ? "Closed" : "Close"}
        </button>
      </div>

      {activeModal === "call" && (
        <ModalShell
          title="Call customer"
          subtitle={`Call ${customerName} and record the result.`}
          onClose={closeModal}
        >
          <form
            className="crm-standard-action-form"
            onSubmit={handleSaveCall}
          >
            <div className="crm-call-customer-card">
              <div>
                <span>Customer phone</span>

                <strong>
                  {customerPhone &&
                  customerPhone !== "N/A"
                    ? customerPhone
                    : "Not available"}
                </strong>
              </div>

              {callablePhone ? (
                <button
                  type="button"
                  className="crm-call-button"
                  onClick={() => {
                    window.location.href =
                      `tel:${callablePhone}`;
                  }}
                >
                  <FaPhone />
                  Call now
                </button>
              ) : (
                <button
                  type="button"
                  className="crm-call-button"
                  disabled
                >
                  <FaPhone />
                  Number unavailable
                </button>
              )}
            </div>

            {error && (
              <div className="crm-action-error">
                {error}
              </div>
            )}

            <div className="crm-action-form-grid">
              <div className="crm-action-field">
                <label htmlFor="call-outcome">
                  Call outcome
                </label>

                <select
                  id="call-outcome"
                  name="outcome"
                  value={callForm.outcome}
                  onChange={handleCallChange}
                >
                  <option value="Connected">
                    Connected
                  </option>
                  <option value="No Answer">
                    No Answer
                  </option>
                  <option value="Busy">
                    Busy
                  </option>
                  <option value="Call Back Requested">
                    Call Back Requested
                  </option>
                  <option value="Resolved">
                    Resolved
                  </option>
                  <option value="Wrong Number">
                    Wrong Number
                  </option>
                </select>
              </div>

              <div className="crm-action-field">
                <label htmlFor="call-duration">
                  Duration
                </label>

                <input
                  id="call-duration"
                  name="duration"
                  type="text"
                  value={callForm.duration}
                  onChange={handleCallChange}
                  placeholder="Example: 5 minutes"
                />
              </div>

              <div className="crm-action-field full">
                <label htmlFor="call-notes">
                  Call notes
                </label>

                <textarea
                  id="call-notes"
                  name="notes"
                  value={callForm.notes}
                  onChange={handleCallChange}
                  placeholder="Write what was discussed..."
                />
              </div>
            </div>

            <footer className="crm-composer-footer">
              <button
                type="button"
                className="crm-action-secondary"
                onClick={closeModal}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="crm-action-primary"
              >
                Save call
              </button>
            </footer>
          </form>
        </ModalShell>
      )}

      {activeModal === "meeting" && (
        <ModalShell
          title="Schedule meeting"
          subtitle="Save the meeting directly in ServiceWise CRM."
          onClose={closeModal}
        >
          <form
            className="crm-standard-action-form"
            onSubmit={handleScheduleMeeting}
          >
            {error && (
              <div className="crm-action-error">
                {error}
              </div>
            )}

            <div className="crm-action-form-grid">
              <div className="crm-action-field full">
                <label htmlFor="meeting-title">
                  Meeting title
                </label>

                <input
                  id="meeting-title"
                  name="title"
                  type="text"
                  value={meetingForm.title}
                  onChange={handleMeetingChange}
                  placeholder={`Follow-up: ${ticketNumber}`}
                />
              </div>

              <div className="crm-action-field full">
                <label htmlFor="meeting-date">
                  Meeting date
                </label>

                <input
                  id="meeting-date"
                  name="date"
                  type="date"
                  value={meetingForm.date}
                  onChange={handleMeetingChange}
                />
              </div>

              <div className="crm-action-field">
                <label htmlFor="meeting-start">
                  Start time
                </label>

                <input
                  id="meeting-start"
                  name="startTime"
                  type="time"
                  value={meetingForm.startTime}
                  onChange={handleMeetingChange}
                />
              </div>

              <div className="crm-action-field">
                <label htmlFor="meeting-end">
                  End time
                </label>

                <input
                  id="meeting-end"
                  name="endTime"
                  type="time"
                  value={meetingForm.endTime}
                  onChange={handleMeetingChange}
                />
              </div>

              <div className="crm-action-field full">
                <label htmlFor="meeting-attendee">
                  Attendee email
                </label>

                <input
                  id="meeting-attendee"
                  name="attendeeEmail"
                  type="email"
                  value={
                    meetingForm.attendeeEmail
                  }
                  onChange={handleMeetingChange}
                  placeholder="customer@example.com"
                />
              </div>

              <div className="crm-action-field full">
                <label htmlFor="meeting-description">
                  Meeting agenda
                </label>

                <textarea
                  id="meeting-description"
                  name="description"
                  value={
                    meetingForm.description
                  }
                  onChange={handleMeetingChange}
                  placeholder="Add discussion points..."
                />
              </div>
            </div>

            <footer className="crm-composer-footer">
              <button
                type="button"
                className="crm-action-secondary"
                onClick={closeModal}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="crm-action-primary"
              >
                <FaCalendarAlt />
                Schedule meeting
              </button>
            </footer>
          </form>
        </ModalShell>
      )}

      {activeModal === "task" && (
        <ModalShell
          title="Create task"
          subtitle={`Create a follow-up task for ${ticketNumber}.`}
          onClose={closeModal}
        >
          <form
            className="crm-standard-action-form"
            onSubmit={handleSaveTask}
          >
            {error && (
              <div className="crm-action-error">
                {error}
              </div>
            )}

            <div className="crm-action-form-grid">
              <div className="crm-action-field full">
                <label htmlFor="task-title">
                  Task title
                </label>

                <input
                  id="task-title"
                  name="title"
                  type="text"
                  value={taskForm.title}
                  onChange={handleTaskChange}
                  placeholder="Follow up with customer"
                />
              </div>

              <div className="crm-action-field">
                <label htmlFor="task-date">
                  Due date
                </label>

                <input
                  id="task-date"
                  name="dueDate"
                  type="date"
                  value={taskForm.dueDate}
                  onChange={handleTaskChange}
                />
              </div>

              <div className="crm-action-field">
                <label htmlFor="task-time">
                  Due time
                </label>

                <input
                  id="task-time"
                  name="dueTime"
                  type="time"
                  value={taskForm.dueTime}
                  onChange={handleTaskChange}
                />
              </div>

              <div className="crm-action-field full">
                <label htmlFor="task-notes">
                  Task details
                </label>

                <textarea
                  id="task-notes"
                  name="notes"
                  value={taskForm.notes}
                  onChange={handleTaskChange}
                  placeholder="Add task instructions..."
                />
              </div>
            </div>

            <footer className="crm-composer-footer">
              <button
                type="button"
                className="crm-action-secondary"
                onClick={closeModal}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="crm-action-primary"
              >
                Create task
              </button>
            </footer>
          </form>
        </ModalShell>
      )}
    </>
  );
}

