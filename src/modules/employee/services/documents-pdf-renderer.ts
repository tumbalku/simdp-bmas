import fs from "fs";
import path from "path";

import type { IssuedDocumentVerification } from "@/modules/document-verification/server";

import type { EmployeeProfilePdfData } from "./profile-pdf";

type RenderEmployeeDocumentsPdfHtmlOptions = {
  verification: IssuedDocumentVerification;
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

function formatEmploymentType(employee: EmployeeProfilePdfData["employee"]) {
  if (employee.employeeGroup && employee.employmentStatus) {
    return `${employee.employeeGroup}/${employee.employmentStatus}`;
  }

  return employee.employeeGroup || employee.employmentStatus || "-";
}

function renderEmployeeDetails(data: EmployeeProfilePdfData) {
  const employee = data.employee;
  const details = [
    ["Nama", employee.name],
    ["NIP", employee.employeeId],
    ["NIK", employee.nik],
    ["Pangkat/Golongan", employee.employeeRank],
    ["Jabatan", employee.employeePosition],
    ["Status/Jenis Kepegawaian", formatEmploymentType(employee)],
    ["Unit Kerja", employee.workplace],
  ];

  return details
    .map(
      ([label, value]) => `
        <div class="detail-row">
          <div class="detail-label">${escapeHtml(label)}</div>
          <div class="detail-separator">:</div>
          <div class="detail-value">${escapeHtml(value)}</div>
        </div>
      `,
    )
    .join("");
}

function renderDocumentRows(data: EmployeeProfilePdfData) {
  const documents = data.documents;

  if (documents.length === 0) {
    return `
      <tr>
        <td class="empty-cell" colspan="7">Belum ada dokumen pegawai yang tersimpan di sistem.</td>
      </tr>
    `;
  }

  return documents
    .map(
      (document, index) => `
        <tr>
          <td class="col-no">${index + 1}</td>
          <td class="col-code">${escapeHtml(document.documentTypeCode)}</td>
          <td class="col-type">${escapeHtml(document.documentTypeName)}</td>
          <td class="col-number">${escapeHtml(document.documentNumber)}</td>
          <td class="col-date">${escapeHtml(formatDate(document.uploadedAt))}</td>
          <td class="col-date">${escapeHtml(formatDate(document.expiryDate))}</td>
          <td class="col-status">${escapeHtml(document.statusLabel)}</td>
        </tr>
      `,
    )
    .join("");
}

export function renderEmployeeDocumentsPdfHtml(
  data: EmployeeProfilePdfData,
  options: RenderEmployeeDocumentsPdfHtmlOptions,
) {
  const generatedAt = new Date().toISOString();
  const printedAt = formatPrintedAt(generatedAt);
  const letterheadLogo = getLetterheadLogoDataUrl();

  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Laporan Dokumen</title>
  <style>
    :root {
      --ink: #111111;
      --muted: #334155;
      --line: #111111;
      --soft-line: #3f3f46;
    }

    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      color: var(--ink);
      background: #ffffff;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10px;
      line-height: 1.22;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: 100%;
      min-height: calc(297mm - 18mm);
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
      margin: 0 0 12px;
      border-top: 2px solid var(--line);
      border-bottom: 1px solid var(--line);
    }
    .title {
      margin: 0 0 14px;
      text-align: center;
      font-size: 16px;
      font-weight: 900;
      letter-spacing: .01em;
      text-transform: uppercase;
    }
    .employee-details {
      display: grid;
      grid-template-columns: 1fr;
      row-gap: 4px;
      margin-bottom: 14px;
      font-size: 10px;
    }
    .detail-row {
      display: grid;
      grid-template-columns: 150px 8px 1fr;
      gap: 4px;
      min-width: 0;
    }
    .detail-label {
      color: var(--muted);
      font-weight: 700;
    }
    .detail-separator { font-weight: 700; }
    .detail-value {
      min-width: 0;
      font-weight: 700;
      overflow-wrap: anywhere;
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
      border: .75px solid var(--soft-line);
      padding: 5px 4px;
      vertical-align: middle;
      overflow-wrap: anywhere;
    }
    th {
      height: 30px;
      text-align: center;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 8.5px;
      font-weight: 800;
      text-transform: uppercase;
      white-space: nowrap;
    }
    td {
      min-height: 22px;
      font-size: 8.5px;
      font-weight: 500;
    }
    tbody tr:nth-child(even) td { background: #f8fafc; }
    .col-no { text-align: center; font-size: 8.5px; }
    .col-code,
    .col-type,
    .col-date,
    .col-status {
      text-align: center;
      font-size: 8.5px;
      line-height: 1.2;
      white-space: nowrap;
      overflow-wrap: normal;
      word-break: normal;
    }
    .col-number {
      font-size: 8.5px;
      line-height: 1.2;
      text-align: center;
    }
    .empty-cell {
      height: 56px;
      text-align: center;
      color: #64748b;
      font-style: italic;
    }
    .verification-row {
      display: grid;
      grid-template-columns: 72px 1fr;
      gap: 10px;
      align-items: center;
      margin-top: 14px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .verification-row img {
      width: 72px;
      height: 72px;
      display: block;
    }
    .verification-label {
      color: #0f766e;
      font-size: 7px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: .04em;
    }
    .verification-title {
      margin-top: 3px;
      color: #0f172a;
      font-size: 8.4px;
      font-weight: 900;
    }
    .verification-url {
      margin-top: 5px;
      color: #475569;
      font-size: 6.6px;
      overflow-wrap: anywhere;
    }
    .verification-note {
      margin-top: 5px;
      color: #64748b;
      font-size: 7px;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      margin-top: auto;
      padding-top: 8px;
      border-top: 1px solid #cbd5e1;
      color: #64748b;
      font-size: 7px;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    @page { size: A4 portrait; margin: 8mm 7mm; }
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

    <h1 class="title">Laporan Dokumen</h1>

    <section class="employee-details">${renderEmployeeDetails(data)}</section>

    <table>
      <colgroup>
        <col style="width: 4%" />
        <col style="width: 9%" />
        <col style="width: 22%" />
        <col style="width: 25%" />
        <col style="width: 10%" />
        <col style="width: 19%" />
        <col style="width: 11%" />
      </colgroup>
      <thead>
        <tr>
          <th>No</th>
          <th>Kode</th>
          <th>Nama Dokumen</th>
          <th>Nomor Dokumen</th>
          <th>Diunggah</th>
          <th>Masa Berakhir</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${renderDocumentRows(data)}</tbody>
    </table>

    <section class="verification-row">
      <img src="${escapeHtml(options.verification.qrCodeDataUrl)}" alt="QR Code verifikasi laporan dokumen" />
      <div>
        <div class="verification-label">Verifikasi Laporan</div>
        <div class="verification-title">Scan QR untuk mengecek keaslian PDF laporan dokumen ini.</div>
        <div class="verification-url">${escapeHtml(options.verification.verifyUrl)}</div>
        <div class="verification-note">Halaman verifikasi menampilkan status validasi, subjek dokumen, tanggal terbit, dan hash file PDF.</div>
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
