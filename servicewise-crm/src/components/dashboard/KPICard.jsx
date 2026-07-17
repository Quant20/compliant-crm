import Card from "../ui/Card";

export default function KPICard({
  title,
  value,
  change,
}) {
  return (
    <Card>
      <h4>{title}</h4>

      <h1>{value}</h1>

      <p>{change} this month</p>
    </Card>
  );
}