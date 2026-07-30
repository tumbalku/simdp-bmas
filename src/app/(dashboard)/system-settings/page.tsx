import { redirect } from "next/navigation";

import { ROUTES } from "@/constants";
import { requireAuth } from "@/lib/auth";
import { getSystemSettings } from "@/modules/settings/server";
import { SettingsPageView } from "@/modules/settings/components/SettingsPageView";

export const dynamic = "force-dynamic";

export default async function SystemSettingsPage() {
  const session = await requireAuth();
  if (session.role !== "ADMIN") {
    redirect(ROUTES.dashboard);
  }

  const settings = await getSystemSettings();

  return <SettingsPageView settings={settings} />;
}
