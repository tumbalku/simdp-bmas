"use client";

import { useEffect, useRef, useState } from "react";
import { FileCheck2, HeartPulse, ShieldCheck } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getResponsiveMetricGridClass,
  ResponsiveMetricCard,
} from "@/components/cards/ResponsiveMetricCard";

import { DonutChart } from "@/components/charts/DonutChart";
import { SimpleBarChart } from "./StatisticsCharts";

type CountUpProps = {
  value: number;
  suffix?: string;
  decimals?: number;
  start: boolean;
};

const metricCards = [
  {
    label: "Total dokumen",
    compactTitle: "Dokumen",
    value: 512,
    description: "Dokumen terkelola",
    icon: FileCheck2,
  },
  {
    label: "Compliance rate",
    compactTitle: "Patuh",
    value: 86.4,
    suffix: "%",
    decimals: 1,
    description: "Pegawai dengan dokumen wajib lengkap",
    icon: ShieldCheck,
  },
  {
    label: "Antrian verifikasi",
    compactTitle: "Antrian",
    value: 18,
    description: "Dokumen yang menunggu review",
    icon: HeartPulse,
  },
];

const genderByEmploymentStatus = [
  { status: "ASN - Laki-laki", total: 82 },
  { status: "ASN - Perempuan", total: 96 },
  { status: "NON_ASN - Laki-laki", total: 64 },
  { status: "NON_ASN - Perempuan", total: 73 },
];

const ageRangeData = [
  { label: "< 25", value: 32 },
  { label: "25-34", value: 78 },
  { label: "35-44", value: 96 },
  { label: "45-54", value: 71 },
  { label: ">= 55", value: 28 },
];

function CountUp({ value, suffix = "", decimals = 0, start }: CountUpProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!start) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setDisplayValue(value);
      setIsAnimating(false);
      return;
    }

    const duration = 1800;
    const steps = 60;
    const increment = value / steps;
    let currentStep = 0;
    setDisplayValue(0);
    setIsAnimating(true);

    const interval = window.setInterval(() => {
      currentStep += 1;
      setDisplayValue(Math.min(value, increment * currentStep));

      if (currentStep >= steps) {
        window.clearInterval(interval);
        setDisplayValue(value);
        setIsAnimating(false);
      }
    }, duration / steps);

    return () => {
      window.clearInterval(interval);
      setIsAnimating(false);
    };
  }, [start, value]);

  return (
    <span className={`tabular-nums ${isAnimating ? "count-up-active" : ""}`}>
      {displayValue.toLocaleString("id-ID", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

export function StatisticsDashboardPreview() {
  const sectionRef = useRef<HTMLElement>(null);
  const [hasEnteredViewport, setHasEnteredViewport] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const isVisibleOnLoad = section.getBoundingClientRect().top < window.innerHeight;
    if (isVisibleOnLoad) {
      setHasEnteredViewport(true);
      return;
    }

    if (!("IntersectionObserver" in window)) {
      setHasEnteredViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setHasEnteredViewport(true);
        observer.disconnect();
      },
      { threshold: 0.2 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="space-y-4" aria-labelledby="statistics-preview-title">
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">Ringkasan dokumen</p>
        <h2 id="statistics-preview-title" className="text-2xl font-bold tracking-tight text-balance">
          Pantau kondisi dokumen dari satu ringkasan
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Ringkasan metrik, distribusi pegawai, dan rentang usia dalam satu tampilan yang mudah dibaca.
        </p>
      </div>

      <div className={`grid ${getResponsiveMetricGridClass(metricCards.map((metric) => metric.compactTitle))} gap-1.5 sm:gap-4 md:grid-cols-3`}>
        {metricCards.map((metric) => (
          <ResponsiveMetricCard
            key={metric.label}
            title={metric.label}
            compactTitle={metric.compactTitle}
            icon={metric.icon}
            iconClassName="bg-accent text-accent-foreground"
            value={
              <>
                <span className="mr-1 text-primary">&plusmn;</span>
                <CountUp value={metric.value} suffix={metric.suffix} decimals={metric.decimals} start={hasEnteredViewport} />
              </>
            }
            description={metric.description}
            valueClassName="text-2xl font-bold"
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Distribusi jenis kelamin</CardTitle>
            <CardDescription>Distribusi pegawai berdasarkan status ASN dan NON_ASN.</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart
              className="h-56"
              data={genderByEmploymentStatus}
              index="status"
              category="total"
              label="pegawai"
            />
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted-foreground">
              {genderByEmploymentStatus.map((item, index) => (
                <div key={item.status} className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: `var(--chart-${(index % 5) + 1})` }} aria-hidden="true" />
                    <span className="truncate">{item.status}</span>
                  </span>
                  <span className="font-medium tabular-nums text-foreground">{item.total}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rentang usia pegawai</CardTitle>
            <CardDescription>Jumlah pegawai di setiap kelompok usia.</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={ageRangeData} height={270} barColor="var(--chart-2)" />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
