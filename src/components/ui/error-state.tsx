"use client"

import * as React from "react"
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/utils"
import { Button } from "@/components/ui/button"

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ElementType
  title?: string
  description?: string
  code?: string | number
  details?: string | Error
  primaryAction?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  compact?: boolean
}

export function ErrorState({
  icon: Icon = AlertTriangle,
  title = "Terjadi Kesalahan",
  description = "Maaf, sistem mengalami kendala saat memproses permintaan Anda.",
  code,
  details,
  primaryAction,
  secondaryAction,
  compact = false,
  className,
  ...props
}: ErrorStateProps) {
  const [showDetails, setShowDetails] = React.useState(false)

  const detailText =
    typeof details === "string"
      ? details
      : details?.stack || details?.message || String(details)

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-6 rounded-xl border bg-card text-card-foreground shadow-xs",
        compact ? "py-6 px-4 max-w-md mx-auto" : "min-h-[320px] max-w-lg mx-auto w-full my-8",
        className
      )}
      {...props}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4 ring-8 ring-destructive/5">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </div>

      {code && (
        <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1">
          Kode Keliruan: {code}
        </span>
      )}

      <h3 className="text-lg font-semibold tracking-tight text-foreground mb-1">
        {title}
      </h3>

      <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
        {description}
      </p>

      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
          {primaryAction && (
            <Button
              onClick={primaryAction.onClick}
              variant="default"
              size="default"
              className="w-full sm:w-auto min-w-[120px]"
            >
              {primaryAction.label}
            </Button>
          )}

          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
              size="default"
              className="w-full sm:w-auto min-w-[120px]"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}

      {details && (
        <div className="mt-6 w-full text-left border-t pt-4">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors mx-auto"
          >
            <span>{showDetails ? "Sembunyikan Rincian" : "Tampilkan Rincian Teknis"}</span>
            {showDetails ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          {showDetails && (
            <div className="mt-3 p-3 bg-muted/60 rounded-lg border text-left overflow-x-auto">
              <pre className="text-[11px] font-mono text-muted-foreground whitespace-pre-wrap break-all leading-tight">
                {detailText}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
