import Card from "../ui/Card";

const activities = [
  "Ali Khan created Ticket TK-1001",
  "Sara Ahmed replied to Ticket TK-1002",
  "Ahmed Raza resolved Ticket TK-0998",
  "Fatima Noor updated customer profile",
];

export default function RecentActivity() {
  return (
    <Card title="Recent Activity">
      <ul className="activity-list">
        {activities.map((activity, index) => (
          <li key={index}>{activity}</li>
        ))}
      </ul>
    </Card>
  );
}