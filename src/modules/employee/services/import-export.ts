/* eslint-disable @typescript-eslint/no-explicit-any */
import { logActivity } from "@/modules/security/server";
import { SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security/server";
import { handleEmployeeCrud } from "./crud";
import { canonicalGender, canonicalMaritalStatus, canonicalReligion } from "./shared";

export async function importFromCsv(
  csvText: string,
  actorId: string,
  actorName: string,
  actorRole: string
) {
  const parseCsvLine = (line: string, delimiter: string) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && inQuotes && nextChar === '"') {
        current += '"';
        i++;
        continue;
      }

      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      if (char === delimiter && !inQuotes) {
        values.push(current.trim());
        current = "";
        continue;
      }

      current += char;
    }

    values.push(current.trim());
    return values;
  };

  const parseCsv = (text: string) => {
    const lines = text.split(String.fromCharCode(10)).map((line) => line.replace(String.fromCharCode(13), "")).filter((line) => line.trim().length > 0);
    if (lines.length === 0) return [];
    const delimiter = lines[0].includes(";") ? ";" : ",";
    const headers = parseCsvLine(lines[0], delimiter).map((h) => h.replace(/^﻿/, ""));
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i], delimiter);
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      rows.push(row);
    }
    return rows;
  };

  const rows = parseCsv(csvText);
  let importedCount = 0;
  let failedCount = 0;
  const errors: Array<{ row: number; error: string }> = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 1-indexed plus header

    try {
      if (!row.email || !row.name) {
        throw new Error("Email dan Nama wajib diisi");
      }
      if (!row.employeeId && !row.nik) {
        throw new Error("NIP (employeeId) atau NIK wajib diisi");
      }

      await handleEmployeeCrud(
        "CREATE",
        undefined,
        {
          email: row.email,
          name: row.name,
          role: row.role || "EMPLOYEE",
          employeeId: row.employeeId || row.nip || null,
          nik: row.nik || null,
          gender: canonicalGender(row.gender),
          birthPlace: row.birthPlace || null,
          birthDate: row.birthDate || null,
          academicDegree: row.academicDegree || null,
          lastEducation: row.lastEducation || null,
          religion: canonicalReligion(row.religion),
          maritalStatus: canonicalMaritalStatus(row.maritalStatus),
          phone: row.phone || null,
          address: row.address || null,
          joinDate: row.joinDate || null,
          employmentStatusId: row.employmentStatusId || null,
          employeeGroupId: row.employeeGroupId || null,
          employeePositionId: row.employeePositionId || null,
          employeeRankId: row.employeeRankId || null,
          workplaceId: row.workplaceId || null,
        },
        actorId,
        actorName,
        actorRole
      );

      importedCount++;
    } catch (err: any) {
      failedCount++;
      errors.push({ row: rowNum, error: err.message });
    }
  }

  await logActivity({
    actorId,
    actorName,
    actorRole,
    eventType: SECURITY_EVENT_TYPE.EMPLOYEE_UPDATED,
    resource: "BulkImport",
    status: SECURITY_LOG_STATUS.SUCCESS,
    metadata: { importedCount, failedCount },
  });

  return { importedCount, failedCount, errors };
}
