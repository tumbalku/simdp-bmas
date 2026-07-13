"use client"

import { useEffect, useState } from "react"

import { PAGINATION } from "@/constants"
import {
  getNotifications,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/modules/notification/actions"

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

export function useNavbarNotifications(enabled: boolean) {
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
