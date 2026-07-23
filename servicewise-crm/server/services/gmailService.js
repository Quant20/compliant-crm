export function normalizeEmailPayload(payload = {}) {
  const senderName = payload.senderName || payload.fromName || "Email Customer";
  const senderEmail = payload.senderEmail || payload.from || "";
  const subject = payload.subject || "Email complaint";
  const message = payload.message || payload.body || payload.text || "";

  if (!String(message).trim()) {
    const error = new Error("Email message content is required.");
    error.statusCode = 400;
    throw error;
  }

  return {
    customerName: senderName,
    customerEmail: senderEmail,
    customerPhone: "",
    subject,
    description: message,
    department: payload.department || "Customer Support",
    priority: payload.priority || "Medium",
    status: "Open",
    assignedAgent: "",
    category: payload.category || "General",
    channel: "Email",
  };
}
