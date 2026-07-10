"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import {
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  Settings,
  Menu,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logoutAction, getSessionProfileAction } from "@/modules/auth/actions"
import { getNavItemsByRole, type NavItem, type UserRole } from "@/lib/nav-items"

/* -------------------------------------------------------------------------- */
/*  Types & constants                                                           */
/* -------------------------------------------------------------------------- */

type Profile = {
  name: string
  email: string
  role: string
  avatarUrl: string | null
  employeeId: string | null
}

const ROLE_BADGE_STYLES: Record<string, string> = {
  ADMIN: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/20",
  STAFF: "bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 border border-sky-500/20",
}
const DEFAULT_ROLE_BADGE =
  "bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400 border border-slate-500/20"

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  STAFF: "Staff",
  EMPLOYEE: "Pegawai",
}

function getRoleBadgeStyle(role: string) {
  return ROLE_BADGE_STYLES[role] ?? DEFAULT_ROLE_BADGE
}

function getInitials(name: string) {
  if (!name) return "U"
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
}

/* -------------------------------------------------------------------------- */
/*  Data hook                                                                   */
/* -------------------------------------------------------------------------- */

function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
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
    <Link href="/dashboard" className="flex items-center gap-2 select-none group">
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
        <LogoIcon />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-bold tracking-tight text-foreground leading-none">SIMDP</span>
        <span className="text-[10px] font-medium text-muted-foreground mt-0.5 leading-none">
          RSUD Bahteramas
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
/*  Profile menu                                                               */
/* -------------------------------------------------------------------------- */

function ProfileMenu({ profile, loading }: { profile: Profile | null; loading: boolean }) {
  const handleLogout = async () => {
    try {
      const res = await logoutAction()
      if (res.ok) {
        window.location.href = "/login"
      }
    } catch (err) {
      console.error("Logout error in Navbar:", err)
    }
  }

  if (loading) {
    return (
      <div className="flex h-9 w-9 items-center justify-center">
        <div className="size-8 rounded-full bg-muted animate-pulse" />
      </div>
    )
  }

  if (!profile) {
    return (
      <Button render={<Link href="/login" />} nativeButton={false} size="sm" variant="default" className="rounded-lg h-8 px-4">
        Masuk
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button className="flex items-center justify-center rounded-full transition-transform hover:scale-105 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Avatar size="default">
              {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={profile.name} />}
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl">
        <div className="px-3 py-2 text-xs font-normal">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground truncate max-w-[120px]">{profile.name}</p>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-medium leading-none select-none uppercase",
                  getRoleBadgeStyle(profile.role)
                )}
              >
                {ROLE_LABEL[profile.role] ?? profile.role}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href={profile.employeeId ? `/employees/${profile.employeeId}` : "/dashboard"} />}>
          <UserIcon className="size-4 mr-2 text-muted-foreground" />
          Profil Saya
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/settings" />}>
          <Settings className="size-4 mr-2 text-muted-foreground" />
          Pengaturan
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} variant="destructive" className="flex items-center cursor-pointer">
          <LogOut className="size-4 mr-2" />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* -------------------------------------------------------------------------- */
/*  Mobile nav                                                                  */
/* -------------------------------------------------------------------------- */

function MobileNavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem
  pathname: string
  onNavigate: () => void
}) {
  const Icon = item.icon
  const isActive =
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === item.href || pathname.startsWith(item.href + "/")

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 text-sm py-2 px-3 rounded-lg transition-colors hover:bg-accent hover:text-primary",
        isActive ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground"
      )}
    >
      <Icon className="size-4" />
      {item.label}
    </Link>
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

  return (
    <div className="absolute top-14 left-0 w-full bg-card border-b border-border p-3 flex flex-col gap-1 md:hidden animate-in slide-in-from-top-5 duration-200 shadow-lg z-50">
      <nav className="flex flex-col gap-1">
        {items.map((item) => (
          <MobileNavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
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
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/95 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <Logo />

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ProfileMenu profile={profile} loading={loading} />
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
