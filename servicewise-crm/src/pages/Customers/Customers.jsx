import { useMemo, useState } from "react";
import { FaEnvelope, FaSearch, FaTicketAlt, FaUser } from "react-icons/fa";

import { useTickets } from "../../context/TicketContext";
import "./Customers.css";

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function getCustomer(ticket) {
  return {
    id: ticket.customer?.id || ticket.customer_id || ticket.customer?.email || ticket.id,
    name:
      ticket.customer?.name ||
      ticket.customer_name ||
      ticket.customerName ||
      "Unknown customer",
    email:
      ticket.customer?.email ||
      ticket.customer_email ||
      ticket.customerEmail ||
      "",
    phone:
      ticket.customer?.phone ||
      ticket.customer_phone ||
      ticket.customerPhone ||
      "",
  };
}

function initials(name) {
  return String(name || "Customer")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function Customers() {
  const { tickets = [] } = useTickets();
  const [searchTerm, setSearchTerm] = useState("");

  const customers = useMemo(() => {
    const customerMap = new Map();

    tickets.forEach((ticket) => {
      const customer = getCustomer(ticket);
      const key = String(customer.id || customer.email || customer.name);
      const existing = customerMap.get(key) || {
        ...customer,
        totalTickets: 0,
        openTickets: 0,
        latestTicketAt: "",
      };

      existing.totalTickets += 1;

      const status = normalize(ticket.status);
      if (!["closed", "resolved"].includes(status)) {
        existing.openTickets += 1;
      }

      const ticketDate =
        ticket.updatedAt || ticket.updated_at || ticket.createdAt || ticket.created_at || "";

      if (
        ticketDate &&
        (!existing.latestTicketAt ||
          new Date(ticketDate).getTime() > new Date(existing.latestTicketAt).getTime())
      ) {
        existing.latestTicketAt = ticketDate;
      }

      customerMap.set(key, existing);
    });

    return Array.from(customerMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [tickets]);

  const filteredCustomers = useMemo(() => {
    const query = normalize(searchTerm);
    if (!query) return customers;

    return customers.filter((customer) =>
      [customer.name, customer.email, customer.phone].some((value) =>
        normalize(value).includes(query),
      ),
    );
  }, [customers, searchTerm]);

  const customersWithOpenTickets = customers.filter(
    (customer) => customer.openTickets > 0,
  ).length;

  return (
    <section className="crm-page-container customers-page">
      <div className="customers-page__header">
        <div>
          <p className="page-eyebrow">CUSTOMER DIRECTORY</p>
          <h2>Customers</h2>
          <p>Customer profiles are rebuilt automatically from recovered ticket data.</p>
        </div>
      </div>

      <div className="customers-summary-grid">
        <article>
          <FaUser />
          <div>
            <span>Total customers</span>
            <strong>{customers.length}</strong>
          </div>
        </article>
        <article>
          <FaTicketAlt />
          <div>
            <span>Customers with open tickets</span>
            <strong>{customersWithOpenTickets}</strong>
          </div>
        </article>
        <article>
          <FaEnvelope />
          <div>
            <span>Customer tickets</span>
            <strong>{tickets.length}</strong>
          </div>
        </article>
      </div>

      <div className="customers-panel">
        <div className="customers-toolbar">
          <div>
            <h3>Customer records</h3>
            <p>{filteredCustomers.length} customer(s) found</p>
          </div>

          <label className="customers-search">
            <FaSearch aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search name, email or phone"
            />
          </label>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="customers-empty-state">
            <FaUser />
            <h3>No customers found</h3>
            <p>Customers will appear when tickets contain customer information.</p>
          </div>
        ) : (
          <div className="customer-grid">
            {filteredCustomers.map((customer) => (
              <article className="customer-card" key={String(customer.id)}>
                <div className="customer-card__avatar">{initials(customer.name)}</div>
                <div className="customer-card__body">
                  <h3>{customer.name}</h3>
                  <p>{customer.email || "No email recorded"}</p>
                  <p>{customer.phone || "No phone recorded"}</p>
                  <div className="customer-card__stats">
                    <span>{customer.totalTickets} total</span>
                    <span>{customer.openTickets} open</span>
                  </div>
                  <small>
                    Last activity: {customer.latestTicketAt ? new Date(customer.latestTicketAt).toLocaleString("en-PK") : "Not available"}
                  </small>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
