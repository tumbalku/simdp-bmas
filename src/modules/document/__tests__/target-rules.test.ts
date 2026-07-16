import { describe, expect, it } from "vitest";
import { matchesDocumentTypeTarget } from "../target-rules";

describe("document target rules", () => {
  const employee = {
    employmentStatusId: "status-asn",
    employeeGroupId: "group-pns",
    employeePositionId: "position-doctor",
    employeePosition: { professionGroupId: "profession-medical" },
    employeeRankId: "rank-iii-a",
    workplaceId: "work-er",
  };

  it("treats empty target dimensions as all employees", () => {
    expect(matchesDocumentTypeTarget(employee, {})).toBe(true);
  });

  it("matches all employee groups when only employment status is selected", () => {
    expect(
      matchesDocumentTypeTarget(employee, {
        employmentStatuses: [{ employmentStatusId: "status-asn" }],
        employeeGroups: [],
      }),
    ).toBe(true);
  });

  it("requires all filled target dimensions to match", () => {
    expect(
      matchesDocumentTypeTarget(employee, {
        employmentStatuses: [{ employmentStatusId: "status-asn" }],
        employeeGroups: [{ employeeGroupId: "group-pppk" }],
      }),
    ).toBe(false);
  });

  it("matches employee position target rules", () => {
    expect(
      matchesDocumentTypeTarget(employee, {
        employeePositions: [{ employeePositionId: "position-doctor" }],
      }),
    ).toBe(true);

    expect(
      matchesDocumentTypeTarget(employee, {
        employeePositions: [{ employeePositionId: "position-nurse" }],
      }),
    ).toBe(false);
  });
});
