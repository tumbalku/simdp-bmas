import type { EmployeeProfilePdfData } from "./profile-pdf";

type RenderEmployeeProfilePdfHtmlOptions = {
  includeProfile: boolean;
};

function escapeHtml(value: string | null | undefined) {
  return String(value ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(date);
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "PG"
  );
}

function formatTmt(data: EmployeeProfilePdfData["employee"]) {
  if (!data.hasTmt || !data.tmtStartDate) return null;
  if (data.tmtEndDate) {
    return {
      label: "Masa Kontrak",
      value: `${formatDate(data.tmtStartDate)} s.d. ${formatDate(data.tmtEndDate)}`,
    };
  }
  return { label: "TMT Awal CPNS", value: formatDate(data.tmtStartDate) };
}

function badgeTone(value: string) {
  const normalized = value.toLowerCase();
  if (/(aktif|berlaku|valid|selesai|disetujui|approved|lengkap)/.test(normalized)) return "success";
  if (/(kedaluwarsa|kadaluarsa|expired|ditolak|nonaktif|invalid)/.test(normalized)) return "danger";
  if (/(pending|proses|menunggu|diajukan)/.test(normalized)) return "warning";
  return "info";
}

function infoCard(label: string, value: string | null | undefined, wide = false) {
  return `
    <article class="info-card${wide ? " wide" : ""}">
      <div class="info-label">${escapeHtml(label)}</div>
      <div class="info-value">${escapeHtml(value)}</div>
    </article>
  `;
}

function sectionCard(number: string, label: string, title: string, rows: string[]) {
  return `
    <section class="section-card">
      <div class="section-header">
        <div class="section-number">${escapeHtml(number)}</div>
        <div>
          <div class="section-label">${escapeHtml(label)}</div>
          <h3 class="section-title">${escapeHtml(title)}</h3>
        </div>
      </div>
      <div class="info-grid">${rows.join("")}</div>
    </section>
  `;
}

export function renderEmployeeProfilePdfHtml(
  data: EmployeeProfilePdfData,
  options: RenderEmployeeProfilePdfHtmlOptions
) {
  const generatedAt = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date());
  const tmt = formatTmt(data.employee);
  const identity = data.employee.employeeId || data.employee.nik || data.employee.id;
  const photo = data.employee.avatarUrl
    ? `<img src="${escapeHtml(data.employee.avatarUrl)}" alt="Foto pegawai" />`
    : `${escapeHtml(getInitials(data.employee.name))}`;

  const badges = [
    data.employee.status,
    data.employee.employmentStatus,
    data.employee.employeeRank,
  ]
    .filter(Boolean)
    .map((badge) => `<span class="badge badge-${badgeTone(badge || "")}">${escapeHtml(badge)}</span>`)
    .join("");

  const profileSections = options.includeProfile
    ? [
        sectionCard("01", "Identitas", "Identitas Utama", [
          infoCard("Nama Lengkap", data.employee.name),
          infoCard("NIP / NIPTT", data.employee.employeeId),
          infoCard("NIK", data.employee.nik),
          infoCard("Tempat, Tanggal Lahir", `${data.employee.birthPlace || "-"}, ${formatDate(data.employee.birthDate)}`),
          infoCard("Jenis Kelamin", data.employee.gender),
          infoCard("Status Pegawai", data.employee.status),
          infoCard("Alamat Lengkap", data.employee.address, true),
        ]),
        sectionCard("02", "Detail Profil", "Informasi Kepegawaian", [
          infoCard("Status Kepegawaian", data.employee.employmentStatus),
          infoCard("Kelompok Pegawai", data.employee.employeeGroup),
          infoCard("Jabatan", data.employee.employeePosition),
          infoCard("Pangkat / Golongan", data.employee.employeeRank),
          infoCard("Unit Kerja", data.employee.workplace),
          infoCard("Mulai Bekerja", formatDate(data.employee.joinDate)),
          tmt ? infoCard(tmt.label, tmt.value) : "",
        ]),
        sectionCard("03", "Detail Profil", "Kontak & Data Pribadi", [
          infoCard("Email", data.employee.email),
          infoCard("Telepon", data.employee.phone),
          infoCard("Pendidikan Terakhir", data.employee.lastEducation),
          infoCard("Gelar Akademik", data.employee.academicDegree),
          infoCard("Agama", data.employee.religion),
          infoCard("Status Pernikahan", data.employee.maritalStatus),
        ]),
      ].join("")
    : "";

  const documentsHtml = data.documents.length
    ? data.documents
        .map(
          (document) => `
            <article class="document-item">
              <div>
                <div class="document-name">${escapeHtml(document.documentTypeName)}</div>
                <div class="document-meta">Jenis Dokumen</div>
              </div>
              <div>
                <div class="document-number">${escapeHtml(document.documentNumber || "Nomor dokumen belum diisi")}</div>
                <div class="document-meta">Nomor Dokumen • Diunggah ${escapeHtml(formatDate(document.uploadedAt))}</div>
              </div>
              <div class="document-side">
                <span class="badge badge-muted">${escapeHtml(document.archiveCategoryLabel)}</span>
                <span class="badge badge-${badgeTone(document.statusLabel)}">${escapeHtml(document.statusLabel)}</span>
              </div>
            </article>
          `
        )
        .join("")
    : `<div class="empty-state">Tidak ada metadata dokumen sesuai opsi yang dipilih.</div>`;

  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Profil Pegawai - ${escapeHtml(data.employee.name)}</title>
  <style>
    :root {
      --ink: #111827;
      --muted: #64748b;
      --soft: #f8fafc;
      --panel: #ffffff;
      --line: #dbe3ef;
      --navy: #0f2742;
      --blue: #2563eb;
      --blue-soft: #eff6ff;
      --teal: #0f766e;
      --teal-soft: #ecfdf5;
      --amber: #92400e;
      --amber-soft: #fffbeb;
      --red: #991b1b;
      --red-soft: #fef2f2;
    }

    * { box-sizing: border-box; }
    html, body { margin: 0; color: var(--ink); font-family: Arial, Helvetica, sans-serif; background: white; }
    body { font-size: 10px; line-height: 1.42; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { width: 100%; }

    .doc-header {
      position: relative;
      overflow: hidden;
      min-height: 96px;
      margin-bottom: 14px;
      padding: 18px 22px;
      border-radius: 14px;
      color: white;
      background: linear-gradient(135deg, #0f2742 0%, #12385f 66%, #0f766e 100%);
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .doc-header::after {
      content: "";
      position: absolute;
      right: -46px;
      top: -82px;
      width: 190px;
      height: 190px;
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 999px;
    }
    .brand { display: flex; align-items: center; gap: 12px; position: relative; z-index: 1; }
    .brand-mark {
      width: 44px;
      height: 44px;
      display: grid;
      place-items: center;
      border-radius: 12px;
      background: white;
      color: var(--teal);
      font-size: 22px;
      font-weight: 900;
    }
    .brand-title { margin: 0; font-size: 13px; font-weight: 900; }
    .brand-subtitle { margin-top: 3px; color: #dbeafe; font-size: 8.5px; }
    .doc-kicker {
      position: absolute;
      right: 22px;
      top: 22px;
      z-index: 1;
      text-align: right;
      color: #bfdbfe;
      font-size: 7.5px;
      font-weight: 800;
      text-transform: uppercase;
    }
    .doc-kicker strong { display: block; margin-bottom: 3px; color: white; font-size: 11px; }

    .hero {
      display: grid;
      grid-template-columns: 96px 1fr;
      gap: 18px;
      align-items: center;
      margin-bottom: 14px;
      padding: 14px;
      border: 1px solid var(--line);
      border-radius: 15px;
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .photo {
      width: 96px;
      height: 118px;
      overflow: hidden;
      display: grid;
      place-items: center;
      border: 1px solid #bfdbfe;
      border-radius: 15px;
      background: var(--blue-soft);
      color: var(--muted);
      font-size: 18px;
      font-weight: 900;
      text-align: center;
      letter-spacing: -.04em;
    }
    .photo img { width: 100%; height: 100%; object-fit: cover; }
    .hero-label { color: var(--teal); font-size: 7.5px; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; }
    .employee-name { margin: 4px 0 2px; color: var(--navy); font-size: 20px; line-height: 1.08; font-weight: 900; }
    .employee-id { color: var(--muted); font-size: 9px; }
    .hero-copy { max-width: 440px; margin: 8px 0 10px; color: #475569; font-size: 8.5px; line-height: 1.55; }
    .badges { display: flex; flex-wrap: wrap; gap: 6px; }
    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 19px;
      max-width: 170px;
      padding: 3px 8px;
      border: 1px solid #bfdbfe;
      border-radius: 999px;
      color: #1d4ed8;
      background: var(--blue-soft);
      font-size: 7.2px;
      font-weight: 900;
      white-space: normal;
    }
    .badge-success { color: #166534; background: var(--teal-soft); border-color: #bbf7d0; }
    .badge-danger { color: var(--red); background: var(--red-soft); border-color: #fecaca; }
    .badge-warning { color: var(--amber); background: var(--amber-soft); border-color: #fde68a; }
    .badge-info, .badge-muted { color: #1d4ed8; background: var(--blue-soft); border-color: #bfdbfe; }
    .badge-muted { color: #475569; background: #f1f5f9; border-color: #dbe3ef; }

    .section-card {
      margin-top: 12px;
      padding: 13px;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: var(--panel);
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; break-after: avoid; }
    .section-number {
      display: grid;
      place-items: center;
      width: 27px;
      height: 27px;
      flex-shrink: 0;
      border-radius: 8px;
      background: var(--teal);
      color: white;
      font-size: 10px;
      font-weight: 900;
    }
    .section-label { color: var(--teal); font-size: 7.5px; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; }
    .section-title { margin: 2px 0 0; color: var(--navy); font-size: 13px; line-height: 1.15; font-weight: 900; }
    .info-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; }
    .info-card {
      min-height: 45px;
      padding: 8px 9px;
      border: 1px solid var(--line);
      border-radius: 9px;
      background: var(--soft);
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .info-card.wide { grid-column: span 2; }
    .info-label { margin-bottom: 4px; color: var(--muted); font-size: 7px; font-weight: 900; text-transform: uppercase; letter-spacing: .03em; }
    .info-value { color: var(--ink); font-size: 9px; font-weight: 800; overflow-wrap: anywhere; }

    .document-section { page-break-before: always; break-before: page; break-inside: auto; page-break-inside: auto; }
    .document-list { display: grid; gap: 7px; }
    .document-item {
      display: grid;
      grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr) 140px;
      gap: 10px;
      align-items: center;
      padding: 9px 10px;
      border: 1px solid var(--line);
      border-radius: 10px;
      background: white;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .document-name, .document-number { color: var(--ink); font-size: 9px; font-weight: 900; overflow-wrap: anywhere; }
    .document-number { font-weight: 800; }
    .document-meta { margin-top: 3px; color: var(--muted); font-size: 6.8px; text-transform: uppercase; letter-spacing: .03em; }
    .document-side { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 5px; }
    .print-note {
      margin-top: 10px;
      padding: 8px 10px;
      border-left: 3px solid var(--teal);
      border-radius: 0 8px 8px 0;
      color: #475569;
      background: var(--soft);
      font-size: 7.8px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .empty-state { border: 1px dashed #cbd5e1; border-radius: 10px; padding: 15px; text-align: center; color: var(--muted); background: var(--soft); }
    .footer-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 14px;
      padding-top: 7px;
      border-top: 1px solid var(--line);
      font-size: 7.5px;
      color: var(--muted);
    }
    .footer-right { color: var(--navy); font-weight: 800; }
    @page { size: A4; margin: 13mm 14mm; }
    @media print {
      body { background: white; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .section-card, .info-card, .document-item, .hero, .doc-header { break-inside: avoid; page-break-inside: avoid; }
      .document-section { page-break-before: always; break-before: page; }
    }
  </style>
</head>
<body>
  <main class="page">
    <header class="doc-header">
      <div class="brand">
        <div class="brand-mark">S</div>
        <div>
          <h1 class="brand-title">SiCantIK</h1>
          <div class="brand-subtitle">Sistem Pencatatan Informasi Kepegawaian RSUD Bahteramas</div>
        </div>
      </div>
      <div class="doc-kicker">
        <strong>Profil Pegawai</strong>
        Dokumen Internal
      </div>
    </header>

    <section class="hero">
      <div class="photo">${photo}</div>
      <div>
        <div class="hero-label">Preview Profil Pegawai</div>
        <h2 class="employee-name">${escapeHtml(data.employee.name)}</h2>
        <div class="employee-id">NIP ${escapeHtml(identity)}</div>
        <p class="hero-copy">Ringkasan profil, biodata, informasi kepegawaian, dan arsip dokumen relevan untuk kebutuhan administrasi HR.</p>
        <div class="badges">${badges}</div>
      </div>
    </section>

    ${profileSections}

    <section class="section-card document-section">
      <div class="section-header">
        <div class="section-number">04</div>
        <div>
          <div class="section-label">Dokumen</div>
          <h3 class="section-title">Arsip Kepegawaian</h3>
        </div>
      </div>
      <div class="document-list">${documentsHtml}</div>
      <div class="print-note">Metadata dokumen hanya berisi ringkasan arsip. File asli tidak disertakan dalam export PDF ini.</div>
    </section>

    <div class="footer-bar">
      <span>Dicetak ${escapeHtml(generatedAt)}</span>
      <div class="footer-right">Dokumen SiCantIK</div>
    </div>
  </main>
</body>
</html>`;
}
