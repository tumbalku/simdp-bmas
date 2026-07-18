/* eslint-disable @typescript-eslint/no-explicit-any */
import { logActivity } from "@/modules/security/service";
import { SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security/constants";
import * as repository from "../repository";
import { mapEmployeeSummary } from "../mappers";
import {
  buildEmployeeDirectoryWhere,
  EMPLOYEE_EXPORT_DELIMITER,
  EMPLOYEE_EXPORT_HEADERS,
  escapeCsvCell,
  type EmployeeDirectoryFilter,
  type EmployeeExportActor,
} from "./shared";

export async function getEmployeeDirectory(filter: EmployeeDirectoryFilter = {}) {
  const where = buildEmployeeDirectoryWhere(filter);

  const employees = await repository.findEmployees(where);
  return employees.map(mapEmployeeSummary);
}

export async function getEmployeeDirectoryWithPagination(
  filter: EmployeeDirectoryFilter = {}
) {
  const page = filter.page || 1;
  const limit = filter.limit || 20;
  const skip = (page - 1) * limit;

  const where = buildEmployeeDirectoryWhere(filter);

  const [employees, total] = await Promise.all([
    repository.findEmployeesWithPagination(where, skip, limit),
    repository.countEmployees(where),
  ]);

  return {
    data: employees.map(mapEmployeeSummary),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function exportEmployeeDirectoryCsv(
  filter: EmployeeDirectoryFilter = {},
  actor: EmployeeExportActor
) {
  const where = buildEmployeeDirectoryWhere(filter);
  const employees = await repository.findEmployeesForExport(where);
  const rows = employees.map((employee: any) => [
    employee.name,
    employee.employeeId,
    employee.nik,
    employee.user?.email,
    employee.user?.role || "EMPLOYEE",
    employee.status || "Aktif",
    employee.user?.isActive === false ? "Nonaktif" : "Aktif",
    employee.employmentStatus?.name,
    employee.employeeGroup?.name,
    employee.employeePosition?.name,
    employee.employeeRank?.name,
    employee.workplace?.name,
    employee.phone,
    employee.lastEducation,
  ]);

  await logActivity({
    ...actor,
    eventType: SECURITY_EVENT_TYPE.EMPLOYEE_EXPORTED,
    resource: "EmployeeDirectory",
    status: SECURITY_LOG_STATUS.SUCCESS,
    metadata: {
      rowCount: employees.length,
      archiveView: filter.archiveView || "active",
    },
  });

  return [EMPLOYEE_EXPORT_HEADERS, ...rows]
    .map((row) => row.map(escapeCsvCell).join(EMPLOYEE_EXPORT_DELIMITER))
    .join("\n");
}
