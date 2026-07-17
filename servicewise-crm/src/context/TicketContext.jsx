import { createContext, useContext, useState } from "react";
import ticketService from "../services/ticketService";

const TicketContext = createContext();

export function TicketProvider({ children }) {
  const [tickets, setTickets] = useState(ticketService.getAllTickets());

  const createTicket = (ticket) => {
    ticketService.createTicket(ticket);
    setTickets([...ticketService.getAllTickets()]);
  };

  const updateTicket = (id, updates) => {
    ticketService.updateTicket(id, updates);
    setTickets([...ticketService.getAllTickets()]);
  };

  const deleteTicket = (id) => {
    ticketService.deleteTicket(id);
    setTickets([...ticketService.getAllTickets()]);
  };

  return (
    <TicketContext.Provider
      value={{
        tickets,
        createTicket,
        updateTicket,
        deleteTicket,
      }}
    >
      {children}
    </TicketContext.Provider>
  );
}

export function useTickets() {
  return useContext(TicketContext);
}