import { useNavigate } from "react-router-dom";

import Button from "../ui/Button";
import Card from "../ui/Card";

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <Card title="Quick Actions">
      <div className="quick-actions">
        <Button onClick={() => navigate("/tickets")}>New Ticket</Button>
        <Button
          variant="secondary"
          onClick={() => navigate("/customers")}
        >
          Add Customer
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate("/help-center")}
        >
          Help Center
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate("/reports")}
        >
          Reports
        </Button>
      </div>
    </Card>
  );
}
