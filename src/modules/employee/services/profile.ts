import { storage } from "@/lib/storage";
import { logActivity } from "@/modules/security/server";
import { SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security/server";
import { getSystemSettingValue } from "@/modules/settings/server";
import { AppError } from "@/lib/errors";
import * as repository from "../repository";
import { mapEmployeeDetail } from "../mappers";
import { canonicalEmployeeStatus, canonicalGender, canonicalMaritalStatus, canonicalReligion } from "./shared";

const PROFILE_IMAGE_MAX_UPLOAD_MB_KEY = "profile_image_max_upload_mb";
const DEFAULT_PROFILE_IMAGE_MAX_UPLOAD_MB = "2";
const PROFILE_SELF_UPDATE_COOLDOWN_DAYS = 90;
const PROFILE_SELF_UPDATE_COOLDOWN_MS = PROFILE_SELF_UPDATE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

function sanitizeFileNameSegment(value: string) {
  return value.replace(/[^A-Za-z0-9._-]/g, "-");
}

function validateProfileImageFormat(buffer: Buffer) {
  const header = buffer.subarray(0, 12).toString("hex").toUpperCase();

  if (header.startsWith("89504E47")) return "png";
  if (header.startsWith("FFD8FF")) return "jpg";
  if (header.startsWith("52494646") && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "webp";

  throw new AppError("UNSUPPORTED_MEDIA_TYPE", "Format foto profil harus PNG, JPG, JPEG, atau WEBP.", 415);
}

function isManagedProfileAvatarPath(value: string | null | undefined) {
  if (!value) return false;
  return value.startsWith("uploads/profile/") || value.startsWith("supabase/profile/") || value.startsWith("profile/");
}

function formatCooldownDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(value);
}

function assertProfileSelfUpdateAllowed(input: { actorRole: string; lastUpdatedAt?: Date | null; now: Date }) {
  if (input.actorRole !== "EMPLOYEE" || !input.lastUpdatedAt) return;

  const nextAllowedAt = new Date(input.lastUpdatedAt.getTime() + PROFILE_SELF_UPDATE_COOLDOWN_MS);
  if (nextAllowedAt > input.now) {
    throw new AppError(
      "PROFILE_UPDATE_COOLDOWN",
      `Profil mandiri baru bisa diperbarui kembali pada ${formatCooldownDate(nextAllowedAt)}.`,
      429,
    );
  }
}

async function assertProfileMasterDataIsValid(data: {
  employmentStatusId?: string | null;
  employeeGroupId?: string | null;
  professionGroupId?: string | null;
  employeePositionId?: string | null;
  employeeRankId?: string | null;
  workplaceId?: string | null;
}) {
  if (data.employmentStatusId) {
    const employmentStatus = await repository.findEmploymentStatusById(data.employmentStatusId);
    if (!employmentStatus) {
      throw new AppError("VALIDATION_ERROR", "Status kepegawaian tidak ditemukan.", 400);
    }
  }

  if (data.employeeGroupId) {
    if (data.employmentStatusId) {
      const employeeGroup = await repository.findEmployeeGroupByIdAndEmploymentStatus(
        data.employeeGroupId,
        data.employmentStatusId,
      );
      if (!employeeGroup) {
        throw new AppError(
          "VALIDATION_ERROR",
          "Kelompok pegawai tidak sesuai dengan status kepegawaian yang dipilih.",
          400,
        );
      }
    } else {
      const employeeGroup = await repository.findEmployeeGroupById(data.employeeGroupId);
      if (!employeeGroup) {
        throw new AppError("VALIDATION_ERROR", "Kelompok pegawai tidak ditemukan.", 400);
      }
    }
  }

  if (data.employeePositionId) {
    if (data.professionGroupId) {
      const employeePosition = await repository.findEmployeePositionByIdAndProfessionGroup(
        data.employeePositionId,
        data.professionGroupId,
      );
      if (!employeePosition) {
        throw new AppError(
          "VALIDATION_ERROR",
          "Jabatan tidak sesuai dengan rumpun profesi yang dipilih.",
          400,
        );
      }
    } else {
      const employeePosition = await repository.findEmployeePositionById(data.employeePositionId);
      if (!employeePosition) {
        throw new AppError("VALIDATION_ERROR", "Jabatan tidak ditemukan.", 400);
      }
    }
  }

  if (data.employeeRankId) {
    const employeeRank = await repository.findEmployeeRankById(data.employeeRankId);
    if (!employeeRank) {
      throw new AppError("VALIDATION_ERROR", "Pangkat/golongan tidak ditemukan.", 400);
    }
  }

  if (data.workplaceId) {
    const workplace = await repository.findWorkplaceById(data.workplaceId);
    if (!workplace) {
      throw new AppError("VALIDATION_ERROR", "Tempat kerja tidak ditemukan.", 400);
    }
  }
}

export function resolveProfileAvatarUrl(input: {
  uploadedAvatarUrl?: string | null;
  googleAvatarUrl?: string | null;
}) {
  return input.uploadedAvatarUrl || input.googleAvatarUrl || null;
}

export function getProfileAvatarDisplayUrl(storedAvatarUrl: string | null | undefined) {
  if (!storedAvatarUrl) return null;
  if (!isManagedProfileAvatarPath(storedAvatarUrl)) return storedAvatarUrl;

  const filePath = storedAvatarUrl.replace(/^uploads\//, "").replace(/^supabase\//, "").replace(/^s3\//, "");
  return `/api/v1/profile/avatar?file=${encodeURIComponent(filePath)}`;
}

export async function getEmployeeDetail(id: string) {
  const employee = await repository.findEmployeeDetailById(id);
  if (!employee) return null;
  return mapEmployeeDetail(employee);
}

export async function getCurrentProfile(userId: string) {
  const employee = await repository.findEmployeeByUserId(userId);
  return employee;
}

export async function uploadProfileAvatar(
  data: { file: File },
  session: { userId: string; role: string },
  actorName: string
) {
  const employee = await repository.findEmployeeSimpleByUserId(session.userId);
  if (!employee) throw new AppError("NOT_FOUND", "Profil pegawai tidak ditemukan.", 404);

  const fileArrayBuffer = await data.file.arrayBuffer();
  const buffer = Buffer.from(fileArrayBuffer);
  const maxUploadMb = Number(await getSystemSettingValue(PROFILE_IMAGE_MAX_UPLOAD_MB_KEY, DEFAULT_PROFILE_IMAGE_MAX_UPLOAD_MB));
  const sizeMb = buffer.length / (1024 * 1024);

  if (!Number.isFinite(maxUploadMb) || maxUploadMb <= 0) {
    throw new AppError("VALIDATION_ERROR", "Batas upload foto profil tidak valid.", 400);
  }

  if (sizeMb > maxUploadMb) {
    throw new AppError("PAYLOAD_TOO_LARGE", `Ukuran foto profil melebihi batas maksimal ${maxUploadMb} MB.`, 413);
  }

  const ext = validateProfileImageFormat(buffer);
  const identifier = sanitizeFileNameSegment(employee.nik || employee.employeeId || employee.id);
  const uploadPath = `profile/${identifier}_avatar_${Date.now()}.${ext}`;
  const savedPath = await storage.upload(uploadPath, buffer, data.file.type || `image/${ext}`);
  await repository.updateEmployee(employee.id, { avatarUrl: savedPath });

  const previousAvatarUrl = employee.avatarUrl;
  if (previousAvatarUrl && isManagedProfileAvatarPath(previousAvatarUrl) && previousAvatarUrl !== savedPath) {
    await storage.delete(previousAvatarUrl).catch(() => undefined);
  }

  await logActivity({
    actorId: session.userId,
    actorName,
    actorRole: session.role,
    eventType: SECURITY_EVENT_TYPE.EMPLOYEE_UPDATED,
    resource: `EmployeeProfile:${employee.id}`,
    status: SECURITY_LOG_STATUS.SUCCESS,
    metadata: { updatedFields: ["avatarUrl"] },
  });

  return { avatarUrl: getProfileAvatarDisplayUrl(savedPath) ?? savedPath };
}

export async function getActorDisplayName(userId: string, fallback: string = "User"): Promise<string> {
  const user = await repository.findUserWithEmployeeById(userId);
  return user?.employee?.name || user?.email || fallback;
}

export async function updateProfile(
  userId: string,
  data: {
    name?: string;
    status?: string | null;
    gender?: string | null;
    birthPlace?: string | null;
    birthDate?: string | null;
    academicDegree?: string | null;
    lastEducation?: string | null;
    religion?: string | null;
    maritalStatus?: string | null;
    phone?: string | null;
    address?: string | null;
    joinDate?: string | null;
    hasTmt?: boolean;
    tmtStartDate?: string | null;
    tmtEndDate?: string | null;
    employmentStatusId?: string | null;
    employeeGroupId?: string | null;
    professionGroupId?: string | null;
    employeePositionId?: string | null;
    employeeRankId?: string | null;
    workplaceId?: string | null;
  },
  actorName: string,
  actorRole: string
) {
  const employee = await repository.findEmployeeSimpleByUserId(userId);
  if (!employee) return false;

  await assertProfileMasterDataIsValid(data);

  const updateData = Object.fromEntries(
    Object.entries({
      name: data.name,
      status: data.status === undefined ? undefined : canonicalEmployeeStatus(data.status),
      gender: data.gender === undefined ? undefined : canonicalGender(data.gender),
      birthPlace: data.birthPlace,
      birthDate: data.birthDate === undefined ? undefined : data.birthDate ? new Date(data.birthDate) : null,
      academicDegree: data.academicDegree,
      lastEducation: data.lastEducation,
      religion: data.religion === undefined ? undefined : canonicalReligion(data.religion),
      maritalStatus: data.maritalStatus === undefined ? undefined : canonicalMaritalStatus(data.maritalStatus),
      phone: data.phone,
      address: data.address,
      joinDate: data.joinDate === undefined ? undefined : data.joinDate ? new Date(data.joinDate) : null,
      hasTmt: data.hasTmt,
      tmtStartDate: data.tmtStartDate === undefined ? undefined : data.tmtStartDate ? new Date(data.tmtStartDate) : null,
      tmtEndDate: data.tmtEndDate === undefined ? undefined : data.tmtEndDate ? new Date(data.tmtEndDate) : null,
      employmentStatusId: data.employmentStatusId,
      employeeGroupId: data.employeeGroupId,
      employeePositionId: data.employeePositionId,
      employeeRankId: data.employeeRankId,
      workplaceId: data.workplaceId,
    }).filter(([, value]) => value !== undefined)
  );

  if (Object.keys(updateData).length === 0) return true;

  const now = new Date();
  assertProfileSelfUpdateAllowed({ actorRole, lastUpdatedAt: employee.profileSelfUpdatedAt, now });

  const profileUpdateData = actorRole === "EMPLOYEE"
    ? { ...updateData, profileSelfUpdatedAt: now, updatedBy: userId }
    : { ...updateData, updatedBy: userId };

  await repository.updateEmployee(employee.id, profileUpdateData);

  await logActivity({
    actorId: userId,
    actorName,
    actorRole,
    eventType: SECURITY_EVENT_TYPE.EMPLOYEE_UPDATED,
    resource: `EmployeeProfile:${employee.id}`,
    status: SECURITY_LOG_STATUS.SUCCESS,
    metadata: { updatedFields: Object.keys(updateData) },
  });

  return true;
}
