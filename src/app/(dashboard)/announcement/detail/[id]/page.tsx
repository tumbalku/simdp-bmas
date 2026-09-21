import { notFound } from "next/navigation";

import { requireAuth } from "@/lib/auth";
import { PostDetailView } from "@/modules/post/components";
import { getPostByIdForUser } from "@/modules/post/server";

export const dynamic = "force-dynamic";

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth("EMPLOYEE");
  const { id } = await params;
  const post = await getPostByIdForUser(id, {
    userId: session.userId,
    role: session.role,
    employeeId: session.employeeId ?? null,
    workplaceId: null,
    employeeGroupId: null,
  });

  if (!post) {
    notFound();
  }

  const canManage = session.role === "ADMIN" || session.role === "STAFF";
  const canDelete = session.role === "ADMIN" || (session.role === "STAFF" && post.authorId === session.userId);

  return <PostDetailView post={post} canEdit={canManage} canDelete={canDelete} />;
}
