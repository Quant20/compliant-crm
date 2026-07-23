export const MOCK_WHATSAPP_STORAGE_KEY =
  "servicewise_mock_whatsapp_inbox_v1";

export const MOCK_WHATSAPP_TICKETS_KEY =
  "servicewise_mock_whatsapp_tickets_v1";

export const MOCK_WHATSAPP_PENDING_KEY =
  "servicewise_mock_whatsapp_pending_v1";

export const mockIncomingScenarios = [
  {
    body:
      "Payment was deducted but the retailer has still not received the amount. Transaction ID TXN-984521.",
    senderRole: "Retailer",
  },
  {
    body:
      "The voucher is showing rejected. Please check voucher VCH-44291.",
    senderRole: "Retailer",
  },
  {
    body:
      "Retailer account is blocked after KYC update. Retailer ID RTL-2038.",
    senderRole: "ASM",
  },
  {
    body:
      "Any update on the payment complaint shared yesterday?",
    senderRole: "Retailer",
  },
  {
    body:
      "Good morning team.",
    senderRole: "Retailer",
  },
  {
    body:
      "Thank you, the issue has been resolved.",
    senderRole: "Retailer",
  },
  {
    body:
      "Please share today's settlement report when available.",
    senderRole: "ASM",
  },
];

export const createInitialMockConversations = () => [
  {
    id: "wa-group-karachi-south",
    type: "group",
    name: "Karachi Retailers — ASM South",
    businessNumber: "+92 300 0000000",
    groupId: "mock-group-001",
    participants: [
      {
        name: "Ahmed Retailer",
        role: "Retailer",
        phone: "+92 300 1112233",
      },
      {
        name: "Usman Khan",
        role: "ASM",
        phone: "+92 301 7778899",
      },
      {
        name: "ServiceWise Support",
        role: "Support",
        phone: "+92 300 0000000",
      },
    ],
    unreadCount: 4,
    lastMessageAt: "2026-07-22T11:40:00.000Z",
    messages: [
      {
        id: "msg-khi-1",
        senderName: "Ahmed Retailer",
        senderRole: "Retailer",
        senderPhone: "+92 300 1112233",
        direction: "inbound",
        body: "Good morning team.",
        createdAt: "2026-07-22T10:05:00.000Z",
        reviewStatus: "no_ticket",
        decisionNote: "Greeting only",
      },
      {
        id: "msg-khi-2",
        senderName: "Ahmed Retailer",
        senderRole: "Retailer",
        senderPhone: "+92 300 1112233",
        direction: "inbound",
        body:
          "Payment was deducted but the retailer did not receive it. Transaction ID TXN-84920.",
        createdAt: "2026-07-22T10:08:00.000Z",
        reviewStatus: "unreviewed",
      },
      {
        id: "msg-khi-3",
        senderName: "Usman Khan",
        senderRole: "ASM",
        senderPhone: "+92 301 7778899",
        direction: "inbound",
        body:
          "Support team, please check this transaction urgently.",
        createdAt: "2026-07-22T10:10:00.000Z",
        reviewStatus: "unreviewed",
      },
      {
        id: "msg-khi-4",
        senderName: "ServiceWise Support",
        senderRole: "Support",
        senderPhone: "+92 300 0000000",
        direction: "outbound",
        body:
          "We are checking TXN-84920 and will update the group.",
        createdAt: "2026-07-22T10:14:00.000Z",
        reviewStatus: "conversation_only",
      },
      {
        id: "msg-khi-5",
        senderName: "Ahmed Retailer",
        senderRole: "Retailer",
        senderPhone: "+92 300 1112233",
        direction: "inbound",
        body: "It is still pending. Any update?",
        createdAt: "2026-07-22T11:40:00.000Z",
        reviewStatus: "unreviewed",
      },
    ],
  },
  {
    id: "wa-direct-retailer-ahmed",
    type: "direct",
    name: "Ahmed Retailer",
    businessNumber: "+92 300 0000000",
    contactPhone: "+92 300 1112233",
    participants: [
      {
        name: "Ahmed Retailer",
        role: "Retailer",
        phone: "+92 300 1112233",
      },
      {
        name: "ServiceWise Support",
        role: "Support",
        phone: "+92 300 0000000",
      },
    ],
    unreadCount: 2,
    lastMessageAt: "2026-07-22T09:32:00.000Z",
    messages: [
      {
        id: "msg-ahmed-1",
        senderName: "Ahmed Retailer",
        senderRole: "Retailer",
        senderPhone: "+92 300 1112233",
        direction: "inbound",
        body:
          "My retailer account is blocked after the KYC update. Retailer ID RTL-2038.",
        createdAt: "2026-07-22T09:24:00.000Z",
        reviewStatus: "unreviewed",
      },
      {
        id: "msg-ahmed-2",
        senderName: "Ahmed Retailer",
        senderRole: "Retailer",
        senderPhone: "+92 300 1112233",
        direction: "inbound",
        body:
          "I have already shared the documents yesterday.",
        createdAt: "2026-07-22T09:32:00.000Z",
        reviewStatus: "unreviewed",
      },
    ],
  },
  {
    id: "wa-group-hyderabad",
    type: "group",
    name: "Hyderabad Retailer Support",
    businessNumber: "+92 300 0000000",
    groupId: "mock-group-002",
    participants: [
      {
        name: "Sana Retailer",
        role: "Retailer",
        phone: "+92 333 5050607",
      },
      {
        name: "Fahad Ali",
        role: "ASM",
        phone: "+92 321 9090101",
      },
      {
        name: "ServiceWise Support",
        role: "Support",
        phone: "+92 300 0000000",
      },
    ],
    unreadCount: 1,
    lastMessageAt: "2026-07-21T15:25:00.000Z",
    messages: [
      {
        id: "msg-hyd-1",
        senderName: "Sana Retailer",
        senderRole: "Retailer",
        senderPhone: "+92 333 5050607",
        direction: "inbound",
        body:
          "Voucher VCH-44291 is showing rejected although all details are correct.",
        createdAt: "2026-07-21T15:12:00.000Z",
        reviewStatus: "ticket_created",
        linkedTicketNumber: "WA-DEMO-001",
        linkedTicketId: "demo-ticket-001",
      },
      {
        id: "msg-hyd-2",
        senderName: "Fahad Ali",
        senderRole: "ASM",
        senderPhone: "+92 321 9090101",
        direction: "inbound",
        body:
          "Please also share today's settlement report.",
        createdAt: "2026-07-21T15:25:00.000Z",
        reviewStatus: "unreviewed",
      },
    ],
  },
  {
    id: "wa-direct-sana",
    type: "direct",
    name: "Sana Customer",
    businessNumber: "+92 300 0000000",
    contactPhone: "+92 333 5050607",
    participants: [
      {
        name: "Sana Customer",
        role: "Customer",
        phone: "+92 333 5050607",
      },
      {
        name: "ServiceWise Support",
        role: "Support",
        phone: "+92 300 0000000",
      },
    ],
    unreadCount: 0,
    lastMessageAt: "2026-07-20T16:40:00.000Z",
    messages: [
      {
        id: "msg-sana-1",
        senderName: "Sana Customer",
        senderRole: "Customer",
        senderPhone: "+92 333 5050607",
        direction: "inbound",
        body: "Thank you. The issue has been resolved.",
        createdAt: "2026-07-20T16:40:00.000Z",
        reviewStatus: "no_ticket",
        decisionNote: "Resolution confirmation",
      },
    ],
  },
];

export const createInitialMockTickets = () => [
  {
    id: "demo-ticket-001",
    ticketNumber: "WA-DEMO-001",
    subject: "Voucher rejected — VCH-44291",
    description:
      "Voucher VCH-44291 is showing rejected although all details are correct.",
    status: "Open",
    priority: "Medium",
    category: "Voucher Issue",
    source: "WhatsApp",
    conversationName: "Hyderabad Retailer Support",
    senderName: "Sana Retailer",
    createdAt: "2026-07-21T15:15:00.000Z",
  },
];
