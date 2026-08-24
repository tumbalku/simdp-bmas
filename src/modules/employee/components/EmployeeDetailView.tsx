import Link from "next/link";
import { Briefcase, Mail, MapPin, Phone, User, Calendar, GraduationCap, Heart, Award, Pencil } from "lucide-react";
import { CardContainer } from "@/components/cards/CardContainer";
import { InfoField } from "@/components/cards/InfoField";
import { PageHeader } from "@/components/navigation/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage, AvatarBadge } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { CareerHistoryDialog } from "./CareerHistoryDialog";
import { EmployeeProfilePdfDownloadDialog } from "./EmployeeProfilePdfDownloadDialog";
import { DownloadDocumentsPdfButton } from "./DownloadDocumentsPdfButton";
import { ROLE_LABELS, getRoleBadgeStyle, routeTo, type UserRole } from "@/constants";
import { Card, CardContent } from "@/components/ui/card";

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
  hasTmt: boolean;
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
  documents: Array<{ id: string; title: string; status: string; documentNumber?: string | null; uploadedAt: string | null; expiryDate: string | null; documentTypeName: string; documentTypeCode?: string | null; archiveCategory: string }>;
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
        eyebrow="Kepegawaian"
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
        trailing={<EmployeeProfilePdfDownloadDialog employeeId={employee.id} employeeName={employee.name} />}
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
              <Badge variant="outline" className={`px-1.5 py-0 text-[10px] font-medium ${getRoleBadgeStyle(employee.role)}`}>
                {roleLabel}
              </Badge>
            </div>
            <p className="pt-0.5 text-xs font-medium text-muted-foreground">
              {employee.employeePosition || "Pegawai"} • {employee.workplace || "Unit belum diisi"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <CardContainer
          className="border-muted-foreground/10 shadow-sm"
          description="Identitas dasar, tingkat pendidikan, NIP, NIK, dan kontak pegawai."
          icon={User}
          title="Informasi Pribadi & Kontak"
        >
          <div className="grid gap-2 md:grid-cols-2">
            <InfoField icon={User} label="NIP / NIPTT" value={employee.employeeId || "-"} variant="inline" />
            <InfoField icon={User} label="NIK" value={employee.nik || "-"} variant="inline" />
            <InfoField icon={Mail} label="Email" value={employee.email || "-"} variant="inline" />
            <InfoField icon={Phone} label="Telepon" value={employee.phone || "-"} variant="inline" />
            <InfoField icon={MapPin} label="Alamat Tinggal" value={employee.address || "-"} variant="inline" />
            <InfoField icon={User} label="Jenis Kelamin" value={employee.gender || "-"} variant="inline" />
            <InfoField
              icon={Calendar}
              label="Tempat & Tanggal Lahir"
              value={`${employee.birthPlace || "-"}, ${formatDate(employee.birthDate)}`}
              variant="inline"
            />
            <InfoField
              icon={GraduationCap}
              label="Pendidikan Terakhir"
              value={employee.lastEducation
                ? `${employee.lastEducation} ${employee.academicDegree ? `(${employee.academicDegree})` : ""}`
                : "-"}
              variant="inline"
            />
            <InfoField icon={Heart} label="Agama" value={employee.religion || "-"} variant="inline" />
            <InfoField icon={Award} label="Status Pernikahan" value={employee.maritalStatus || "-"} variant="inline" />
            <InfoField icon={Briefcase} label="Mulai Bekerja (Join Date)" value={formatDate(employee.joinDate)} variant="inline" />
            <InfoField
              icon={Briefcase}
              label="Kelompok / Golongan"
              value={`${employee.employeeGroup || "-"} ${employee.employeeRank ? `(${employee.employeeRank})` : ""}`}
              variant="inline"
            />
            {employee.hasTmt && employee.tmtStartDate ? (
              <InfoField
                icon={Calendar}
                label={employee.tmtEndDate ? "Masa Kontrak" : "TMT Awal CPNS"}
                value={employee.tmtEndDate
                  ? `${formatDate(employee.tmtStartDate)} s.d. ${formatDate(employee.tmtEndDate)}`
                  : formatDate(employee.tmtStartDate)}
                variant="inline"
              />
            ) : null}
          </div>
        </CardContainer>

        <div className="space-y-6">
          <CardContainer
            title="Dokumen Pegawai"
            description={`Dokumen milik pegawai ini yang tersimpan di sistem (${employee.documentCount} berkas).`}
            action={
              <DownloadDocumentsPdfButton
                employeeId={employee.id}
                employeeName={employee.name}
              />
            }
            contentClassName="space-y-3"
          >
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
          </CardContainer>

          <CardContainer
            title="Riwayat Karier"
            description="Catatan perubahan status, jabatan, rumpun profesi, dan unit kerja."
            action={
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
            }
            contentClassName="space-y-3"
          >
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
            {employee.careerHistories.length === 0 ? <p className="text-xs text-muted-foreground">Belum ada riwayat.</p> : null}
          </CardContainer>
        </div>
      </div>
    </div>
  );
}
