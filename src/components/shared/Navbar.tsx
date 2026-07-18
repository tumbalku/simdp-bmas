"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import {
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { getSessionProfileAction } from "@/modules/auth"
import type { UserRole } from "@/constants/roles"
import { getNavItemsByRole, type NavItem } from "@/config/nav"
import { APP, ROUTES } from "@/constants"
import { NotificationPanel } from "@/components/shared/navbar/NotificationPanel"
import {
  UserProfileMenu,
  type NavbarProfile,
} from "@/components/shared/navbar/UserProfileMenu"

/* -------------------------------------------------------------------------- */
/*  Data hook                                                                   */
/* -------------------------------------------------------------------------- */

function useProfile() {
  const [profile, setProfile] = useState<NavbarProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      try {
        const res = await getSessionProfileAction()
        if (!cancelled && res.ok && res.data) {
          setProfile(res.data)
        }
      } catch (err) {
        console.error("Failed to load profile in Navbar:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadProfile()
    return () => { cancelled = true }
  }, [])

  return { profile, loading }
}

/* -------------------------------------------------------------------------- */
/*  Logo                                                                        */
/* -------------------------------------------------------------------------- */

function LogoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5 text-primary"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M12 11v6" />
      <path d="M9 14h6" />
    </svg>
  )
}

function Logo() {
  return (
    <Link href={ROUTES.dashboard} className="flex items-center gap-2 select-none group">
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
        <LogoIcon />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-bold tracking-tight text-foreground leading-none">{APP.name}</span>
        <span className="text-[10px] font-medium text-muted-foreground mt-0.5 leading-none">
          {APP.organization}
        </span>
      </div>
    </Link>
  )
}

/* -------------------------------------------------------------------------- */
/*  Theme toggle                                                                */
/* -------------------------------------------------------------------------- */

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="size-9 rounded-lg hover:bg-accent"
      aria-label="Toggle Theme"
    >
      {mounted && resolvedTheme === "dark" ? (
        <Sun className="size-4 text-amber-500 transition-all" />
      ) : (
        <Moon className="size-4 text-slate-700 dark:text-slate-300 transition-all" />
      )}
    </Button>
  )
}

/* -------------------------------------------------------------------------- */
/*  Mobile nav                                                                  */
/* -------------------------------------------------------------------------- */

function MobileNavLink({
  item,
  pathname,
  onNavigate,
  open,
  onToggle,
}: {
  item: NavItem
  pathname: string
  onNavigate: () => void
  open: boolean
  onToggle: () => void
}) {
  const Icon = item.icon
  const isActive =
    item.href === ROUTES.dashboard
      ? pathname === ROUTES.dashboard
      : pathname === item.href || pathname.startsWith(item.href + "/")
  const hasChildren = Boolean(item.children?.length)
  const hasActiveChild = item.children?.some((child) =>
    child.href === ROUTES.dashboard
      ? pathname === ROUTES.dashboard
      : pathname === child.href || pathname.startsWith(child.href + "/")
  )
  const isOpen = open || hasActiveChild

  if (!hasChildren) {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-primary",
          isActive ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground"
        )}
      >
        <Icon className="size-4" />
        {item.label}
      </Link>
    )
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-primary",
          isActive || hasActiveChild ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground"
        )}
      >
        <Icon className="size-4" />
        <span className="flex-1">{item.label}</span>
        <ChevronDown className={cn("size-4 transition-transform", isOpen ? "rotate-180" : "")} />
      </button>

      {isOpen ? (
        <div className="ml-5 border-l border-border pl-2">
          {item.children?.map((child) => {
            const ChildIcon = child.icon
            const childActive =
              child.href === ROUTES.dashboard
                ? pathname === ROUTES.dashboard
                : pathname === child.href || pathname.startsWith(child.href + "/")

            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-primary",
                  childActive ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground"
                )}
              >
                <ChildIcon className="size-4" />
                {child.label}
              </Link>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function MobileMenuPanel({
  pathname,
  role,
  onNavigate,
}: {
  pathname: string
  role: UserRole | null
  onNavigate: () => void
}) {
  const items = role ? getNavItemsByRole(role) : []
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set())

  const toggleMenu = (href: string) => {
    setOpenMenus((prev) => {
      const next = new Set(prev)
      if (next.has(href)) {
        next.delete(href)
      } else {
        next.add(href)
      }
      return next
    })
  }

  return (
    <div className="absolute top-14 left-0 w-full bg-card border-b border-border p-3 flex flex-col gap-1 md:hidden animate-in slide-in-from-top-5 duration-200 shadow-lg z-50">
      <nav className="flex flex-col gap-1">
        {items.map((item) => (
          <MobileNavLink
            key={item.href}
            item={item}
            pathname={pathname}
            onNavigate={onNavigate}
            open={openMenus.has(item.href)}
            onToggle={() => toggleMenu(item.href)}
          />
        ))}
      </nav>
    </div>
  )
}

function MobileMenuToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className="size-9 rounded-lg md:hidden hover:bg-accent"
      aria-label="Toggle Mobile Menu"
    >
      {open ? <X className="size-5 text-foreground" /> : <Menu className="size-5 text-foreground" />}
    </Button>
  )
}

/* -------------------------------------------------------------------------- */
/*  Navbar                                                                      */
/* -------------------------------------------------------------------------- */

export default function Navbar() {
  const pathname = usePathname()
  const { profile, loading } = useProfile()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  return (
    <header className="sticky top-0 z-40 w-full shrink-0 border-b border-border bg-card/95 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <Logo />

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <NotificationPanel enabled={Boolean(profile)} userId={profile?.userId} />
          <UserProfileMenu profile={profile} loading={loading} />
          <MobileMenuToggle open={mobileMenuOpen} onToggle={() => setMobileMenuOpen((v) => !v)} />
        </div>
      </div>

      {mobileMenuOpen && (
        <MobileMenuPanel
          pathname={pathname}
          role={(profile?.role as UserRole) ?? null}
          onNavigate={() => setMobileMenuOpen(false)}
        />
      )}
    </header>
  )
}
