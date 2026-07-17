import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Input from "../../components/ui/Input";

export default function Dashboard() {
  return (
    <>
      <h1>Dashboard</h1>

      <Card title="UI Components Preview">
        <Input label="Customer Name" placeholder="Enter customer name" />

        <Badge color="success">Open</Badge>

        <br />
        <br />

        <Button>Primary Button</Button>
      </Card>
    </>
  );
}