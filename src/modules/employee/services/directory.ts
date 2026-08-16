/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PaginationMeta } from "@/types/pagination";
import { logActivity } from "@/modules/security/server";
import { SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security/server";
import * as repository from "../repository";
import { EMPLOYEE_STATUS_LABELS, EMPLOYEE_STATUS_VALUE, getEmployeeStatusLabel } from "../constants";
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
  filter: EmployeeDirectoryFilter & {
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  } = {}
) {
  const page = filter.page || 1;
  const limit = filter.limit || 20;
  const skip = (page - 1) * limit;

  const where = buildEmployeeDirectoryWhere(filter);

  const [employees, total] = await Promise.all([
    repository.findEmployeesWithPagination(where, skip, limit, filter.sortBy, filter.sortOrder),
    repository.countEmployees(where),
  ]);

  const totalPages = Math.ceil(total / limit);

  const pagination: PaginationMeta = {
    page,
    pageSize: limit,
    totalItems: total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };

  return {
    data: employees.map(mapEmployeeSummary),
    pagination,
  };
}

export async function getEmployeeDirectorOptions() {
  const employees = await repository.findEmployeeSignatureOptions();
  return employees.map((employee) => ({
    id: employee.id,
    name: employee.name,
    nip: employee.employeeId,
    position: employee.employeePosition?.name ?? null,
    rank: employee.employeeRank?.name ?? null,
  }));
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
    getEmployeeStatusLabel(employee.status) || EMPLOYEE_STATUS_LABELS[EMPLOYEE_STATUS_VALUE.ACTIVE],
    employee.user?.isActive === false ? "Nonaktif" : EMPLOYEE_STATUS_LABELS[EMPLOYEE_STATUS_VALUE.ACTIVE],
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
