"use client"

import Link from "next/link"
import { ShieldAlert, Home, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Forbidden() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive mx-auto mb-6 ring-8 ring-destructive/5">
          <ShieldAlert className="h-10 w-10" aria-hidden="true" />
        </div>

        <span className="text-sm font-semibold tracking-widest text-destructive uppercase">
          Error 403
        </span>

        <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1 mb-2">
          Akses Ditolak
        </h1>

        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          Anda tidak memiliki hak akses yang cukup untuk membuka halaman atau sumber daya ini.
          Silakan hubungi administrator jika Anda merasa ini adalah kesalahan.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button nativeButton={false} render={<Link href="/" />} variant="default" className="w-full sm:w-auto">
            <Home className="h-4 w-4 mr-2" />
            Kembali ke Beranda
          </Button>

          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Sebelumnya
          </Button>
        </div>

        <div className="mt-12 text-xs text-muted-foreground">
          RSUD Bahteramas &mdash; Sistem Informasi Manajemen Dokumen Pegawai
        </div>
      </div>
    </div>
  )
}
