#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const SUPPORTED_PROVIDER = new Set(["local", "supabase"]);
const DEFAULT_LIMIT = 100;

function usage() {
  console.log(`SIMDP storage snapshot helper

Usage:
  node scripts/backup-storage-source.mjs snapshot --out-dir <dir>

Environment:
  STORAGE_PROVIDER=local|supabase
  SIMDP_STORAGE_DIR=<local storage dir>                  # required when STORAGE_PROVIDER=local
  SUPABASE_URL=<https://project.supabase.co>             # required when STORAGE_PROVIDER=supabase
  SUPABASE_SERVICE_ROLE_KEY=<service role key>           # required when STORAGE_PROVIDER=supabase
  SUPABASE_STORAGE_BUCKET=<bucket>                       # required when STORAGE_PROVIDER=supabase
`);
}

function parseArgs(argv) {
  const args = [...argv];
  const command = args.shift() ?? "snapshot";
  let outDir = "";

  while (args.length > 0) {
    const arg = args.shift();
    if (arg === "--out-dir") {
      outDir = args.shift() ?? "";
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      return { command: "help", outDir: "" };
    }
    throw new Error(`Argumen tidak dikenal: ${arg}`);
  }

  return { command, outDir };
}

function sanitizeRelativeStoragePath(filePath) {
  const normalized = filePath
    .split("?")[0]
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^uploads\//, "")
    .replace(/^supabase\//, "");

  const parts = normalized.split("/").filter(Boolean);
  if (parts.length === 0) {
    throw new Error(`Path storage tidak valid: ${filePath}`);
  }

  if (parts.some((part) => part === "..")) {
    throw new Error(`Path storage berbahaya: ${filePath}`);
  }

  return parts.join("/");
}

async function writeSourceFile(outRoot, relativePath, buffer) {
  const cleanRelativePath = sanitizeRelativeStoragePath(relativePath);
  const destination = path.join(outRoot, "storage", cleanRelativePath);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, buffer);
}

export async function snapshotLocalStorageSource({ outDir, storageDir = process.env.SIMDP_STORAGE_DIR }) {
  if (!storageDir) {
    throw new Error("SIMDP_STORAGE_DIR wajib diisi saat STORAGE_PROVIDER=local");
  }

  const resolvedStorageDir = path.resolve(storageDir);
  const stat = await fs.stat(resolvedStorageDir).catch(() => null);
  if (!stat || !stat.isDirectory()) {
    throw new Error(`Folder storage lokal tidak ditemukan: ${resolvedStorageDir}`);
  }

  const destinationRoot = path.join(outDir, "storage");
  await fs.mkdir(outDir, { recursive: true });
  await fs.mkdir(destinationRoot, { recursive: true });
  await fs.cp(resolvedStorageDir, destinationRoot, { recursive: true, force: true });

  return { provider: "local", root: destinationRoot };
}

async function listSupabaseObjects({ baseUrl, bucket, serviceRoleKey, prefix, offset, limit }) {
  const response = await fetch(
    `${baseUrl}/storage/v1/object/list/${encodeURIComponent(bucket)}`,
    {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        prefix,
        offset,
        limit,
        sortBy: { column: "name", order: "asc" },
      }),
    },
  );

  if (!response.ok) {
    const responseText = await response.text().catch(() => "");
    throw new Error(
      `Gagal membaca daftar file Supabase Storage (${response.status}): ${responseText || response.statusText}`,
    );
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Respons list Supabase Storage tidak valid");
  }

  return data;
}

function isSupabaseFolderEntry(object) {
  return (
    object &&
    typeof object.name === "string" &&
    object.name.trim() &&
    object.id === null &&
    object.metadata === null
  );
}

async function listSupabaseObjectsRecursive({
  baseUrl,
  bucket,
  serviceRoleKey,
  prefix,
}) {
  const allObjects = [];
  let offset = 0;

  while (true) {
    const objects = await listSupabaseObjects({
      baseUrl,
      bucket,
      serviceRoleKey,
      prefix,
      offset,
      limit: DEFAULT_LIMIT,
    });

    if (objects.length === 0) {
      break;
    }

    for (const object of objects) {
      const objectName = object?.name;
      if (typeof objectName !== "string" || !objectName.trim()) {
        continue;
      }

      const objectPath = [prefix, objectName].filter(Boolean).join("/");
      if (isSupabaseFolderEntry(object) || objectName.endsWith("/")) {
        const nestedObjects = await listSupabaseObjectsRecursive({
          baseUrl,
          bucket,
          serviceRoleKey,
          prefix: objectPath.replace(/\/+$/, ""),
        });
        allObjects.push(...nestedObjects);
        continue;
      }

      allObjects.push(objectPath);
    }

    if (objects.length < DEFAULT_LIMIT) {
      break;
    }

    offset += DEFAULT_LIMIT;
  }

  return allObjects;
}

async function downloadSupabaseObject({ baseUrl, bucket, serviceRoleKey, objectName }) {
  const encodedPath = objectName
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");

  const response = await fetch(
    `${baseUrl}/storage/v1/object/authenticated/${encodeURIComponent(bucket)}/${encodedPath}`,
    {
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
      },
    },
  );

  if (!response.ok) {
    const responseText = await response.text().catch(() => "");
    throw new Error(
      `Gagal download file Supabase Storage ${objectName} (${response.status}): ${responseText || response.statusText}`,
    );
  }

  return Buffer.from(await response.arrayBuffer());
}

export async function snapshotSupabaseStorageSource({
  outDir,
  baseUrl = process.env.SUPABASE_URL,
  serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY,
  bucket = process.env.SUPABASE_STORAGE_BUCKET,
}) {
  if (!baseUrl) {
    throw new Error("SUPABASE_URL wajib diisi saat STORAGE_PROVIDER=supabase");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY wajib diisi saat STORAGE_PROVIDER=supabase");
  }

  if (!bucket) {
    throw new Error("SUPABASE_STORAGE_BUCKET wajib diisi saat STORAGE_PROVIDER=supabase");
  }

  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  await fs.mkdir(path.join(outDir, "storage"), { recursive: true });

  const objectNames = await listSupabaseObjectsRecursive({
    baseUrl: normalizedBaseUrl,
    bucket,
    serviceRoleKey,
    prefix: "",
  });

  for (const objectName of objectNames) {
    const bytes = await downloadSupabaseObject({
      baseUrl: normalizedBaseUrl,
      bucket,
      serviceRoleKey,
      objectName,
    });
    await writeSourceFile(outDir, objectName, bytes);
  }

  return { provider: "supabase", root: path.join(outDir, "storage") };
}

export async function snapshotStorageSource({ outDir } = {}) {
  if (!outDir) {
    throw new Error("--out-dir wajib diisi");
  }

  const provider = process.env.STORAGE_PROVIDER || "local";
  if (!SUPPORTED_PROVIDER.has(provider)) {
    throw new Error(`STORAGE_PROVIDER=${provider} belum didukung oleh backup worker ini`);
  }

  if (provider === "local") {
    return snapshotLocalStorageSource({ outDir });
  }

  return snapshotSupabaseStorageSource({ outDir });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { command, outDir } = parseArgs(process.argv.slice(2));

  if (command === "help") {
    usage();
    process.exit(0);
  }

  if (command !== "snapshot") {
    usage();
    console.error(`Command tidak dikenal: ${command}`);
    process.exit(1);
  }

  try {
    const result = await snapshotStorageSource({ outDir });
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
