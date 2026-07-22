"use client";

import type { ReactNode } from "react";
import { useAuthSessionRefresh } from "../hooks";

export function AuthSessionRefresh({ children }: { children: ReactNode }) {
  useAuthSessionRefresh();
  return children;
}
