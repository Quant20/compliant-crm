import {
  useMemo,
  useState,
} from "react";

import {
  FaEdit,
  FaPlus,
  FaSearch,
  FaUserCheck,
  FaUserClock,
  FaUsers,
} from "react-icons/fa";

import AgentFormModal from "../../components/agents/AgentFormModal";
import { useTickets } from "../../context/TicketContext";

import {
  addAgent,
  getAgents,
  updateAgent,
  updateAgentStatus,
} from "../../services/agentService";

import "./Agents.css";

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getAssignedAgent(ticket) {
  return (
    ticket.assignedAgent ||
    ticket.assignedAgentName ||
    ticket.assigned_agent_name ||
    "Unassigned"
  );
}

function initials(name) {
  return String(name || "Agent")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function Agents() {
  const { tickets = [] } = useTickets();

  const [agentRecords, setAgentRecords] =
    useState(getAgents);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [formOpen, setFormOpen] =
    useState(false);

  const [selectedAgent, setSelectedAgent] =
    useState(null);

  const openCreateForm = () => {
    setSelectedAgent(null);
    setFormOpen(true);
  };

  const openEditForm = (agent) => {
    setSelectedAgent(agent);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setSelectedAgent(null);
  };

  const saveAgent = (formData) => {
    if (selectedAgent) {
      updateAgent(
        selectedAgent.id,
        formData,
      );
    } else {
      addAgent(formData);
    }

    setAgentRecords(getAgents());
  };

  const changeAgentStatus = (
    agentId,
    nextStatus,
  ) => {
    const updatedAgents =
      updateAgentStatus(
        agentId,
        nextStatus,
      );

    setAgentRecords(updatedAgents);
  };

  const agents = useMemo(() => {
    return agentRecords.map((agent) => {
      const assignedTickets =
        tickets.filter(
          (ticket) =>
            normalize(
              getAssignedAgent(ticket),
            ) === normalize(agent.name),
        );

      const activeTickets =
        assignedTickets.filter(
          (ticket) =>
            ![
              "closed",
              "resolved",
            ].includes(
              normalize(ticket.status),
            ),
        ).length;

      const capacity = Number(
        agent.ticketCapacity || 10,
      );

      return {
        ...agent,
        activeTickets,
        capacity,
        utilization:
          capacity > 0
            ? Math.min(
                100,
                Math.round(
                  (activeTickets /
                    capacity) *
                    100,
                ),
              )
            : 0,
      };
    });
  }, [agentRecords, tickets]);

  const filteredAgents = useMemo(() => {
    const query = normalize(searchTerm);

    return agents.filter((agent) => {
      const matchesSearch =
        !query ||
        [
          agent.name,
          agent.email,
          agent.department,
          agent.role,
          agent.employeeId,
        ].some((value) =>
          normalize(value).includes(query),
        );

      const matchesStatus =
        statusFilter === "All" ||
        normalize(agent.status) ===
          normalize(statusFilter);

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    agents,
    searchTerm,
    statusFilter,
  ]);

  const assignableAgents =
    agents.filter(
      (agent) => agent.isAssignable,
    ).length;

  const availableAgents =
    agents.filter(
      (agent) =>
        normalize(agent.status) ===
        "available",
    ).length;

  const busyAgents = agents.filter(
    (agent) =>
      normalize(agent.status) === "busy",
  ).length;

  return (
    <>
      <section className="crm-page-container agents-page">
        <div className="agents-page__header">
          <div>
            <p className="page-eyebrow">
              TEAM MANAGEMENT
            </p>

            <h2>Agents</h2>

            <p>
              Add, update and manage agent
              availability and ticket
              workloads.
            </p>
          </div>

          <button
            type="button"
            className="agents-add-button"
            onClick={openCreateForm}
          >
            <FaPlus />
            Add Agent
          </button>
        </div>

        <div className="agents-summary-grid">
          <article>
            <FaUsers />

            <div>
              <span>
                Assignable agents
              </span>

              <strong>
                {assignableAgents}
              </strong>
            </div>
          </article>

          <article>
            <FaUserCheck />

            <div>
              <span>Available</span>

              <strong>
                {availableAgents}
              </strong>
            </div>
          </article>

          <article>
            <FaUserClock />

            <div>
              <span>Busy</span>

              <strong>
                {busyAgents}
              </strong>
            </div>
          </article>
        </div>

        <div className="agents-panel">
          <div className="agents-toolbar">
            <label className="agents-search">
              <FaSearch />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value,
                  )
                }
                placeholder="Search agents"
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value,
                )
              }
            >
              <option value="All">
                All statuses
              </option>

              <option value="Available">
                Available
              </option>

              <option value="Busy">
                Busy
              </option>

              <option value="Offline">
                Offline
              </option>
            </select>
          </div>

          <div className="agents-table-wrap">
            <table className="agents-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Workload</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredAgents.map(
                  (agent) => (
                    <tr key={agent.id}>
                      <td>
                        <div className="agent-identity">
                          <span className="agent-avatar">
                            {initials(
                              agent.name,
                            )}
                          </span>

                          <div>
                            <strong>
                              {agent.name}
                            </strong>

                            <small>
                              {agent.email}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        {agent.department ||
                          "Not assigned"}
                      </td>

                      <td>
                        {agent.role ||
                          agent.designation}
                      </td>

                      <td>
                        <select
                          className={`agent-status-select agent-status-select--${normalize(
                            agent.status,
                          )}`}
                          value={
                            agent.status ||
                            "Offline"
                          }
                          onChange={(event) =>
                            changeAgentStatus(
                              agent.id,
                              event.target
                                .value,
                            )
                          }
                          aria-label={`Change ${agent.name} status`}
                        >
                          <option value="Available">
                            Available
                          </option>

                          <option value="Busy">
                            Busy
                          </option>

                          <option value="Offline">
                            Offline
                          </option>
                        </select>
                      </td>

                      <td>
                        <div className="agent-capacity-label">
                          <span>
                            {
                              agent.activeTickets
                            }{" "}
                            / {agent.capacity}
                          </span>

                          <strong>
                            {
                              agent.utilization
                            }
                            %
                          </strong>
                        </div>

                        <div className="agent-capacity">
                          <span
                            style={{
                              width: `${agent.utilization}%`,
                            }}
                          />
                        </div>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="agent-edit-button"
                          onClick={() =>
                            openEditForm(
                              agent,
                            )
                          }
                          aria-label={`Edit ${agent.name}`}
                        >
                          <FaEdit />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          {filteredAgents.length ===
            0 && (
            <p className="agents-empty">
              No agents match the selected
              filters.
            </p>
          )}
        </div>
      </section>

      <AgentFormModal
        open={formOpen}
        mode={
          selectedAgent
            ? "edit"
            : "create"
        }
        agent={selectedAgent}
        onClose={closeForm}
        onSave={saveAgent}
      />
    </>
  );
}
