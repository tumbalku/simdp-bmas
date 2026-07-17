import Link from "next/link";
import { Briefcase, Mail, MapPin, Phone, User, Calendar, GraduationCap, Heart, Award, Pencil, ShieldCheck } from "lucide-react";
import { InfoCard } from "@/components/shared/InfoCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage, AvatarBadge } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS, getRoleBadgeStyle, routeTo, type UserRole } from "@/constants";
import { CareerHistoryDialog } from "./CareerHistoryDialog";

type MasterDataOption = {
  id: string;
  name: string;
};

type EmployeeGroupOption = MasterDataOption & {
  employmentStatusId: string;
};

type EmployeePositionOption = MasterDataOption & {
  professionGroupId: string;
};

type EmployeeDetail = {
  id: string;
  employeeId: string | null;
  nik: string | null;
  name: string;
  status: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  role: string;
  isActive: boolean;
  employmentStatus: string | null;
  workplace: string | null;
  employeeGroup: string | null;
  employeePosition: string | null;
  employeeRank: string | null;
  employmentStatusId: string | null;
  employeeGroupId: string | null;
  professionGroupId: string | null;
  employeePositionId: string | null;
  employeeRankId: string | null;
  workplaceId: string | null;
  birthDate: string | null;
  birthPlace: string | null;
  joinDate: string | null;
  address: string | null;
  academicDegree: string | null;
  lastEducation: string | null;
  religion: string | null;
  maritalStatus: string | null;
  avatarUrl: string | null;
  tmtStartDate: string | null;
  tmtEndDate: string | null;
  documentCount: number;
  documents: Array<{ id: string; title: string; status: string; uploadedAt: string | null; expiryDate: string | null; documentTypeName: string; archiveCategory: string }>;
  careerHistories: Array<{ id: string; effectiveDate: string | null; note: string | null; employmentStatus: string | null; employeePosition: string | null; workplace: string | null }>;
};

type EmployeeDetailViewProps = {
  employee: EmployeeDetail;
  masterData: {
    employmentStatuses: MasterDataOption[];
    employeeGroups: EmployeeGroupOption[];
    professionGroups: MasterDataOption[];
    employeePositions: EmployeePositionOption[];
    employeeRanks: MasterDataOption[];
    workplaces: MasterDataOption[];
  };
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value));
}

export function EmployeeDetailView({ employee, masterData }: EmployeeDetailViewProps) {
  const nameInitials = employee.name
    ? employee.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "EP";
  const employeeDetailHref = routeTo.masterDataEmployeeDetail(employee.id);
  const roleLabel = employee.role in ROLE_LABELS ? ROLE_LABELS[employee.role as UserRole] : employee.role;

  const buildDocumentHref = (documentId: string) => {
    const params = new URLSearchParams({ returnTo: employeeDetailHref });

    return `${routeTo.documentDetail(documentId)}?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/master-data/employees"
        backLabel="Kembali ke data pegawai"
        title="Profil Pegawai"
        description="Detail informasi profil, status kepegawaian, dokumen, dan riwayat karier pegawai."
        actions={[
          {
            label: "Edit Pegawai",
            href: routeTo.masterDataEmployeeEdit(employee.id),
            icon: Pencil,
          },
        ]}
      />

      {/* Profil Centered Box */}
      <Card className="border-muted-foreground/10 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center space-y-2  text-center">
          <Avatar size="xl" className="border shadow-sm">
            {employee.avatarUrl && <AvatarImage src={employee.avatarUrl} alt={employee.name} />}
            <AvatarFallback className="bg-primary/10 text-lg font-bold text-primary">
              {nameInitials}
            </AvatarFallback>
            {employee.isActive && (
              <AvatarBadge className="bg-green-600 dark:bg-green-800" />
            )}
          </Avatar>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">{employee.name}</h2>
            <div className="flex items-center justify-center gap-1.5">
              <Badge variant="outline" className="bg-muted/50 px-1.5 py-0 text-[10px] font-semibold text-foreground">
                {employee.status || "Aktif"}
              </Badge>
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-medium">
                {employee.employmentStatus || "-"}
              </Badge>
            </div>
            <p className="pt-0.5 text-xs font-medium text-muted-foreground">
              {employee.employeePosition || "Pegawai"} • {employee.workplace || "Unit belum diisi"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <InfoCard
          className="border-muted-foreground/10 shadow-sm"
          columns={2}
          description="Identitas dasar, tingkat pendidikan, NIP, NIK, dan kontak pegawai."
          fieldVariant="inline"
          fields={[
            { key: "employeeId", icon: User, label: "NIP / NIPTT", value: employee.employeeId || "-" },
            { key: "nik", icon: User, label: "NIK", value: employee.nik || "-" },
            { key: "email", icon: Mail, label: "Email", value: employee.email || "-" },
            { key: "phone", icon: Phone, label: "Telepon", value: employee.phone || "-" },
            { key: "address", icon: MapPin, label: "Alamat Tinggal", value: employee.address || "-" },
            { key: "gender", icon: User, label: "Jenis Kelamin", value: employee.gender || "-" },
            {
              key: "birth",
              icon: Calendar,
              label: "Tempat & Tanggal Lahir",
              value: `${employee.birthPlace || "-"}, ${formatDate(employee.birthDate)}`,
            },
            {
              key: "education",
              icon: GraduationCap,
              label: "Pendidikan Terakhir",
              value: employee.lastEducation
                ? `${employee.lastEducation} ${employee.academicDegree ? `(${employee.academicDegree})` : ""}`
                : "-",
            },
            { key: "religion", icon: Heart, label: "Agama", value: employee.religion || "-" },
            {
              key: "maritalStatus",
              icon: Award,
              label: "Status Pernikahan",
              value: employee.maritalStatus || "-",
            },
            {
              key: "joinDate",
              icon: Briefcase,
              label: "Mulai Bekerja (Join Date)",
              value: formatDate(employee.joinDate),
            },
            {
              key: "groupRank",
              icon: Briefcase,
              label: "Kelompok / Golongan",
              value: `${employee.employeeGroup || "-"} ${employee.employeeRank ? `(${employee.employeeRank})` : ""}`,
            },
            {
              key: "tmt",
              icon: Calendar,
              label: employee.tmtEndDate ? "Masa Kontrak" : "TMT Awal CPNS",
              value: employee.tmtEndDate
                ? `${formatDate(employee.tmtStartDate)} s.d. ${formatDate(employee.tmtEndDate)}`
                : formatDate(employee.tmtStartDate),
              hidden: !employee.tmtStartDate,
            },
          ]}
          icon={User}
          title="Informasi Pribadi & Kontak"
          truncate
        />

        <div className="space-y-6">
          <Card className="border-muted-foreground/10 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <ShieldCheck className="size-4 text-primary" />
                Data Akun
              </CardTitle>
              <CardDescription>Email login, role, dan status akses akun SIMDP.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border bg-muted/20 p-3 text-sm sm:col-span-2">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <Mail className="size-3.5" />
                  Email Login
                </div>
                <div className="mt-1 truncate font-medium" title={employee.email || undefined}>
                  {employee.email || "-"}
                </div>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Role</div>
                <Badge variant="outline" className={`mt-2 ${getRoleBadgeStyle(employee.role)}`}>
                  {roleLabel}
                </Badge>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status Akun</div>
                <Badge variant={employee.isActive ? "default" : "secondary"} className="mt-2">
                  {employee.isActive ? "Aktif" : "Nonaktif"}
                </Badge>
                <p className="mt-2 text-xs text-muted-foreground">
                  {employee.isActive ? "Akun dapat login ke SIMDP." : "Akun tidak dapat login sampai diaktifkan kembali."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted-foreground/10 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Dokumen Pegawai</CardTitle>
              <CardDescription>Dokumen milik pegawai ini yang tersimpan di sistem ({employee.documentCount} berkas).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {employee.documents.map((document) => (
                <div key={document.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-xs">
                  <div>
                    <div className="font-semibold text-foreground">{document.title}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {document.documentTypeName} • Diunggah {formatDate(document.uploadedAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{document.status}</Badge>
                    <Link className={buttonVariants({ variant: "outline", size: "xs" })} href={buildDocumentHref(document.id)}>Buka</Link>
                  </div>
                </div>
              ))}
              {employee.documents.length === 0 ? <p className="text-xs text-muted-foreground">Belum ada dokumen.</p> : null}
            </CardContent>
          </Card>

          <Card className="border-muted-foreground/10 shadow-sm">
            <CardHeader>
              <div>
                <CardTitle className="text-base font-semibold">Riwayat Karier</CardTitle>
                <CardDescription>Catatan perubahan status, jabatan, rumpun profesi, dan unit kerja.</CardDescription>
              </div>
              <CardAction>
                <CareerHistoryDialog
                  employeeId={employee.id}
                  currentValues={{
                    employmentStatusId: employee.employmentStatusId,
                    employeeGroupId: employee.employeeGroupId,
                    professionGroupId: employee.professionGroupId,
                    employeePositionId: employee.employeePositionId,
                    employeeRankId: employee.employeeRankId,
                    workplaceId: employee.workplaceId,
                  }}
                  options={masterData}
                />
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-3">
              {employee.careerHistories.map((history) => (
                <div key={history.id} className="rounded-lg border p-3 text-xs">
                  <div className="font-semibold text-foreground">
                    {history.employeePosition || history.employmentStatus || "Riwayat Karier"}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {history.workplace || "-"} • Berlaku TMT {formatDate(history.effectiveDate)}
                  </div>
                  {history.note ? <p className="mt-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded">{history.note}</p> : null}
                </div>
              ))}
              {employee.careerHistories.length === 0 ? <p className="text-xs text-muted-foreground">Belum ada riwayat karier.</p> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
