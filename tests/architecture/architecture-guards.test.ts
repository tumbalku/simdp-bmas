import { describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { collectArchitectureViolations } from "./architecture-guards";

describe("architecture guards", () => {
  it("keeps module repository imports behind module boundaries", () => {
    const violations = collectArchitectureViolations({ rootDir: process.cwd() });

    expect(violations.repositoryBoundary).toEqual([]);
  });

  it("keeps client components from calling fetch directly", () => {
    const violations = collectArchitectureViolations({ rootDir: process.cwd() });

    expect(violations.clientFetch).toEqual([]);
  });

  it("keeps legacy employee status strings out of non-label layers", () => {
    const violations = collectArchitectureViolations({ rootDir: process.cwd() });

    expect(violations.legacyConstants).toEqual([]);
  });

  it("fails when code imports another module repository directly", () => {
    const rootDir = createFixtureProject({
      "src/modules/document/service.ts": "import { employeeRepository } from '@/modules/employee/repository';\n",
    });

    const violations = collectArchitectureViolations({ rootDir });

    expect(violations.repositoryBoundary).toEqual([
      expect.objectContaining({ file: "src/modules/document/service.ts", line: 1 }),
    ]);
    cleanupFixtureProject(rootDir);
  });

  it("fails when a client component calls fetch directly", () => {
    const rootDir = createFixtureProject({
      "src/modules/document/components/DocumentButton.tsx": '"use client";\nexport function Button() { fetch("/api"); }\n',
    });

    const violations = collectArchitectureViolations({ rootDir });

    expect(violations.clientFetch).toEqual([
      expect.objectContaining({ file: "src/modules/document/components/DocumentButton.tsx", line: 2 }),
    ]);
    cleanupFixtureProject(rootDir);
  });

  it("fails when legacy employee status strings are used outside label layers", () => {
    const rootDir = createFixtureProject({
      "src/modules/employee/service.ts": 'export const fallbackStatus = "Aktif";\n',
      "src/modules/employee/constants.ts": 'export const label = "Aktif";\n',
    });

    const violations = collectArchitectureViolations({ rootDir });

    expect(violations.legacyConstants).toEqual([
      expect.objectContaining({ file: "src/modules/employee/service.ts", line: 1 }),
    ]);
    cleanupFixtureProject(rootDir);
  });
});

function createFixtureProject(files: Record<string, string>): string {
  const rootDir = mkdtempSync(path.join(tmpdir(), "simdp-architecture-"));

  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(rootDir, ...filePath.split("/"));
    mkdirSync(path.dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, content);
  }

  return rootDir;
}

function cleanupFixtureProject(rootDir: string) {
  rmSync(rootDir, { force: true, recursive: true });
}
