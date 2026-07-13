"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { getNavItemsByRole, type UserRole, type NavItem } from "@/lib/nav-items";
import { ROUTES } from "@/constants/routes";
import { id as defaultDictionary } from "@/i18n/dictionaries/id";

interface SideBarProps {
  role: UserRole;
}

export function SideBar({ role }: SideBarProps) {
  const pathname = usePathname();
  const items = getNavItemsByRole(role);
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());
  const navCopy = defaultDictionary.nav;

  const toggleMenu = (href: string) => {
    setOpenMenus((prev) => {
      const next = new Set(prev);
      if (next.has(href)) {
        next.delete(href);
      } else {
        next.add(href);
      }
      return next;
    });
  };

  const isActive = (item: NavItem) => {
    if (item.href === ROUTES.dashboard) {
      return pathname === ROUTES.dashboard;
    }
    return pathname === item.href || pathname.startsWith(item.href + "/");
  };

  const hasActiveChild = (item: NavItem) => {
    if (!item.children) return false;
    return item.children.some((child) => isActive(child));
  };

  return (
    <Sidebar
      collapsible="none"
      className="hidden shrink-0 border-r border-sidebar-border md:flex"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {navCopy.menu}
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2">
            <SidebarMenu>
              {items.map((item) => {
                const Icon = item.icon;
                const itemActive = isActive(item);
                const childActive = hasActiveChild(item);
                const isOpen = openMenus.has(item.href) || childActive;

                // Item dengan submenu
                if (item.children && item.children.length > 0) {
                  return (
                    <SidebarMenuItem key={item.href} className="px-1.5">
                      <SidebarMenuButton
                        onClick={() => toggleMenu(item.href)}
                        isActive={itemActive || childActive}
                        className="min-w-0 rounded-lg px-2"
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        <ChevronDown
                          className={cn(
                            "size-4 shrink-0 transition-transform",
                            isOpen ? "rotate-180" : "",
                          )}
                        />
                      </SidebarMenuButton>
                      {isOpen && (
                        <SidebarMenuSub className="mx-2 px-2 py-1">
                          {item.children.map((child) => {
                            const ChildIcon = child.icon;
                            const childIsActive = isActive(child);
                            return (
                              <SidebarMenuSubItem key={child.href}>
                                <SidebarMenuSubButton
                                  render={<Link href={child.href} />}
                                  isActive={childIsActive}
                                  className="min-w-0 gap-2 px-2 text-xs"
                                >
                                  <ChildIcon className="size-3.5 shrink-0" />
                                  <span className="min-w-0 truncate">{child.label}</span>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  );
                }

                // Item biasa tanpa submenu
                return (
                  <SidebarMenuItem key={item.href} className="px-1.5">
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={itemActive}
                      className="min-w-0 rounded-lg px-2"
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="min-w-0 truncate">{item.label}</span>
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

export default SideBar;
