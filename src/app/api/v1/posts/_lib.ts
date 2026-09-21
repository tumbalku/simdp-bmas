import type { AppError } from "@/lib/errors";

export function formatValidationDetails(error: {
  issues: Array<{ path: PropertyKey[]; message: string }>;
}) {
  return error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }));
}

export async function getActorInfo(session: { userId: string; role: string }) {
  const { getActorDisplayName } = await import("@/modules/employee/server");
  const name = await getActorDisplayName(session.userId);
  return { name, role: session.role };
}

export function mapPostError(error: AppError) {
  if (error.code === "UNAUTHENTICATED") return "Sesi tidak valid atau telah berakhir.";
  if (error.code === "FORBIDDEN") return "Anda tidak memiliki akses mengelola pengumuman.";
  return error.message;
}
