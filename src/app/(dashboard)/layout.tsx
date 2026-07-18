import React from "react";
import { redirect } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import Navbar from "@/components/navigation/Navbar";
import { SideBar } from "@/components/navigation/Sidebar";
import { getSession } from "@/lib/auth";
import type { UserRole } from "@/constants/roles";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const role = session.role as UserRole;

  return (
    <SidebarProvider
      className="fixed inset-0 h-dvh !min-h-0 overflow-hidden"
      style={{ "--sidebar-width": "13rem" } as React.CSSProperties}
    >
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-background">
        {/* Top Navbar */}
        <Navbar />

        {/* Sidebar + Main Content */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <SideBar role={role} />
          <main className="scrollbar-soft min-w-0 flex-1 overflow-y-auto bg-muted/20 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
