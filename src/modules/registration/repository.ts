import type { Prisma, UserRegistrationRequest } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { REGISTRATION_STATUS } from "./constants";

export function findExistingUserByEmail(email: string) {
  // Uniqueness checks include archived rows because their identifiers remain reserved.
  return prisma.user.findFirst({ where: { email }, select: { id: true, deletedAt: true } });
}

export function findExistingEmployeeIdentity(input: { nik?: string | null; employeeId?: string | null }) {
  const identityConditions = [
    ...(input.nik ? [{ nik: input.nik }] : []),
    ...(input.employeeId ? [{ employeeId: input.employeeId }] : []),
  ];

  if (identityConditions.length === 0) {
    return null;
  }

  return prisma.employee.findFirst({
    where: {
      OR: identityConditions,
    },
    select: { id: true, nik: true, employeeId: true, deletedAt: true },
  });
}

export function findRegistrationByEmail(email: string) {
  return prisma.userRegistrationRequest.findFirst({
    where: { email, status: REGISTRATION_STATUS.EMAIL_PENDING },
    orderBy: { createdAt: "desc" },
  });
}

export function findLatestRegistrationByEmail(email: string) {
  return prisma.userRegistrationRequest.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });
}

export function findRegistrationById(id: string) {
  return prisma.userRegistrationRequest.findUnique({ where: { id } });
}

export function findRegistrationByIdentity(input: {
  email: string;
  nik?: string | null;
  employeeId?: string | null;
  now: Date;
}) {
  const identityConditions = [
    ...(input.nik ? [{ nik: input.nik }] : []),
    ...(input.employeeId ? [{ employeeId: input.employeeId }] : []),
  ];

  if (identityConditions.length === 0) {
    return null;
  }

  return prisma.userRegistrationRequest.findFirst({
    where: {
      email: { not: input.email },
      OR: [
        {
          status: REGISTRATION_STATUS.EMAIL_PENDING,
          emailOtpExpiresAt: { gt: input.now },
        },
        { status: REGISTRATION_STATUS.PENDING_ADMIN_REVIEW },
      ],
      AND: [{ OR: identityConditions }],
    },
    select: { id: true, email: true, nik: true, employeeId: true },
  });
}

export function findActiveRegistrationByEmail(email: string, now: Date) {
  return prisma.userRegistrationRequest.findFirst({
    where: {
      email,
      OR: [
        {
          status: REGISTRATION_STATUS.EMAIL_PENDING,
          emailOtpExpiresAt: { gt: now },
        },
        { status: REGISTRATION_STATUS.PENDING_ADMIN_REVIEW },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
}

export function expireStaleEmailPendingRegistrations(input: {
  email: string;
  nik?: string | null;
  employeeId?: string | null;
  now: Date;
}) {
  const matchingIdentity = [
    { email: input.email },
    ...(input.nik ? [{ nik: input.nik }] : []),
    ...(input.employeeId ? [{ employeeId: input.employeeId }] : []),
  ];

  return prisma.userRegistrationRequest.updateMany({
    where: {
      status: REGISTRATION_STATUS.EMAIL_PENDING,
      emailOtpExpiresAt: { lte: input.now },
      OR: matchingIdentity,
    },
    data: {
      status: REGISTRATION_STATUS.EXPIRED,
      passwordHash: null,
      emailOtpHash: null,
      emailOtpExpiresAt: null,
    },
  });
}

export function createRegistration(input: {
  id: string;
  email: string;
  name: string;
  nik?: string | null;
  employeeId?: string | null;
  passwordHash: string;
  phone?: string | null;
  workplaceName?: string | null;
  otpHash: string;
  otpExpiresAt: Date;
  now: Date;
}) {
  return prisma.userRegistrationRequest.create({
    data: {
      id: input.id,
      email: input.email,
      name: input.name,
      nik: input.nik || null,
      employeeId: input.employeeId || null,
      passwordHash: input.passwordHash,
      phone: input.phone || null,
      workplaceName: input.workplaceName || null,
      note: null,
      status: REGISTRATION_STATUS.EMAIL_PENDING,
      emailOtpHash: input.otpHash,
      emailOtpExpiresAt: input.otpExpiresAt,
      emailOtpSentAt: input.now,
      emailOtpAttempts: 0,
      emailVerifiedAt: null,
      reviewedAt: null,
      reviewedByAdminId: null,
      reviewNote: null,
    },
  });
}

export function restartEmailPendingRegistration(id: string, input: Omit<Parameters<typeof createRegistration>[0], "id" | "email">) {
  return prisma.userRegistrationRequest.update({
    where: { id },
    data: {
      name: input.name,
      nik: input.nik || null,
      employeeId: input.employeeId || null,
      passwordHash: input.passwordHash,
      phone: input.phone || null,
      workplaceName: input.workplaceName || null,
      note: null,
      status: REGISTRATION_STATUS.EMAIL_PENDING,
      emailOtpHash: input.otpHash,
      emailOtpExpiresAt: input.otpExpiresAt,
      emailOtpSentAt: input.now,
      emailOtpAttempts: 0,
      emailVerifiedAt: null,
      reviewedAt: null,
      reviewedByAdminId: null,
      reviewNote: null,
    },
  });
}

export function updateRegistration(id: string, data: Prisma.UserRegistrationRequestUpdateInput) {
  return prisma.userRegistrationRequest.update({ where: { id }, data });
}

export async function markRegistrationEmailVerified(input: { id: string; now: Date }) {
  const updated = await prisma.userRegistrationRequest.updateMany({
    where: {
      id: input.id,
      status: REGISTRATION_STATUS.EMAIL_PENDING,
    },
    data: {
      status: REGISTRATION_STATUS.PENDING_ADMIN_REVIEW,
      emailOtpHash: null,
      emailOtpExpiresAt: null,
      emailOtpAttempts: 0,
      emailVerifiedAt: input.now,
    },
  });

  if (updated.count !== 1) {
    throw new Error("REGISTRATION_NOT_VERIFYABLE");
  }

  const verified = await prisma.userRegistrationRequest.findUnique({ where: { id: input.id } });
  if (!verified) {
    throw new Error("REGISTRATION_NOT_FOUND_AFTER_VERIFY");
  }
  return verified;
}

export async function rejectRegistrationIfReviewable(input: {
  id: string;
  reviewedByAdminId: string;
  now: Date;
}) {
  const updated = await prisma.userRegistrationRequest.updateMany({
    where: {
      id: input.id,
      status: {
        in: [REGISTRATION_STATUS.EMAIL_PENDING, REGISTRATION_STATUS.PENDING_ADMIN_REVIEW],
      },
    },
    data: {
      status: REGISTRATION_STATUS.REJECTED,
      reviewedAt: input.now,
      reviewedByAdminId: input.reviewedByAdminId,
      reviewNote: null,
      passwordHash: null,
      emailOtpHash: null,
      emailOtpExpiresAt: null,
    },
  });

  if (updated.count !== 1) {
    throw new Error("REGISTRATION_NOT_REVIEWABLE");
  }

  const rejected = await prisma.userRegistrationRequest.findUnique({ where: { id: input.id } });
  if (!rejected) {
    throw new Error("REGISTRATION_NOT_FOUND_AFTER_REJECT");
  }
  return rejected;
}

export function listRegistrationRequests(input: {
  where: Prisma.UserRegistrationRequestWhereInput;
  skip: number;
  take: number;
}) {
  return prisma.$transaction([
    prisma.userRegistrationRequest.findMany({
      where: input.where,
      skip: input.skip,
      take: input.take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.userRegistrationRequest.count({ where: input.where }),
    prisma.userRegistrationRequest.count({ where: { status: REGISTRATION_STATUS.PENDING_ADMIN_REVIEW } }),
  ]);
}

export function findActiveAdmins() {
  return prisma.user.findMany({
    where: { role: "ADMIN", isActive: true, deletedAt: null },
    select: { id: true, email: true },
  });
}

export async function approveRegistrationTransaction(input: {
  request: UserRegistrationRequest;
  reviewedByAdminId: string;
  reviewNote?: string | null;
  userId: string;
  employeeId: string;
  now: Date;
}) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.userRegistrationRequest.findUnique({ where: { id: input.request.id } });
    if (!current || current.status !== REGISTRATION_STATUS.PENDING_ADMIN_REVIEW) {
      throw new Error("REGISTRATION_NOT_REVIEWABLE");
    }
    if (!current.passwordHash) {
      throw new Error("REGISTRATION_PASSWORD_NOT_AVAILABLE");
    }

    const claimed = await tx.userRegistrationRequest.updateMany({
      where: {
        id: current.id,
        status: REGISTRATION_STATUS.PENDING_ADMIN_REVIEW,
      },
      data: {
        status: REGISTRATION_STATUS.APPROVED,
        reviewedAt: input.now,
        reviewedByAdminId: input.reviewedByAdminId,
        reviewNote: input.reviewNote || null,
        passwordHash: null,
        emailOtpHash: null,
        emailOtpExpiresAt: null,
      },
    });

    if (claimed.count !== 1) {
      throw new Error("REGISTRATION_NOT_REVIEWABLE");
    }

    const user = await tx.user.create({
      data: {
        id: input.userId,
        email: current.email,
        passwordHash: current.passwordHash,
        role: "EMPLOYEE",
        isActive: true,
      },
    });

    const employee = await tx.employee.create({
      data: {
        id: input.employeeId,
        userId: user.id,
        employeeId: current.employeeId,
        nik: current.nik,
        name: current.name,
        phone: current.phone,
        createdBy: input.reviewedByAdminId,
      },
    });

    const registration = await tx.userRegistrationRequest.findUnique({ where: { id: current.id } });
    if (!registration) {
      throw new Error("REGISTRATION_NOT_FOUND_AFTER_APPROVE");
    }

    return { user, employee, registration };
  });
}
