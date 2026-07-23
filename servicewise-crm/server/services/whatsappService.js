export function normalizeWhatsAppPayload(payload = {}) {
  const customerName = payload.customerName || payload.profileName || "WhatsApp Customer";
  const customerPhone = payload.customerPhone || payload.from || "";
  const message = payload.message || payload.text || "";

  if (!String(message).trim()) {
    const error = new Error("WhatsApp message content is required.");
    error.statusCode = 400;
    throw error;
  }

  return {
    customerName,
    customerEmail: "",
    customerPhone,
    subject: payload.subject || "WhatsApp complaint",
    description: message,
    department: payload.department || "Customer Support",
    priority: payload.priority || "Medium",
    status: "Open",
    assignedAgent: "",
    category: payload.category || "General",
    channel: "WhatsApp",
  };
}
