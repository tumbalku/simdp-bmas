import { requireDashboardRole } from "@/lib/dashboard-auth";
import { ManagePostsView } from "@/modules/post/components";
import { getAnnouncementAttachmentLimits } from "@/modules/post/server";

export const dynamic = "force-dynamic";

export default async function ManageAnnouncementPage() {
  await requireDashboardRole("STAFF");
  const attachmentLimits = await getAnnouncementAttachmentLimits();

  return <ManagePostsView attachmentLimits={attachmentLimits} />;
}
