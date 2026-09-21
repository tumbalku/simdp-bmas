"use client"

import React, { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import {
  Check,
  Menu,
  Palette,
  X,
  ChevronDown,
} from "lucide-react"

import { cn } from "@/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  APP_THEME_OPTIONS,
  DEFAULT_APP_THEME,
  getAppThemeOption,
} from "@/components/providers/theme-options"
import type { UserRole } from "@/constants/roles"
import { getNavItemsByRole, type NavItem } from "@/config/nav"
import { APP, ROUTES } from "@/constants"
import { NotificationPanel } from "@/components/navigation/navbar/NotificationPanel"
import {
  UserProfileMenu,
  type NavbarProfile,
} from "@/components/navigation/navbar/UserProfileMenu"

/* -------------------------------------------------------------------------- */
/*  Logo                                                                        */
/* -------------------------------------------------------------------------- */

function LogoIcon() {
  return <Image src="/images/logo.png" alt="" width={28} height={28} className="size-7 object-contain" />
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
/*  Theme selector                                                              */
/* -------------------------------------------------------------------------- */

function ThemeSelector() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const currentThemeId = mounted ? theme : DEFAULT_APP_THEME
  const activeTheme = getAppThemeOption(currentThemeId) ?? getAppThemeOption(DEFAULT_APP_THEME)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-lg hover:bg-accent"
            aria-label={`Pilih tema${activeTheme ? `: ${activeTheme.label}` : ""}`}
            suppressHydrationWarning
          >
            <Palette className="size-4 text-foreground transition-all" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="navbar-solid-dropdown w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Tema tampilan</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {APP_THEME_OPTIONS.map((option) => {
            const isActive = option.id === currentThemeId

            return (
              <DropdownMenuItem
                key={option.id}
                onClick={() => setTheme(option.id)}
                className="min-h-11 cursor-pointer gap-3 px-2 py-2"
              >
                <span className="flex -space-x-1" aria-hidden="true">
                  {option.previewColors.map((color) => (
                    <span
                      key={`${option.id}-${color}`}
                      className="size-4 rounded-full border border-background ring-1 ring-border"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{option.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{option.description}</span>
                </span>
                {isActive ? <Check className="size-4 text-primary" aria-hidden="true" /> : null}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
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
        data-active={isActive}
        className={cn(
          "mobile-nav-link flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-primary",
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
        data-active={isActive || hasActiveChild}
        className={cn(
          "mobile-nav-link flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-primary",
          isActive || hasActiveChild ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground"
        )}
      >
        <Icon className="size-4" />
        <span className="flex-1">{item.label}</span>
        <ChevronDown className={cn("size-4 transition-transform", isOpen ? "rotate-180" : "")} />
      </button>

      {isOpen ? (
        <div className="mobile-nav-children ml-5 border-l border-border pl-2">
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
                data-active={childActive}
                className={cn(
                  "mobile-nav-link flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-primary",
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
    <div className="mobile-nav-panel navbar-solid-panel absolute inset-x-3 top-full z-50 mt-2 flex max-h-[calc(100dvh-4.5rem)] flex-col gap-2 overflow-y-auto rounded-xl border border-border bg-popover p-2.5 shadow-xl animate-in slide-in-from-top-4 duration-200 md:hidden">
      <div className="relative flex items-center justify-between border-b border-border/70 px-1 pb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Navigasi</span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
          {items.length} menu
        </span>
      </div>
      <nav className="relative flex flex-col gap-1">
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

type NavbarProps = {
  profile?: NavbarProfile | null
}

export default function Navbar({ profile = null }: NavbarProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const hasProfile = Boolean(profile)

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [hasProfile, pathname])

  return (
    <header className="isolate sticky top-0 z-50 w-full shrink-0 border-b border-border bg-card/95 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <Logo />

        <div className="flex items-center gap-2">
          <ThemeSelector />
          <NotificationPanel enabled={Boolean(profile)} userId={profile?.userId} />
          <UserProfileMenu profile={profile} loading={false} />
          {hasProfile ? (
            <MobileMenuToggle open={mobileMenuOpen} onToggle={() => setMobileMenuOpen((v) => !v)} />
          ) : null}
        </div>
      </div>

      {hasProfile && mobileMenuOpen && (
        <MobileMenuPanel
          pathname={pathname}
          role={(profile?.role as UserRole) ?? null}
          onNavigate={() => setMobileMenuOpen(false)}
        />
      )}
    </header>
  )
}
