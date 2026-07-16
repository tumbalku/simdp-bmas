import Link from "next/link";
import { Briefcase, Mail, MapPin, Phone } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type EmployeeDetail = {
  id: string;
  employeeId: string | null;
  nik: string | null;
  name: string;
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
  birthDate: string | null;
  birthPlace: string | null;
  joinDate: string | null;
  address: string | null;
  documentCount: number;
  documents: Array<{ id: string; title: string; status: string; uploadedAt: string | null; expiryDate: string | null; documentTypeName: string; archiveCategory: string }>;
  careerHistories: Array<{ id: string; effectiveDate: string | null; note: string | null; employmentStatus: string | null; employeePosition: string | null; workplace: string | null }>;
};

type EmployeeDetailViewProps = {
  employee: EmployeeDetail;
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value));
}

export function EmployeeDetailView({ employee }: EmployeeDetailViewProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/master-data/employees"
        backLabel="Kembali ke pegawai"
        eyebrow="Profil pegawai"
        title={employee.name}
        description={`${employee.employeePosition || "Pegawai"} - ${employee.workplace || "Unit belum diisi"}`}
        trailing={
          <Badge variant={employee.isActive ? "default" : "secondary"}>
            {employee.isActive ? "Akun aktif" : "Akun nonaktif"}
          </Badge>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardDescription>NIP</CardDescription><CardTitle>{employee.employeeId || "-"}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Dokumen</CardDescription><CardTitle>{employee.documentCount}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Status kepegawaian</CardDescription><CardTitle>{employee.employmentStatus || "-"}</CardTitle></CardHeader></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Informasi pribadi</CardTitle>
            <CardDescription>Identitas dasar dan kontak pegawai.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Info icon={Mail} label="Email" value={employee.email || "-"} />
            <Info icon={Phone} label="Telepon" value={employee.phone || "-"} />
            <Info icon={MapPin} label="Alamat" value={employee.address || "-"} />
            <Info icon={Briefcase} label="Mulai bekerja" value={formatDate(employee.joinDate)} />
            <Info icon={Briefcase} label="Lahir" value={`${employee.birthPlace || "-"}, ${formatDate(employee.birthDate)}`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dokumen pegawai</CardTitle>
            <CardDescription>Dokumen milik pegawai ini yang tersimpan di sistem.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {employee.documents.map((document) => (
              <div key={document.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                <div>
                  <div className="font-medium">{document.title}</div>
                  <div className="text-xs text-muted-foreground">{document.documentTypeName} - {formatDate(document.uploadedAt)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{document.status}</Badge>
                  <Link className={buttonVariants({ variant: "outline", size: "xs" })} href={`/documents/${document.id}`}>Buka</Link>
                </div>
              </div>
            ))}
            {employee.documents.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada dokumen.</p> : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat karier</CardTitle>
          <CardDescription>Perubahan status, jabatan, dan unit kerja.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {employee.careerHistories.map((history) => (
            <div key={history.id} className="rounded-xl border p-3">
              <div className="font-medium">{history.employeePosition || history.employmentStatus || "Riwayat karier"}</div>
              <div className="text-sm text-muted-foreground">{history.workplace || "-"} - {formatDate(history.effectiveDate)}</div>
              {history.note ? <p className="mt-2 text-sm">{history.note}</p> : null}
            </div>
          ))}
          {employee.careerHistories.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada riwayat karier.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-muted/20 p-3">
      <Icon className="mt-0.5 size-4 text-muted-foreground" />
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
}
