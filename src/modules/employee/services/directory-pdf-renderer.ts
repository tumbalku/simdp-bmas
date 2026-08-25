import fs from "fs";
import path from "path";

import type { IssuedDocumentVerification } from "@/modules/document-verification/server";

import type { EmployeeDirectoryPdfData, EmployeeDirectoryPdfRow } from "./directory-pdf";

export type PdfPaperSize = "A4" | "F4" | "LEGAL" | "LETTER" | "A3";
export type PdfOrientation = "landscape" | "portrait";

type RenderEmployeeDirectoryPdfHtmlOptions = {
  verification?: IssuedDocumentVerification | null;
  paperSize?: PdfPaperSize;
  orientation?: PdfOrientation;
  includeSignature?: boolean;
  official?: {
    name: string;
    position: string;
    rank: string;
    nip: string;
  };
};

function escapeHtml(value: string | number | null | undefined) {
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

function formatBirthHtml(row: EmployeeDirectoryPdfRow) {
  const place = row.birthPlace || "-";
  const date = formatDate(row.birthDate);
  if (place === "-" && date === "-") return "-";
  if (place === "-") return escapeHtml(date);
  if (date === "-") return `${escapeHtml(place)},`;
  return `${escapeHtml(place)},<br />${escapeHtml(date)}`;
}

function formatStatus(row: EmployeeDirectoryPdfRow) {
  if (row.employeeGroup && row.employmentStatus) return `${row.employeeGroup}/${row.employmentStatus}`;
  return row.employeeGroup || row.employmentStatus || "-";
}

function formatPrintedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Dicetak: -";
  const day = new Intl.DateTimeFormat("id-ID", { day: "numeric" }).format(date);
  const monthYear = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(date);
  const time = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(".", ":");

  return `Dicetak: ${day} ${monthYear} pukul ${time}`;
}

function formatPeriodDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const day = new Intl.DateTimeFormat("id-ID", { day: "numeric" }).format(date);
  const monthYear = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(date);
  return `${day} ${monthYear}`;
}

function getLetterheadLogoDataUrl() {
  const logoPath = path.join(process.cwd(), "public", "images", "logo-anoa-sultra.png");
  const buffer = fs.readFileSync(logoPath);
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

function formatTmtHtml(tmt: string | null) {
  if (!tmt) return "-";
  if (tmt.includes(" s.d. ")) {
    const parts = tmt.split(" s.d. ");
    return `${escapeHtml(parts[0])}<br />s.d<br />${escapeHtml(parts[1])}`;
  }
  return escapeHtml(tmt);
}

function renderRows(rows: EmployeeDirectoryPdfRow[]) {
  if (rows.length === 0) {
    return `
      <tr>
        <td class="empty-cell" colspan="12">Tidak ada data pegawai yang sesuai dengan query pencarian.</td>
      </tr>
    `;
  }

  return rows
    .map(
      (row) => `
        <tr>
          <td class="col-no">${escapeHtml(row.no)}</td>
          <td class="col-name">${escapeHtml(row.name)}</td>
          <td class="col-nip">${escapeHtml(row.employeeId)}</td>
          <td class="col-nik">${escapeHtml(row.nik)}</td>
          <td class="col-rank">${escapeHtml(row.rank)}</td>
          <td class="col-position">${escapeHtml(row.position)}</td>
          <td class="col-workplace">${escapeHtml(row.workplace)}</td>
          <td class="col-birth">${formatBirthHtml(row)}</td>
          <td class="col-education">${escapeHtml(row.lastEducation)}</td>
          <td class="col-status">${escapeHtml(formatStatus(row))}</td>
          <td class="col-tmt">${formatTmtHtml(row.tmt)}</td>
          <td class="col-gender">${escapeHtml(row.gender)}</td>
        </tr>
      `,
    )
    .join("");
}

function getPageCssSize(paperSize: PdfPaperSize = "A4", orientation: PdfOrientation = "landscape") {
  const isLandscape = orientation === "landscape";
  switch (paperSize) {
    case "F4":
      return isLandscape ? "330mm 215mm" : "215mm 330mm";
    case "LEGAL":
      return isLandscape ? "355.6mm 215.9mm" : "215.9mm 355.6mm";
    case "LETTER":
      return isLandscape ? "279.4mm 215.9mm" : "215.9mm 279.4mm";
    case "A3":
      return `A3 ${orientation}`;
    case "A4":
    default:
      return `A4 ${orientation}`;
  }
}

export function renderEmployeeDirectoryPdfHtml(
  data: EmployeeDirectoryPdfData,
  options: RenderEmployeeDirectoryPdfHtmlOptions,
) {
  const printedAt = formatPrintedAt(data.generatedAt);
  const periodDate = formatPeriodDate(data.generatedAt);
  const currentMonth = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date(data.generatedAt));
  const letterheadLogo = getLetterheadLogoDataUrl();

  const paperSize = options.paperSize ?? "A4";
  const orientation = options.orientation ?? "landscape";
  const includeSignature = options.includeSignature ?? true;
  const pageCss = getPageCssSize(paperSize, orientation);

  const signatureHtml =
    includeSignature && options.official
      ? `
      <div class="signature">
        <div>Mengetahui,</div>
        <div>Kendari&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${escapeHtml(currentMonth)}</div>
        <div>${escapeHtml(options.official.position)},</div>
        <div class="name">${escapeHtml(options.official.name)}</div>
        <div>${escapeHtml(options.official.rank)}</div>
        <div>NIP. ${escapeHtml(options.official.nip)}</div>
      </div>
    `
      : "";

  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(data.title)}</title>
  <style>
    :root {
      --ink: #111111;
      --muted: #334155;
      --line: #111111;
      --soft-line: #3f3f46;
      --teal: #0f766e;
    }

    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      color: var(--ink);
      background: #ffffff;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10px;
      line-height: 1.25;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: 100%;
      min-height: calc(210mm - 14mm);
      display: flex;
      flex-direction: column;
    }
    .letterhead {
      display: grid;
      grid-template-columns: 126px 1fr 126px;
      align-items: center;
      gap: 16px;
      margin-bottom: 6px;
    }
    .seal-wrap { display: flex; justify-content: center; }
    .letterhead-logo {
      width: 88px;
      height: 82px;
      object-fit: contain;
      display: block;
    }
    .head-copy { text-align: center; }
    .head-copy .province {
      font-size: 15px;
      font-weight: 800;
      letter-spacing: .01em;
    }
    .head-copy .hospital {
      margin-top: 0;
      font-size: 17px;
      font-weight: 900;
      letter-spacing: .01em;
    }
    .head-copy .address {
      margin-top: 0;
      color: #1f2937;
      font-size: 9.5px;
      font-weight: 500;
    }
    .head-copy .contact {
      margin-top: 0;
      font-size: 9.5px;
      font-weight: 700;
      text-decoration: underline;
    }
    .head-rule {
      height: 3px;
      margin: 0 0 9px;
      border-top: 2px solid var(--line);
      border-bottom: 1px solid var(--line);
    }
    .title-block {
      margin: 0 0 10px;
      text-align: center;
    }
    .title {
      margin: 0;
      text-align: center;
      font-size: 16px;
      font-weight: 900;
      letter-spacing: .01em;
      text-transform: uppercase;
    }
    .subtitle {
      margin-top: 3px;
      text-align: center;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .01em;
    }
    table {
      width: 99.8%;
      margin: 0 auto;
      border-collapse: collapse;
      table-layout: fixed;
      border: 1.6px solid var(--line);
    }
    thead { display: table-header-group; }
    tr { break-inside: avoid; page-break-inside: avoid; }
    th, td {
      border: 1px solid var(--soft-line);
      padding: 5px 4px;
      vertical-align: middle;
      overflow-wrap: break-word;
      word-break: break-word;
    }
    th {
      height: auto;
      min-height: 28px;
      text-align: center;
      font-family: "Times New Roman", Times, serif;
      font-size: 9px;
      font-weight: 900;
      text-transform: uppercase;
      vertical-align: middle;
    }
    td {
      min-height: 20px;
      font-size: 8.5px;
      font-weight: 500;
      text-align: center;
    }
    tbody tr:nth-child(even) td { background: #f8fafc; }
    .col-no { 
      width: 25px; 
      text-align: center;
      white-space: nowrap;
    }
    .col-name { 
      font-weight: 700;
      text-align: left;
      white-space: normal;
      overflow-wrap: break-word;
      word-break: break-word;
    }
    .col-nip {
      font-size: 8.5px;
      line-height: 1.08;
      white-space: nowrap;
      text-align: center;
    }
    .col-nik {
      font-size: 8.5px;
      line-height: 1.08;
      white-space: nowrap;
      text-align: center;
    }
    .col-rank {
      font-size: 8.5px;
      text-align: left;
      white-space: normal;
      overflow-wrap: break-word;
      word-break: break-word;
    }
    .col-position {
      font-size: 8.5px;
      text-align: left;
      white-space: normal;
      overflow-wrap: break-word;
      word-break: break-word;
    }
    .col-workplace {
      font-size: 8.5px;
      text-align: left;
      white-space: normal;
      overflow-wrap: break-word;
      word-break: break-word;
    }
    .col-birth {
      font-size: 8px;
      line-height: 1.15;
      white-space: normal;
      overflow-wrap: break-word;
      word-break: break-word;
    }
    .col-education {
      font-size: 8.5px;
      white-space: normal;
      overflow-wrap: break-word;
      word-break: break-word;
    }
    .col-status {
      font-size: 8px;
      line-height: 1.15;
      white-space: normal;
      overflow-wrap: break-word;
      word-break: break-word;
    }
    .col-tmt {
      font-size: 8px;
      line-height: 1.12;
      white-space: nowrap;
      text-align: center;
    }
    .col-gender {
      font-size: 8.5px;
      white-space: nowrap;
      text-align: center;
    }
    .compact-header {
      padding: 3px 2px;
      font-size: 8.5px;
      line-height: 1.05;
    }
    .compact-header span {
      display: block;
    }

    .signature-row {
      margin-top: 14px;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .verification-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 6px;
    }
    .verification-card img {
      width: 64px;
      height: 64px;
      object-fit: contain;
    }
    .verification-label {
      font-size: 8.5px;
      font-weight: 800;
      color: #111111;
      text-transform: uppercase;
      letter-spacing: .02em;
      text-align: center;
    }
    .signature {
      width: 260px;
      font-size: 9.5px;
      line-height: 1.3;
    }
    .signature .name {
      margin-top: 46px;
      font-weight: 800;
      text-decoration: underline;
    }
    .empty-cell {
      padding: 16px;
      font-style: italic;
      color: #64748b;
    }
    .footer {
      margin-top: 10px;
      display: flex;
      justify-content: space-between;
      margin-top: 0;
      padding-top: 6px;
      border-top: 1px solid #cbd5e1;
      color: #64748b;
      font-size: 7px;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    @page { size: ${pageCss}; margin: 7mm 8mm; }
  </style>
</head>
<body>
  <main class="page">
    <header class="letterhead">
      <div class="seal-wrap"><img class="letterhead-logo" src="${letterheadLogo}" alt="Logo Sulawesi Tenggara" /></div>
      <div class="head-copy">
        <div class="province">PEMERINTAH PROVINSI SULAWESI TENGGARA</div>
        <div class="hospital">RUMAH SAKIT UMUM DAERAH BAHTERAMAS</div>
        <div class="address">Jalan Kapten Piere Tendean No. 50 Telp. (0401) 3195611 Baruga Kendari</div>
        <div class="contact">Email : admin@rsud-bahteramas.go.id&nbsp;&nbsp; Website : www.rsud-bahteramas.go.id</div>
      </div>
      <div></div>
    </header>
    <div class="head-rule"></div>

    <div class="title-block">
      <h1 class="title">Laporan Kepegawaian</h1>
      <div class="subtitle">Periode ${escapeHtml(periodDate)}</div>
    </div>

    <table>
      <colgroup>
        <col style="width: 2.2%" />
        <col style="width: 12.8%" />
        <col style="width: 9.5%" />
        <col style="width: 8.5%" />
        <col style="width: 9.5%" />
        <col style="width: 10.5%" />
        <col style="width: 9.5%" />
        <col style="width: 7%" />
        <col style="width: 9%" />
        <col style="width: 9%" />
        <col style="width: 6.2%" />
        <col style="width: 6.3%" />
      </colgroup>
      <thead>
        <tr>
          <th>No</th>
          <th>Nama</th>
          <th>NIP</th>
          <th>NIK</th>
          <th>Pangkat / Golongan</th>
          <th>Jabatan</th>
          <th>Unit Kerja</th>
          <th>Tempat/Tgl Lahir</th>
          <th>Pendidikan Terakhir</th>
          <th class="compact-header"><span>Status/Jenis</span><span>Pegawai</span></th>
          <th>TMT</th>
          <th class="compact-header"><span>Jenis</span><span>Kelamin</span></th>
        </tr>
      </thead>
      <tbody>${renderRows(data.rows)}</tbody>
    </table>

    <section class="signature-row">
      ${
        options.verification
          ? `
      <div class="verification-card">
        <div class="verification-label">Verifikasi Laporan</div>
        <img src="${escapeHtml(options.verification.qrCodeDataUrl)}" alt="QR Code verifikasi laporan" />
      </div>
      `
          : `<div></div>`
      }
      ${signatureHtml}
    </section>

    <footer class="footer">
      <span>${escapeHtml(printedAt)}</span>
      <span>Dokumen SiCantIK</span>
    </footer>
  </main>
</body>
</html>`;
}
