import {
  LayoutDashboard,
  FileText,
  BarChart3,
  ShieldCheck,
  Settings,
  ClipboardCheck,
  Database,
  FolderOpen,
  UserCog,
  Layers,
  type LucideIcon,
} from "lucide-react";

import { ROUTES } from "@/constants/routes";
import { ROLE_GROUPS, type UserRole } from "@/constants/roles";
import { id as defaultDictionary } from "@/i18n/dictionaries/id";

/* -------------------------------------------------------------------------- */
/*  Types                                                                       */
/* -------------------------------------------------------------------------- */

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | null;
  /** Jika undefined → semua role boleh akses */
  roles?: readonly UserRole[];
  /** Nested submenu items */
  children?: NavItem[];
};

export type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

/* -------------------------------------------------------------------------- */
/*  Nav config per role                                                         */
/* -------------------------------------------------------------------------- */

const navCopy = defaultDictionary.nav;

export const navItems = [
  {
    label: navCopy.dashboard,
    href: ROUTES.dashboard,
    icon: LayoutDashboard,
    roles: ROLE_GROUPS.all,
  },
  {
    label: navCopy.documents,
    href: ROUTES.documents,
    icon: FileText,
    roles: ROLE_GROUPS.all,
  },
  {
    label: navCopy.verification,
    href: ROUTES.verification,
    icon: ClipboardCheck,
    roles: ROLE_GROUPS.adminStaff,
  },
  {
    label: navCopy.statistics,
    href: ROUTES.statistics,
    icon: BarChart3,
    roles: ROLE_GROUPS.adminStaff,
  },
  {
    label: navCopy.masterData,
    href: ROUTES.masterData,
    icon: Database,
    roles: ROLE_GROUPS.adminOnly,
    children: [
      {
        label: navCopy.masterDataDocuments,
        href: ROUTES.masterDataDocuments,
        icon: FolderOpen,
        roles: ROLE_GROUPS.adminOnly,
      },
      {
        label: navCopy.masterDataEmployees,
        href: ROUTES.masterDataEmployees,
        icon: UserCog,
        roles: ROLE_GROUPS.adminOnly,
      },
      {
        label: navCopy.masterDataCategories,
        href: ROUTES.masterDataCategories,
        icon: Layers,
        roles: ROLE_GROUPS.adminOnly,
      },
    ],
  },
  {
    label: navCopy.security,
    href: ROUTES.securityLog,
    icon: ShieldCheck,
    roles: ROLE_GROUPS.adminOnly,
  },
  {
    label: navCopy.settings,
    href: ROUTES.settings,
    icon: Settings,
    roles: ROLE_GROUPS.adminOnly,
  },
] as const satisfies readonly NavItem[];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/** Filter nav items berdasarkan role user yang sedang login */
export function getNavItemsByRole(role: UserRole): NavItem[] {
  return navItems.filter((item) => !item.roles || (item.roles as readonly UserRole[]).includes(role));
}
