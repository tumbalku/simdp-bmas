"use client";

import { useEffect, useRef } from "react";
import { refreshSession } from "./api";

const REFRESH_INTERVAL_MS = 20 * 60 * 1000;
const REFRESH_ON_RESUME_AFTER_MS = 15 * 60 * 1000;

let activeRefresh: ReturnType<typeof refreshSession> | null = null;

function requestRefresh() {
  if (!activeRefresh) {
    activeRefresh = refreshSession().finally(() => {
      activeRefresh = null;
    });
  }

  return activeRefresh;
}

export function useAuthSessionRefresh() {
  const lastRefreshAt = useRef(Date.now());

  useEffect(() => {
    let disposed = false;

    const refreshIfNeeded = async () => {
      const result = await requestRefresh();
      if (disposed) return;

      if (result.ok) {
        lastRefreshAt.current = Date.now();
      } else if (result.shouldLogout) {
        window.location.replace("/login?session_expired=1");
      }
    };

    const intervalId = window.setInterval(refreshIfNeeded, REFRESH_INTERVAL_MS);
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastRefreshAt.current >= REFRESH_ON_RESUME_AFTER_MS
      ) {
        void refreshIfNeeded();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
}
