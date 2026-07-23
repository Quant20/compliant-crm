const urgentKeywords = [
  "fraud",
  "stolen",
  "double charged",
  "payment deducted",
  "account blocked",
  "security",
];

export function applyBasicAutomation(ticketInput) {
  const content = `${ticketInput.subject || ""} ${ticketInput.description || ""}`.toLowerCase();
  const isUrgent = urgentKeywords.some((keyword) => content.includes(keyword));

  return {
    ...ticketInput,
    priority: isUrgent ? "High" : ticketInput.priority || "Medium",
    department:
      content.includes("payment") || content.includes("settlement")
        ? "Finance"
        : ticketInput.department || "Customer Support",
  };
}
