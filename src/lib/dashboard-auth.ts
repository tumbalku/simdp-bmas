import { redirect } from "next/navigation";

import { ROUTES } from "@/constants";
import { getSession, hasRolePermission } from "@/lib/auth";

export async function requireDashboardRole(minRole: string) {
  const session = await getSession();

  if (!session) {
    redirect(ROUTES.login);
  }

  if (!hasRolePermission(session.role, minRole)) {
    redirect(ROUTES.dashboard);
  }

  return session;
}
