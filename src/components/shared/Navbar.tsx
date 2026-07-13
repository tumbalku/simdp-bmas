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
  ChevronDown,
  Bell,
  CheckCheck,
  FileText,
  Inbox,
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
import {
  getNotifications,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/modules/notification/actions"
import type { UserRole } from "@/constants/roles"
import { getNavItemsByRole, type NavItem } from "@/lib/nav-items"
import { APP, DATE_FORMATS, DATE_LOCALE, PAGINATION, ROLE_LABELS, ROUTES, routeTo } from "@/constants"

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

type NotificationItem = {
  id: string
  type: string
  title: string
  message: string | null
  isRead: boolean
  relatedEntityType: string | null
  relatedEntityId: string | null
  createdAt: string
}

const ROLE_BADGE_STYLES: Record<string, string> = {
  ADMIN: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/20",
  STAFF: "bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 border border-sky-500/20",
}
const DEFAULT_ROLE_BADGE =
  "bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400 border border-slate-500/20"

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

function useNotifications(enabled: boolean) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(enabled)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    async function loadNotifications() {
      try {
        const res = await getNotifications({
          page: PAGINATION.defaultPage,
          pageSize: PAGINATION.navbarNotificationLimit,
        })
        if (!cancelled && res.ok) {
          setNotifications(res.data)
          setUnreadCount(res.meta.unreadCount)
        }
      } catch (err) {
        console.error("Failed to load notifications in Navbar:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadNotifications()
    return () => { cancelled = true }
  }, [enabled])

  return { notifications, unreadCount, setNotifications, setUnreadCount, loading }
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
/*  Notification menu                                                           */
/* -------------------------------------------------------------------------- */

function NotificationMenu({ enabled }: { enabled: boolean }) {
  const {
    notifications,
    unreadCount,
    setNotifications,
    setUnreadCount,
    loading,
  } = useNotifications(enabled)

  if (!enabled) return null

  const handleMarkAllRead = async () => {
    const res = await markAllNotificationsReadAction()
    if (!res.ok) return
    setNotifications((items) => items.map((item) => ({ ...item, isRead: true })))
    setUnreadCount(0)
  }

  const handleMarkRead = async (id: string) => {
    const res = await markNotificationReadAction(id)
    if (!res.ok) return
    setNotifications((items) =>
      items.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    )
    setUnreadCount((count) => Math.max(0, count - 1))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            className="relative flex size-9 items-center justify-center rounded-lg outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Buka notifikasi"
          >
            <Bell className="size-4 text-slate-700 dark:text-slate-300" />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground shadow-sm">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </button>
        }
      />
      <DropdownMenuContent align="end" className="mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-xl p-0">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Notifikasi</p>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} belum dibaca` : "Semua sudah dibaca"}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="h-8 px-2 text-xs"
          >
            <CheckCheck className="size-3.5" />
            Tandai semua
          </Button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {loading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
              <Inbox className="size-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Belum ada notifikasi</p>
                <p className="text-xs text-muted-foreground">Aktivitas penting akan muncul di sini.</p>
              </div>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function NotificationRow({
  notification,
  onMarkRead,
}: {
  notification: NotificationItem
  onMarkRead: (id: string) => void
}) {
  const href = getNotificationHref(notification)
  const content = (
    <div className={cn(
      "flex gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent",
      !notification.isRead && "bg-primary/5"
    )}>
      <div className={cn(
        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
        notification.isRead ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
      )}>
        <FileText className="size-4" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-1 text-sm font-medium text-foreground">{notification.title}</p>
          {!notification.isRead ? <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" /> : null}
        </div>
        {notification.message ? (
          <p className="line-clamp-2 text-xs text-muted-foreground">{notification.message}</p>
        ) : null}
        <p className="text-[11px] text-muted-foreground">{formatNotificationDate(notification.createdAt)}</p>
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} onClick={() => !notification.isRead && onMarkRead(notification.id)}>
        {content}
      </Link>
    )
  }

  return (
    <button
      type="button"
      className="w-full text-left"
      onClick={() => !notification.isRead && onMarkRead(notification.id)}
    >
      {content}
    </button>
  )
}

function getNotificationHref(notification: NotificationItem) {
  const type = notification.relatedEntityType?.toUpperCase()
  if (!notification.relatedEntityId) return null
  if (type === "DOCUMENT" || type === "DOCUMENT_RECORD") {
    return routeTo.documentDetail(notification.relatedEntityId)
  }
  return null
}

function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat(DATE_LOCALE, DATE_FORMATS.dateTime).format(new Date(value))
}

/* -------------------------------------------------------------------------- */
/*  Profile menu                                                               */
/* -------------------------------------------------------------------------- */

function ProfileMenu({ profile, loading }: { profile: Profile | null; loading: boolean }) {
  const handleLogout = async () => {
    try {
      const res = await logoutAction()
      if (res.ok) {
        window.location.href = "/"
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
      <Button render={<Link href={ROUTES.login} />} nativeButton={false} size="sm" variant="default" className="rounded-lg h-8 px-4">
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
                {ROLE_LABELS[profile.role as keyof typeof ROLE_LABELS] ?? profile.role}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href={ROUTES.profile} />}>
          <UserIcon className="size-4 mr-2 text-muted-foreground" />
          Profil Saya
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href={ROUTES.settings} />}>
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
          <NotificationMenu enabled={Boolean(profile)} />
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
