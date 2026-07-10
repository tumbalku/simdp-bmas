import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import Navbar from "@/components/shared/Navbar";
import SideBar from "@/components/shared/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
        {/* Top Navbar */}
        <Navbar />

        {/* Sidebar + Main Content Layout */}
        <div className="flex flex-1 overflow-hidden">
          <SideBar />
          <main className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-6">
            {/*<div className="mx-auto max-w-7xl">*/}
            <div className="mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
