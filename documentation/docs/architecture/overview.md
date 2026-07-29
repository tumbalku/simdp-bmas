---
title: Architecture Overview
---

# Architecture Overview

SIMDP memakai arsitektur modular di atas Next.js App Router. Prinsip utamanya sederhana: UI dan route tidak boleh langsung mengakses database atau storage. Semua perubahan data harus melewati service boundary modul.

## Gambaran sistem

```mermaid
flowchart LR
  User["User Browser"] --> Next["Next.js App Router"]
  Next --> Modules["src/modules/*"]
  Modules --> Prisma["Prisma Client"]
  Prisma --> Postgres["PostgreSQL / Supabase"]
  Modules --> Storage["IStorageProvider"]
  Storage --> Local["Local Uploads"]
  Storage --> Supabase["Supabase Storage"]
  Storage --> S3["S3-compatible"]
  Modules --> Events["Internal Event Bus"]
  Events --> Notification["Notification / Email / Realtime"]
  Scripts["Ops Scripts"] --> Backup["Backup Artifacts"]
  Backup --> Offsite["Google Drive / Folder / Future S3"]
```

## Prinsip desain

1. Modul adalah bounded context.
2. `service.ts` adalah public boundary modul.
3. Repository hanya boleh dipanggil oleh service modul yang sama.
4. Client component tidak boleh melakukan `fetch()` langsung.
5. Semua input eksternal divalidasi dengan Zod.
6. Aksi sensitif wajib menulis `SecurityLog`.
7. Storage dokumen aplikasi dan target backup adalah concern berbeda.
8. `statistics` adalah modul read-only.

## Request flow standar

```mermaid
sequenceDiagram
  participant UI as React Component
  participant Hook as module hooks.ts
  participant API as module api.ts / action
  participant Service as module service.ts
  participant Repo as module repository.ts
  participant DB as PostgreSQL

  UI->>Hook: request data / mutation
  Hook->>API: call module API wrapper
  API->>Service: auth, validation, service call
  Service->>Repo: query or mutation
  Repo->>DB: Prisma
  DB-->>Repo: result
  Repo-->>Service: domain data
  Service-->>API: safe DTO
  API-->>Hook: response
  Hook-->>UI: state
```

## Runtime deployment

SIMDP mendukung beberapa pola deployment:

| Deployment | Database | Storage dokumen | Backup target |
|---|---|---|---|
| Vercel + Supabase | Supabase PostgreSQL | Supabase Storage | Google Drive/offsite job |
| VPS local | PostgreSQL lokal/Docker | Folder local `/uploads` | Folder/NAS lalu offsite |
| Hybrid | Supabase PostgreSQL | Supabase Storage atau local | Local worker/offsite |

`DEPLOYMENT_CONTEXT` dipakai untuk guard konfigurasi agar kombinasi env yang berbahaya gagal cepat.

## Source detail

- `context/architecture/system-overview.md`
- `context/architecture/module-boundaries.md`
- `context/architecture/patterns.md`
- `context/architecture/diagrams/`
