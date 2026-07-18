/* eslint-disable @typescript-eslint/no-explicit-any */
import * as argon2 from "argon2";
import crypto from "crypto";
import { AppError } from "@/lib/errors";
import { logActivity } from "@/modules/security/server";
import { SECURITY_ACTOR_ROLE, SECURITY_EVENT_TYPE, SECURITY_LOG_STATUS } from "@/modules/security/server";
import * as repository from "../repository";
import { canonicalEmployeeStatus, canonicalGender, canonicalMaritalStatus, canonicalReligion } from "./shared";

export async function handleEmployeeCrud(
  operation: "CREATE" | "UPDATE" | "DELETE" | "RESTORE" | "PERMANENT_DELETE",
  id?: string,
  data?: any,
  actorId?: string,
  actorName?: string,
  actorRole?: string
) {
  const systemActor = {
    actorId: actorId || null,
    actorName: actorName || "System",
    actorRole: actorRole || SECURITY_ACTOR_ROLE.ADMIN,
  };

  if (operation === "CREATE") {
    if (!data.email || !data.name) {
      throw new AppError("VALIDATION_ERROR", "Email dan Nama wajib diisi", 400);
    }
    if (!data.employeeId && !data.nik) {
      throw new AppError("VALIDATION_ERROR", "NIP atau NIK wajib diisi. Isi minimal salah satu identitas pegawai.", 400, [
        { path: "employeeId", message: "Isi NIP atau NIK." },
        { path: "nik", message: "Isi NIK atau NIP." },
      ]);
    }

    // Check duplicate
    if (data.email) {
      const exist = await repository.findUserByEmail(data.email);
      if (exist) throw new AppError("CONFLICT", "Email sudah terdaftar. Gunakan email lain.", 409);
    }
    if (data.employeeId) {
      const exist = await repository.findEmployeeByEmployeeId(data.employeeId);
      if (exist) throw new AppError("CONFLICT", "NIP sudah terdaftar. Periksa kembali NIP pegawai.", 409);
    }
    if (data.nik) {
      const exist = await repository.findEmployeeByNik(data.nik);
      if (exist) throw new AppError("CONFLICT", "NIK sudah terdaftar. Periksa kembali NIK pegawai.", 409);
    }

    const userId = crypto.randomUUID();
    const employeeId = crypto.randomUUID();
    // Do not create accounts with a shared default password. Admin-created
    // users should activate access through the password reset flow.
    const passwordHash = await argon2.hash(crypto.randomBytes(24).toString("base64url"));

    const result = await repository.createEmployeeWithUserTransaction({
      user: {
        id: userId,
        email: data.email,
        passwordHash,
        role: data.role || "EMPLOYEE",
        isActive: data.isActive ?? true,
      },
      employee: {
        id: employeeId,
        userId: userId,
        employeeId: data.employeeId || null,
        nik: data.nik || null,
        name: data.name,
        status: canonicalEmployeeStatus(data.status),
        gender: canonicalGender(data.gender),
        birthPlace: data.birthPlace || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        academicDegree: data.academicDegree || null,
        lastEducation: data.lastEducation || null,
        religion: canonicalReligion(data.religion),
        maritalStatus: canonicalMaritalStatus(data.maritalStatus),
        phone: data.phone || null,
        address: data.address || null,
        joinDate: data.joinDate ? new Date(data.joinDate) : null,
        hasTmt: data.hasTmt ?? false,
        tmtStartDate: data.tmtStartDate ? new Date(data.tmtStartDate) : null,
        tmtEndDate: data.tmtEndDate ? new Date(data.tmtEndDate) : null,
        employmentStatusId: data.employmentStatusId || null,
        employeeGroupId: data.employeeGroupId || null,
        employeePositionId: data.employeePositionId || null,
        employeeRankId: data.employeeRankId || null,
        workplaceId: data.workplaceId || null,
        createdBy: systemActor.actorId,
      },
    });

    await logActivity({
      ...systemActor,
      eventType: SECURITY_EVENT_TYPE.EMPLOYEE_CREATED,
      resource: `Employee:${employeeId}`,
      status: SECURITY_LOG_STATUS.SUCCESS,
      metadata: { email: data.email, name: data.name },
    });

    return { id: result.employee.id, name: result.employee.name };
  }

  if (operation === "UPDATE") {
    if (!id) throw new AppError("VALIDATION_ERROR", "ID pegawai wajib diisi.", 400);

    const employee = await repository.findEmployeeWithUserById(id);
    if (!employee) throw new AppError("NOT_FOUND", "Pegawai tidak ditemukan.", 404);

    // Check duplicate if values changed
    if (data.email && data.email !== employee.user.email) {
      const exist = await repository.findUserByEmail(data.email);
      if (exist) throw new AppError("CONFLICT", "Email sudah terdaftar. Gunakan email lain.", 409);
    }
    if (data.employeeId && data.employeeId !== employee.employeeId) {
      const exist = await repository.findEmployeeByEmployeeId(data.employeeId);
      if (exist) throw new AppError("CONFLICT", "NIP sudah terdaftar. Periksa kembali NIP pegawai.", 409);
    }
    if (data.nik && data.nik !== employee.nik) {
      const exist = await repository.findEmployeeByNik(data.nik);
      if (exist) throw new AppError("CONFLICT", "NIK sudah terdaftar. Periksa kembali NIK pegawai.", 409);
    }

    if (data.isActive === false && employee.userId === systemActor.actorId) {
      throw new AppError("VALIDATION_ERROR", "Akun sendiri tidak dapat dinonaktifkan.", 400);
    }

    const userUpdateData = {
      ...(data.email !== undefined && data.email !== employee.user.email ? { email: data.email } : {}),
      ...(data.role !== undefined && data.role !== employee.user.role ? { role: data.role } : {}),
      ...(data.isActive !== undefined && data.isActive !== employee.user.isActive ? { isActive: data.isActive } : {}),
    };
    const accountUpdatedFields = Object.keys(userUpdateData);

    const result = await repository.updateEmployeeWithUserTransaction({
      id,
      userId: employee.userId,
      user: accountUpdatedFields.length > 0 ? userUpdateData : undefined,
      employee: {
        employeeId: data.employeeId !== undefined ? data.employeeId : undefined,
        nik: data.nik !== undefined ? data.nik : undefined,
        name: data.name ?? undefined,
        status: data.status !== undefined ? canonicalEmployeeStatus(data.status) : undefined,
        gender: data.gender !== undefined ? canonicalGender(data.gender) : undefined,
        birthPlace: data.birthPlace !== undefined ? data.birthPlace : undefined,
        birthDate: data.birthDate !== undefined ? (data.birthDate ? new Date(data.birthDate) : null) : undefined,
        academicDegree: data.academicDegree !== undefined ? data.academicDegree : undefined,
        lastEducation: data.lastEducation !== undefined ? data.lastEducation : undefined,
        religion: data.religion !== undefined ? canonicalReligion(data.religion) : undefined,
        maritalStatus: data.maritalStatus !== undefined ? canonicalMaritalStatus(data.maritalStatus) : undefined,
        phone: data.phone !== undefined ? data.phone : undefined,
        address: data.address !== undefined ? data.address : undefined,
        joinDate: data.joinDate !== undefined ? (data.joinDate ? new Date(data.joinDate) : null) : undefined,
        hasTmt: data.hasTmt !== undefined ? data.hasTmt : undefined,
        tmtStartDate: data.tmtStartDate !== undefined ? (data.tmtStartDate ? new Date(data.tmtStartDate) : null) : undefined,
        tmtEndDate: data.tmtEndDate !== undefined ? (data.tmtEndDate ? new Date(data.tmtEndDate) : null) : undefined,
        employmentStatusId: data.employmentStatusId !== undefined ? data.employmentStatusId : undefined,
        employeeGroupId: data.employeeGroupId !== undefined ? data.employeeGroupId : undefined,
        employeePositionId: data.employeePositionId !== undefined ? data.employeePositionId : undefined,
        employeeRankId: data.employeeRankId !== undefined ? data.employeeRankId : undefined,
        workplaceId: data.workplaceId !== undefined ? data.workplaceId : undefined,
        updatedBy: systemActor.actorId,
      },
    });

    await logActivity({
      ...systemActor,
      eventType: SECURITY_EVENT_TYPE.EMPLOYEE_UPDATED,
      resource: `Employee:${id}`,
      status: SECURITY_LOG_STATUS.SUCCESS,
      metadata: { name: result.name },
    });

    if (accountUpdatedFields.length > 0) {
      await logActivity({
        ...systemActor,
        eventType: SECURITY_EVENT_TYPE.EMPLOYEE_ACCOUNT_UPDATED,
        resource: `User:${employee.userId}`,
        status: SECURITY_LOG_STATUS.SUCCESS,
        metadata: {
          employeeId: id,
          updatedFields: accountUpdatedFields,
        },
      });
    }

    return { id: result.id, name: result.name };
  }

  if (operation === "DELETE") {
    if (!id) throw new AppError("VALIDATION_ERROR", "ID pegawai wajib diisi.", 400);

    const employee = await repository.findEmployeeById(id);
    if (!employee) throw new AppError("NOT_FOUND", "Pegawai tidak ditemukan.", 404);

    await repository.softDeleteEmployeeAndUser(id, employee.userId);

    await logActivity({
      ...systemActor,
      eventType: SECURITY_EVENT_TYPE.EMPLOYEE_DELETED,
      resource: `Employee:${id}`,
      status: SECURITY_LOG_STATUS.SUCCESS,
    });

    return { id, name: employee.name };
  }

  if (operation === "RESTORE") {
    if (!id) throw new AppError("VALIDATION_ERROR", "ID pegawai wajib diisi.", 400);

    const employee = await repository.findEmployeeById(id);
    if (!employee) throw new AppError("NOT_FOUND", "Pegawai tidak ditemukan.", 404);

    await repository.restoreEmployeeAndUser(id, employee.userId);

    await logActivity({
      ...systemActor,
      eventType: SECURITY_EVENT_TYPE.EMPLOYEE_RESTORED,
      resource: `Employee:${id}`,
      status: SECURITY_LOG_STATUS.SUCCESS,
    });

    return { id, name: employee.name };
  }

  if (operation === "PERMANENT_DELETE") {
    if (!id) throw new AppError("VALIDATION_ERROR", "ID pegawai wajib diisi.", 400);

    const employee = await repository.findEmployeeById(id);
    if (!employee) throw new AppError("NOT_FOUND", "Pegawai tidak ditemukan.", 404);
    if (!employee.deletedAt) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Pegawai aktif harus diarsipkan terlebih dahulu sebelum dihapus permanen.",
        400
      );
    }
    if (employee.userId === systemActor.actorId) {
      throw new AppError("VALIDATION_ERROR", "Akun sendiri tidak dapat dihapus permanen.", 400);
    }

    await logActivity({
      ...systemActor,
      eventType: SECURITY_EVENT_TYPE.EMPLOYEE_PERMANENTLY_DELETED,
      resource: `Employee:${id}`,
      status: SECURITY_LOG_STATUS.SUCCESS,
      metadata: {
        employeeName: employee.name,
        userId: employee.userId,
      },
    });

    await repository.permanentlyDeleteEmployeeAndUser(id, employee.userId);

    return { id, name: employee.name };
  }

  throw new AppError("BAD_REQUEST", "Operasi tidak didukung.", 400);
}
