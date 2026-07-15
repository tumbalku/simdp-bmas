import { PrismaClient, Role, DocumentStatus, ArchiveCategory } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as pg from "pg";
import * as argon2 from "argon2";
import * as dotenv from "dotenv";
import { createHash } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEMO_PASSWORD = "password123";
const REVIEWER_NAME = "Siti Rahma, S.Sos";

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function daysAgo(days: number) {
  return daysFromNow(-days);
}

function dateOnly(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day));
}

function pdfBuffer(title: string) {
  // Minimal valid-ish PDF for local preview smoke testing.
  const safeTitle = title.replace(/[()\\]/g, " ");
  return Buffer.from(
    `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length 82 >>\nstream\nBT /F1 18 Tf 72 720 Td (${safeTitle}) Tj 0 -32 Td (SIMDP RSUD Bahteramas demo seed) Tj ET\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n`,
    "utf8",
  );
}

async function createDemoPdf(relativePath: string, title: string) {
  const cleanPath = relativePath.startsWith("uploads/")
    ? relativePath.slice("uploads/".length)
    : relativePath;
  const fullPath = path.join(process.cwd(), "uploads", cleanPath);
  const buffer = pdfBuffer(title);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, buffer);

  return {
    fileSize: BigInt(buffer.length),
    fileHash: createHash("sha256").update(buffer).digest("hex"),
  };
}

async function resetDemoData() {
  await prisma.notification.deleteMany({});
  await prisma.verificationHistory.deleteMany({});
  await prisma.documentRecord.deleteMany({});
  await prisma.documentTypeProfessionGroup.deleteMany({});
  await prisma.documentTypeEmploymentStatus.deleteMany({});
  await prisma.documentTypeEmployeeGroup.deleteMany({});
  await prisma.documentTypeEmployeeRank.deleteMany({});
  await prisma.documentTypeWorkplace.deleteMany({});
  await prisma.documentType.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});
  await prisma.employeeCareerHistory.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.securityLog.deleteMany({});
  await prisma.systemSetting.deleteMany({});
  await prisma.employeePosition.deleteMany({});
  await prisma.professionGroup.deleteMany({});
  await prisma.employeeGroup.deleteMany({});
  await prisma.employeeRank.deleteMany({});
  await prisma.workplace.deleteMany({});
  await prisma.employmentStatus.deleteMany({});
  await prisma.user.deleteMany({});
}

async function main() {
  console.log("Memulai seeding data demo SIMDP...");
  await resetDemoData();

  const passwordHash = await argon2.hash(DEMO_PASSWORD);

  const [pns, pppk, kontrak, honorer, internship] = await Promise.all([
    prisma.employmentStatus.create({ data: { id: "seed_status_pns", name: "PNS" } }),
    prisma.employmentStatus.create({ data: { id: "seed_status_pppk", name: "PPPK" } }),
    prisma.employmentStatus.create({ data: { id: "seed_status_kontrak", name: "Kontrak BLUD" } }),
    prisma.employmentStatus.create({ data: { id: "seed_status_honorer", name: "Honorer Daerah" } }),
    prisma.employmentStatus.create({ data: { id: "seed_status_internship", name: "Magang / Internship" } }),
  ]);

  const groups = await Promise.all([
    prisma.employeeGroup.create({ data: { id: "seed_group_medis", name: "Tenaga Medis", employmentStatusId: pns.id } }),
    prisma.employeeGroup.create({ data: { id: "seed_group_keperawatan", name: "Keperawatan", employmentStatusId: pppk.id } }),
    prisma.employeeGroup.create({ data: { id: "seed_group_penunjang", name: "Penunjang Medis", employmentStatusId: kontrak.id } }),
    prisma.employeeGroup.create({ data: { id: "seed_group_administrasi", name: "Administrasi", employmentStatusId: honorer.id } }),
    prisma.employeeGroup.create({ data: { id: "seed_group_magang", name: "Peserta Magang", employmentStatusId: internship.id } }),
  ]);

  const professionGroups = await Promise.all([
    prisma.professionGroup.create({ data: { id: "seed_prof_dokter", name: "Dokter" } }),
    prisma.professionGroup.create({ data: { id: "seed_prof_perawat", name: "Perawat" } }),
    prisma.professionGroup.create({ data: { id: "seed_prof_bidan", name: "Bidan" } }),
    prisma.professionGroup.create({ data: { id: "seed_prof_farmasi", name: "Farmasi" } }),
    prisma.professionGroup.create({ data: { id: "seed_prof_admin", name: "Administrasi RS" } }),
  ]);

  const positions = await Promise.all([
    prisma.employeePosition.create({ data: { id: "seed_pos_dokter_umum", name: "Dokter Umum", professionGroupId: professionGroups[0].id } }),
    prisma.employeePosition.create({ data: { id: "seed_pos_dokter_spesialis", name: "Dokter Spesialis Anak", professionGroupId: professionGroups[0].id } }),
    prisma.employeePosition.create({ data: { id: "seed_pos_perawat", name: "Perawat Pelaksana", professionGroupId: professionGroups[1].id } }),
    prisma.employeePosition.create({ data: { id: "seed_pos_kepala_ruang", name: "Kepala Ruangan", professionGroupId: professionGroups[1].id } }),
    prisma.employeePosition.create({ data: { id: "seed_pos_bidan", name: "Bidan Pelaksana", professionGroupId: professionGroups[2].id } }),
    prisma.employeePosition.create({ data: { id: "seed_pos_apoteker", name: "Apoteker", professionGroupId: professionGroups[3].id } }),
    prisma.employeePosition.create({ data: { id: "seed_pos_rekam_medis", name: "Perekam Medis", professionGroupId: professionGroups[4].id } }),
    prisma.employeePosition.create({ data: { id: "seed_pos_admin_kepeg", name: "Admin Kepegawaian", professionGroupId: professionGroups[4].id } }),
  ]);

  const ranks = await Promise.all([
    prisma.employeeRank.create({ data: { id: "seed_rank_ii_a", name: "Pengatur Muda / II-a" } }),
    prisma.employeeRank.create({ data: { id: "seed_rank_ii_c", name: "Pengatur / II-c" } }),
    prisma.employeeRank.create({ data: { id: "seed_rank_iii_a", name: "Penata Muda / III-a" } }),
    prisma.employeeRank.create({ data: { id: "seed_rank_iii_b", name: "Penata Muda Tk. I / III-b" } }),
    prisma.employeeRank.create({ data: { id: "seed_rank_iii_d", name: "Penata Tk. I / III-d" } }),
    prisma.employeeRank.create({ data: { id: "seed_rank_iv_a", name: "Pembina / IV-a" } }),
  ]);

  const workplaces = await Promise.all([
    prisma.workplace.create({ data: { id: "seed_wp_igd", name: "Instalasi Gawat Darurat" } }),
    prisma.workplace.create({ data: { id: "seed_wp_icu", name: "Ruang ICU" } }),
    prisma.workplace.create({ data: { id: "seed_wp_poli_anak", name: "Poliklinik Anak" } }),
    prisma.workplace.create({ data: { id: "seed_wp_poli_bedah", name: "Poliklinik Bedah" } }),
    prisma.workplace.create({ data: { id: "seed_wp_farmasi", name: "Instalasi Farmasi" } }),
    prisma.workplace.create({ data: { id: "seed_wp_rekam_medis", name: "Rekam Medis" } }),
    prisma.workplace.create({ data: { id: "seed_wp_kepegawaian", name: "Subbag Kepegawaian" } }),
    prisma.workplace.create({ data: { id: "seed_wp_laboratorium", name: "Laboratorium Klinik" } }),
  ]);

  const documentTypes = await Promise.all([
    prisma.documentType.create({ data: { id: "seed_type_ktp", code: "KTP", name: "Kartu Tanda Penduduk", archiveCategory: ArchiveCategory.PERSONAL, isMandatory: true, requiresDocumentNumber: true, allowedFormats: "pdf,jpg,png", maxSizeMb: 2, icon: "id-card" } }),
    prisma.documentType.create({ data: { id: "seed_type_ijazah", code: "IJAZAH", name: "Ijazah Pendidikan Terakhir", archiveCategory: ArchiveCategory.EDUCATION, isMandatory: true, requiresIssueDate: true, allowedFormats: "pdf", maxSizeMb: 5, icon: "graduation-cap" } }),
    prisma.documentType.create({ data: { id: "seed_type_sk_cpns", code: "SK-CPNS", name: "SK CPNS / Pengangkatan", archiveCategory: ArchiveCategory.EMPLOYMENT, isMandatory: true, requiresDocumentNumber: true, requiresIssueDate: true, allowedFormats: "pdf", maxSizeMb: 5, icon: "briefcase" } }),
    prisma.documentType.create({ data: { id: "seed_type_str", code: "STR", name: "Surat Tanda Registrasi", archiveCategory: ArchiveCategory.CERTIFICATION, isMandatory: true, requiresDocumentNumber: true, requiresIssueDate: true, requiresExpiryDate: true, allowedFormats: "pdf,jpg,png", maxSizeMb: 4, icon: "shield-check" } }),
    prisma.documentType.create({ data: { id: "seed_type_sip", code: "SIP", name: "Surat Izin Praktik", archiveCategory: ArchiveCategory.CERTIFICATION, requiresDocumentNumber: true, requiresIssueDate: true, requiresExpiryDate: true, allowedFormats: "pdf", maxSizeMb: 4, icon: "badge-check" } }),
    prisma.documentType.create({ data: { id: "seed_type_pelatihan", code: "SERT-PEL", name: "Sertifikat Pelatihan", archiveCategory: ArchiveCategory.CERTIFICATION, allowMultiple: true, requiresIssueDate: true, allowedFormats: "pdf,jpg,png", maxSizeMb: 4, icon: "award" } }),
    prisma.documentType.create({ data: { id: "seed_type_npwp", code: "NPWP", name: "NPWP", archiveCategory: ArchiveCategory.LEGAL, requiresDocumentNumber: true, allowedFormats: "pdf,jpg,png", maxSizeMb: 2, icon: "file-text" } }),
    prisma.documentType.create({ data: { id: "seed_type_kk", code: "KK", name: "Kartu Keluarga", archiveCategory: ArchiveCategory.PERSONAL, allowedFormats: "pdf,jpg,png", maxSizeMb: 3, icon: "users" } }),
    prisma.documentType.create({ data: { id: "seed_type_bls", code: "BLS", name: "Sertifikat Basic Life Support", archiveCategory: ArchiveCategory.CERTIFICATION, allowMultiple: true, requiresIssueDate: true, requiresExpiryDate: true, allowedFormats: "pdf", maxSizeMb: 4, icon: "heart-pulse" } }),
    prisma.documentType.create({ data: { id: "seed_type_surat_sehat", code: "SURAT-SEHAT", name: "Surat Keterangan Sehat", archiveCategory: ArchiveCategory.LEGAL, requiresIssueDate: true, requiresExpiryDate: true, allowedFormats: "pdf", maxSizeMb: 3, icon: "stethoscope" } }),
  ]);

  await prisma.documentTypeEmploymentStatus.createMany({
    data: documentTypes.flatMap((type) => [pns, pppk, kontrak, honorer].map((status) => ({
      id: `seed_rel_type_status_${type.id}_${status.id}`,
      documentTypeId: type.id,
      employmentStatusId: status.id,
    }))),
  });

  await prisma.documentTypeWorkplace.createMany({
    data: documentTypes.slice(0, 6).flatMap((type) => workplaces.slice(0, 6).map((workplace) => ({
      id: `seed_rel_type_wp_${type.id}_${workplace.id}`,
      documentTypeId: type.id,
      workplaceId: workplace.id,
    }))),
  });

  const employeeSeeds = [
    { id: "seed_admin", email: "admin@rsudbahteramas.test", role: Role.ADMIN, name: "dr. Arman Satria, M.Kes", employeeId: "197801012006041001", nik: "7471010101780001", gender: "Laki-laki", birthPlace: "Kendari", birthDate: dateOnly(1978, 1, 1), degree: "M.Kes", education: "S2 Kesehatan Masyarakat", status: pns, group: groups[0], position: positions[1], rank: ranks[5], workplace: workplaces[6] },
    { id: "seed_staff_1", email: "staff@rsudbahteramas.test", role: Role.STAFF, name: "Siti Rahma, S.Sos", employeeId: "198805122010012004", nik: "7471021205880002", gender: "Perempuan", birthPlace: "Bau-Bau", birthDate: dateOnly(1988, 5, 12), degree: "S.Sos", education: "S1 Administrasi Publik", status: pns, group: groups[3], position: positions[7], rank: ranks[3], workplace: workplaces[6] },
    { id: "seed_staff_2", email: "verifikator@rsudbahteramas.test", role: Role.STAFF, name: "Muh. Fadli, A.Md.RMIK", employeeId: "199206212019031006", nik: "7471032106920003", gender: "Laki-laki", birthPlace: "Kolaka", birthDate: dateOnly(1992, 6, 21), degree: "A.Md.RMIK", education: "D3 Rekam Medis", status: pppk, group: groups[3], position: positions[6], rank: ranks[2], workplace: workplaces[5] },
    { id: "seed_emp_1", email: "budi.setiawan@rsudbahteramas.test", role: Role.EMPLOYEE, name: "Budi Setiawan, A.Md.Kep", employeeId: "199503032020031003", nik: "7471040303950004", gender: "Laki-laki", birthPlace: "Kendari", birthDate: dateOnly(1995, 3, 3), degree: "A.Md.Kep", education: "D3 Keperawatan", status: kontrak, group: groups[1], position: positions[2], rank: ranks[1], workplace: workplaces[0] },
    { id: "seed_emp_2", email: "dewi.lestari@rsudbahteramas.test", role: Role.EMPLOYEE, name: "Dewi Lestari, S.Kep.Ns", employeeId: "199104142016042005", nik: "7471051404910005", gender: "Perempuan", birthPlace: "Unaaha", birthDate: dateOnly(1991, 4, 14), degree: "S.Kep.Ns", education: "Profesi Ners", status: pns, group: groups[1], position: positions[3], rank: ranks[4], workplace: workplaces[1] },
    { id: "seed_emp_3", email: "fitri.handayani@rsudbahteramas.test", role: Role.EMPLOYEE, name: "Fitri Handayani, A.Md.Keb", employeeId: "199607092021052006", nik: "7471060907960006", gender: "Perempuan", birthPlace: "Raha", birthDate: dateOnly(1996, 7, 9), degree: "A.Md.Keb", education: "D3 Kebidanan", status: pppk, group: groups[1], position: positions[4], rank: ranks[2], workplace: workplaces[2] },
    { id: "seed_emp_4", email: "eko.prasetyo@rsudbahteramas.test", role: Role.EMPLOYEE, name: "Eko Prasetyo, S.Farm.Apt", employeeId: "198912302015011007", nik: "7471073012890007", gender: "Laki-laki", birthPlace: "Makassar", birthDate: dateOnly(1989, 12, 30), degree: "Apt", education: "Profesi Apoteker", status: pns, group: groups[2], position: positions[5], rank: ranks[3], workplace: workplaces[4] },
    { id: "seed_emp_5", email: "lina.marlina@rsudbahteramas.test", role: Role.EMPLOYEE, name: "Lina Marlina, A.Md.AK", employeeId: null, nik: "7471081808980008", gender: "Perempuan", birthPlace: "Wakatobi", birthDate: dateOnly(1998, 8, 18), degree: "A.Md.AK", education: "D3 Analis Kesehatan", status: honorer, group: groups[2], position: positions[6], rank: ranks[0], workplace: workplaces[7] },
    { id: "seed_emp_6", email: "andri.saputra@rsudbahteramas.test", role: Role.EMPLOYEE, name: "Andri Saputra, S.Ked", employeeId: null, nik: "7471092201990009", gender: "Laki-laki", birthPlace: "Konawe", birthDate: dateOnly(1999, 1, 22), degree: "S.Ked", education: "Pendidikan Dokter", status: internship, group: groups[4], position: positions[0], rank: ranks[0], workplace: workplaces[3] },
    { id: "seed_emp_7", email: "kartika.sari@rsudbahteramas.test", role: Role.EMPLOYEE, name: "Kartika Sari, S.Tr.Keb", employeeId: "199305272018072010", nik: "7471102705930010", gender: "Perempuan", birthPlace: "Kendari", birthDate: dateOnly(1993, 5, 27), degree: "S.Tr.Keb", education: "D4 Kebidanan", status: pppk, group: groups[1], position: positions[4], rank: ranks[2], workplace: workplaces[2] },
  ];

  const employees = [];
  for (let i = 0; i < employeeSeeds.length; i++) {
    const item = employeeSeeds[i];
    const user = await prisma.user.create({
      data: {
        id: `usr_${item.id}`,
        email: item.email,
        passwordHash,
        role: item.role,
        isActive: true,
      },
    });

    const employee = await prisma.employee.create({
      data: {
        id: `emp_${item.id}`,
        userId: user.id,
        employeeId: item.employeeId,
        nik: item.nik,
        name: item.name,
        gender: item.gender,
        birthPlace: item.birthPlace,
        birthDate: item.birthDate,
        academicDegree: item.degree,
        lastEducation: item.education,
        religion: i % 3 === 0 ? "Islam" : i % 3 === 1 ? "Kristen" : "Hindu",
        maritalStatus: i % 2 === 0 ? "Menikah" : "Belum Menikah",
        phone: `08${String(1210000000 + i * 73129)}`,
        address: `Jl. Demo SIMDP No. ${10 + i}, Kendari`,
        joinDate: dateOnly(2015 + (i % 8), (i % 12) + 1, 10),
        hasTmt: item.role !== Role.ADMIN,
        tmtStartDate: dateOnly(2020 + (i % 4), (i % 12) + 1, 1),
        tmtEndDate: item.status.id === internship.id ? daysFromNow(120) : null,
        employmentStatusId: item.status.id,
        employeeGroupId: item.group.id,
        employeePositionId: item.position.id,
        employeeRankId: item.rank.id,
        workplaceId: item.workplace.id,
        createdBy: "usr_seed_admin",
        updatedBy: "usr_seed_admin",
      },
    });

    employees.push({ user, employee, seed: item });
  }

  await prisma.employeeCareerHistory.createMany({
    data: employees.map(({ employee, seed }, index) => ({
      id: `seed_career_${index + 1}`,
      employeeId: employee.id,
      employmentStatusId: seed.status.id,
      employeeGroupId: seed.group.id,
      employeePositionId: seed.position.id,
      employeeRankId: seed.rank.id,
      workplaceId: seed.workplace.id,
      effectiveDate: dateOnly(2020 + (index % 4), (index % 12) + 1, 1),
      note: `Riwayat penempatan awal ${seed.workplace.name}`,
      createdBy: "usr_seed_staff_1",
    })),
  });

  const staffUser = employees[1].user;
  const employeeUser = employees[3].user;

  const documentSeeds = [
    { id: "seed_doc_001", owner: 3, type: 0, title: "KTP Budi Setiawan", status: DocumentStatus.APPROVED, number: "7471040303950004", issue: dateOnly(2017, 4, 12), expiry: null, uploadedDaysAgo: 46, reviewedDaysAgo: 44, note: "Data identitas sesuai dan terbaca jelas." },
    { id: "seed_doc_002", owner: 3, type: 1, title: "Ijazah D3 Keperawatan Budi", status: DocumentStatus.APPROVED, number: "IJZ-KEP-2016-023", issue: dateOnly(2016, 9, 20), expiry: null, uploadedDaysAgo: 40, reviewedDaysAgo: 39, note: "Ijazah valid dan sesuai profil pegawai." },
    { id: "seed_doc_003", owner: 3, type: 3, title: "STR Keperawatan Budi", status: DocumentStatus.PENDING, number: "STR/KEP/2026/0182", issue: dateOnly(2026, 1, 10), expiry: daysFromNow(27), uploadedDaysAgo: 1, reviewedDaysAgo: null, note: null },
    { id: "seed_doc_004", owner: 4, type: 3, title: "STR Ners Dewi Lestari", status: DocumentStatus.APPROVED, number: "STR/NERS/2025/0091", issue: dateOnly(2025, 2, 4), expiry: daysFromNow(300), uploadedDaysAgo: 25, reviewedDaysAgo: 23, note: "STR aktif dan masa berlaku aman." },
    { id: "seed_doc_005", owner: 5, type: 4, title: "SIP Bidan Fitri Handayani", status: DocumentStatus.REJECTED, number: "SIP/BID/2026/0037", issue: dateOnly(2026, 3, 16), expiry: daysFromNow(600), uploadedDaysAgo: 8, reviewedDaysAgo: 7, note: "Nomor SIP kurang jelas, mohon unggah ulang hasil scan yang lebih tajam." },
    { id: "seed_doc_006", owner: 6, type: 5, title: "Sertifikat Pelatihan Farmasi Klinik", status: DocumentStatus.PENDING, number: "PLT-FAR-2026-071", issue: dateOnly(2026, 5, 5), expiry: null, uploadedDaysAgo: 2, reviewedDaysAgo: null, note: null },
    { id: "seed_doc_007", owner: 7, type: 8, title: "Sertifikat BLS Lina Marlina", status: DocumentStatus.EXPIRED, number: "BLS-2022-778", issue: dateOnly(2022, 6, 1), expiry: daysAgo(15), uploadedDaysAgo: 120, reviewedDaysAgo: 118, note: "Sertifikat lama tercatat, perlu pembaruan karena sudah kedaluwarsa." },
    { id: "seed_doc_008", owner: 8, type: 2, title: "SK Magang Andri Saputra", status: DocumentStatus.APPROVED, number: "SK-MAGANG-2026-014", issue: dateOnly(2026, 1, 2), expiry: daysFromNow(110), uploadedDaysAgo: 18, reviewedDaysAgo: 16, note: "SK magang sesuai periode aktif." },
    { id: "seed_doc_009", owner: 9, type: 9, title: "Surat Keterangan Sehat Kartika", status: DocumentStatus.PENDING, number: "SKS-2026-114", issue: dateOnly(2026, 6, 20), expiry: daysFromNow(75), uploadedDaysAgo: 3, reviewedDaysAgo: null, note: null },
    { id: "seed_doc_010", owner: 4, type: 6, title: "NPWP Dewi Lestari", status: DocumentStatus.REPLACED, number: "76.543.210.1-811.000", issue: dateOnly(2020, 1, 15), expiry: null, uploadedDaysAgo: 300, reviewedDaysAgo: 295, note: "Dokumen lama sudah diganti dengan versi terbaru." },
    { id: "seed_doc_011", owner: 3, type: 4, title: "SIP Perawat Budi Setiawan", status: DocumentStatus.PENDING, number: "SIP/PRW/2026/0211", issue: dateOnly(2026, 2, 12), expiry: daysFromNow(540), uploadedDaysAgo: 1, reviewedDaysAgo: null, note: null },
    { id: "seed_doc_012", owner: 3, type: 5, title: "Sertifikat Komunikasi Efektif Budi", status: DocumentStatus.PENDING, number: "PLT-KEP-2026-112", issue: dateOnly(2026, 4, 18), expiry: null, uploadedDaysAgo: 2, reviewedDaysAgo: null, note: null },
    { id: "seed_doc_013", owner: 4, type: 0, title: "KTP Dewi Lestari", status: DocumentStatus.PENDING, number: "7471051404910005", issue: dateOnly(2018, 1, 8), expiry: null, uploadedDaysAgo: 4, reviewedDaysAgo: null, note: null },
    { id: "seed_doc_014", owner: 4, type: 1, title: "Ijazah Profesi Ners Dewi", status: DocumentStatus.PENDING, number: "IJZ-NERS-2015-044", issue: dateOnly(2015, 11, 12), expiry: null, uploadedDaysAgo: 5, reviewedDaysAgo: null, note: null },
    { id: "seed_doc_015", owner: 4, type: 8, title: "Sertifikat BLS Dewi Lestari", status: DocumentStatus.PENDING, number: "BLS-2026-145", issue: dateOnly(2026, 5, 2), expiry: daysFromNow(700), uploadedDaysAgo: 6, reviewedDaysAgo: null, note: null },
    { id: "seed_doc_016", owner: 5, type: 0, title: "KTP Fitri Handayani", status: DocumentStatus.PENDING, number: "7471060907960006", issue: dateOnly(2017, 7, 22), expiry: null, uploadedDaysAgo: 2, reviewedDaysAgo: null, note: null },
    { id: "seed_doc_017", owner: 5, type: 1, title: "Ijazah D3 Kebidanan Fitri", status: DocumentStatus.PENDING, number: "IJZ-BID-2017-089", issue: dateOnly(2017, 8, 25), expiry: null, uploadedDaysAgo: 3, reviewedDaysAgo: null, note: null },
    { id: "seed_doc_018", owner: 5, type: 3, title: "STR Bidan Fitri Handayani", status: DocumentStatus.PENDING, number: "STR/BID/2026/0188", issue: dateOnly(2026, 3, 5), expiry: daysFromNow(430), uploadedDaysAgo: 5, reviewedDaysAgo: null, note: null },
    { id: "seed_doc_019", owner: 6, type: 0, title: "KTP Eko Prasetyo", status: DocumentStatus.PENDING, number: "7471073012890007", issue: dateOnly(2016, 12, 14), expiry: null, uploadedDaysAgo: 1, reviewedDaysAgo: null, note: null },
    { id: "seed_doc_020", owner: 6, type: 3, title: "STR Apoteker Eko Prasetyo", status: DocumentStatus.PENDING, number: "STR/APT/2026/0072", issue: dateOnly(2026, 2, 26), expiry: daysFromNow(365), uploadedDaysAgo: 2, reviewedDaysAgo: null, note: null },
    { id: "seed_doc_021", owner: 6, type: 6, title: "NPWP Eko Prasetyo", status: DocumentStatus.PENDING, number: "81.234.567.8-811.000", issue: dateOnly(2019, 10, 10), expiry: null, uploadedDaysAgo: 7, reviewedDaysAgo: null, note: null },
    { id: "seed_doc_022", owner: 7, type: 0, title: "KTP Lina Marlina", status: DocumentStatus.PENDING, number: "7471081808980008", issue: dateOnly(2019, 8, 18), expiry: null, uploadedDaysAgo: 4, reviewedDaysAgo: null, note: null },
    { id: "seed_doc_023", owner: 7, type: 9, title: "Surat Keterangan Sehat Lina", status: DocumentStatus.PENDING, number: "SKS-2026-209", issue: dateOnly(2026, 6, 28), expiry: daysFromNow(62), uploadedDaysAgo: 6, reviewedDaysAgo: null, note: null },
    { id: "seed_doc_024", owner: 8, type: 0, title: "KTP Andri Saputra", status: DocumentStatus.PENDING, number: "7471092201990009", issue: dateOnly(2020, 1, 22), expiry: null, uploadedDaysAgo: 3, reviewedDaysAgo: null, note: null },
    { id: "seed_doc_025", owner: 8, type: 5, title: "Sertifikat Orientasi Magang Andri", status: DocumentStatus.PENDING, number: "PLT-MAG-2026-033", issue: dateOnly(2026, 1, 16), expiry: null, uploadedDaysAgo: 8, reviewedDaysAgo: null, note: null },
    { id: "seed_doc_026", owner: 9, type: 0, title: "KTP Kartika Sari", status: DocumentStatus.PENDING, number: "7471102705930010", issue: dateOnly(2016, 5, 27), expiry: null, uploadedDaysAgo: 2, reviewedDaysAgo: null, note: null },
    { id: "seed_doc_027", owner: 9, type: 3, title: "STR Kebidanan Kartika Sari", status: DocumentStatus.PENDING, number: "STR/BID/2026/0274", issue: dateOnly(2026, 4, 7), expiry: daysFromNow(390), uploadedDaysAgo: 4, reviewedDaysAgo: null, note: null },
  ];

  for (const item of documentSeeds) {
    const docType = documentTypes[item.type];
    const fileName = `${docType.code.toLowerCase()}-${employees[item.owner].employee.id}.pdf`;
    const filePath = `uploads/demo-seed/${fileName}`;
    const fileMeta = await createDemoPdf(filePath, item.title);
    await prisma.documentRecord.create({
      data: {
        id: item.id,
        ownerId: employees[item.owner].employee.id,
        documentTypeId: docType.id,
        title: item.title,
        status: item.status,
        isCurrent: item.status !== DocumentStatus.REPLACED,
        allowMultipleSnapshot: docType.allowMultiple,
        fileName,
        filePath,
        fileSize: fileMeta.fileSize,
        mimeType: "application/pdf",
        fileHash: fileMeta.fileHash,
        storageProvider: "local",
        documentNumber: item.number,
        issueDate: item.issue,
        expiryDate: item.expiry,
        uploadedAt: daysAgo(item.uploadedDaysAgo),
        createdBy: employees[item.owner].user.id,
        updatedBy: staffUser.id,
      },
    });

    if (item.reviewedDaysAgo !== null) {
      await prisma.verificationHistory.create({
        data: {
          id: `seed_vh_${item.id}`,
          documentRecordId: item.id,
          status: item.status,
          reviewedById: staffUser.id,
          reviewNote: item.note,
          reviewedAt: daysAgo(item.reviewedDaysAgo),
        },
      });
    }
  }

  await prisma.notification.createMany({
    data: [
      { id: "seed_notif_001", userId: employeeUser.id, type: "DOCUMENT_APPROVED", title: "KTP disetujui", message: "KTP Budi Setiawan telah disetujui verifikator.", isRead: false, relatedEntityType: "DOCUMENT", relatedEntityId: "seed_doc_001", createdAt: daysAgo(44) },
      { id: "seed_notif_002", userId: employeeUser.id, type: "DOCUMENT_APPROVED", title: "Ijazah disetujui", message: "Ijazah pendidikan terakhir telah masuk arsip resmi.", isRead: true, relatedEntityType: "DOCUMENT", relatedEntityId: "seed_doc_002", createdAt: daysAgo(39) },
      { id: "seed_notif_003", userId: employees[5].user.id, type: "DOCUMENT_REJECTED", title: "SIP perlu diperbaiki", message: "Nomor SIP kurang jelas, mohon unggah ulang scan yang lebih tajam.", isRead: false, relatedEntityType: "DOCUMENT", relatedEntityId: "seed_doc_005", createdAt: daysAgo(7) },
      { id: "seed_notif_004", userId: employees[7].user.id, type: "DOCUMENT_EXPIRED", title: "Sertifikat BLS kedaluwarsa", message: "Sertifikat BLS sudah kedaluwarsa dan perlu diperbarui.", isRead: false, relatedEntityType: "DOCUMENT", relatedEntityId: "seed_doc_007", createdAt: daysAgo(1) },
      { id: "seed_notif_005", userId: staffUser.id, type: "VERIFICATION_QUEUE", title: "20 dokumen menunggu verifikasi", message: "Ada 20 dokumen daftar tunggu yang perlu ditinjau verifikator.", isRead: false, relatedEntityType: "VERIFICATION", relatedEntityId: "seed_doc_003", createdAt: daysAgo(1) },
      { id: "seed_notif_006", userId: employees[6].user.id, type: "DOCUMENT_APPROVED", title: "Sertifikat pelatihan diterima", message: "Pelatihan farmasi klinik berhasil diarsipkan.", isRead: true, relatedEntityType: "DOCUMENT", relatedEntityId: "seed_doc_006", createdAt: daysAgo(2) },
      { id: "seed_notif_007", userId: employees[9].user.id, type: "DOCUMENT_PENDING", title: "Surat sehat sedang ditinjau", message: "Berkas Anda masih menunggu pemeriksaan staf.", isRead: false, relatedEntityType: "DOCUMENT", relatedEntityId: "seed_doc_009", createdAt: daysAgo(3) },
      { id: "seed_notif_008", userId: employees[4].user.id, type: "REMINDER_H30", title: "STR akan kedaluwarsa", message: "STR Ners Dewi akan kedaluwarsa dalam periode pemantauan.", isRead: true, relatedEntityType: "DOCUMENT", relatedEntityId: "seed_doc_004", createdAt: daysAgo(5) },
      { id: "seed_notif_009", userId: employees[8].user.id, type: "DOCUMENT_APPROVED", title: "SK Magang disetujui", message: "SK Magang Andri Saputra telah diverifikasi.", isRead: true, relatedEntityType: "DOCUMENT", relatedEntityId: "seed_doc_008", createdAt: daysAgo(16) },
      { id: "seed_notif_010", userId: employees[1].user.id, type: "SYSTEM", title: "Data demo siap diuji", message: "Seed demo SIMDP telah menyiapkan data untuk uji CRUD dan verifikasi.", isRead: false, relatedEntityType: "SYSTEM", relatedEntityId: null, createdAt: new Date() },
    ],
  });

  await prisma.systemSetting.createMany({
    data: [
      { key: "seed.maxUploadSizeMb", value: "5", label: "Maksimal Upload", description: "Ukuran maksimal unggah dokumen demo", updatedBy: staffUser.id },
      { key: "seed.allowedFileTypes", value: "pdf,jpg,png", label: "Format Berkas", description: "Format berkas yang diizinkan", updatedBy: staffUser.id },
      { key: "seed.reminderDays", value: "30,7,1", label: "Hari Pengingat", description: "Jadwal reminder kedaluwarsa dokumen", updatedBy: staffUser.id },
      { key: "seed.requireRejectNote", value: "true", label: "Catatan Penolakan", description: "Alasan penolakan wajib diisi", updatedBy: staffUser.id },
      { key: "seed.demoMode", value: "true", label: "Mode Demo", description: "Menandai data hasil seed lokal", updatedBy: staffUser.id },
    ],
  });

  await prisma.securityLog.createMany({
    data: [
      { id: "seed_log_001", actorId: employees[0].user.id, actorName: employees[0].employee.name, actorRole: "ADMIN", eventType: "USER_CREATED", resource: "User:seed", status: "SUCCESS", metadata: { source: "seed" }, timestamp: daysAgo(20) },
      { id: "seed_log_002", actorId: staffUser.id, actorName: REVIEWER_NAME, actorRole: "STAFF", eventType: "DOCUMENT_VERIFIED", resource: "DocumentRecord:seed_doc_001", status: "SUCCESS", metadata: { decision: "APPROVED" }, timestamp: daysAgo(44) },
      { id: "seed_log_003", actorId: staffUser.id, actorName: REVIEWER_NAME, actorRole: "STAFF", eventType: "DOCUMENT_VERIFIED", resource: "DocumentRecord:seed_doc_005", status: "SUCCESS", metadata: { decision: "REJECTED" }, timestamp: daysAgo(7) },
      { id: "seed_log_004", actorId: employeeUser.id, actorName: employees[3].employee.name, actorRole: "EMPLOYEE", eventType: "DOCUMENT_UPLOADED", resource: "DocumentRecord:seed_doc_003", status: "SUCCESS", metadata: { documentType: "STR" }, timestamp: daysAgo(1) },
      { id: "seed_log_005", actorId: employees[9].user.id, actorName: employees[9].employee.name, actorRole: "EMPLOYEE", eventType: "DOCUMENT_UPLOADED", resource: "DocumentRecord:seed_doc_009", status: "SUCCESS", metadata: { documentType: "SURAT-SEHAT" }, timestamp: daysAgo(3) },
      { id: "seed_log_006", actorId: staffUser.id, actorName: REVIEWER_NAME, actorRole: "STAFF", eventType: "DOCUMENT_DOWNLOADED", resource: "DocumentRecord:seed_doc_004", status: "SUCCESS", metadata: { purpose: "verification" }, timestamp: daysAgo(23) },
      { id: "seed_log_007", actorId: employees[2].user.id, actorName: employees[2].employee.name, actorRole: "STAFF", eventType: "EMPLOYEE_UPDATED", resource: "Employee:emp_seed_emp_1", status: "SUCCESS", metadata: { field: "workplace" }, timestamp: daysAgo(12) },
      { id: "seed_log_008", actorId: employees[0].user.id, actorName: employees[0].employee.name, actorRole: "ADMIN", eventType: "SYSTEM_SETTING_UPDATED", resource: "SystemSetting:seed.reminderDays", status: "SUCCESS", metadata: { value: "30,7,1" }, timestamp: daysAgo(6) },
      { id: "seed_log_009", actorId: null, actorName: "System", actorRole: "SYSTEM", eventType: "EXPIRY_CRON_RUN", resource: "Cron:check-expiry", status: "SUCCESS", metadata: { scanned: 10 }, timestamp: daysAgo(1) },
      { id: "seed_log_010", actorId: staffUser.id, actorName: REVIEWER_NAME, actorRole: "STAFF", eventType: "LOGIN", resource: "Session:demo", status: "SUCCESS", metadata: { source: "seed-demo" }, timestamp: new Date() },
    ],
  });

  const counts = {
    users: await prisma.user.count(),
    employees: await prisma.employee.count(),
    employmentStatuses: await prisma.employmentStatus.count(),
    employeeGroups: await prisma.employeeGroup.count(),
    professionGroups: await prisma.professionGroup.count(),
    positions: await prisma.employeePosition.count(),
    ranks: await prisma.employeeRank.count(),
    workplaces: await prisma.workplace.count(),
    documentTypes: await prisma.documentType.count(),
    documentRecords: await prisma.documentRecord.count(),
    pendingDocuments: await prisma.documentRecord.count({ where: { status: DocumentStatus.PENDING } }),
    notifications: await prisma.notification.count(),
    verificationHistories: await prisma.verificationHistory.count(),
    securityLogs: await prisma.securityLog.count(),
    systemSettings: await prisma.systemSetting.count(),
  };

  console.log("Seeding selesai.");
  console.table(counts);
  console.log("Akun demo (password sama untuk semua): password123");
  console.log("- Admin: admin@rsudbahteramas.test");
  console.log("- Staff: staff@rsudbahteramas.test");
  console.log("- Staff verifikator: verifikator@rsudbahteramas.test");
  console.log("- Employee utama: budi.setiawan@rsudbahteramas.test");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
