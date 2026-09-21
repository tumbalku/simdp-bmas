import { redirect } from "next/navigation";

import { routeTo } from "@/constants";

export const dynamic = "force-dynamic";

export default async function LegacyManageAnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(routeTo.announcementsManageEdit(id));
}
