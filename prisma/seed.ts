import { PrismaClient, Role, DocumentStatus, ArchiveCategory } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as pg from "pg";
import * as argon2 from "argon2";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Memulai seeding data...");

  // Reset data lama yang bentrok
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
  await prisma.user.deleteMany({});
  await prisma.employmentStatus.deleteMany({});
  await prisma.workplace.deleteMany({});

  const passwordHash = await argon2.hash("password123");

  // 1. Seed Master Data: EmploymentStatus
  const statusPns = await prisma.employmentStatus.create({
    data: { id: "stat_pns", name: "PNS" },
  });
  const statusPppk = await prisma.employmentStatus.create({
    data: { id: "stat_pppk", name: "PPPK" },
  });
  const statusNonAsn = await prisma.employmentStatus.create({
    data: { id: "stat_non_asn", name: "Non-ASN" },
  });

  // 2. Seed Master Data: Workplace (Unit Kerja)
  const wpIcu = await prisma.workplace.create({
    data: { id: "wp_icu", name: "Ruang ICU" },
  });
  const wpUgd = await prisma.workplace.create({
    data: { id: "wp_ugd", name: "Unit Gawat Darurat (UGD)" },
  });
  const wpPoliAnak = await prisma.workplace.create({
    data: { id: "wp_poli_anak", name: "Poli Anak" },
  });
  const wpPoliBedah = await prisma.workplace.create({
    data: { id: "wp_poli_bedah", name: "Poli Bedah" },
  });

  // 3. Seed Master Data: DocumentType
  const typeKtp = await prisma.documentType.create({
    data: {
      id: "type_ktp",
      code: "DOC-KTP",
      name: "Kartu Tanda Penduduk (KTP)",
      archiveCategory: ArchiveCategory.PERSONAL,
      isMandatory: true,
      allowedFormats: "pdf,jpg,png",
      maxSizeMb: 2.0,
    },
  });

  const typeIjazah = await prisma.documentType.create({
    data: {
      id: "type_ijazah",
      code: "DOC-IJZ",
      name: "Ijazah Pendidikan Terakhir",
      archiveCategory: ArchiveCategory.EDUCATION,
      isMandatory: true,
      allowedFormats: "pdf",
      maxSizeMb: 5.0,
    },
  });

  const typeSk = await prisma.documentType.create({
    data: {
      id: "type_sk",
      code: "DOC-SKP",
      name: "SK Pengangkatan Pegawai",
      archiveCategory: ArchiveCategory.EMPLOYMENT,
      isMandatory: true,
      allowedFormats: "pdf",
      maxSizeMb: 5.0,
    },
  });

  const typeStr = await prisma.documentType.create({
    data: {
      id: "type_str",
      code: "DOC-STR",
      name: "Surat Tanda Registrasi (STR) Aktif",
      archiveCategory: ArchiveCategory.CERTIFICATION,
      isMandatory: true,
      requiresExpiryDate: true,
      allowedFormats: "pdf,png",
      maxSizeMb: 3.0,
    },
  });

  const typePelatihan = await prisma.documentType.create({
    data: {
      id: "type_pelatihan",
      code: "DOC-PLT",
      name: "Sertifikat Pelatihan Kompetensi",
      archiveCategory: ArchiveCategory.CERTIFICATION,
      allowMultiple: true,
      allowedFormats: "pdf,jpg,png",
      maxSizeMb: 4.0,
    },
  });

  // 4. Seed Users & Employees
  // Admin
  const adminUser = await prisma.user.create({
    data: {
      id: "usr_admin",
      email: "admin@rsud.go.id",
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  await prisma.employee.create({
    data: {
      id: "emp_admin",
      userId: adminUser.id,
      employeeId: "198501012010011001",
      nik: "7471010101010001",
      name: "Dr. H. Admin Supratman, M.Kes",
      gender: "Laki-laki",
      workplaceId: wpIcu.id,
      employmentStatusId: statusPns.id,
    },
  });

  // Staff
  const staffUser = await prisma.user.create({
    data: {
      id: "usr_staff",
      email: "staff@rsud.go.id",
      passwordHash,
      role: Role.STAFF,
      isActive: true,
    },
  });

  await prisma.employee.create({
    data: {
      id: "emp_staff",
      userId: staffUser.id,
      employeeId: "199002022015022002",
      nik: "7471020202020002",
      name: "Siti Rahma, S.Sos",
      gender: "Perempuan",
      workplaceId: wpUgd.id,
      employmentStatusId: statusPppk.id,
    },
  });

  // Pegawai Utama (Budi)
  const budiUser = await prisma.user.create({
    data: {
      id: "usr_budi",
      email: "pegawai@rsud.go.id",
      passwordHash,
      role: Role.EMPLOYEE,
      isActive: true,
    },
  });

  const empBudi = await prisma.employee.create({
    data: {
      id: "emp_budi",
      userId: budiUser.id,
      employeeId: "199503032020031003",
      nik: "7471030303030003",
      name: "Budi Setiawan, A.Md.Kep",
      gender: "Laki-laki",
      workplaceId: wpUgd.id,
      employmentStatusId: statusNonAsn.id,
    },
  });

  // Pegawai Dummy Tambahan (12 orang untuk membesarkan statistik dashboard)
  const dummyPegawais = [
    { name: "Andi Wijaya, S.Kep", email: "andi@rsud.go.id", nip: "199301012018011004", nik: "7471040404040004", gender: "Laki-laki", wp: wpIcu.id, status: statusPns.id },
    { name: "Dewi Lestari, A.Md.Keb", email: "dewi@rsud.go.id", nip: "199402022019022005", nik: "7471050505050005", gender: "Perempuan", wp: wpPoliAnak.id, status: statusPppk.id },
    { name: "Eko Prasetyo, S.Kep.Ns", email: "eko@rsud.go.id", nip: "199103032017031006", nik: "7471060606060006", gender: "Laki-laki", wp: wpPoliBedah.id, status: statusPns.id },
    { name: "Fitri Handayani, S.Gz", email: "fitri@rsud.go.id", nip: null, nik: "7471070707070007", gender: "Perempuan", wp: wpPoliAnak.id, status: statusNonAsn.id },
    { name: "Guntur Wibowo, A.Md.Rad", email: "guntur@rsud.go.id", nip: "198804042014041008", nik: "7471080808080008", gender: "Laki-laki", wp: wpUgd.id, status: statusPns.id },
    { name: "Hesti Purwanti, A.Md.Far", email: "hesti@rsud.go.id", nip: "199605052021052009", nik: "7471090909090009", gender: "Perempuan", wp: wpPoliBedah.id, status: statusPppk.id },
    { name: "Iwan Fals, S.Farm", email: "iwan@rsud.go.id", nip: null, nik: "7471101010100010", gender: "Laki-laki", wp: wpIcu.id, status: statusNonAsn.id },
    { name: "Joko Widodo, S.Kom", email: "joko@rsud.go.id", nip: "198206062009061011", nik: "7471111111110011", gender: "Laki-laki", wp: wpUgd.id, status: statusPns.id },
    { name: "Kartika Sari, S.Tr.Keb", email: "kartika@rsud.go.id", nip: "199207072018072012", nik: "7471121212120012", gender: "Perempuan", wp: wpPoliAnak.id, status: statusPppk.id },
    { name: "Lilis Marlina, A.Md.AK", email: "lilis@rsud.go.id", nip: null, nik: "7471131313130013", gender: "Perempuan", wp: wpIcu.id, status: statusNonAsn.id },
  ];

  const createdEmployees = [];
  for (let i = 0; i < dummyPegawais.length; i++) {
    const p = dummyPegawais[i];
    const user = await prisma.user.create({
      data: {
        id: `usr_dummy_${i}`,
        email: p.email,
        passwordHash,
        role: Role.EMPLOYEE,
        isActive: true,
      },
    });

    const emp = await prisma.employee.create({
      data: {
        id: `emp_dummy_${i}`,
        userId: user.id,
        employeeId: p.nip,
        nik: p.nik,
        name: p.name,
        gender: p.gender,
        workplaceId: p.wp,
        employmentStatusId: p.status,
      },
    });
    createdEmployees.push(emp);
  }

  // 5. Seed Document Records (Variasi status & kepatuhan dokumen)
  // Budi (Pegawai Utama) - Memiliki dokumen yang variatif untuk memperagakan dashboard personal
  await prisma.documentRecord.create({
    data: {
      id: "doc_budi_ktp",
      ownerId: empBudi.id,
      documentTypeId: typeKtp.id,
      title: "KTP Budi Setiawan",
      status: DocumentStatus.APPROVED,
      fileName: "ktp-budi.pdf",
      filePath: "/uploads/ktp-budi.pdf",
      uploadedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 hari lalu
    },
  });

  await prisma.documentRecord.create({
    data: {
      id: "doc_budi_ijazah",
      ownerId: empBudi.id,
      documentTypeId: typeIjazah.id,
      title: "Ijazah D3 Keperawatan Budi",
      status: DocumentStatus.APPROVED,
      fileName: "ijazah-budi.pdf",
      filePath: "/uploads/ijazah-budi.pdf",
      uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 hari lalu
    },
  });

  await prisma.documentRecord.create({
    data: {
      id: "doc_budi_str",
      ownerId: empBudi.id,
      documentTypeId: typeStr.id,
      title: "STR Keperawatan Budi",
      status: DocumentStatus.APPROVED,
      fileName: "str-budi.pdf",
      filePath: "/uploads/str-budi.pdf",
      uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 hari lalu
      expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Expire dalam 15 hari (memicu warning!)
    },
  });

  await prisma.documentRecord.create({
    data: {
      id: "doc_budi_pelatihan_1",
      ownerId: empBudi.id,
      documentTypeId: typePelatihan.id,
      title: "Sertifikat BTCLS Budi",
      status: DocumentStatus.PENDING,
      fileName: "btcls-budi.pdf",
      filePath: "/uploads/btcls-budi.pdf",
      uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Kemarin
    },
  });

  await prisma.documentRecord.create({
    data: {
      id: "doc_budi_sk",
      ownerId: empBudi.id,
      documentTypeId: typeSk.id,
      title: "SK Kontrak Kerja Budi",
      status: DocumentStatus.REJECTED,
      fileName: "sk-budi-lama.pdf",
      filePath: "/uploads/sk-budi-lama.pdf",
      uploadedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 hari lalu
    },
  });

  // Seed Dokumen untuk Pegawai Dummy agar status kepatuhan dashboard Admin menarik
  // Pegawai 0-4 dibuat Patuh (Memiliki semua dokumen mandatory ter-APPROVED)
  for (let i = 0; i < 5; i++) {
    const emp = createdEmployees[i];
    await prisma.documentRecord.create({
      data: {
        id: `doc_dummy_${i}_ktp`,
        ownerId: emp.id,
        documentTypeId: typeKtp.id,
        status: DocumentStatus.APPROVED,
        fileName: `ktp-${i}.pdf`,
        filePath: `/uploads/ktp-${i}.pdf`,
        uploadedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      },
    });
    await prisma.documentRecord.create({
      data: {
        id: `doc_dummy_${i}_ijazah`,
        ownerId: emp.id,
        documentTypeId: typeIjazah.id,
        status: DocumentStatus.APPROVED,
        fileName: `ijz-${i}.pdf`,
        filePath: `/uploads/ijz-${i}.pdf`,
        uploadedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      },
    });
    await prisma.documentRecord.create({
      data: {
        id: `doc_dummy_${i}_sk`,
        ownerId: emp.id,
        documentTypeId: typeSk.id,
        status: DocumentStatus.APPROVED,
        fileName: `sk-${i}.pdf`,
        filePath: `/uploads/sk-${i}.pdf`,
        uploadedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      },
    });
    await prisma.documentRecord.create({
      data: {
        id: `doc_dummy_${i}_str`,
        ownerId: emp.id,
        documentTypeId: typeStr.id,
        status: DocumentStatus.APPROVED,
        fileName: `str-${i}.pdf`,
        filePath: `/uploads/str-${i}.pdf`,
        uploadedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // Aman
      },
    });
  }

  // Pegawai 5-7 dibuat Kurang Patuh (Ada dokumen yang berstatus PENDING/REJECTED/Belum Unggah)
  for (let i = 5; i < 8; i++) {
    const emp = createdEmployees[i];
    await prisma.documentRecord.create({
      data: {
        id: `doc_dummy_${i}_ktp`,
        ownerId: emp.id,
        documentTypeId: typeKtp.id,
        status: DocumentStatus.APPROVED,
        fileName: `ktp-${i}.pdf`,
        filePath: `/uploads/ktp-${i}.pdf`,
      },
    });
    await prisma.documentRecord.create({
      data: {
        id: `doc_dummy_${i}_ijazah`,
        ownerId: emp.id,
        documentTypeId: typeIjazah.id,
        status: DocumentStatus.PENDING, // Masih pending
        fileName: `ijz-${i}.pdf`,
        filePath: `/uploads/ijz-${i}.pdf`,
      },
    });
  }

  // Pegawai 8-9 belum upload dokumen apapun (Non-compliant)

  console.log("Seeding selesai!");
  console.log("Akun tersedia:");
  console.log("- Admin: admin@rsud.go.id / 198501012010011001 (Password: password123)");
  console.log("- Staff: staff@rsud.go.id / 199002022015022002 (Password: password123)");
  console.log("- Pegawai: pegawai@rsud.go.id / 199503032020031003 (Password: password123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
