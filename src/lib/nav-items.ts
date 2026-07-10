import {
  LayoutDashboard,
  FileText,
  Users,
  ShieldCheck,
  Bell,
  Settings,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Types                                                                       */
/* -------------------------------------------------------------------------- */

export type UserRole = "ADMIN" | "STAFF" | "EMPLOYEE";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | null;
  /** Jika undefined → semua role boleh akses */
  roles?: UserRole[];
};

export type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

/* -------------------------------------------------------------------------- */
/*  Nav config per role                                                         */
/* -------------------------------------------------------------------------- */

const ALL_ROLES: UserRole[] = ["ADMIN", "STAFF", "EMPLOYEE"];
const ADMIN_STAFF: UserRole[] = ["ADMIN", "STAFF"];
const ADMIN_ONLY: UserRole[] = ["ADMIN"];

export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ALL_ROLES,
  },
  {
    label: "Dokumen",
    href: "/documents",
    icon: FileText,
    roles: ALL_ROLES,
  },
  {
    label: "Verifikasi",
    href: "/verification",
    icon: ClipboardCheck,
    roles: ADMIN_STAFF,
  },
  {
    label: "Notifikasi",
    href: "/notifications",
    icon: Bell,
    roles: ALL_ROLES,
  },
  {
    label: "Pegawai",
    href: "/employees",
    icon: Users,
    roles: ADMIN_ONLY,
  },
  {
    label: "Master Data",
    href: "/master-data",
    icon: LayoutDashboard,
    roles: ADMIN_ONLY,
  },
  {
    label: "Keamanan",
    href: "/security-log",
    icon: ShieldCheck,
    roles: ADMIN_ONLY,
  },
  {
    label: "Pengaturan",
    href: "/settings",
    icon: Settings,
    roles: ADMIN_ONLY,
  },
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/** Filter nav items berdasarkan role user yang sedang login */
export function getNavItemsByRole(role: UserRole): NavItem[] {
  return navItems.filter((item) => !item.roles || item.roles.includes(role));
}
