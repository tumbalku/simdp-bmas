import { requireAuth } from "@/lib/auth";
import { errorResponse } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { employeeDirectorySchema } from "@/modules/employee";
import { exportEmployeeDirectoryCsv, getActorDisplayName } from "@/modules/employee/server";

export const dynamic = "force-dynamic";

function parseNonNegativeInt(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

function getTimestamp() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
}

export async function GET(request: Request) {
  try {
    const session = await requireAuth("ADMIN");
    const { searchParams } = new URL(request.url);

    const parsed = employeeDirectorySchema.safeParse({
      archiveView: searchParams.get("archiveView") === "archived" ? "archived" : "active",
      search: searchParams.get("search") || undefined,
      employmentStatusId: searchParams.get("employmentStatusId") || undefined,
      employeeGroupId: searchParams.get("employeeGroupId") || undefined,
      professionGroupId: searchParams.get("professionGroupId") || undefined,
      employeePositionId: searchParams.get("employeePositionId") || undefined,
      employeeRankId: searchParams.get("employeeRankId") || undefined,
      workplaceId: searchParams.get("workplaceId") || undefined,
      maritalStatus: searchParams.get("maritalStatus") || undefined,
      lastEducation: searchParams.get("lastEducation") || undefined,
      tmtStartDate: searchParams.get("tmtStartDate") || undefined,
      tmtEndDate: searchParams.get("tmtEndDate") || undefined,
      retirementAgeFrom: parseNonNegativeInt(searchParams.get("retirementAgeFrom")),
      retirementAgeTo: parseNonNegativeInt(searchParams.get("retirementAgeTo")),
      status: searchParams.get("status") || undefined,
    });

    if (!parsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Filter export tidak valid.",
        parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
        400,
      );
    }

    const actorName = await getActorDisplayName(session.userId, "Admin");
    const csv = await exportEmployeeDirectoryCsv(parsed.data, {
      actorId: session.userId,
      actorName,
      actorRole: session.role,
    });
    const filename = `Export-Data-Pegawai_Seluruh-Unit_${getTimestamp()}.csv`;

    return new Response(`\uFEFF${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/v1/employees/export error:", error);

    if (error instanceof AppError) {
      const message =
        error.code === "UNAUTHENTICATED"
          ? "Sesi tidak valid atau telah berakhir."
          : error.code === "FORBIDDEN"
            ? "Anda tidak memiliki akses untuk export data pegawai."
            : error.message;

      return errorResponse(error.code, message, error.details, error.status);
    }

    return errorResponse(
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Terjadi kesalahan internal saat export data pegawai.",
      undefined,
      500,
    );
  }
}
