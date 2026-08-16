import { storage } from "@/lib/storage";
import { logActivity } from "@/modules/security/server";
import { SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security/server";
import { getSystemSettingValue } from "@/modules/settings/server";
import { AppError } from "@/lib/errors";
import * as repository from "../repository";
import { mapEmployeeDetail } from "../mappers";
import { canonicalMaritalStatus, canonicalReligion } from "./shared";

const PROFILE_IMAGE_MAX_UPLOAD_MB_KEY = "profile_image_max_upload_mb";
const DEFAULT_PROFILE_IMAGE_MAX_UPLOAD_MB = "2";

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
    phone?: string | null;
    address?: string | null;
    birthPlace?: string | null;
    birthDate?: string | null;
    religion?: string | null;
    maritalStatus?: string | null;
  },
  actorName: string,
  actorRole: string
) {
  const employee = await repository.findEmployeeSimpleByUserId(userId);
  if (!employee) return false;

  const updateData = Object.fromEntries(
    Object.entries({
      phone: data.phone,
      address: data.address,
      birthPlace: data.birthPlace,
      birthDate: data.birthDate === undefined ? undefined : data.birthDate ? new Date(data.birthDate) : null,
      religion: data.religion === undefined ? undefined : canonicalReligion(data.religion),
      maritalStatus: data.maritalStatus === undefined ? undefined : canonicalMaritalStatus(data.maritalStatus),
    }).filter(([, value]) => value !== undefined)
  );

  if (Object.keys(updateData).length === 0) return true;

  await repository.updateEmployee(employee.id, updateData);

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
