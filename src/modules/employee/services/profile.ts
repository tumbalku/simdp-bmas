import { logActivity } from "@/modules/security/server";
import { SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security/server";
import * as repository from "../repository";
import { mapEmployeeDetail } from "../mappers";
import { canonicalReligion } from "./shared";

export async function getEmployeeDetail(id: string) {
  const employee = await repository.findEmployeeDetailById(id);
  if (!employee) return null;
  return mapEmployeeDetail(employee);
}

export async function getCurrentProfile(userId: string) {
  const employee = await repository.findEmployeeByUserId(userId);
  return employee;
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
      maritalStatus: data.maritalStatus,
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
