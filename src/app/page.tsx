import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  FileCheck2,
  HeartPulse,
  Mail,
  MapPin,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import Navbar from "@/components/navigation/Navbar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { StatisticsDashboardPreview } from "@/modules/statistics/components/StatisticsDashboardPreview";

const services = [
  {
    title: "Dokumen pegawai",
    description: "Upload dan kelola dokumen kepegawaian dari satu tempat.",
    icon: FileCheck2,
  },
  {
    title: "Verifikasi terarah",
    description: "Setiap dokumen diproses sesuai role dan alur kerja yang jelas.",
    icon: ShieldCheck,
  },
  {
    title: "Profil kepegawaian",
    description: "Data profil dan riwayat karier lebih mudah ditelusuri.",
    icon: UsersRound,
  },
  {
    title: "Ringkasan statistik",
    description: "Pantau status dokumen melalui ringkasan yang mudah dibaca.",
    icon: HeartPulse,
  },
];

const highlights = [
  { value: "1", label: "Data pegawai", icon: FileCheck2 },
  { value: "3", label: "Role akses", icon: ShieldCheck },
  { value: "24/7", label: "Riwayat data", icon: CalendarDays },
];

const faqItems = [
  {
    question: "Apa itu SiCantIK?",
    answer:
      "SiCantIK adalah sistem pencatatan informasi kepegawaian RSUD Bahteramas untuk membantu pengelolaan profil, dokumen, verifikasi, dan ringkasan statistik pegawai.",
  },
  {
    question: "Siapa saja yang dapat menggunakan SiCantIK?",
    answer:
      "SiCantIK digunakan oleh Admin, Staff, dan Employee. Setiap pengguna melihat fitur sesuai role dan kewenangan yang diberikan.",
  },
  {
    question: "Dokumen apa saja yang dapat dikelola?",
    answer:
      "Jenis dokumen mengikuti master data yang ditetapkan oleh pengelola kepegawaian. Dokumen dapat memiliki status pending, approved, rejected, expired, atau replaced.",
  },
  {
    question: "Bagaimana proses verifikasi dokumen dilakukan?",
    answer:
      "Setelah dokumen diunggah, Staff atau Admin dapat meninjau dokumen dan memperbarui statusnya sesuai hasil pemeriksaan. Riwayat verifikasi tersimpan di sistem.",
  },
  {
    question: "Apa yang harus dilakukan jika tidak dapat masuk?",
    answer:
      "Pastikan identifier dan password sudah benar. Jika masih mengalami kendala, gunakan alur lupa password atau hubungi pengelola sistem melalui kanal internal rumah sakit.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <Navbar />

      <main>
        <section className="relative isolate overflow-hidden border-b border-border">
          <Image
            src="/images/bg-landing.png"
            alt="Gedung RSUD Bahteramas"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/20 dark:from-slate-950 dark:via-slate-950/85 dark:to-slate-950/30" />

          <div className="relative mx-auto grid min-h-[calc(100dvh-3.5rem)] w-full max-w-7xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(300px,0.65fr)] lg:px-8 lg:py-16">
            <div className="max-w-2xl">

              <h1 className="hero-reveal [animation-delay:120ms] mt-6 max-w-2xl text-4xl font-bold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Kelola <span className="text-primary">dokumen</span> pegawai dengan lebih <span className="inline-block rounded-md bg-primary px-2 py-1 text-white shadow-sm">tertata.</span>
              </h1>
              <p className="hero-reveal [animation-delay:220ms] mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                SiCantIK membantu tim RSUD Bahteramas menyimpan, memverifikasi, dan menelusuri dokumen kepegawaian secara aman.
              </p>

              <div className="hero-reveal [animation-delay:320ms] mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href={ROUTES.login} className={buttonVariants({ size: "lg", className: "box-border h-11 w-full !border-2 !border-primary px-5 shadow-md shadow-primary/20 transition-colors hover:!border-primary hover:!bg-card hover:!text-primary hover:shadow-none sm:w-44" })}>
                  Masuk ke SiCantIK
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover/button:translate-x-1" aria-hidden="true" />
                </Link>
                <a href="#layanan" className={buttonVariants({ variant: "outline", size: "lg", className: "box-border h-11 w-full !border-2 !border-primary bg-card/80 px-5 !text-primary backdrop-blur-sm transition-colors hover:!border-primary hover:!bg-primary hover:!text-primary-foreground sm:w-44" })}>
                  Lihat layanan
                </a>
              </div>
            </div>

            <div className="hero-reveal [animation-delay:420ms] mx-auto mt-10 grid w-full max-w-2xl grid-cols-3 justify-items-center gap-1.5 overflow-hidden rounded-xl border border-border bg-card/90 p-2 shadow-lg backdrop-blur-sm sm:gap-6 sm:p-4 lg:col-span-2 lg:mt-0">
              {highlights.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.label} className="flex min-w-0 max-w-full flex-col items-center justify-center gap-1 text-center sm:flex-row sm:gap-3 sm:text-left">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent p-1.5 text-accent-foreground sm:size-8 sm:p-2">
                      <Icon className="size-3.5 sm:size-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 max-w-full">
                      <p className="text-sm font-bold tracking-tight sm:text-2xl">{item.value}</p>
                      <p className="truncate text-[9px] leading-4 text-muted-foreground sm:text-xs">{item.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="layanan" className="mx-auto w-full max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="max-w-2xl space-y-3">
              <p className="text-sm font-semibold text-primary">Layanan SiCantIK</p>
              <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">Satu alur kerja untuk kebutuhan dokumen pegawai.</h2>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                Dirancang agar pegawai dan pengelola administrasi dapat bekerja lebih tenang, cepat, dan konsisten.
              </p>
            </div>
            <Link href={ROUTES.login} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              Buka sistem
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service, index) => {
              const Icon = service.icon;

              return (
                <article
                  key={service.title}
                  className="hero-reveal group rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="rounded-lg bg-accent p-3 text-accent-foreground transition-transform duration-300 group-hover:scale-105">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="mt-8 text-lg font-semibold tracking-tight">{service.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{service.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="relative mx-auto grid w-full max-w-7xl gap-8 px-4 pb-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div className="relative min-h-80 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <Image
              src="/images/sicantik-hero.png"
              alt="Area depan gedung RSUD Bahteramas"
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover object-[58%_50%] transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/75">RSUD Bahteramas</p>
              <p className="mt-2 text-xl font-semibold">Administrasi yang mendukung pelayanan.</p>
            </div>
          </div>

          <div className="flex flex-col justify-center rounded-xl border border-border bg-card p-6 sm:p-8">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              Tentang SiCantIK
            </div>
            <h2 className="mt-5 text-3xl font-bold tracking-tight text-balance">Data kepegawaian yang siap mendukung kerja harian.</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
              SiCantIK menjadi ruang kerja bersama untuk mengelola data pegawai, dokumen, verifikasi, dan ringkasan statistik dengan alur yang mudah dipahami.
            </p>
            <div className="mt-7 grid grid-cols-3 gap-2 border-t border-border pt-6 sm:gap-4">
              <div className="min-w-0">
                <p className="truncate text-xl font-bold text-primary sm:text-2xl">Aman</p>
                <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">akses sesuai role</p>
              </div>
              <div className="min-w-0">
                <p className="truncate text-xl font-bold text-primary sm:text-2xl">Rapi</p>
                <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">dokumen terpusat</p>
              </div>
              <div className="min-w-0">
                <p className="truncate text-xl font-bold text-primary sm:text-2xl">Jelas</p>
                <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">mudah dipantau</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <StatisticsDashboardPreview />
        </div>

        <section id="faq" className="mx-auto grid w-full max-w-7xl gap-8 px-4 pb-20 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
          <div className="max-w-md">
            <p className="text-sm font-semibold text-primary">Pertanyaan umum</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">Informasi penting sebelum mulai menggunakan SiCantIK.</h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">Temukan jawaban singkat tentang akses, dokumen, dan alur verifikasi.</p>
            <Link href={ROUTES.login} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              Masuk ke sistem
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="rounded-xl border border-border bg-card px-5 py-2 shadow-sm sm:px-7">
            <Accordion className="divide-y divide-border" defaultValue={["faq-0"]}>
              {faqItems.map((item, index) => (
                <AccordionItem key={item.question} value={`faq-${index}`} className="border-0">
                  <AccordionTrigger className="py-5 text-base hover:no-underline">{item.question}</AccordionTrigger>
                  <AccordionContent className="pb-5 text-sm leading-6 text-muted-foreground">{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-slate-950 text-slate-100">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 rounded-xl border border-white/10 bg-gradient-to-br from-primary/35 via-slate-900 to-slate-950 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-primary">Mulai dari data yang lebih tertata</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">SiCantIK siap mendukung administrasi kepegawaian RSUD Bahteramas.</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Masuk untuk mengelola dokumen, memantau verifikasi, dan melihat ringkasan data kepegawaian.</p>
            </div>
            <Link href={ROUTES.login} className={buttonVariants({ size: "lg", className: "box-border h-11 w-full !border-2 !border-primary px-5 shadow-md shadow-primary/20 transition-colors hover:!border-primary hover:!bg-card hover:!text-primary hover:shadow-none sm:w-44" })}>
              Masuk ke SiCantIK
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid gap-10 py-12 md:grid-cols-[1.3fr_0.7fr_0.7fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-white p-1.5">
                  <Image src="/images/logo.png" alt="" width={32} height={32} className="size-8 object-contain" />
                </div>
                <div>
                  <p className="text-sm font-bold tracking-tight text-white">SiCantIK</p>
                  <p className="text-xs text-slate-400">RSUD Bahteramas</p>
                </div>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">Sistem pencatatan informasi kepegawaian untuk alur dokumen yang aman, rapi, dan mudah ditelusuri.</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">Navigasi</h3>
              <nav className="mt-4 grid gap-3 text-sm text-slate-400" aria-label="Navigasi footer">
                <a href="#layanan" className="transition-colors hover:text-white">Layanan</a>
                <a href="#statistics-preview-title" className="transition-colors hover:text-white">Ringkasan dokumen</a>
                <Link href={ROUTES.login} className="transition-colors hover:text-white">Masuk</Link>
              </nav>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">Komitmen</h3>
              <div className="mt-4 grid gap-3 text-sm text-slate-400">
                <p className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" aria-hidden="true" />Akses sesuai role</p>
                <p className="flex items-center gap-2"><FileCheck2 className="size-4 text-primary" aria-hidden="true" />Dokumen terpusat</p>
                <p className="flex items-center gap-2"><HeartPulse className="size-4 text-primary" aria-hidden="true" />Alur kerja jelas</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">RSUD Bahteramas</h3>
              <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-400">
                <p className="flex gap-2"><MapPin className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />Provinsi Sulawesi Tenggara</p>
                <p className="flex gap-2"><Mail className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />Informasi kepegawaian melalui kanal internal rumah sakit</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-white/10 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} SiCantIK. RSUD Bahteramas.</p>
            <p>Data kepegawaian dikelola sesuai akses pengguna.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
