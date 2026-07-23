const FIELD_ALIASES = {
  "issue type": "issueType",
  issue: "issueType",
  category: "issueType",
  "retailer id": "retailerId",
  retailer: "retailerId",
  "transaction id": "transactionId",
  "txn id": "transactionId",
  transaction: "transactionId",
  "voucher id": "voucherId",
  voucher: "voucherId",
  amount: "amount",
  "transaction amount": "amount",
  "voucher amount": "amount",
  priority: "priority",
  description: "description",
  details: "description",
  problem: "description",
  "registered phone": "registeredPhone",
  "phone number": "registeredPhone",
  phone: "registeredPhone",
};

const FIELD_LABELS = {
  issueType: "Issue Type",
  retailerId: "Retailer ID",
  transactionId: "Transaction ID",
  voucherId: "Voucher ID",
  amount: "Amount",
  priority: "Priority",
  description: "Description",
  registeredPhone: "Registered Phone",
};

const normalizeKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

export const parseMessageFields = (body) => {
  const fields = {};

  String(body || "")
    .split(/\r?\n/)
    .forEach((line) => {
      const separatorIndex = line.indexOf(":");

      if (separatorIndex === -1) {
        return;
      }

      const rawKey = line.slice(0, separatorIndex);
      const rawValue = line.slice(separatorIndex + 1).trim();
      const normalizedKey = normalizeKey(rawKey);
      const fieldName = FIELD_ALIASES[normalizedKey];

      if (fieldName && rawValue) {
        fields[fieldName] = rawValue;
      }
    });

  return fields;
};

export const parseStructuredWhatsAppMessage = (body) => {
  const value = String(body || "").trim();
  const firstLine = value.split(/\r?\n/)[0]?.trim() || "";

  const newTicketMatch = firstLine.match(/^#NEW_TICKET\b/i);
  const completeMatch = firstLine.match(
    /^#COMPLETE\s+([A-Z0-9-]+)\b/i,
  );
  const updateMatch = firstLine.match(
    /^#UPDATE\s+([A-Z0-9-]+)\b/i,
  );

  if (newTicketMatch) {
    return {
      type: "new_ticket",
      reference: "",
      fields: parseMessageFields(value),
    };
  }

  if (completeMatch) {
    return {
      type: "complete",
      reference: completeMatch[1].toUpperCase(),
      fields: parseMessageFields(value),
    };
  }

  if (updateMatch) {
    const remainingLines = value.split(/\r?\n/).slice(1);

    return {
      type: "update",
      reference: updateMatch[1].toUpperCase(),
      fields: {
        description: remainingLines.join("\n").trim(),
      },
    };
  }

  return {
    type: "normal",
    reference: "",
    fields: {},
  };
};

export const getRequiredFields = (issueType) => {
  const normalized = normalizeKey(issueType);

  if (
    normalized.includes("payment") ||
    normalized.includes("settlement") ||
    normalized.includes("transaction")
  ) {
    return [
      "issueType",
      "retailerId",
      "transactionId",
      "amount",
      "description",
    ];
  }

  if (normalized.includes("voucher")) {
    return [
      "issueType",
      "retailerId",
      "voucherId",
      "amount",
      "description",
    ];
  }

  if (
    normalized.includes("account") ||
    normalized.includes("kyc") ||
    normalized.includes("blocked")
  ) {
    return [
      "issueType",
      "retailerId",
      "registeredPhone",
      "description",
    ];
  }

  return [
    "issueType",
    "retailerId",
    "description",
  ];
};

export const getMissingFields = (fields) => {
  return getRequiredFields(fields.issueType).filter(
    (fieldName) =>
      !String(fields[fieldName] || "").trim(),
  );
};

export const getFieldLabel = (fieldName) =>
  FIELD_LABELS[fieldName] || fieldName;

export const buildMissingDetailsReply = ({
  reference,
  fields,
  missingFields,
}) => {
  const missingLines = missingFields
    .map(
      (fieldName) =>
        `• ${getFieldLabel(fieldName)}`,
    )
    .join("\n");

  const completionTemplate = missingFields
    .map(
      (fieldName) =>
        `${getFieldLabel(fieldName)}:`,
    )
    .join("\n");

  return [
    `Your request ${reference} has not been ticketed yet.`,
    "",
    "Missing information:",
    missingLines,
    "",
    "Please reply using:",
    "",
    `#COMPLETE ${reference}`,
    completionTemplate,
  ].join("\n");
};

export const createPendingReference = (pendingRequests) => {
  const highestNumber = (pendingRequests || []).reduce(
    (highest, request) => {
      const number = Number(
        String(request.reference || "").replace(/\D/g, ""),
      );

      return Number.isNaN(number)
        ? highest
        : Math.max(highest, number);
    },
    1000,
  );

  return `WA-REQ-${highestNumber + 1}`;
};
