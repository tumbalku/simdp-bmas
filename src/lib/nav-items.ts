import { FileText, Home, ShieldCheck, UsersRound, LucideIcon } from "lucide-react"

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  badge?: string | null
}

export type NavSection = {
  id: string
  label: string
  basePath: string
  items?: NavItem[]   // ← opsional sekarang. Kosong/undefined = tidak ada sidebar
}

export const navSections: NavSection[] = [
  {
    id: "home",
    label: "Home",
    basePath: "/",
  },
  {
    id: "dashboard",
    label: "Dashboard",
    basePath: "/dashboard",
    items: [
      { label: "Dashboard", icon: Home, href: "/dashboard", badge: null },
      { label: "Dokumen", icon: FileText, href: "/documents", badge: "12" },
    ],
  },
  {
    id: "settings",
    label: "Admin Setting",
    basePath: "/settings",
    items: [
      { label: "Dashboard", icon: Home, href: "/dashboard", badge: null },
      { label: "Dokumen", icon: FileText, href: "/documents", badge: "12" },
    ],
  },
  {
    id: "preview",
    label: "Preview",
    basePath: "/component-preview",
  },
]


export function isSectionActive(section: NavSection, pathname: string): boolean {
  const matchesBasePath =
    section.basePath === "/" ? pathname === "/" : pathname.startsWith(section.basePath)

  return matchesBasePath || (section.items ?? []).some((i) => pathname.startsWith(i.href))
}

export function getActiveSection(pathname: string): NavSection | undefined {
  return navSections.find((section) => isSectionActive(section, pathname))
}