import { PrismaClient } from "@prisma/client";
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
  await prisma.refreshToken.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await argon2.hash("password123");

  // 1. Seed Admin
  const adminUser = await prisma.user.create({
    data: {
      id: "usr_admin",
      email: "admin@rsud.go.id",
      passwordHash,
      role: "ADMIN",
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
    },
  });

  // 2. Seed Staff
  const staffUser = await prisma.user.create({
    data: {
      id: "usr_staff",
      email: "staff@rsud.go.id",
      passwordHash,
      role: "STAFF",
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
    },
  });

  // 3. Seed Employee (Pegawai)
  const employeeUser = await prisma.user.create({
    data: {
      id: "usr_pegawai",
      email: "pegawai@rsud.go.id",
      passwordHash,
      role: "EMPLOYEE",
      isActive: true,
    },
  });

  await prisma.employee.create({
    data: {
      id: "emp_pegawai",
      userId: employeeUser.id,
      employeeId: "199503032020031003",
      nik: "7471030303030003",
      name: "Budi Setiawan, A.Md.Kep",
      gender: "Laki-laki",
    },
  });

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
