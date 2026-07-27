import { vi, beforeEach } from "vitest";

// Mock environment variables
process.env.JWT_SECRET = "test-jwt-secret-with-minimum-32-chars-long";
process.env.REFRESH_TOKEN_SECRET = "test-refresh-token-secret-minimum-32-chars-long";
process.env.CRON_SECRET = "test-cron-secret-key-123456";
process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
// @ts-expect-error - NODE_ENV is read-only in process.env type definition
process.env.NODE_ENV = "test";
process.env.UPLOAD_DIR = "./tests/tmp-uploads";

// Mock next/headers
export const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockImplementation(async () => mockCookieStore),
  headers: vi.fn().mockImplementation(async () => new Map()),
}));

// Mock Prisma
export const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  userTwoFactor: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
  },
  refreshToken: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  passwordResetToken: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  employmentStatus: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  },
  employeeGroup: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  },
  professionGroup: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  },
  employeePosition: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  },
  employeeRank: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  },
  workplace: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  },
  employee: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  },
  employeeCareerHistory: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  },
  documentType: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  documentTypeProfessionGroup: {
    createMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  documentTypeEmploymentStatus: {
    createMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  documentTypeEmployeeGroup: {
    createMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  documentTypeEmployeePosition: {
    createMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  documentTypeEmployeeRank: {
    createMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  documentTypeWorkplace: {
    createMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  documentRecord: {
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
  },
  verificationHistory: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  },
  documentVerification: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  rateLimitBucket: {
    findUnique: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  notification: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
  },
  securityLog: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  systemSetting: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  },
  $executeRaw: vi.fn(),
  $queryRaw: vi.fn(),
  $transaction: vi.fn().mockImplementation(async (cb) => {
    if (typeof cb === "function") {
      return cb(mockPrisma);
    }
    return Promise.all(cb);
  }),
};

// Mock the whole prisma module
vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.$queryRaw.mockResolvedValue([
    {
      key: "RateLimit:test",
      category: "TEST",
      count: 1,
      resetAt: new Date(Date.now() + 60 * 1000),
      limitedLoggedAt: null,
    },
  ]);
  mockPrisma.rateLimitBucket.updateMany.mockResolvedValue({ count: 1 });
  mockPrisma.rateLimitBucket.deleteMany.mockResolvedValue({ count: 0 });
});
