import Card from "../ui/Card";
import Button from "../ui/Button";

export default function QuickActions() {
  return (
    <Card title="Quick Actions">
      <div className="quick-actions">
        <Button>New Ticket</Button>
        <Button variant="secondary">Add Customer</Button>
        <Button variant="secondary">Knowledge Base</Button>
        <Button variant="secondary">Reports</Button>
      </div>
    </Card>
  );
}