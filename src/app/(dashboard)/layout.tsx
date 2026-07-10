import React from "react";
import { redirect } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import Navbar from "@/components/shared/Navbar";
import { SideBar } from "@/components/shared/Sidebar";
import { getSession } from "@/lib/auth";
import type { UserRole } from "@/lib/nav-items";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const role = session.role as UserRole;

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
        {/* Top Navbar */}
        <Navbar />

        {/* Sidebar + Main Content */}
        <div className="flex flex-1 overflow-hidden">
          <SideBar role={role} />
          <main className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-6">
            <div className="mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
