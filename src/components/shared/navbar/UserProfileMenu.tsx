"use client"

import Link from "next/link"
import { LogOut, Settings, User as UserIcon } from "lucide-react"

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
import { logoutAction } from "@/modules/auth/actions"
import { ROLE_LABELS, ROUTES, getRoleBadgeStyle } from "@/constants"
import { id as defaultDictionary } from "@/i18n/dictionaries/id"

const profileCopy = defaultDictionary.navbar.profile

export type NavbarProfile = {
  name: string
  email: string
  role: string
  avatarUrl: string | null
  employeeId: string | null
}

interface UserProfileMenuProps {
  profile: NavbarProfile | null
  loading: boolean
}

export function UserProfileMenu({ profile, loading }: UserProfileMenuProps) {
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
        {profileCopy.login}
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
                  getRoleBadgeStyle(profile.role),
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
          {profileCopy.profile}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href={ROUTES.settings} />}>
          <Settings className="size-4 mr-2 text-muted-foreground" />
          {profileCopy.settings}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} variant="destructive" className="flex items-center cursor-pointer">
          <LogOut className="size-4 mr-2" />
          {profileCopy.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function getInitials(name: string) {
  if (!name) return "U"
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
}
