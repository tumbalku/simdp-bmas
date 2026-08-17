"use client"

import { useEffect } from "react"
import { AlertOctagon } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global Error Boundary:", error)
  }, [error])

  return (
    <html lang="id">
      <body className="min-h-screen bg-background font-sans flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center p-6 border rounded-xl bg-card text-card-foreground shadow-xs">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mx-auto mb-4 ring-8 ring-destructive/5">
            <AlertOctagon className="h-8 w-8" aria-hidden="true" />
          </div>

          <span className="text-xs font-semibold tracking-widest text-destructive uppercase">
            Error Kritis
          </span>

          <h1 className="text-xl font-bold tracking-tight text-foreground mt-1 mb-2">
            Gangguan Sistem Utama
          </h1>

          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Terjadi masalah serius pada aplikasi. Silakan coba muat ulang atau hubungi administrator jika kendala berlanjut.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full sm:w-auto px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Coba Lagi
            </button>
            <button
              type="button"
              onClick={() => (window.location.href = "/")}
              className="w-full sm:w-auto px-4 py-2 border bg-background text-foreground text-sm font-medium rounded-lg hover:bg-muted transition-colors"
            >
              Halaman Utama
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
