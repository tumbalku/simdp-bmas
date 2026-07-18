import crypto from "crypto";
import { logActivity } from "@/modules/security/server";
import { SECURITY_ACTOR_ROLE, SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security/server";
import * as repository from "../repository";

export async function addCareerHistory(data: {
  employeeId: string;
  employmentStatusId?: string;
  employeeGroupId?: string;
  employeePositionId?: string;
  employeeRankId?: string;
  workplaceId?: string;
  effectiveDate: string;
  note?: string;
  createdBy?: string;
  actorName?: string;
  actorRole?: string;
}) {
  const historyId = crypto.randomUUID();
  const effectiveDate = new Date(data.effectiveDate);
  const currentAssignment: Record<string, string | null> = {};

  if (data.employmentStatusId !== undefined) currentAssignment.employmentStatusId = data.employmentStatusId || null;
  if (data.employeeGroupId !== undefined) currentAssignment.employeeGroupId = data.employeeGroupId || null;
  if (data.employeePositionId !== undefined) currentAssignment.employeePositionId = data.employeePositionId || null;
  if (data.employeeRankId !== undefined) currentAssignment.employeeRankId = data.employeeRankId || null;
  if (data.workplaceId !== undefined) currentAssignment.workplaceId = data.workplaceId || null;

  const result = await repository.createCareerHistoryAndUpdateCurrent({
    history: {
      id: historyId,
      employeeId: data.employeeId,
      employmentStatusId: data.employmentStatusId || null,
      employeeGroupId: data.employeeGroupId || null,
      employeePositionId: data.employeePositionId || null,
      employeeRankId: data.employeeRankId || null,
      workplaceId: data.workplaceId || null,
      effectiveDate,
      note: data.note || null,
      createdBy: data.createdBy || null,
    },
    currentAssignment,
  });

  await logActivity({
    actorId: data.createdBy || null,
    actorName: data.actorName || "System",
    actorRole: data.actorRole || SECURITY_ACTOR_ROLE.ADMIN,
    eventType: SECURITY_EVENT_TYPE.EMPLOYEE_UPDATED,
    resource: `Employee:${data.employeeId}`,
    status: SECURITY_LOG_STATUS.SUCCESS,
    metadata: { careerHistoryId: historyId, action: "add_career_history" },
  });

  return { id: result.id, effectiveDate: data.effectiveDate };
}
