import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import * as path from "node:path";

export type ArchitectureViolation = {
  file: string;
  line: number;
  message: string;
};

export type ArchitectureViolations = {
  repositoryBoundary: ArchitectureViolation[];
  clientFetch: ArchitectureViolation[];
  legacyConstants: ArchitectureViolation[];
};

type CollectOptions = {
  rootDir: string;
};

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);
const LEGACY_EMPLOYEE_STATUS_STRINGS = ["Aktif", "Pensiun", "Tubel"] as const;
const LABEL_LAYER_PATTERNS = [
  /\/components\//,
  /\/constants\.ts$/,
  /\/mappers\.ts$/,
  /\/dictionaries\//,
  /\/i18n\//,
];

export function collectArchitectureViolations(options: CollectOptions): ArchitectureViolations {
  const srcDir = path.join(options.rootDir, "src");
  const files = collectSourceFiles(srcDir);

  return files.reduce<ArchitectureViolations>(
    (violations, filePath) => {
      const content = readFileSync(filePath, "utf8");
      violations.repositoryBoundary.push(...findRepositoryBoundaryViolations(options.rootDir, filePath, content));
      violations.clientFetch.push(...findClientFetchViolations(options.rootDir, filePath, content));
      violations.legacyConstants.push(...findLegacyConstantViolations(options.rootDir, filePath, content));
      return violations;
    },
    { repositoryBoundary: [], clientFetch: [], legacyConstants: [] }
  );
}

function collectSourceFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];

  return readdirSync(directory).flatMap((entry) => {
    const entryPath = path.join(directory, entry);
    const stats = statSync(entryPath);

    if (stats.isDirectory()) {
      if (entry === ".next" || entry === "node_modules") return [];
      if (entry === "__tests__") return [];
      return collectSourceFiles(entryPath);
    }

    if (!stats.isFile() || !SOURCE_EXTENSIONS.has(path.extname(entryPath))) return [];
    if (entryPath.endsWith(".d.ts")) return [];

    return [entryPath];
  });
}

function findRepositoryBoundaryViolations(
  rootDir: string,
  filePath: string,
  content: string
): ArchitectureViolation[] {
  const fileModule = getOwningModule(rootDir, filePath);
  const importPattern = /from\s+["']@\/modules\/([^/]+)\/(?:repository|repositories\/[^"']+)["']/g;

  return findMatches(content, importPattern)
    .filter((match) => match.groups[0] !== fileModule)
    .map((match) => ({
      file: toRelativePath(rootDir, filePath),
      line: match.line,
      message: `Import repository modul '${match.groups[0]}' harus lewat service/public boundary.`,
    }));
}

function findClientFetchViolations(
  rootDir: string,
  filePath: string,
  content: string
): ArchitectureViolation[] {
  if (!hasUseClientDirective(content)) return [];

  return findMatches(content, /\bfetch\s*\(/g).map((match) => ({
    file: toRelativePath(rootDir, filePath),
    line: match.line,
    message: "Client component tidak boleh memanggil fetch() langsung; gunakan hooks/api modul.",
  }));
}

function findLegacyConstantViolations(
  rootDir: string,
  filePath: string,
  content: string
): ArchitectureViolation[] {
  const relativePath = toRelativePath(rootDir, filePath);
  if (isLabelLayer(relativePath)) return [];

  return LEGACY_EMPLOYEE_STATUS_STRINGS.flatMap((legacyValue) =>
    findMatches(content, new RegExp(`(["'])${escapeRegExp(legacyValue)}\\1`, "g")).map((match) => ({
      file: relativePath,
      line: match.line,
      message: `Legacy status '${legacyValue}' harus berada di constants/label mapping, bukan layer non-label.`,
    }))
  );
}

function hasUseClientDirective(content: string): boolean {
  const firstStatements = content.split("\n").slice(0, 8).join("\n");
  return /^[\s;]*(?:"use client"|'use client')/m.test(firstStatements);
}

function isLabelLayer(relativePath: string): boolean {
  const normalizedPath = normalizePath(relativePath);
  return LABEL_LAYER_PATTERNS.some((pattern) => pattern.test(normalizedPath));
}

function getOwningModule(rootDir: string, filePath: string): string | null {
  const normalizedPath = normalizePath(toRelativePath(rootDir, filePath));
  const match = normalizedPath.match(/^src\/modules\/([^/]+)\//);
  return match?.[1] ?? null;
}

function findMatches(content: string, pattern: RegExp): Array<{ line: number; groups: string[] }> {
  return Array.from(content.matchAll(pattern)).map((match) => ({
    line: getLineNumber(content, match.index ?? 0),
    groups: match.slice(1),
  }));
}

function getLineNumber(content: string, index: number): number {
  return content.slice(0, index).split("\n").length;
}

function toRelativePath(rootDir: string, filePath: string): string {
  return normalizePath(path.relative(rootDir, filePath));
}

function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
