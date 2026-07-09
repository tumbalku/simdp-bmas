"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ toastOptions, ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "color-mix(in srgb, var(--success) 12%, var(--popover))",
          "--success-border": "color-mix(in srgb, var(--success) 28%, var(--border))",
          "--success-text": "var(--success)",
          "--info-bg": "color-mix(in srgb, var(--info) 12%, var(--popover))",
          "--info-border": "color-mix(in srgb, var(--info) 28%, var(--border))",
          "--info-text": "var(--info)",
          "--warning-bg": "color-mix(in srgb, var(--warning) 14%, var(--popover))",
          "--warning-border": "color-mix(in srgb, var(--warning) 32%, var(--border))",
          "--warning-text": "var(--warning)",
          "--error-bg": "color-mix(in srgb, var(--destructive) 12%, var(--popover))",
          "--error-border": "color-mix(in srgb, var(--destructive) 30%, var(--border))",
          "--error-text": "var(--destructive)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        ...toastOptions,
        classNames: {
          toast:
            "cn-toast border-border bg-popover text-popover-foreground shadow-sm",
          success:
            "border-success/20 bg-success/10 text-success [&_[data-description]]:text-success/80",
          info: "border-info/20 bg-info/10 text-info [&_[data-description]]:text-info/80",
          warning:
            "border-warning/20 bg-warning/10 text-warning [&_[data-description]]:text-warning/80",
          error:
            "border-destructive/20 bg-destructive/10 text-destructive [&_[data-description]]:text-destructive/80",
          loading:
            "border-muted-foreground/20 bg-muted text-muted-foreground",
          ...toastOptions?.classNames,
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
