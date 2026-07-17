import tickets from "../data/tickets";

class TicketService {
  constructor() {
    this.tickets = [...tickets];
  }

  getAllTickets() {
    return this.tickets;
  }

  getTicketById(id) {
    return this.tickets.find((ticket) => ticket.id === id);
  }

  createTicket(ticket) {
    const newTicket = {
      ...ticket,
      id: Date.now(),
      ticketNumber: `SW-${Date.now()}`,
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString(),
      attachments: [],
      comments: [],
      activities: [],
    };

    this.tickets.unshift(newTicket);

    return newTicket;
  }

  updateTicket(id, updates) {
    this.tickets = this.tickets.map((ticket) =>
      ticket.id === id
        ? {
            ...ticket,
            ...updates,
            updatedAt: new Date().toLocaleString(),
          }
        : ticket
    );
  }

  deleteTicket(id) {
    this.tickets = this.tickets.filter((ticket) => ticket.id !== id);
  }
}

export default new TicketService();