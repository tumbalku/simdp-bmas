"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"

import {
  APP_THEME_IDS,
  APP_THEME_STORAGE_KEY,
  DEFAULT_APP_THEME,
  isAppThemeId,
} from "@/components/providers/theme-options"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={DEFAULT_APP_THEME}
      disableTransitionOnChange
      enableColorScheme={false}
      enableSystem={false}
      storageKey={APP_THEME_STORAGE_KEY}
      themes={[...APP_THEME_IDS]}
      {...props}
    >
      <ThemeStorageNormalizer />
      {children}
    </NextThemesProvider>
  )
}

function ThemeStorageNormalizer() {
  const { theme, setTheme } = useTheme()

  React.useEffect(() => {
    if (!theme) return

    if (theme === "dark") {
      setTheme("spotify")
      return
    }

    if (!isAppThemeId(theme)) {
      setTheme(DEFAULT_APP_THEME)
    }
  }, [setTheme, theme])

  return null
}
