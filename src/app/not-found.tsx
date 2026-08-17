"use client"

import Link from "next/link"
import { FileQuestion, Home, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto mb-6 ring-8 ring-primary/5">
          <FileQuestion className="h-10 w-10" aria-hidden="true" />
        </div>

        <span className="text-sm font-semibold tracking-widest text-primary uppercase">
          Error 404
        </span>

        <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1 mb-2">
          Halaman Tidak Ditemukan
        </h1>

        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          Maaf, halaman yang Anda cari tidak ditemukan atau telah dipindahkan.
          Silakan periksa kembali tautan yang Anda tuju.
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
