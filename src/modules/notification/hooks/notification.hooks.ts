"use client"

import { useCallback, useEffect, useState } from "react"

import { PAGINATION } from "@/constants"
import {
  getNotifications,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/modules/notification"
import { getPusherClient } from "@/lib/notifications/client/pusher-client"

export type NavbarNotification = {
  id: string
  type: string
  title: string
  message: string | null
  isRead: boolean
  relatedEntityType: string | null
  relatedEntityId: string | null
  createdAt: string
}

export function useNavbarNotifications(enabled: boolean, userId?: string) {
  const [notifications, setNotifications] = useState<NavbarNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(enabled)

  const loadNotifications = useCallback(async (options?: { showLoading?: boolean }) => {
    if (!enabled) {
      setLoading(false)
      return
    }

    if (options?.showLoading) setLoading(true)

    try {
      const res = await getNotifications({
        page: PAGINATION.defaultPage,
        pageSize: PAGINATION.navbarNotificationLimit,
      })

      if (res.ok) {
        setNotifications(res.data)
        setUnreadCount(res.meta.unreadCount)
      }
    } catch (err) {
      console.error("Failed to load notifications in Navbar:", err)
    } finally {
      if (options?.showLoading) setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    void loadNotifications({ showLoading: true })
  }, [enabled, loadNotifications])

  // Realtime subscription via Pusher, with polling fallback for local/no-provider setups.
  useEffect(() => {
    if (!enabled || !userId) return

    const pusher = getPusherClient()
    if (!pusher) {
      const intervalId = window.setInterval(() => {
        void loadNotifications()
      }, 15000)

      return () => window.clearInterval(intervalId)
    }

    const channelName = `private-user-${userId}`
    const channel = pusher.subscribe(channelName)

    channel.bind("notification:new", (newNotif: NavbarNotification) => {
      setNotifications((prev) => {
        // Avoid duplicate items
        if (prev.some((item) => item.id === newNotif.id)) return prev
        return [newNotif, ...prev].slice(0, PAGINATION.navbarNotificationLimit)
      })
      setUnreadCount((c) => c + 1)
    })

    return () => {
      channel.unbind("notification:new")
      pusher.unsubscribe(channelName)
    }
  }, [enabled, loadNotifications, userId])

  const markAllRead = async () => {
    const res = await markAllNotificationsReadAction()
    if (!res.ok) return

    setNotifications((items) => items.map((item) => ({ ...item, isRead: true })))
    setUnreadCount(0)
  }

  const markRead = async (id: string) => {
    const res = await markNotificationReadAction(id)
    if (!res.ok) return

    setNotifications((items) =>
      items.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
    )
    setUnreadCount((count) => Math.max(0, count - 1))
  }

  return {
    notifications,
    unreadCount,
    loading,
    markAllRead,
    markRead,
  }
}
