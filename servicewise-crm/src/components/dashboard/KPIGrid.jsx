import KPICard from "./KPICard";
import { dashboardStats } from "../../data/dashboardData";

export default function KPIGrid() {
  return (
    <div className="kpi-grid">
      {dashboardStats.map((item) => (
        <KPICard
          key={item.id}
          title={item.title}
          value={item.value}
          change={item.change}
        />
      ))}
    </div>
  );
}