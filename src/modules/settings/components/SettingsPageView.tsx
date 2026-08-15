"use client";

import { useMemo, useState, useTransition } from "react";
import { BellRing, Loader2, RotateCcw, Save, ShieldCheck, SquareCheck, SquareX, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, PageHeaderButton } from "@/components/navigation/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DATE_FORMATS, DATE_LOCALE } from "@/constants";
import { SECURITY_EVENT_TYPE, SECURITY_EVENT_TYPE_LABELS, type SecurityEventType } from "@/modules/security";
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
    key: "profile_image_max_upload_mb",
    fallbackLabel: "Batas Upload Foto Profil",
    fallbackDescription: "Batas ukuran file gambar untuk foto profil pegawai.",
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

const SECURITY_EVENT_GROUPS: { title: string; events: SecurityEventType[] }[] = [
  {
    title: "Autentikasi & Sesi",
    events: [
      SECURITY_EVENT_TYPE.AUTH_LOGIN_SUCCESS,
      SECURITY_EVENT_TYPE.AUTH_LOGIN_FAILED,
      SECURITY_EVENT_TYPE.AUTH_LOGOUT,
      SECURITY_EVENT_TYPE.AUTH_REFRESH_SUCCESS,
      SECURITY_EVENT_TYPE.AUTH_REFRESH_FAILED,
      SECURITY_EVENT_TYPE.AUTH_FORCE_LOGOUT_OTHERS,
      SECURITY_EVENT_TYPE.AUTH_SESSION_REVOKED,
      SECURITY_EVENT_TYPE.AUTH_PASSWORD_CHANGED,
      SECURITY_EVENT_TYPE.AUTH_PASSWORD_RESET_REQUESTED,
      SECURITY_EVENT_TYPE.AUTH_PASSWORD_RESET_SUCCESS,
      SECURITY_EVENT_TYPE.AUTH_PASSWORD_VERIFICATION_SUCCESS,
      SECURITY_EVENT_TYPE.AUTH_PASSWORD_VERIFICATION_FAILED,
      SECURITY_EVENT_TYPE.AUTH_2FA_ENABLED,
      SECURITY_EVENT_TYPE.AUTH_2FA_DISABLED,
      SECURITY_EVENT_TYPE.AUTH_2FA_EMAIL_SENT,
      SECURITY_EVENT_TYPE.AUTH_2FA_SUCCESS,
      SECURITY_EVENT_TYPE.AUTH_2FA_CHALLENGE_FAILED,
      SECURITY_EVENT_TYPE.AUTH_GOOGLE_LOGIN_SUCCESS,
      SECURITY_EVENT_TYPE.AUTH_GOOGLE_LOGIN_FAILED,
    ],
  },
  {
    title: "Dokumen",
    events: [
      SECURITY_EVENT_TYPE.DOCUMENT_UPLOADED,
      SECURITY_EVENT_TYPE.DOCUMENT_APPROVED,
      SECURITY_EVENT_TYPE.DOCUMENT_REJECTED,
      SECURITY_EVENT_TYPE.DOCUMENT_DOWNLOADED,
      SECURITY_EVENT_TYPE.DOCUMENT_EXPORTED,
      SECURITY_EVENT_TYPE.DOCUMENT_DELETED,
      SECURITY_EVENT_TYPE.DOCUMENT_RESTORED,
      SECURITY_EVENT_TYPE.DOCUMENT_PERMANENTLY_DELETED,
      SECURITY_EVENT_TYPE.DOCUMENT_MALWARE_DETECTED,
      SECURITY_EVENT_TYPE.DOCUMENT_MALWARE_SCAN_FAILED,
    ],
  },
  {
    title: "Pegawai",
    events: [
      SECURITY_EVENT_TYPE.EMPLOYEE_CREATED,
      SECURITY_EVENT_TYPE.EMPLOYEE_UPDATED,
      SECURITY_EVENT_TYPE.EMPLOYEE_ACCOUNT_UPDATED,
      SECURITY_EVENT_TYPE.EMPLOYEE_DELETED,
      SECURITY_EVENT_TYPE.EMPLOYEE_RESTORED,
      SECURITY_EVENT_TYPE.EMPLOYEE_PERMANENTLY_DELETED,
      SECURITY_EVENT_TYPE.EMPLOYEE_EXPORTED,
    ],
  },
  {
    title: "Sistem & Lainnya",
    events: [
      SECURITY_EVENT_TYPE.CRON_CHECK_EXPIRY_RUN,
      SECURITY_EVENT_TYPE.CRON_DOCUMENT_EXPIRED,
      SECURITY_EVENT_TYPE.MASTER_DATA_CREATED,
      SECURITY_EVENT_TYPE.MASTER_DATA_UPDATED,
      SECURITY_EVENT_TYPE.MASTER_DATA_DELETED,
      SECURITY_EVENT_TYPE.SYSTEM_SETTING_UPDATED,
      SECURITY_EVENT_TYPE.API_RATE_LIMIT_CHECK,
    ],
  },
];

const ALL_SECURITY_EVENTS = Object.values(SECURITY_EVENT_TYPE);
const DEFAULT_ENABLED_SECURITY_EVENTS = ALL_SECURITY_EVENTS.filter(
  (event) => event !== SECURITY_EVENT_TYPE.AUTH_REFRESH_SUCCESS
);

export function SettingsPageView({ settings }: SettingsPageViewProps) {
  const [values, setValues] = useState(() => createInitialValues(settings));
  const [isPending, startTransition] = useTransition();
  const settingsByKey = useMemo(() => new Map(settings.map((setting) => [setting.key, setting])), [settings]);

  const latestUpdate = settings.reduce<string | null>((latest, setting) => {
    const current = new Date(setting.updatedAt).toISOString();
    return !latest || current > latest ? current : latest;
  }, null);

  const selectedEventsSet = useMemo(() => {
    try {
      const raw = values.security_log_enabled_events;
      const parsed = raw ? JSON.parse(raw) : [];
      return new Set<string>(Array.isArray(parsed) ? parsed : []);
    } catch {
      return new Set<string>();
    }
  }, [values.security_log_enabled_events]);

  const toggleEvent = (event: SecurityEventType, checked: boolean) => {
    const nextSet = new Set(selectedEventsSet);
    if (checked) {
      nextSet.add(event);
    } else {
      nextSet.delete(event);
    }
    setValues((prev) => ({
      ...prev,
      security_log_enabled_events: JSON.stringify(Array.from(nextSet)),
    }));
  };

  const handleSelectAllEvents = () => {
    setValues((prev) => ({
      ...prev,
      security_log_enabled_events: JSON.stringify(ALL_SECURITY_EVENTS),
    }));
  };

  const handleDeselectAllEvents = () => {
    setValues((prev) => ({
      ...prev,
      security_log_enabled_events: JSON.stringify([]),
    }));
  };

  const handleResetDefaultEvents = () => {
    setValues((prev) => ({
      ...prev,
      security_log_enabled_events: JSON.stringify(DEFAULT_ENABLED_SECURITY_EVENTS),
    }));
  };

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
          <PageHeaderButton
            label="Simpan"
            type="submit"
            disabled={isPending}
            icon={isPending ? Loader2 : Save}
            iconClassName={isPending ? "animate-spin" : undefined}
          />
        }
      />

      <Tabs defaultValue="reminder" className="space-y-6">
        <TabsList className="w-full grid grid-cols-3 sm:flex sm:w-auto">
          <TabsTrigger value="reminder" className="gap-2">
            <BellRing className="size-4" />
            <span className="hidden sm:inline">Reminder Dokumen</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2">
            <UploadCloud className="size-4" />
            <span className="hidden sm:inline">Upload & Retensi</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <ShieldCheck className="size-4" />
            <span className="hidden sm:inline">Keamanan & Log Audit</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reminder">
          <SettingsCard
            title="Reminder Dokumen"
            description="Konfigurasi waktu pengingat dokumen yang akan kedaluwarsa."
            fields={REMINDER_FIELDS}
            values={values}
            settingsByKey={settingsByKey}
            onChange={setValues}
          />
        </TabsContent>

        <TabsContent value="upload">
          <SettingsCard
            title="Upload & Retensi"
            description="Konfigurasi batas file dan pemulihan data soft delete."
            fields={STORAGE_FIELDS}
            values={values}
            settingsByKey={settingsByKey}
            onChange={setValues}
          />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="size-4 text-primary" />
                Retensi Log Keamanan
              </CardTitle>
              <CardDescription>
                Konfigurasi durasi penyimpanan log aktivitas keamanan sebelum dibersihkan otomatis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 rounded-xl border bg-muted/20 p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Label htmlFor="security_log_retention_days">
                      {settingsByKey.get("security_log_retention_days")?.label ?? "Masa Retensi Log Keamanan (Hari)"}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {settingsByKey.get("security_log_retention_days")?.description ??
                        "Jumlah hari penyimpanan log aktivitas keamanan sebelum dibersihkan otomatis."}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">hari</span>
                </div>
                <Input
                  id="security_log_retention_days"
                  type="number"
                  min={1}
                  value={values.security_log_retention_days ?? "30"}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      security_log_retention_days: event.target.value,
                    }))
                  }
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="size-4 text-primary" />
                  Event Log Keamanan Aktif
                </CardTitle>
                <CardDescription>
                  Pilih jenis event yang akan dicatat oleh sistem audit log ({selectedEventsSet.size} dari{" "}
                  {ALL_SECURITY_EVENTS.length} event dipilih).
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:items-center">
                <Button type="button" variant="outline" size="sm" onClick={handleSelectAllEvents} className="w-full sm:w-auto justify-start sm:justify-center">
                  <SquareCheck className="size-3.5" />
                  Pilih Semua
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleDeselectAllEvents} className="w-full sm:w-auto justify-start sm:justify-center">
                  <SquareX className="size-3.5" />
                  Hapus Semua
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleResetDefaultEvents} className="w-full sm:w-auto justify-start sm:justify-center">
                  <RotateCcw className="size-3.5" />
                  Reset Default
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {SECURITY_EVENT_GROUPS.map((group) => (
                <div key={group.title} className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">{group.title}</h4>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {group.events.map((event) => {
                      const isChecked = selectedEventsSet.has(event);
                      const id = `event-${event}`;
                      return (
                        <div
                          key={event}
                          className="flex items-start space-x-3 rounded-lg border p-3 bg-muted/10 transition-colors hover:bg-muted/30"
                        >
                          <Checkbox
                            id={id}
                            checked={isChecked}
                            onCheckedChange={(checked) => toggleEvent(event, Boolean(checked))}
                          />
                          <div className="grid gap-0.5 leading-none">
                            <Label htmlFor={id} className="cursor-pointer text-sm font-medium">
                              {SECURITY_EVENT_TYPE_LABELS[event] || event}
                            </Label>
                            <p className="text-xs text-muted-foreground font-mono">{event}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(DATE_LOCALE, DATE_FORMATS.dateTime).format(new Date(value));
}

