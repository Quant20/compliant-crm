import { useState } from "react";

function ConversationPanel({ ticket, onAddConversation, onAddInternalNote }) {
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");

  const submitReply = (event) => {
    event.preventDefault();
    const trimmed = message.trim();

    if (!trimmed) {
      return;
    }

    onAddConversation(ticket.id, {
      sender: "Support Agent",
      message: trimmed,
      type: "reply",
    });
    setMessage("");
  };

  const submitNote = (event) => {
    event.preventDefault();
    const trimmed = note.trim();

    if (!trimmed) {
      return;
    }

    onAddInternalNote(ticket.id, {
      author: "Support Agent",
      message: trimmed,
    });
    setNote("");
  };

  const combinedTimeline = [
    ...(ticket.conversations || []).map((item) => ({ ...item, group: "conversation" })),
    ...(ticket.notes || []).map((item) => ({ ...item, group: "note" })),
  ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <section className="conversation-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Communication</p>
          <h3>Conversation and notes</h3>
        </div>
      </div>

      <div className="conversation-list">
        {combinedTimeline.length === 0 ? (
          <p className="empty-state">No replies or internal notes yet.</p>
        ) : (
          combinedTimeline.map((item, index) => (
            <article
              className={`conversation-item ${
                item.group === "note" ? "conversation-item--note" : ""
              }`}
              key={`${item.createdAt}-${index}`}
            >
              <div className="conversation-item__header">
                <strong>{item.sender || item.author}</strong>
                <span>{item.group === "note" ? "Internal note" : "Reply"}</span>
              </div>
              <p>{item.message}</p>
              <small>{new Date(item.createdAt).toLocaleString()}</small>
            </article>
          ))
        )}
      </div>

      <form className="conversation-form" onSubmit={submitReply}>
        <label htmlFor="reply-message">Customer reply</label>
        <textarea
          id="reply-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Write a response to the customer"
          rows="4"
        />
        <button className="button button--primary" type="submit">
          Add reply
        </button>
      </form>

      <form className="conversation-form conversation-form--note" onSubmit={submitNote}>
        <label htmlFor="internal-note">Internal note</label>
        <textarea
          id="internal-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Add a note visible only to your team"
          rows="3"
        />
        <button className="button button--secondary" type="submit">
          Add internal note
        </button>
      </form>
    </section>
  );
}

export default ConversationPanel;
