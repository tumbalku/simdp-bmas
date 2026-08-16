"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ toastOptions, ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      richColors={false}
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
          "--success-bg": "rgb(236, 253, 245)",
          "--success-border": "rgb(110, 231, 183)",
          "--success-text": "rgb(4, 120, 87)",
          "--info-bg": "rgb(240, 249, 255)",
          "--info-border": "rgb(125, 211, 252)",
          "--info-text": "rgb(3, 105, 161)",
          "--warning-bg": "rgb(254, 243, 199)",
          "--warning-border": "rgb(252, 211, 77)",
          "--warning-text": "rgb(180, 83, 9)",
          "--error-bg": "rgb(255, 241, 242)",
          "--error-border": "rgb(253, 164, 175)",
          "--error-text": "rgb(190, 18, 60)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        ...toastOptions,
        classNames: {
          toast:
            "cn-toast border shadow-md rounded-lg font-sans text-xs sm:text-sm",
          success:
            "!bg-emerald-50 !border-emerald-300 !text-emerald-800 dark:!bg-emerald-950/80 dark:!border-emerald-700/50 dark:!text-emerald-200 [&_[data-description]]:!text-emerald-700 dark:[&_[data-description]]:!text-emerald-300",
          info: "!bg-sky-50 !border-sky-300 !text-sky-800 dark:!bg-sky-950/80 dark:!border-sky-700/50 dark:!text-sky-200 [&_[data-description]]:!text-sky-700 dark:[&_[data-description]]:!text-sky-300",
          warning:
            "!bg-amber-50 !border-amber-300 !text-amber-800 dark:!bg-amber-950/80 dark:!border-amber-700/50 dark:!text-amber-200 [&_[data-description]]:!text-amber-700 dark:[&_[data-description]]:!text-amber-300",
          error:
            "!bg-rose-50 !border-rose-300 !text-rose-800 dark:!bg-rose-950/80 dark:!border-rose-700/50 dark:!text-rose-200 [&_[data-description]]:!text-rose-700 dark:[&_[data-description]]:!text-rose-300",
          loading:
            "!bg-slate-50 !border-slate-300 !text-slate-800 dark:!bg-slate-900 dark:!border-slate-700 dark:!text-slate-200",
          ...toastOptions?.classNames,
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
