import { requireDashboardRole } from "@/lib/dashboard-auth";
import { PostFeedView } from "@/modules/post/components";

export const dynamic = "force-dynamic";

export default async function AnnouncementPage() {
  const session = await requireDashboardRole("EMPLOYEE");

  return <PostFeedView canManage={session.role === "ADMIN" || session.role === "STAFF"} />;
}
