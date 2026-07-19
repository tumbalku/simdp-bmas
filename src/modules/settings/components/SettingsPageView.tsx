"use client";

import { useMemo, useState, useTransition } from "react";
import { BellRing, DatabaseBackup, Loader2, Save, ShieldCheck, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/navigation/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DATE_FORMATS, DATE_LOCALE } from "@/constants";
import { updateSystemSettingAction } from "@/modules/settings";

type SystemSetting = {
  key: string;
  value: string;
  label: string | null;
  description: string | null;
  updatedAt: Date | string;
};

type SettingsPageViewProps = {
  settings: SystemSetting[];
};

type SettingField = {
  key: string;
  fallbackLabel: string;
  fallbackDescription: string;
  min: number;
  unit: string;
};

const REMINDER_FIELDS = [
  {
    key: "reminder_days_h30",
    fallbackLabel: "Reminder H-30",
    fallbackDescription: "Jumlah hari sebelum kedaluwarsa untuk pengingat awal.",
    min: 1,
    unit: "hari",
  },
  {
    key: "reminder_days_h7",
    fallbackLabel: "Reminder H-7",
    fallbackDescription: "Jumlah hari sebelum kedaluwarsa untuk pengingat menengah.",
    min: 1,
    unit: "hari",
  },
  {
    key: "reminder_days_h1",
    fallbackLabel: "Reminder H-1",
    fallbackDescription: "Jumlah hari sebelum kedaluwarsa untuk pengingat akhir.",
    min: 1,
    unit: "hari",
  },
] as const satisfies readonly SettingField[];

const STORAGE_FIELDS = [
  {
    key: "default_max_upload_mb",
    fallbackLabel: "Batas Maksimal Upload",
    fallbackDescription: "Batas ukuran file global jika jenis dokumen tidak punya batas khusus.",
    min: 1,
    unit: "MB",
  },
  {
    key: "soft_delete_retention_days",
    fallbackLabel: "Masa Retensi Sampah",
    fallbackDescription: "Batas waktu pemulihan data yang sudah dihapus sementara.",
    min: 1,
    unit: "hari",
  },
] as const satisfies readonly SettingField[];

export function SettingsPageView({ settings }: SettingsPageViewProps) {
  const [values, setValues] = useState(() => createInitialValues(settings));
  const [isPending, startTransition] = useTransition();
  const settingsByKey = useMemo(() => new Map(settings.map((setting) => [setting.key, setting])), [settings]);

  const latestUpdate = settings.reduce<string | null>((latest, setting) => {
    const current = new Date(setting.updatedAt).toISOString();
    return !latest || current > latest ? current : latest;
  }, null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = Object.entries(values).map(([key, value]) => ({
      key,
      value: value.trim(),
    }));

    startTransition(async () => {
      const result = await updateSystemSettingAction({ settings: payload });

      if (result.ok) {
        toast.success("Pengaturan berhasil disimpan.");
        return;
      }

      toast.error(result.error.message);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PageHeader
        eyebrow="Administrasi"
        title="Pengaturan Sistem"
        description="Atur parameter operasional SiCantIK seperti jadwal reminder, batas upload, dan masa retensi data."
        trailing={
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Simpan
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard icon={BellRing} label="Reminder aktif" value={`${REMINDER_FIELDS.length} tahap`} />
        <SummaryCard icon={UploadCloud} label="Batas upload" value={`${values.default_max_upload_mb ?? "-"} MB`} />
        <SummaryCard icon={DatabaseBackup} label="Retensi data" value={`${values.soft_delete_retention_days ?? "-"} hari`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <SettingsCard
          title="Reminder Dokumen"
          description="Konfigurasi waktu pengingat dokumen yang akan kedaluwarsa."
          fields={REMINDER_FIELDS}
          values={values}
          settingsByKey={settingsByKey}
          onChange={setValues}
        />

        <SettingsCard
          title="Upload & Retensi"
          description="Konfigurasi batas file dan pemulihan data soft delete."
          fields={STORAGE_FIELDS}
          values={values}
          settingsByKey={settingsByKey}
          onChange={setValues}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4 text-primary" />
            Catatan keamanan
          </CardTitle>
          <CardDescription>
            Perubahan pengaturan sistem termasuk aksi sensitif dan akan tercatat di audit log.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Terakhir diperbarui: {latestUpdate ? formatDateTime(latestUpdate) : "Belum ada data pembaruan."}
        </CardContent>
      </Card>
    </form>
  );
}

function createInitialValues(settings: SystemSetting[]) {
  return Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
}

function SettingsCard({
  title,
  description,
  fields,
  values,
  settingsByKey,
  onChange,
}: {
  title: string;
  description: string;
  fields: readonly SettingField[];
  values: Record<string, string>;
  settingsByKey: Map<string, SystemSetting>;
  onChange: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field) => {
          const setting = settingsByKey.get(field.key);
          const label = setting?.label ?? field.fallbackLabel;
          const descriptionText = setting?.description ?? field.fallbackDescription;

          return (
            <div key={field.key} className="space-y-2 rounded-xl border bg-muted/20 p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Label htmlFor={field.key}>{label}</Label>
                  <p className="text-sm text-muted-foreground">{descriptionText}</p>
                </div>
                <span className="text-xs font-medium text-muted-foreground">{field.unit}</span>
              </div>
              <Input
                id={field.key}
                type="number"
                min={field.min}
                value={values[field.key] ?? ""}
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    [field.key]: event.target.value,
                  }))
                }
                required
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BellRing;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardDescription>{label}</CardDescription>
          <Icon className="size-4 text-primary" />
        </div>
        <CardTitle className="text-xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(DATE_LOCALE, DATE_FORMATS.dateTime).format(new Date(value));
}
