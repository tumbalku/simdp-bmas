import { BriefcaseBusiness, CalendarDays, IdCard, Mail, MapPin, Phone, ShieldCheck, UserRound } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DATE_FORMATS, DATE_LOCALE, ROLE_LABELS } from "@/constants";

type NamedRecord = {
  name: string;
} | null;

type ProfileData = {
  employeeId: string | null;
  nik: string | null;
  name: string;
  gender: string | null;
  birthDate: Date | string | null;
  birthPlace: string | null;
  academicDegree: string | null;
  lastEducation: string | null;
  religion: string | null;
  maritalStatus: string | null;
  phone: string | null;
  address: string | null;
  joinDate: Date | string | null;
  hasTmt: boolean;
  tmtStartDate: Date | string | null;
  tmtEndDate: Date | string | null;
  employmentStatus: NamedRecord;
  employeeGroup: NamedRecord;
  employeePosition: NamedRecord;
  employeeRank: NamedRecord;
  workplace: NamedRecord;
};

type AccountData = {
  email: string;
  role: string;
};

type ProfilePageViewProps = {
  profile: ProfileData;
  account: AccountData;
};

function formatDate(value: Date | string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(DATE_LOCALE, DATE_FORMATS.date).format(new Date(value));
}

function getRoleLabel(role: string) {
  return ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role;
}

function display(value: string | null | undefined) {
  return value?.trim() || "-";
}

export function ProfilePageView({ profile, account }: ProfilePageViewProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profil Saya"
        title={profile.name}
        description="Data pribadi, akun, dan informasi kepegawaian yang tersimpan di SIMDP."
        trailing={<Badge variant="secondary">{getRoleLabel(account.role)}</Badge>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="NIP" value={display(profile.employeeId)} />
        <SummaryCard label="NIK" value={display(profile.nik)} />
        <SummaryCard label="Status" value={display(profile.employmentStatus?.name)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Data akun</CardTitle>
            <CardDescription>Informasi login dan identitas akun.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Info icon={UserRound} label="Nama" value={profile.name} />
            <Info icon={Mail} label="Email" value={account.email} />
            <Info icon={ShieldCheck} label="Role" value={getRoleLabel(account.role)} />
            <Info icon={Phone} label="Telepon" value={display(profile.phone)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data pribadi</CardTitle>
            <CardDescription>Identitas dan kontak pegawai.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <Info icon={UserRound} label="Jenis kelamin" value={display(profile.gender)} />
            <Info icon={CalendarDays} label="Tanggal lahir" value={formatDate(profile.birthDate)} />
            <Info icon={MapPin} label="Tempat lahir" value={display(profile.birthPlace)} />
            <Info icon={IdCard} label="Agama" value={display(profile.religion)} />
            <Info icon={IdCard} label="Status pernikahan" value={display(profile.maritalStatus)} />
            <Info icon={MapPin} label="Alamat" value={display(profile.address)} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data kepegawaian</CardTitle>
          <CardDescription>Status, jabatan, unit kerja, dan riwayat pendidikan singkat.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <Info icon={BriefcaseBusiness} label="Status kepegawaian" value={display(profile.employmentStatus?.name)} />
          <Info icon={BriefcaseBusiness} label="Kelompok pegawai" value={display(profile.employeeGroup?.name)} />
          <Info icon={BriefcaseBusiness} label="Jabatan" value={display(profile.employeePosition?.name)} />
          <Info icon={BriefcaseBusiness} label="Pangkat/Golongan" value={display(profile.employeeRank?.name)} />
          <Info icon={MapPin} label="Tempat kerja" value={display(profile.workplace?.name)} />
          <Info icon={CalendarDays} label="Tanggal masuk" value={formatDate(profile.joinDate)} />
          <Info icon={IdCard} label="Gelar akademik" value={display(profile.academicDegree)} />
          <Info icon={IdCard} label="Pendidikan terakhir" value={display(profile.lastEducation)} />
          <Info
            icon={CalendarDays}
            label="TMT"
            value={profile.hasTmt ? `${formatDate(profile.tmtStartDate)} - ${formatDate(profile.tmtEndDate)}` : "-"}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-muted/20 p-3">
      <Icon className="mt-0.5 size-4 text-muted-foreground" />
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="break-words font-medium">{value}</div>
      </div>
    </div>
  );
}
