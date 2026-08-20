import { CheckCircle2, Clock3, KeyRound, Mail, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/navigation/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS, type UserRole } from "@/constants";
import { ChangePasswordDialog } from "@/modules/auth/components/ChangePasswordDialog";
import { SessionManagementPanel, type SessionListItem } from "@/modules/auth/components/SessionManagementPanel";
import { TwoFactorPanel } from "@/modules/auth/components/TwoFactorPanel";

type UserSettingsAccount = {
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt: Date | string | null;
  employeeName: string | null;
  employeeId: string | null;
  nik: string | null;
  twoFactorEnabled: boolean;
};

type UserSettingsPageViewProps = {
  account: UserSettingsAccount;
  sessions: SessionListItem[];
};

export function UserSettingsPageView({ account, sessions }: UserSettingsPageViewProps) {
  const roleLabel = account.role in ROLE_LABELS ? ROLE_LABELS[account.role as UserRole] : account.role;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Akun"
        title="Pengaturan"
        description="Kelola keamanan akun dan preferensi pribadi SiCantIK."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card className="border-muted-foreground/10 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <ShieldCheck className="size-4 text-primary" />
              Aktivitas Akun
            </CardTitle>
            <CardDescription>Status akses dan aktivitas login terakhir akun SiCantIK.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border bg-muted/20 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <CheckCircle2 className="size-3.5" />
                    Status Akun
                  </div>
                  <Badge variant={account.isActive ? "default" : "secondary"}>
                    {account.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {account.isActive
                    ? "Akun dapat digunakan untuk mengakses SiCantIK."
                    : "Akun sedang tidak aktif. Hubungi admin jika perlu akses kembali."}
                </p>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <Clock3 className="size-3.5" />
                  Login Terakhir
                </div>
                <div className="mt-2 font-medium">{formatDateTime(account.lastLoginAt)}</div>
                <p className="mt-1 text-xs text-muted-foreground">Gunakan info ini untuk mengenali aktivitas akun.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-muted-foreground/10 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <ShieldCheck className="size-4 text-primary" />
              Keamanan Akun
            </CardTitle>
            <CardDescription>
              Password dapat diganti mandiri. Email login dan role tetap dikelola admin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <Mail className="size-3.5" />
                  Email Login
                </div>
                <div className="mt-1 truncate font-medium" title={account.email}>
                  {account.email}
                </div>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <KeyRound className="size-3.5" />
                  Role
                </div>
                <div className="mt-1 font-medium">{roleLabel}</div>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold">Password akun</div>
                <p className="text-xs text-muted-foreground">
                  Gunakan password kuat dan jangan bagikan ke orang lain.
                </p>
              </div>
              <ChangePasswordDialog />
            </div>
          </CardContent>
        </Card>
      </div>

      <TwoFactorPanel enabled={account.twoFactorEnabled} />

      <Card className="border-muted-foreground/10 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <ShieldCheck className="size-4 text-primary" />
            Manajemen Sesi
          </CardTitle>
          <CardDescription>Lihat dan cabut sesi login aktif pada akun ini.</CardDescription>
        </CardHeader>
        <CardContent>
          <SessionManagementPanel sessions={sessions} />
        </CardContent>
      </Card>
    </div>
  );
}

function formatDateTime(value: Date | string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
