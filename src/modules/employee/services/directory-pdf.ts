import type { EmployeeDirectoryFilter } from "./shared";
import { buildEmployeeDirectoryWhere } from "./shared";
import * as repository from "../repository";
import { getGenderLabel } from "../constants";
import { toIsoDate } from "../mappers";

export type EmployeeDirectoryPdfRow = {
  no: number;
  name: string;
  employeeId: string | null;
  nik: string | null;
  rank: string | null;
  position: string | null;
  workplace: string | null;
  birthPlace: string | null;
  birthDate: string | null;
  lastEducation: string | null;
  employeeGroup: string | null;
  employmentStatus: string | null;
  tmt: string | null;
  gender: string | null;
};

export type EmployeeDirectoryPdfData = {
  title: string;
  archiveView: "active" | "archived";
  generatedAt: string;
  rowCount: number;
  rows: EmployeeDirectoryPdfRow[];
};

function formatTmt(employee: {
  hasTmt?: boolean | null;
  tmtStartDate?: Date | string | null;
  tmtEndDate?: Date | string | null;
}) {
  if (!employee.hasTmt || !employee.tmtStartDate) return null;
  const start = toIsoDate(employee.tmtStartDate)?.slice(0, 10);
  const end = toIsoDate(employee.tmtEndDate)?.slice(0, 10);
  if (!start) return null;
  return end ? `${start} s.d. ${end}` : start;
}

export async function getEmployeeDirectoryPdfData(
  filter: EmployeeDirectoryFilter = {}
): Promise<EmployeeDirectoryPdfData> {
  const where = buildEmployeeDirectoryWhere(filter);
  const employees = await repository.findEmployeesForExport(where);

  return {
    title: "Laporan Kepegawaian",
    archiveView: filter.archiveView === "archived" ? "archived" : "active",
    generatedAt: new Date().toISOString(),
    rowCount: employees.length,
    rows: employees.map((employee, index) => ({
      no: index + 1,
      name: employee.name,
      employeeId: employee.employeeId,
      nik: employee.nik,
      rank: employee.employeeRank?.name ?? null,
      position: employee.employeePosition?.name ?? null,
      workplace: employee.workplace?.name ?? null,
      birthPlace: employee.birthPlace,
      birthDate: toIsoDate(employee.birthDate),
      lastEducation: employee.lastEducation,
      employeeGroup: employee.employeeGroup?.name ?? null,
      employmentStatus: employee.employmentStatus?.name ?? null,
      tmt: formatTmt(employee),
      gender: getGenderLabel(employee.gender),
    })),
  };
}
