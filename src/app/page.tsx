import { ArrowRight, FileCheck2, ShieldCheck, UsersRound } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { StatisticsDashboardPreview } from "@/modules/statistics/components/StatisticsDashboardPreview";
import Navbar from "@/components/shared/Navbar";
import Link from "next/link";

const features = [
  {
    title: "Dokumen pegawai terpusat",
    description:
      "Kelola upload, status, masa berlaku, dan riwayat dokumen pegawai dari satu sistem.",
    icon: FileCheck2,
  },
  {
    title: "Verifikasi berbasis role",
    description:
      "Admin, Staff, dan Employee memiliki akses berbeda sesuai aturan RBAC SIMDP.",
    icon: ShieldCheck,
  },
  {
    title: "Siap dashboard statistik",
    description:
      "Fondasi UI sudah memakai token shadcn/ui dan siap dipakai untuk card, table, dan chart.",
    icon: UsersRound,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full flex-col justify-center gap-10 px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex rounded-full border border-border bg-card px-3 py-1 text-sm font-medium text-muted-foreground shadow-sm">
              SIMDP · RSUD Bahteramas
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
                Sistem Informasi Manajemen Dokumen Pegawai
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Scaffold awal Next.js, TypeScript, Tailwind CSS, dan shadcn/ui untuk
                membangun workflow dokumen pegawai yang rapi, aman, dan mudah dipakai.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg">
                Mulai setup modul
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              {process.env.NODE_ENV !== "production" && (
                <Link href="/component-preview" className={buttonVariants({ variant: "outline", size: "lg" })}>
                  Component Preview
                </Link>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm"
                >
                  <div className="mb-5 inline-flex rounded-md bg-accent p-3 text-accent-foreground">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight">
                    {feature.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>

          <StatisticsDashboardPreview />
        </section>
      </main>
    </div>
  );
}
