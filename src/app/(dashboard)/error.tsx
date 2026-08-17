"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import { ErrorState } from "@/components/ui/error-state"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to monitoring service if needed
    console.error("Dashboard Error Boundary:", error)
  }, [error])

  return (
    <div className="container mx-auto py-10 px-4">
      <ErrorState
        icon={AlertTriangle}
        code={error.digest ? `500 (${error.digest})` : "500"}
        title="Terjadi Kendala Sistem"
        description="Terjadi kesalahan pada panel dashboard. Silakan muat ulang halaman atau coba lagi nanti."
        primaryAction={{
          label: "Coba Lagi",
          onClick: () => reset(),
        }}
        secondaryAction={{
          label: "Muat Ulang Halaman",
          onClick: () => window.location.reload(),
        }}
      />
    </div>
  )
}
