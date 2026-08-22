import { Briefcase, Calendar, GraduationCap, Heart, Mail, MapPin, Phone, ShieldCheck, User } from "lucide-react";

import { InfoCard } from "@/components/cards/InfoCard";
import { PageHeader } from "@/components/navigation/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DATE_FORMATS, DATE_LOCALE, ROLE_LABELS } from "@/constants";
import { EmployeeProfilePdfDownloadDialog } from "@/modules/employee/components/EmployeeProfilePdfDownloadDialog";
import { ProfileAvatarUpload } from "@/modules/employee/components/ProfileAvatarUpload";
import { ProfileEditDialog } from "@/modules/employee/components/ProfileEditDialog";
import { getEmployeeStatusLabel, getGenderLabel, getMaritalStatusLabel, getReligionLabel } from "../constants";

type NamedRecord = {
  name: string;
} | null;

type ProfileData = {
  id: string;
  employeeId: string | null;
  nik: string | null;
  name: string;
  status: string | null;
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
  avatarUrl: string | null;
  isActive: boolean;
};

type ProfilePageViewProps = {
  profile: ProfileData;
  account: AccountData;
};

function formatDate(value: Date | string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(DATE_LOCALE, DATE_FORMATS.date).format(new Date(value));
}

function formatDateInput(value: Date | string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function getRoleLabel(role: string) {
  return ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role;
}

function display(value: string | null | undefined) {
  return value?.trim() || "-";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "PR";
}

function formatTmt(profile: ProfileData) {
  if (!profile.hasTmt || !profile.tmtStartDate) return null;

  if (profile.tmtEndDate) {
    return {
      label: "Masa Kontrak",
      value: `${formatDate(profile.tmtStartDate)} s.d. ${formatDate(profile.tmtEndDate)}`,
    };
  }

  return {
    label: "TMT Awal CPNS",
    value: formatDate(profile.tmtStartDate),
  };
}

export function ProfilePageView({ profile, account }: ProfilePageViewProps) {
  const tmt = formatTmt(profile);
  const roleLabel = getRoleLabel(account.role);
  const initials = getInitials(profile.name);
  const statusLabel = getEmployeeStatusLabel(profile.status) || "Aktif";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profil"
        title="Profil Pegawai"
        description="Lihat dan perbarui data pribadi yang aman dikelola mandiri."
        trailing={
          <>
            <ProfileEditDialog
              initialData={{
                phone: profile.phone || "",
                address: profile.address || "",
                birthPlace: profile.birthPlace || "",
                birthDate: formatDateInput(profile.birthDate),
                religion: profile.religion || "",
                maritalStatus: profile.maritalStatus || "",
              }}
            />
            <EmployeeProfilePdfDownloadDialog employeeId={profile.id} employeeName={profile.name} />
          </>
        }
      />

      <Card className="border-muted-foreground/10 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center space-y-2 text-center">
          <ProfileAvatarUpload
            name={profile.name}
            initials={initials}
            avatarUrl={account.avatarUrl}
            isActive={account.isActive}
          />
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">{profile.name}</h2>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <Badge variant="outline" className="bg-muted/50 px-1.5 py-0 text-[10px] font-semibold text-foreground">
                {statusLabel}
              </Badge>
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-medium">
                {display(profile.employmentStatus?.name)}
              </Badge>
              <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-medium">
                {roleLabel}
              </Badge>
            </div>
            <p className="pt-0.5 text-xs font-medium text-muted-foreground">
              {profile.employeePosition?.name || "Pegawai"} • {profile.workplace?.name || "Unit belum diisi"}
            </p>
          </div>
        </CardContent>
      </Card>

      <InfoCard
        className="border-muted-foreground/10 shadow-sm"
        columns={4}
        description="Identitas dasar, tingkat pendidikan, NIP, NIK, dan kontak pegawai."
        fieldVariant="inline"
        fields={[
          { key: "employeeId", icon: User, label: "NIP / NIPTT", value: display(profile.employeeId) },
          { key: "nik", icon: User, label: "NIK", value: display(profile.nik) },
          { key: "email", icon: Mail, label: "Email Akun", value: account.email },
          { key: "phone", icon: Phone, label: "Telepon", value: display(profile.phone) },
          { key: "address", icon: MapPin, label: "Alamat Tinggal", value: display(profile.address) },
          { key: "gender", icon: User, label: "Jenis Kelamin", value: display(getGenderLabel(profile.gender)) },
          {
            key: "birth",
            icon: Calendar,
            label: "Tempat & Tanggal Lahir",
            value: `${display(profile.birthPlace)}, ${formatDate(profile.birthDate)}`,
          },
          {
            key: "education",
            icon: GraduationCap,
            label: "Pendidikan Terakhir",
            value: profile.lastEducation
              ? `${profile.lastEducation} ${profile.academicDegree ? `(${profile.academicDegree})` : ""}`
              : "-",
          },
          { key: "religion", icon: Heart, label: "Agama", value: display(getReligionLabel(profile.religion)) },
          { key: "maritalStatus", icon: ShieldCheck, label: "Status Pernikahan", value: display(getMaritalStatusLabel(profile.maritalStatus)) },
          { key: "joinDate", icon: Briefcase, label: "Tanggal Mulai Bekerja", value: formatDate(profile.joinDate) },
          {
            key: "groupRank",
            icon: Briefcase,
            label: "Kelompok / Golongan",
            value: `${display(profile.employeeGroup?.name)} ${profile.employeeRank?.name ? `(${profile.employeeRank.name})` : ""}`,
          },
          {
            key: "tmt",
            icon: Calendar,
            label: tmt?.label ?? "TMT Awal CPNS",
            value: tmt?.value ?? "-",
            hidden: !tmt,
          },
        ]}
        icon={User}
        title="Informasi Pribadi & Kontak"
        truncate
      />
    </div>
  );
}
