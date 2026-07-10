"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { getActiveSection } from "@/lib/nav-items";

export function SideBar() {
  const pathname = usePathname();
  const section = getActiveSection(pathname);

  // Section tidak ditemukan, atau ditemukan tapi tidak punya item sidebar
  if (!section || !section.items || section.items.length === 0) {
    return null;
  }

  return (
    <Sidebar className="md:top-14 md:h-[calc(100vh-3.5rem)]">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {section.label}
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2">
            <SidebarMenu>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                return (
                  <SidebarMenuItem key={item.label} className="px-2">
                    <SidebarMenuButton render={<Link href={item.href} />} isActive={isActive} className="rounded-lg">
                      <Icon className="size-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                    {item.badge ? (
                      <SidebarMenuBadge className="right-4 bg-primary/10 text-primary font-medium text-xs rounded-full px-2 py-0.5">
                        {item.badge}
                      </SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default SideBar;