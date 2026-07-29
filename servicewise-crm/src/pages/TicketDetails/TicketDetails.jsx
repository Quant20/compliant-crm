import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  FaArrowLeft,
  FaEnvelope,
} from "react-icons/fa";

import { useTickets } from "../../context/TicketContext";
import useAuth from "../../hooks/useAuth";
import users from "../../data/users";

import EmailReplyModal from "../../components/tickets/EmailReplyModal";
import CustomerMessagesPanel from "../../components/tickets/CustomerMessagesPanel";
import NoteComposerModal from "../../components/tickets/NoteComposerModal";
import TicketActionBar from "../../components/tickets/TicketActionBar";
import TicketDetailsSidebar from "../../components/tickets/TicketDetailsSidebar";

import {
  startTicketReminderWatcher,
} from "../../services/ticketReminderService";

import "./TicketDetailsLayout.css";

const normalizeBadgeValue = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
};

export default function TicketDetails() {
  const { ticketId } = useParams();
  const navigate = useNavigate();

  const { currentUser } = useAuth();

  const {
    tickets = [],
    loading = false,
    error = "",
    loadTickets,
    updateTicket,
    addConversation,
    addInternalNote,
    addActivity,
  } = useTickets();

  const successTimerRef = useRef(null);
  const noteTextareaRef = useRef(null);

  const [activeTab, setActiveTab] =
    useState("conversation");

  const [internalNote, setInternalNote] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [showEmailReply, setShowEmailReply] =
    useState(false);

  const [showNoteComposer, setShowNoteComposer] =
    useState(false);

  const [
    initialLoadRequested,
    setInitialLoadRequested,
  ] = useState(false);

  const [
    collapsedSections,
    setCollapsedSections,
  ] = useState({
    complaint: true,
    messages: false,
    notes: false,
    activity: false,
  });

  const toggleSection = (sectionName) => {
    setCollapsedSections((current) => ({
      ...current,
      [sectionName]: !current[sectionName],
    }));
  };

  const agents = useMemo(() => {
    return users.filter((user) => {
      const role = String(
        user.role || "",
      ).toLowerCase();

      return (
        role === "agent" ||
        role === "support agent"
      );
    });
  }, []);

  const requestedTicketId = useMemo(() => {
    try {
      return decodeURIComponent(
        String(ticketId || ""),
      );
    } catch {
      return String(ticketId || "");
    }
  }, [ticketId]);

  const ticket = useMemo(() => {
    return tickets.find((item) => {
      const databaseId = String(
        item.id || "",
      );

      const ticketNumber = String(
        item.ticketNumber ||
          item.ticket_number ||
          "",
      );

      return (
        databaseId === requestedTicketId ||
        ticketNumber === requestedTicketId
      );
    });
  }, [tickets, requestedTicketId]);

  const conversations = useMemo(() => {
    if (!ticket) {
      return [];
    }

    return (
      ticket.messages ||
      ticket.conversations ||
      []
    );
  }, [ticket]);

  const internalNotes = useMemo(() => {
    if (!ticket) {
      return [];
    }

    return (
      ticket.comments ||
      ticket.internalNotes ||
      []
    );
  }, [ticket]);

  const activities = useMemo(() => {
    return ticket?.activities || [];
  }, [ticket]);

  const getCurrentTime = () => {
    return new Date().toLocaleString(
      "en-GB",
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      },
    );
  };

  const getCurrentAgentName = () => {
    return (
      currentUser?.name || "Current Agent"
    );
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);

    if (successTimerRef.current) {
      window.clearTimeout(
        successTimerRef.current,
      );
    }

    successTimerRef.current =
      window.setTimeout(() => {
        setSuccessMessage("");
      }, 2800);
  };

  const safelyAddActivity = (
    currentTicketId,
    activity,
  ) => {
    if (typeof addActivity === "function") {
      addActivity(currentTicketId, activity);
    }
  };

  const safelyUpdateTicket = (
    currentTicketId,
    changes,
  ) => {
    if (typeof updateTicket === "function") {
      updateTicket(currentTicketId, changes);
    }
  };

  useEffect(() => {
    if (
      initialLoadRequested ||
      typeof loadTickets !== "function"
    ) {
      return;
    }

    setInitialLoadRequested(true);

    Promise.resolve(loadTickets()).catch(
      (loadError) => {
        console.error(
          "Unable to load tickets:",
          loadError,
        );
      },
    );
  }, [initialLoadRequested, loadTickets]);

  useEffect(() => {
  const requestNotificationPermission = async () => {
    if (
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      try {
        await Notification.requestPermission();
      } catch (permissionError) {
        console.error(
          "Notification permission could not be requested:",
          permissionError,
        );
      }
    }
  };

  requestNotificationPermission();

  const stopWatcher =
    startTicketReminderWatcher((task) => {
      const reminderMessage = [
        `Task: ${task.title}`,
        `Ticket: ${task.ticketNumber || "Not specified"}`,
        `Due: ${task.dueDate} at ${task.dueTime}`,
        task.notes ? `Notes: ${task.notes}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      if (
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        const notification = new Notification(
          "ServiceWise Task Reminder",
          {
            body: reminderMessage,
            icon: "/favicon.ico",
            tag: `servicewise-task-${task.id}`,
            requireInteraction: true,
          },
        );

        notification.onclick = () => {
          window.focus();

          if (task.ticketId) {
            window.location.href =
              `/tickets/${task.ticketId}`;
          }

          notification.close();
        };
      }

      window.alert(
        `SERVICEWISE TASK REMINDER\n\n${reminderMessage}`,
      );
    });

  return stopWatcher;
}, []);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        window.clearTimeout(
          successTimerRef.current,
        );
      }
    };
  }, []);

  const handleStatusChange = (event) => {
    if (!ticket) {
      return;
    }

    const status = event.target.value;
    const time = getCurrentTime();

    safelyUpdateTicket(ticket.id, {
      status,
      updatedAt: time,
      updated_at: time,
    });

    safelyAddActivity(ticket.id, {
      id: Date.now(),
      type: "status",
      action: `Status changed to ${status}`,
      user: getCurrentAgentName(),
      time,
    });

    showSuccess("Ticket status updated.");
  };

  const handlePriorityChange = (event) => {
    if (!ticket) {
      return;
    }

    const priority = event.target.value;
    const time = getCurrentTime();

    safelyUpdateTicket(ticket.id, {
      priority,
      updatedAt: time,
      updated_at: time,
    });

    safelyAddActivity(ticket.id, {
      id: Date.now(),
      type: "priority",
      action: `Priority changed to ${priority}`,
      user: getCurrentAgentName(),
      time,
    });

    showSuccess("Ticket priority updated.");
  };

  const handleAgentChange = (event) => {
    if (!ticket) {
      return;
    }

    const assignedAgent =
      event.target.value;

    const time = getCurrentTime();

    safelyUpdateTicket(ticket.id, {
      assignedAgent,
      assignedAgentName: assignedAgent,
      assigned_agent_name: assignedAgent,
      updatedAt: time,
      updated_at: time,
    });

    safelyAddActivity(ticket.id, {
      id: Date.now(),
      type: "assigned",
      action:
        assignedAgent === "Unassigned"
          ? "Ticket unassigned"
          : `Ticket assigned to ${assignedAgent}`,
      user: getCurrentAgentName(),
      time,
    });

    showSuccess("Assigned agent updated.");
  };

  const handleCustomerMessageSend = async (
    messageData,
  ) => {
    if (
      !ticket ||
      !messageData?.message?.trim()
    ) {
      return;
    }

    const time =
      messageData.time || getCurrentTime();

    if (
      typeof addConversation === "function"
    ) {
      await addConversation(ticket.id, {
        ...messageData,
        id: messageData.id || Date.now(),
        time,
        createdAt:
          messageData.createdAt ||
          new Date().toISOString(),
      });
    }

    const channel =
      messageData.channel === "whatsapp"
        ? "WhatsApp"
        : messageData.channel === "email"
          ? "Email"
          : "Manual";

    safelyAddActivity(ticket.id, {
      id: Date.now() + 1,
      type: "reply",
      action: `${channel} customer message added`,
      user: getCurrentAgentName(),
      time,
      channel: messageData.channel,
      groupName: messageData.groupName || "",
    });

    showSuccess(
      messageData.channel === "whatsapp" &&
        messageData.deliveryStatus ===
          "saved_only"
        ? "WhatsApp message saved to history. It was not sent because WhatsApp is not connected."
        : "Customer message added successfully.",
    );
  };

  const handleInternalNote = (event) => {
    event.preventDefault();

    if (
      !ticket ||
      !internalNote.trim()
    ) {
      return;
    }

    saveInternalNote(internalNote.trim());
    setInternalNote("");
  };

  const saveInternalNote = async (noteInput) => {
    if (!ticket || !noteInput) {
      return;
    }

    const noteData =
      typeof noteInput === "string"
        ? { note: noteInput }
        : noteInput;

    const noteText = String(
      noteData.note || "",
    ).trim();

    if (!noteText) {
      return;
    }

    const time = getCurrentTime();

    if (
      typeof addInternalNote === "function"
    ) {
      await addInternalNote(ticket.id, {
        id: noteData.id || Date.now(),
        author:
          noteData.author ||
          getCurrentAgentName(),
        note: noteText,
        html: noteData.html || "",
        time,
        createdAt:
          noteData.createdAt ||
          new Date().toISOString(),
      });
    }

    safelyAddActivity(ticket.id, {
      id: Date.now() + 1,
      type: "note",
      action: "Internal note added",
      user: getCurrentAgentName(),
      time,
    });

    setActiveTab("notes");
    setCollapsedSections((current) => ({
      ...current,
      notes: false,
    }));

    showSuccess("Internal note added.");
  };

  const handleEmailSent = () => {
    if (!ticket) {
      return;
    }

    const time = getCurrentTime();

    safelyAddActivity(ticket.id, {
      id: Date.now(),
      type: "email",
      action: "Email reply sent to customer",
      user: getCurrentAgentName(),
      time,
    });

    setShowEmailReply(false);
    showSuccess("Email sent successfully.");
  };

  const handleCallSaved = (call) => {
    if (!ticket) {
      return;
    }

    const time = getCurrentTime();

    const callDetails = [
      call.outcome,
      call.duration,
    ]
      .filter(Boolean)
      .join(" • ");

    safelyAddActivity(ticket.id, {
      id: Date.now(),
      type: "call",
      action: `Phone call logged${
        callDetails
          ? `: ${callDetails}`
          : ""
      }`,
      user: getCurrentAgentName(),
      time,
      notes: call.notes,
    });

    showSuccess("Phone call saved.");
  };

  const handleTaskSaved = (task) => {
    if (!ticket) {
      return;
    }

    const time = getCurrentTime();

    safelyAddActivity(ticket.id, {
      id: Date.now(),
      type: "task",
      action: `Task created: ${task.title}`,
      user: getCurrentAgentName(),
      time,
      dueDate: task.dueDate,
      dueTime: task.dueTime,
    });

    setActiveTab("activity");
    setCollapsedSections((current) => ({
      ...current,
      activity: false,
    }));

    showSuccess(
      `Task created for ${task.dueDate} at ${task.dueTime}.`,
    );
  };

  const handleMeetingSaved = (meeting) => {
    if (!ticket) {
      return;
    }

    const time = getCurrentTime();

    safelyAddActivity(ticket.id, {
      id: Date.now(),
      type: "meeting",
      action: `Meeting scheduled: ${meeting.title}`,
      user: getCurrentAgentName(),
      time,
      meetingDate: meeting.date,
      meetingTime: meeting.startTime,
    });

    setActiveTab("activity");
    setCollapsedSections((current) => ({
      ...current,
      activity: false,
    }));

    showSuccess(
      `Meeting scheduled for ${meeting.date} at ${meeting.startTime}.`,
    );
  };

  const handleViewActivity = () => {
    setActiveTab("activity");

    setCollapsedSections((current) => ({
      ...current,
      activity: false,
    }));

    window.setTimeout(() => {
      document
        .querySelector(".crm-detail-panel")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 100);
  };

  const handleCloseTicket = () => {
    if (!ticket) {
      return;
    }

    const time = getCurrentTime();

    safelyUpdateTicket(ticket.id, {
      status: "Closed",
      updatedAt: time,
      updated_at: time,
    });

    safelyAddActivity(ticket.id, {
      id: Date.now(),
      type: "status",
      action: "Ticket closed",
      user: getCurrentAgentName(),
      time,
    });

    showSuccess("Ticket closed.");
  };

  if (!initialLoadRequested || loading) {
    return (
      <div className="crm-loading">
        <div className="crm-loading-spinner" />

        <h2>Loading ticket</h2>

        <p>
          Retrieving ticket information from
          Supabase...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="crm-ticket-not-found">
        <h1>Unable to load ticket</h1>

        <p>{error}</p>

        <div className="crm-not-found-actions">
          <button
            type="button"
            className="crm-primary-action"
            onClick={() => {
              if (
                typeof loadTickets ===
                "function"
              ) {
                loadTickets();
              }
            }}
          >
            Try Again
          </button>

          <button
            type="button"
            className="crm-secondary-action"
            onClick={() => navigate("/tickets")}
          >
            Back to Tickets
          </button>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="crm-ticket-not-found">
        <h1>Ticket not found</h1>

        <p>
          No loaded ticket matches ID or ticket
          number: {requestedTicketId || "N/A"}.
        </p>

        <button
          type="button"
          className="crm-primary-action"
          onClick={() => navigate("/tickets")}
        >
          Back to Tickets
        </button>
      </div>
    );
  }

  const customerEmail =
    ticket.customer?.email ||
    ticket.customerEmail ||
    ticket.customer_email ||
    "";

  const customerPhone =
    ticket.customer?.phone ||
    ticket.customer_phone ||
    "N/A";

  const ticketNumber =
    ticket.ticketNumber ||
    ticket.ticket_number ||
    `Ticket #${ticket.id}`;

  const assignedAgent =
    ticket.assignedAgent ||
    ticket.assignedAgentName ||
    ticket.assigned_agent_name ||
    "Unassigned";

  const createdAt =
    ticket.createdAt ||
    ticket.created_at ||
    ticket.received_at ||
    "N/A";

  const updatedAt =
    ticket.updatedAt ||
    ticket.updated_at ||
    createdAt;

  const status = ticket.status || "Open";
  const priority =
    ticket.priority || "Medium";

  return (
    <div className="crm-ticket-detail-page">
      {successMessage && (
        <div className="crm-detail-success">
          {successMessage}
        </div>
      )}

      <div className="crm-detail-topbar">
        <button
          type="button"
          className="crm-back-link"
          onClick={() => navigate("/tickets")}
        >
          <FaArrowLeft />
          Back to tickets
        </button>

        <button
          type="button"
          className="crm-email-button"
          onClick={() =>
            setShowEmailReply(true)
          }
          disabled={!customerEmail}
        >
          <FaEnvelope />
          <span>Reply by Email</span>
        </button>
      </div>

      <header className="crm-detail-header">
        <div className="crm-detail-id-row">
          <span className="crm-detail-ticket-id">
            {ticketNumber}
          </span>

          <span
            className={`crm-table-badge crm-priority-${normalizeBadgeValue(
              priority,
            )}`}
          >
            {priority}
          </span>

          <span
            className={`crm-table-badge crm-status-${normalizeBadgeValue(
              status,
            )}`}
          >
            {status}
          </span>
        </div>

        <h1>
          {ticket.subject || "No subject"}
        </h1>

        <div className="crm-detail-meta">
          <span>Created: {createdAt}</span>
          <span>Updated: {updatedAt}</span>

          <span>
            Source:{" "}
            {ticket.source ||
              ticket.channel ||
              "N/A"}
          </span>
        </div>
      </header>

      <TicketActionBar
        ticket={ticket}
        agents={agents}
        currentUserName={getCurrentAgentName()}
        customerEmail={customerEmail}
        customerPhone={customerPhone}
        onEmail={() =>
          setShowEmailReply(true)
        }
        onNote={() =>
          setShowNoteComposer(true)
        }
        onCallSaved={handleCallSaved}
        onTaskSaved={handleTaskSaved}
        onMeetingSaved={handleMeetingSaved}
        onViewActivity={handleViewActivity}
        onCloseTicket={handleCloseTicket}
      />

      <div className="crm-detail-layout">
        <main className="crm-detail-main">
          <section className="crm-detail-panel">
            <div className="crm-detail-tabs">
              <button
                type="button"
                className={`crm-detail-tab ${
                  activeTab === "conversation"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setActiveTab("conversation")
                }
              >
                Customer Messages
              </button>

              <button
                type="button"
                className={`crm-detail-tab ${
                  activeTab === "notes"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setActiveTab("notes")
                }
              >
                Internal Notes
              </button>

              <button
                type="button"
                className={`crm-detail-tab ${
                  activeTab === "activity"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setActiveTab("activity")
                }
              >
                Activities
              </button>
            </div>

            {activeTab === "conversation" && (
              <>
                <div
                  className={`crm-detail-section ${
                    collapsedSections.complaint
                      ? "crm-section-collapsed"
                      : ""
                  }`}
                >
                  <div className="crm-section-heading crm-collapsible-heading">
                    <div>
                      <h2>Complaint / Issue</h2>

                      <p>
                        Original complaint linked
                        with this ticket.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="crm-collapse-button"
                      onClick={() =>
                        toggleSection("complaint")
                      }
                      aria-expanded={
                        !collapsedSections.complaint
                      }
                    >
                      <span>
                        {collapsedSections.complaint
                          ? "Open"
                          : "Minimize"}
                      </span>

                      <span className="crm-collapse-chevron">
                        {collapsedSections.complaint
                          ? "▸"
                          : "▾"}
                      </span>
                    </button>
                  </div>

                  {!collapsedSections.complaint && (
                    <div className="crm-collapsible-body">
                      <div className="crm-complaint-box">
                        {ticket.description ||
                          "No description available."}
                      </div>
                    </div>
                  )}
                </div>

                <div
                  className={`crm-collapsible-wrapper ${
                    collapsedSections.messages
                      ? "crm-section-collapsed"
                      : ""
                  }`}
                >
                  <div className="crm-collapsible-panel-heading">
                    <div>
                      <h2>Customer Messages</h2>

                      <p>
                        Communication history and
                        customer replies.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="crm-collapse-button"
                      onClick={() =>
                        toggleSection("messages")
                      }
                      aria-expanded={
                        !collapsedSections.messages
                      }
                    >
                      <span>
                        {collapsedSections.messages
                          ? "Open"
                          : "Minimize"}
                      </span>

                      <span className="crm-collapse-chevron">
                        {collapsedSections.messages
                          ? "▸"
                          : "▾"}
                      </span>
                    </button>
                  </div>

                  {!collapsedSections.messages && (
                    <div className="crm-collapsible-body">
                      <CustomerMessagesPanel
                        ticket={ticket}
                        messages={conversations}
                        currentAgentName={
                          getCurrentAgentName()
                        }
                        customerEmail={
                          customerEmail
                        }
                        onOpenEmail={() =>
                          setShowEmailReply(true)
                        }
                        onSendMessage={
                          handleCustomerMessageSend
                        }
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === "notes" && (
              <div
                className={`crm-detail-section ${
                  collapsedSections.notes
                    ? "crm-section-collapsed"
                    : ""
                }`}
              >
                <div className="crm-section-heading crm-collapsible-heading">
                  <div>
                    <h2>Internal Notes</h2>

                    <p>
                      Visible only to the support
                      team.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="crm-collapse-button"
                    onClick={() =>
                      toggleSection("notes")
                    }
                    aria-expanded={
                      !collapsedSections.notes
                    }
                  >
                    <span>
                      {collapsedSections.notes
                        ? "Open"
                        : "Minimize"}
                    </span>

                    <span className="crm-collapse-chevron">
                      {collapsedSections.notes
                        ? "▸"
                        : "▾"}
                    </span>
                  </button>
                </div>

                {!collapsedSections.notes && (
                  <div className="crm-collapsible-body">
                    <div className="crm-notes-list">
                      {internalNotes.length > 0 ? (
                        internalNotes.map((note) => (
                          <div
                            key={
                              note.id ||
                              `${note.author}-${note.time}`
                            }
                            className="crm-note"
                          >
                            <div className="crm-message-heading">
                              <strong>
                                {note.author ||
                                  note.user ||
                                  "Agent"}
                              </strong>

                              <span>
                                {note.time ||
                                  note.created_at ||
                                  ""}
                              </span>
                            </div>

                            {note.html ? (
                              <div
                                className="crm-note-content"
                                dangerouslySetInnerHTML={{
                                  __html:
                                    note.html,
                                }}
                              />
                            ) : (
                              <p>
                                {note.note ||
                                  note.message ||
                                  note.text ||
                                  ""}
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="crm-empty-section">
                          No internal notes added.
                        </div>
                      )}
                    </div>

                    <form
                      className="crm-composer"
                      onSubmit={
                        handleInternalNote
                      }
                    >
                      <label htmlFor="internal-note">
                        Add internal note
                      </label>

                      <textarea
                        ref={noteTextareaRef}
                        id="internal-note"
                        value={internalNote}
                        onChange={(event) =>
                          setInternalNote(
                            event.target.value,
                          )
                        }
                        placeholder="Write a private note for the support team..."
                      />

                      <div className="crm-composer-actions">
                        <button
                          type="submit"
                          className="crm-note-action"
                          disabled={
                            !internalNote.trim()
                          }
                        >
                          Add Internal Note
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {activeTab === "activity" && (
              <div
                className={`crm-detail-section ${
                  collapsedSections.activity
                    ? "crm-section-collapsed"
                    : ""
                }`}
              >
                <div className="crm-section-heading crm-collapsible-heading">
                  <div>
                    <h2>Activity Timeline</h2>

                    <p>
                      Complete ticket history and
                      updates.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="crm-collapse-button"
                    onClick={() =>
                      toggleSection("activity")
                    }
                    aria-expanded={
                      !collapsedSections.activity
                    }
                  >
                    <span>
                      {collapsedSections.activity
                        ? "Open"
                        : "Minimize"}
                    </span>

                    <span className="crm-collapse-chevron">
                      {collapsedSections.activity
                        ? "▸"
                        : "▾"}
                    </span>
                  </button>
                </div>

                {!collapsedSections.activity && (
                  <div className="crm-collapsible-body">
                    <div className="crm-timeline">
                      {activities.length > 0 ? (
                        [...activities]
                          .reverse()
                          .map((activity) => (
                            <div
                              key={
                                activity.id ||
                                `${activity.action}-${activity.time}`
                              }
                              className="crm-timeline-item"
                            >
                              <div className="crm-timeline-dot" />

                              <div className="crm-timeline-content">
                                <strong>
                                  {activity.action ||
                                    "Ticket updated"}
                                </strong>

                                <p>
                                  {activity.user ||
                                    "System"}{" "}
                                  ·{" "}
                                  {activity.time ||
                                    activity.created_at ||
                                    ""}
                                </p>
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="crm-empty-section">
                          No activity available.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </main>

        <TicketDetailsSidebar
          ticket={ticket}
          agents={agents}
          status={status}
          priority={priority}
          assignedAgent={assignedAgent}
          onStatusChange={handleStatusChange}
          onPriorityChange={handlePriorityChange}
          onAgentChange={handleAgentChange}
        />
      </div>

      {showNoteComposer && (
        <NoteComposerModal
          ticket={ticket}
          currentUserName={
            getCurrentAgentName()
          }
          onClose={() =>
            setShowNoteComposer(false)
          }
          onSave={async (noteData) => {
            await saveInternalNote(noteData);
            setShowNoteComposer(false);
          }}
        />
      )}

      {showEmailReply && (
        <EmailReplyModal
          ticket={ticket}
          onClose={() =>
            setShowEmailReply(false)
          }
          onSent={handleEmailSent}
        />
      )}
    </div>
  );
}