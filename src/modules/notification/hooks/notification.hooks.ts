"use client"

import { useEffect, useState } from "react"

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
    return () => {
      cancelled = true
    }
  }, [enabled])

  // Realtime subscription via Pusher
  useEffect(() => {
    if (!enabled || !userId) return

    const pusher = getPusherClient()
    if (!pusher) return

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
  }, [enabled, userId])

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
