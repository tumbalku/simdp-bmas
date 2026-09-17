import { describe, expect, it } from "vitest";

import { getDocumentTypeUploadActionState } from "../utils/upload-action-state";

const existingDocument = {
  id: "doc-1",
  title: "Ijazah Pendidikan Terakhir",
  documentTypeId: "legacy-type",
  documentTypeName: "Ijazah Pendidikan Terakhir",
  archiveCategory: "EDUCATION",
  status: "APPROVED",
  fileName: "ijazah.pdf",
  fileSize: 1024,
  mimeType: "application/pdf",
  uploadedAt: "2026-09-13T00:00:00.000Z",
  verifiedAt: null,
  expiryDate: null,
  ownerId: "employee-1",
  ownerName: "Pegawai",
  ownerEmployeeId: "198501012010011001",
  ownerNik: "7471010101010001",
  documentNumber: null,
  issueDate: null,
};

describe("Document grouped list upload action", () => {
  it("keeps the add action visible but disabled when an existing group has no active document type option", () => {
    const group = {
      documentTypeId: "legacy-type",
      documentTypeName: "Ijazah Pendidikan Terakhir",
      archiveCategory: "EDUCATION",
      allowMultiple: true,
      isMandatory: false,
      documents: [existingDocument],
    };

    expect(getDocumentTypeUploadActionState(group)).toEqual({ isDisabled: true });
  });

  it("disables the add action when a single-file document type already has a document", () => {
    const group = {
      documentTypeId: "type-1",
      documentTypeName: "NPWP",
      archiveCategory: "LEGAL",
      allowMultiple: false,
      isMandatory: false,
      documentType: {
        id: "type-1",
        code: "NPWP",
        name: "NPWP",
        archiveCategory: "LEGAL",
        allowMultiple: false,
        allowedFormats: "pdf",
        maxSizeMb: 2,
        requiresDocumentNumber: false,
        requiresIssueDate: false,
        requiresExpiryDate: false,
      },
      documents: [
        {
          ...existingDocument,
          documentTypeId: "type-1",
          documentTypeName: "NPWP",
          archiveCategory: "LEGAL",
          title: "NPWP",
          fileName: "npwp.pdf",
        },
      ],
    };

    expect(getDocumentTypeUploadActionState(group)).toEqual({ isDisabled: true });
  });

  it("enables the add action when an active multi-file document type already has a document", () => {
    const group = {
      documentTypeId: "type-2",
      documentTypeName: "Sertifikat",
      archiveCategory: "CERTIFICATION",
      allowMultiple: true,
      isMandatory: false,
      documentType: {
        id: "type-2",
        code: "CERT",
        name: "Sertifikat",
        archiveCategory: "CERTIFICATION",
        allowMultiple: true,
        allowedFormats: "pdf",
        maxSizeMb: 2,
        requiresDocumentNumber: false,
        requiresIssueDate: false,
        requiresExpiryDate: false,
      },
      documents: [
        {
          ...existingDocument,
          documentTypeId: "type-2",
          documentTypeName: "Sertifikat",
          archiveCategory: "CERTIFICATION",
          title: "Sertifikat",
          fileName: "sertifikat.pdf",
        },
      ],
    };

    expect(getDocumentTypeUploadActionState(group)).toEqual({ isDisabled: false });
  });
});
