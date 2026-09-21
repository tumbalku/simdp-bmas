import { notFound } from "next/navigation";

import { requireDashboardRole } from "@/lib/dashboard-auth";
import { PostEditorView } from "@/modules/post/components";
import { getPostById } from "@/modules/post/server";

export const dynamic = "force-dynamic";

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireDashboardRole("STAFF");
  const { id } = await params;
  const post = await getPostById(id);

  if (!post) {
    notFound();
  }

  return <PostEditorView post={post} />;
}
