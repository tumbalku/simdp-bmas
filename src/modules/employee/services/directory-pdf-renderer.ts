import fs from "fs";
import path from "path";

import type { IssuedDocumentVerification } from "@/modules/document-verification/server";

import type { EmployeeDirectoryPdfData, EmployeeDirectoryPdfRow } from "./directory-pdf";

type RenderEmployeeDirectoryPdfHtmlOptions = {
  verification: IssuedDocumentVerification;
  director: {
    name: string;
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

function formatBirth(row: EmployeeDirectoryPdfRow) {
  const place = row.birthPlace || "-";
  const date = formatDate(row.birthDate);
  return `${place}, ${date}`;
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

function getLetterheadLogoDataUrl() {
  const logoPath = path.join(process.cwd(), "public", "images", "logo-anoa-sultra.png");
  const buffer = fs.readFileSync(logoPath);
  return `data:image/png;base64,${buffer.toString("base64")}`;
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
          <td>${escapeHtml(row.rank)}</td>
          <td>${escapeHtml(row.position)}</td>
          <td>${escapeHtml(row.workplace)}</td>
          <td>${escapeHtml(formatBirth(row))}</td>
          <td class="col-education">${escapeHtml(row.lastEducation)}</td>
          <td>${escapeHtml(formatStatus(row))}</td>
          <td class="col-tmt">${escapeHtml(row.tmt)}</td>
          <td class="col-gender">${escapeHtml(row.gender)}</td>
        </tr>
      `,
    )
    .join("");
}

export function renderEmployeeDirectoryPdfHtml(
  data: EmployeeDirectoryPdfData,
  options: RenderEmployeeDirectoryPdfHtmlOptions,
) {
  const printedAt = formatPrintedAt(data.generatedAt);
  const currentMonth = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date(data.generatedAt));
  const letterheadLogo = getLetterheadLogoDataUrl();

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
      color: var(--ink);
      background: #ffffff;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 8.4px;
      line-height: 1.14;
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
      margin-top: 4px;
      font-size: 17px;
      font-weight: 900;
      letter-spacing: .01em;
    }
    .head-copy .address {
      margin-top: 4px;
      color: #1f2937;
      font-size: 9.5px;
      font-weight: 500;
    }
    .head-copy .contact {
      margin-top: 4px;
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
    .title {
      margin: 0 0 8px;
      text-align: center;
      font-size: 16px;
      font-weight: 900;
      letter-spacing: .01em;
      text-transform: uppercase;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      border: 1.6px solid var(--line);
    }
    thead { display: table-header-group; }
    tr { break-inside: avoid; page-break-inside: avoid; }
    th, td {
      border: .75px solid var(--soft-line);
      padding: 3px 3px;
      vertical-align: middle;
      overflow-wrap: anywhere;
    }
    th {
      height: 29px;
      text-align: center;
      font-family: "Times New Roman", Times, serif;
      font-size: 7.5px;
      font-weight: 900;
      text-transform: uppercase;
    }
    td {
      min-height: 18px;
      font-size: 7px;
      font-weight: 500;
    }
    tbody tr:nth-child(even) td { background: #f8fafc; }
    .col-no { width: 25px; text-align: center; }
    .col-name { font-weight: 700; }
    .col-nip,
    .col-nik {
      font-size: 6.2px;
      line-height: 1.08;
    }
    .col-gender {
      font-size: 6.4px;
      line-height: 1.08;
      text-align: center;
    }
    .col-education {
      white-space: nowrap;
      overflow-wrap: normal;
      word-break: normal;
      font-size: 6.4px;
      text-align: center;
    }
    .col-tmt {
      white-space: nowrap;
      overflow-wrap: normal;
      word-break: normal;
      font-size: 5.8px;
      text-align: center;
    }
    .compact-header {
      line-height: 1.08;
    }
    .compact-header span {
      display: block;
    }
    .empty-cell {
      height: 54px;
      text-align: center;
      color: #64748b;
      font-style: italic;
    }
    .signature-row {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 24px;
      margin-top: auto;
      padding-top: 20px;
      padding-bottom: 18px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .verification-card {
      display: grid;
      grid-template-columns: 66px 1fr;
      gap: 9px;
      align-items: center;
      padding: 0;
    }
    .verification-card img {
      width: 66px;
      height: 66px;
      display: block;
    }
    .verification-label {
      color: var(--teal);
      font-size: 7px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: .04em;
    }
    .verification-title {
      margin-top: 3px;
      color: #0f172a;
      font-size: 8px;
      font-weight: 900;
    }
    .verification-code {
      margin-top: 5px;
      color: #111827;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 7px;
      font-weight: 900;
      overflow-wrap: anywhere;
    }
    .verification-url {
      margin-top: 2px;
      color: #475569;
      font-size: 6.2px;
      overflow-wrap: anywhere;
    }
    .signature {
      font-size: 9px;
      line-height: 1.28;
    }
    .signature .name {
      margin-top: 42px;
      font-weight: 900;
      text-decoration: underline;
    }
    .footer {
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

    @page { size: A4 landscape; margin: 7mm 8mm; }
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

    <h1 class="title">Laporan Kepegawaian</h1>

    <table>
      <colgroup>
        <col style="width: 2.2%" />
        <col style="width: 13.8%" />
        <col style="width: 8.3%" />
        <col style="width: 6.6%" />
        <col style="width: 9.8%" />
        <col style="width: 10.5%" />
        <col style="width: 9%" />
        <col style="width: 8.5%" />
        <col style="width: 7.4%" />
        <col style="width: 9%" />
        <col style="width: 8.2%" />
        <col style="width: 6.7%" />
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
      <div class="verification-card">
        <img src="${escapeHtml(options.verification.qrCodeDataUrl)}" alt="QR Code verifikasi laporan" />
        <div>
          <div class="verification-label">Verifikasi Laporan</div>
          <div class="verification-title">Scan QR untuk mengecek keaslian PDF laporan ini.</div>
          <div class="verification-code">Kode: ${escapeHtml(options.verification.code)}</div>
          <div class="verification-url">${escapeHtml(options.verification.verifyUrl)}</div>
        </div>
      </div>
      <div class="signature">
        <div>Mengetahui,</div>
        <div>Kendari&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${escapeHtml(currentMonth)}</div>
        <div>Direktur,</div>
        <div class="name">${escapeHtml(options.director.name)}</div>
        <div>${escapeHtml(options.director.rank)}</div>
        <div>NIP. ${escapeHtml(options.director.nip)}</div>
      </div>
    </section>

    <footer class="footer">
      <span>${escapeHtml(printedAt)}</span>
      <span>Dokumen SiCantIK</span>
    </footer>
  </main>
</body>
</html>`;
}
