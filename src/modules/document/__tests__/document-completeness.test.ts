import { describe, expect, it } from "vitest";

import { calculateMandatoryDocumentCompleteness } from "../document-completeness";

describe("calculateMandatoryDocumentCompleteness", () => {
  it("counts only mandatory document types targeted to the employee", () => {
    const employee = {
      employmentStatusId: "status-pegawai",
      employeeGroupId: "group-pegawai",
      employeePositionId: "position-staf",
      employeePosition: { professionGroupId: "profession-staf" },
      employeeRankId: "rank-1",
      workplaceId: "workplace-rs",
    };

    const result = calculateMandatoryDocumentCompleteness({
      employee,
      documentTypes: [
        {
          id: "type-pegawai-1",
          isMandatory: true,
          employeeGroups: [{ employeeGroupId: "group-pegawai" }],
        },
        {
          id: "type-pegawai-2",
          isMandatory: true,
          employmentStatuses: [{ employmentStatusId: "status-pegawai" }],
        },
        {
          id: "type-dokter",
          isMandatory: true,
          professionGroups: [{ professionGroupId: "profession-dokter" }],
        },
        {
          id: "type-perawat",
          isMandatory: true,
          employeePositions: [{ employeePositionId: "position-perawat" }],
        },
        {
          id: "type-opsional",
          isMandatory: false,
          employeeGroups: [{ employeeGroupId: "group-pegawai" }],
        },
      ],
      documents: [
        { documentTypeId: "type-pegawai-1", status: "APPROVED" },
        { documentTypeId: "type-dokter", status: "APPROVED" },
      ],
    });

    expect(result).toEqual({ completed: 1, total: 2, percentage: 50 });
  });

  it("treats pre-filtered document types as applicable when employee is not supplied", () => {
    const result = calculateMandatoryDocumentCompleteness({
      documentTypes: [
        { id: "type-pegawai-1", isMandatory: true },
        { id: "type-pegawai-2", isMandatory: true },
        { id: "type-opsional", isMandatory: false },
      ],
      documents: [
        { documentTypeId: "type-pegawai-1", status: "APPROVED" },
        { documentTypeId: "type-pegawai-2", status: "APPROVED" },
      ],
    });

    expect(result).toEqual({ completed: 2, total: 2, percentage: 100 });
  });

  it("separates required progress by employment status targets", () => {
    const documentTypes = [
      { id: "ktp-asn", isMandatory: true, employmentStatuses: [{ employmentStatusId: "ASN" }] },
      { id: "ijazah-asn", isMandatory: true, employmentStatuses: [{ employmentStatusId: "ASN" }] },
      { id: "sk-asn", isMandatory: true, employmentStatuses: [{ employmentStatusId: "ASN" }] },
      { id: "kontrak-non-asn", isMandatory: true, employmentStatuses: [{ employmentStatusId: "NON_ASN" }] },
      { id: "sertifikat-opsional", isMandatory: false, employmentStatuses: [{ employmentStatusId: "ASN" }] },
      { id: "npwp-opsional", isMandatory: false, employmentStatuses: [{ employmentStatusId: "NON_ASN" }] },
    ];

    const asnProgress = calculateMandatoryDocumentCompleteness({
      employee: { employmentStatusId: "ASN" },
      documentTypes,
      documents: [
        { documentTypeId: "ktp-asn", status: "APPROVED" },
        { documentTypeId: "sertifikat-opsional", status: "APPROVED" },
      ],
    });
    const nonAsnProgress = calculateMandatoryDocumentCompleteness({
      employee: { employmentStatusId: "NON_ASN" },
      documentTypes,
      documents: [
        { documentTypeId: "kontrak-non-asn", status: "APPROVED" },
        { documentTypeId: "npwp-opsional", status: "APPROVED" },
      ],
    });

    expect(asnProgress).toEqual({ completed: 1, total: 3, percentage: 33 });
    expect(nonAsnProgress).toEqual({ completed: 1, total: 1, percentage: 100 });
  });

  it("counts mandatory documents as complete only after they are approved", () => {
    const result = calculateMandatoryDocumentCompleteness({
      employee: { employmentStatusId: "ASN" },
      documentTypes: [
        { id: "ktp-asn", isMandatory: true, employmentStatuses: [{ employmentStatusId: "ASN" }] },
        { id: "ijazah-asn", isMandatory: true, employmentStatuses: [{ employmentStatusId: "ASN" }] },
        { id: "sk-asn", isMandatory: true, employmentStatuses: [{ employmentStatusId: "ASN" }] },
      ],
      documents: [
        { documentTypeId: "ktp-asn", status: "APPROVED" },
        { documentTypeId: "ijazah-asn", status: "PENDING" },
        { documentTypeId: "sk-asn", status: "REJECTED" },
      ],
    });

    expect(result).toEqual({ completed: 1, total: 3, percentage: 33 });
  });
});
