"use client";

import { type CSSProperties, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/utils";
import type { UserRole } from "@/constants/roles";
import { getNavItemsByRole, type NavItem } from "@/config/nav";
import { ROUTES } from "@/constants/routes";
import { id as defaultDictionary } from "@/i18n/dictionaries/id";

interface SideBarProps {
  role: UserRole;
}

export function SideBar({ role }: SideBarProps) {
  const pathname = usePathname();
  const items = getSidebarItemsByRole(role);
  const [collapsed, setCollapsed] = useState(false);
  const navCopy = defaultDictionary.nav;

  const isActive = (item: NavItem) => {
    if (item.href === ROUTES.dashboard) {
      return pathname === ROUTES.dashboard;
    }
    return pathname === item.href || pathname.startsWith(item.href + "/");
  };

  return (
    <Sidebar
      collapsible="none"
      className="hidden shrink-0 overflow-hidden border-r border-sidebar-border transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:flex"
      style={
        {
          "--sidebar-width": collapsed ? "3.75rem" : "13rem",
        } as CSSProperties
      }
      data-collapsed={collapsed}
    >
      <SidebarContent>
        <SidebarGroup className="gap-2">
          <div
            className={cn(
              "flex h-8 items-center px-2",
              collapsed ? "justify-center" : "justify-between",
            )}
          >
            <SidebarGroupLabel
              className={cn(
                "h-auto overflow-hidden px-0 text-xs font-semibold uppercase tracking-wider whitespace-nowrap text-muted-foreground transition-[width,opacity,transform] duration-300 ease-out",
                collapsed ? "w-0 -translate-x-2 opacity-0" : "w-auto translate-x-0 opacity-100",
              )}
              aria-hidden={collapsed}
            >
              {navCopy.menu}
            </SidebarGroupLabel>
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-[background-color,color,transform] duration-300 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:scale-105 focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none"
              aria-label={collapsed ? "Perluas menu samping" : "Ciutkan menu samping"}
              aria-expanded={!collapsed}
              title={collapsed ? "Perluas menu" : "Ciutkan menu"}
            >
              {collapsed ? (
                <PanelLeftOpen className="size-4" aria-hidden="true" />
              ) : (
                <PanelLeftClose className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>

          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const Icon = item.icon;
                const itemActive = isActive(item);

                return (
                  <SidebarMenuItem
                    key={item.href}
                    className="w-full px-1.5"
                  >
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={itemActive}
                      title={item.label}
                      className={cn(
                        "min-w-0 rounded-lg transition-[width,height,gap,padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        collapsed ? "w-full gap-0 px-2" : "w-full gap-2 px-2",
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span
                        className={cn(
                          "min-w-0 overflow-hidden truncate whitespace-nowrap transition-[max-width,opacity,transform] duration-300 ease-out",
                          collapsed ? "max-w-0 -translate-x-2 opacity-0" : "max-w-36 translate-x-0 opacity-100",
                        )}
                        aria-hidden={collapsed}
                      >
                        {item.label}
                      </span>
                    </SidebarMenuButton>
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

function getSidebarItemsByRole(role: UserRole): NavItem[] {
  return getNavItemsByRole(role).flatMap((item) => {
    if (!item.children?.length) {
      return [item];
    }

    return item.children.filter((child) => canAccessNavItem(child, role));
  });
}

function canAccessNavItem(item: NavItem, role: UserRole) {
  return !item.roles || item.roles.includes(role);
}

export default SideBar;
