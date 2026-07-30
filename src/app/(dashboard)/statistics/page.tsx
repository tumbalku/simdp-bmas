import { requireDashboardRole } from "@/lib/dashboard-auth";
import StatisticsView from "@/modules/statistics/components/StatisticsView";

export const dynamic = "force-dynamic";

export default async function StatisticsPage() {
  // Guard access: only ADMIN and STAFF roles allowed (min role: STAFF)
  await requireDashboardRole("STAFF");

  return <StatisticsView />;
}
