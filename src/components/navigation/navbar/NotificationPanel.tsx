"use client"

import Link from "next/link"
import { Bell, CheckCheck, FileText, Inbox } from "lucide-react"

import { cn } from "@/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DATE_FORMATS, DATE_LOCALE, routeTo } from "@/constants"
import { id as defaultDictionary } from "@/i18n/dictionaries/id"
import {
  useNavbarNotifications,
  type NavbarNotification,
} from "@/modules/notification/hooks"
import {
  NOTIFICATION_RELATED_ENTITY_TYPE,
  NOTIFICATION_TYPE,
} from "@/modules/notification"

const notificationCopy = defaultDictionary.navbar.notifications

interface NotificationPanelProps {
  enabled: boolean
  userId?: string
}

export function NotificationPanel({ enabled, userId }: NotificationPanelProps) {
  const {
    notifications,
    unreadCount,
    loading,
    markAllRead,
    markRead,
  } = useNavbarNotifications(enabled, userId)

  if (!enabled) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            id="notification-dropdown-trigger"
            suppressHydrationWarning
            className="relative flex size-9 items-center justify-center rounded-lg outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={notificationCopy.open}
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
            <p className="text-sm font-semibold text-foreground">{notificationCopy.title}</p>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? notificationCopy.unread(unreadCount) : notificationCopy.allRead}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="h-8 px-2 text-xs"
          >
            <CheckCheck className="size-3.5" />
            {notificationCopy.markAll}
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
                onMarkRead={markRead}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
              <Inbox className="size-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{notificationCopy.emptyTitle}</p>
                <p className="text-xs text-muted-foreground">{notificationCopy.emptyDescription}</p>
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
  notification: NavbarNotification
  onMarkRead: (id: string) => void
}) {
  const href = getNotificationHref(notification)
  const content = (
    <div className={cn(
      "flex gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent",
      !notification.isRead && "bg-primary/5",
    )}>
      <div className={cn(
        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
        notification.isRead ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
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

function getNotificationHref(notification: NavbarNotification) {
  if (!notification.relatedEntityId) return null
  if (notification.relatedEntityType === NOTIFICATION_RELATED_ENTITY_TYPE.DOCUMENT_RECORD) {
    if (notification.type === NOTIFICATION_TYPE.VERIFICATION_REQUIRED) {
      return routeTo.verificationDetail(notification.relatedEntityId)
    }

    return routeTo.documentDetail(notification.relatedEntityId)
  }
  return null
}

function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat(DATE_LOCALE, DATE_FORMATS.dateTime).format(new Date(value))
}
