import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import * as path from "node:path";

export type ArchitectureViolation = {
  file: string;
  line: number;
  message: string;
};

export type ArchitectureViolations = {
  repositoryBoundary: ArchitectureViolation[];
  actionRepositoryBoundary: ArchitectureViolation[];
  clientFetch: ArchitectureViolation[];
  clientReadActionImports: ArchitectureViolation[];
  serverPageReadActionImports: ArchitectureViolation[];
  legacyConstants: ArchitectureViolation[];
};

type CollectOptions = {
  rootDir: string;
};

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);
const LEGACY_EMPLOYEE_STATUS_STRINGS = ["Aktif", "Pensiun", "Tubel"] as const;
const LABEL_LAYER_PATTERNS = [
  /\/components\//,
  /\/constants\//,
  /\/constants\.ts$/,
  /\/mappers\//,
  /\/mappers\.ts$/,
  /\/dictionaries\//,
  /\/i18n\//,
];
const READ_ACTION_PREFIX_PATTERN = /^(?:get|fetch|find|list|count|load|read)[A-Z0-9_]/;
const LEGACY_ACTION_REPOSITORY_EXCEPTIONS = new Set([
  // TODO: Auth/settings actions predate the service boundary cleanup. Keep this explicit until they are refactored.
  "src/modules/auth/actions/auth.actions.ts",
  "src/modules/settings/actions/settings.actions.ts",
]);

export function collectArchitectureViolations(options: CollectOptions): ArchitectureViolations {
  const srcDir = path.join(options.rootDir, "src");
  const files = collectSourceFiles(srcDir);

  return files.reduce<ArchitectureViolations>(
    (violations, filePath) => {
      const content = readFileSync(filePath, "utf8");
      violations.repositoryBoundary.push(...findRepositoryBoundaryViolations(options.rootDir, filePath, content));
      violations.actionRepositoryBoundary.push(...findActionRepositoryBoundaryViolations(options.rootDir, filePath, content));
      violations.clientFetch.push(...findClientFetchViolations(options.rootDir, filePath, content));
      violations.clientReadActionImports.push(...findClientReadActionImportViolations(options.rootDir, filePath, content));
      violations.serverPageReadActionImports.push(...findServerPageReadActionImportViolations(options.rootDir, filePath, content));
      violations.legacyConstants.push(...findLegacyConstantViolations(options.rootDir, filePath, content));
      return violations;
    },
    {
      repositoryBoundary: [],
      actionRepositoryBoundary: [],
      clientFetch: [],
      clientReadActionImports: [],
      serverPageReadActionImports: [],
      legacyConstants: [],
    }
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
  const importPattern = /from\s+["']@\/modules\/([^/"'\s]+)\/(?:repository|repositories\/[^"']+)["']/g;

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

function findActionRepositoryBoundaryViolations(
  rootDir: string,
  filePath: string,
  content: string
): ArchitectureViolation[] {
  const relativePath = toRelativePath(rootDir, filePath);
  if (!normalizePath(relativePath).includes("/actions/")) return [];
  if (LEGACY_ACTION_REPOSITORY_EXCEPTIONS.has(relativePath)) return [];

  const importPattern = /from\s+["']([^"']*(?:repository|repositories\/[^"']+)[^"']*)["']/g;

  return findMatches(content, importPattern).map((match) => ({
    file: relativePath,
    line: match.line,
    message: "Server Action tidak boleh import repository langsung; panggil service/server boundary.",
  }));
}

function findClientReadActionImportViolations(
  rootDir: string,
  filePath: string,
  content: string
): ArchitectureViolation[] {
  if (!hasUseClientDirective(content)) return [];

  return findReadActionImportViolations(rootDir, filePath, content, {
    message: "Client component tidak boleh import read Server Action; gunakan hooks/api GET route.",
  });
}

function findServerPageReadActionImportViolations(
  rootDir: string,
  filePath: string,
  content: string
): ArchitectureViolation[] {
  const relativePath = toRelativePath(rootDir, filePath);
  if (!normalizePath(relativePath).startsWith("src/app/")) return [];
  if (!relativePath.endsWith("/page.tsx")) return [];

  return findReadActionImportViolations(rootDir, filePath, content, {
    message: "Server Component page tidak boleh import read Server Action untuk initial render; gunakan module/server.",
  });
}

function findReadActionImportViolations(
  rootDir: string,
  filePath: string,
  content: string,
  options: { message: string }
): ArchitectureViolation[] {
  return getNamedImports(content)
    .filter((importDeclaration) => isModuleActionSource(importDeclaration.source))
    .flatMap((importDeclaration) =>
      importDeclaration.names
        .filter(isReadActionName)
        .map((name) => ({
          file: toRelativePath(rootDir, filePath),
          line: importDeclaration.line,
          message: `${options.message} Import read action '${name}'.`,
        }))
    );
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

function getNamedImports(content: string): Array<{ line: number; source: string; names: string[] }> {
  const importPattern = /import\s+(?:type\s+)?{([\s\S]*?)}\s+from\s+["']([^"']+)["']/g;

  return Array.from(content.matchAll(importPattern)).map((match) => ({
    line: getLineNumber(content, match.index ?? 0),
    source: match[2],
    names: match[1]
      .split(",")
      .map((specifier) => specifier.trim())
      .filter(Boolean)
      .map((specifier) => specifier.replace(/^type\s+/, "").split(/\s+as\s+/i)[0].trim()),
  }));
}

function isModuleActionSource(source: string): boolean {
  return /^@\/modules\/[^/]+$/.test(source) || /^@\/modules\/[^/]+\/actions(?:\/|$)/.test(source);
}

function isReadActionName(name: string): boolean {
  return READ_ACTION_PREFIX_PATTERN.test(name);
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
