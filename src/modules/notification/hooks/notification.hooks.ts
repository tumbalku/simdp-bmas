"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { PAGINATION } from "@/constants"
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/modules/notification"
import { fetchNavbarNotifications } from "../api"
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
  const mountedRef = useRef(false)
  const loadRequestIdRef = useRef(0)

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      loadRequestIdRef.current += 1
    }
  }, [])

  const loadNotifications = useCallback(async (options?: { showLoading?: boolean }) => {
    const requestId = loadRequestIdRef.current + 1
    loadRequestIdRef.current = requestId

    if (!enabled) {
      if (mountedRef.current) setLoading(false)
      return
    }

    if (options?.showLoading && mountedRef.current) setLoading(true)

    try {
      const res = await fetchNavbarNotifications({
        page: PAGINATION.defaultPage,
        pageSize: PAGINATION.navbarNotificationLimit,
      })

      if (!mountedRef.current || loadRequestIdRef.current !== requestId) return

      if (res.ok) {
        setNotifications(res.data)
        setUnreadCount(res.meta.unreadCount)
      }
    } catch (err) {
      console.error("Failed to load notifications in Navbar:", err)
    } finally {
      if (options?.showLoading && mountedRef.current && loadRequestIdRef.current === requestId) {
        setLoading(false)
      }
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
    let cleanup = () => {}

    if (!enabled || !userId) return cleanup

    const pusher = getPusherClient()
    if (!pusher) {
      const intervalId = window.setInterval(() => {
        void loadNotifications()
      }, 15000)

      cleanup = () => window.clearInterval(intervalId)
      return cleanup
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

    cleanup = () => {
      channel.unbind("notification:new")
      pusher.unsubscribe(channelName)
    }

    return cleanup
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
