import React from "react";
import { redirect } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import Navbar from "@/components/navigation/Navbar";
import { SideBar } from "@/components/navigation/Sidebar";
import { getSession } from "@/lib/auth";
import type { UserRole } from "@/constants/roles";
import { AuthSessionRefresh } from "@/modules/auth/components";
import { getSessionProfile } from "@/modules/auth/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const role = session.role as UserRole;
  const profile = await getSessionProfile(session.userId);

  return (
    <AuthSessionRefresh>
      <SidebarProvider
        className="fixed inset-0 !min-h-0 overflow-hidden"
        style={{ "--sidebar-width": "13rem" } as React.CSSProperties}
      >
        <div className="theme-app-shell grid h-full min-h-0 w-full grid-rows-[3.5rem_minmax(0,1fr)] overflow-hidden bg-background">
          {/* Top Navbar */}
          <Navbar profile={profile} />

          {/* Sidebar + Main Content */}
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <SideBar role={role} />
            <main className="theme-main-surface scrollbar-soft min-w-0 flex-1 overflow-y-auto bg-muted/20 p-4 md:p-6">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </AuthSessionRefresh>
  );
}
