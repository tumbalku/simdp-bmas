import fs from "fs";
import path from "path";

import type { IssuedDocumentVerification } from "@/modules/document-verification/server";

import type {
  MasterDataDocumentsPdfData,
  MasterDataDocumentsPdfRow,
} from "./master-data-pdf";

type RenderMasterDataDocumentsPdfHtmlOptions = {
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
  const logoPath = path.join(
    process.cwd(),
    "public",
    "images",
    "logo-anoa-sultra.png",
  );
  const buffer = fs.readFileSync(logoPath);
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

function renderRows(rows: MasterDataDocumentsPdfRow[]) {
  if (rows.length === 0) {
    return `
      <tr>
        <td class="empty-cell" colspan="10">Tidak ada dokumen yang sesuai dengan filter.</td>
      </tr>
    `;
  }

  return rows
    .map(
      (row) => `
        <tr>
          <td class="col-no">${escapeHtml(row.no)}</td>
          <td class="col-code">${escapeHtml(row.documentTypeCode)}</td>
          <td class="col-name">${escapeHtml(row.ownerName)}</td>
          <td class="col-identity">${escapeHtml(row.ownerEmployeeId)}</td>
          <td class="col-identity">${escapeHtml(row.ownerNik)}</td>
          <td class="col-name-doc">${escapeHtml(row.documentTypeName)}</td>
          <td class="col-number">${escapeHtml(row.documentNumber)}</td>
          <td class="col-employment">${escapeHtml(row.employmentType)}</td>
          <td class="col-date">${escapeHtml(formatDate(row.expiryDate))}</td>
          <td class="col-status">${escapeHtml(row.statusLabel)}</td>
        </tr>
      `,
    )
    .join("");
}

export function renderMasterDataDocumentsPdfHtml(
  data: MasterDataDocumentsPdfData,
  options: RenderMasterDataDocumentsPdfHtmlOptions,
) {
  const letterheadLogo = getLetterheadLogoDataUrl();
  const printedAt = formatPrintedAt(data.generatedAt);

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
    }

    * { box-sizing: border-box; }
    html, body {
      margin: 0;
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
    .title {
      margin: 0 0 12px;
      text-align: center;
      font-size: 16px;
      font-weight: 900;
      letter-spacing: .01em;
      text-transform: uppercase;
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
      height: auto;
      min-height: 28px;
      text-align: center;
      font-family: "Times New Roman", Times, serif;
      font-size: 9px;
      font-weight: 900;
      text-transform: uppercase;
      white-space: normal;
    }
    td {
      min-height: 20px;
      font-size: 8.5px;
      font-weight: 500;
    }
    tbody tr:nth-child(even) td { background: #f8fafc; }
    .col-no { text-align: center; }
    .col-code {
      text-align: center;
      font-size: 8px;
      white-space: nowrap;
    }
    .col-name {
      text-align: left;
      font-size: 8px;
      font-weight: 600;
      white-space: normal;
    }
    .col-identity {
      text-align: center;
      font-size: 8px;
      white-space: nowrap;
    }
    .col-name-doc {
      text-align: left;
      font-size: 8px;
      white-space: normal;
    }
    .col-number {
      text-align: left;
      font-size: 8.5px;
      line-height: 1.12;
      white-space: normal;
    }
    .col-employment {
      text-align: center;
      font-size: 8px;
      white-space: normal;
    }
    .col-date {
      text-align: center;
      font-size: 8px;
      white-space: nowrap;
    }
    .col-status {
      text-align: center;
      font-size: 8px;
      white-space: nowrap;
    }
    .empty-cell {
      height: 54px;
      text-align: center;
      color: #64748b;
      font-style: italic;
    }
    .verification-row {
      display: grid;
      grid-template-columns: 72px 1fr;
      gap: 10px;
      align-items: center;
      margin-top: 12px;
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

    <h1 class="title">${escapeHtml(data.title)}</h1>

    <table>
      <colgroup>
        <col style="width: 3%" />
        <col style="width: 8%" />
        <col style="width: 22%" />
        <col style="width: 9%" />
        <col style="width: 8%" />
        <col style="width: 14%" />
        <col style="width: 10%" />
        <col style="width: 12%" />
        <col style="width: 9%" />
        <col style="width: 5%" />
      </colgroup>
      <thead>
        <tr>
          <th>No</th>
          <th>Kode</th>
          <th>Nama</th>
          <th>NIP</th>
          <th>NIK</th>
          <th>Nama Dokumen</th>
          <th>Nomor Dokumen</th>
          <th>Status/Jenis<br />Kepegawaian</th>
          <th>Masa Berakhir<br />Dokumen</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${renderRows(data.rows)}</tbody>
    </table>

    <section class="verification-row">
      <img src="${escapeHtml(options.verification.qrCodeDataUrl)}" alt="QR Code verifikasi laporan dokumen pegawai" />
      <div>
        <div class="verification-label">Verifikasi Laporan</div>
        <div class="verification-title">Scan QR untuk mengecek keaslian PDF laporan dokumen pegawai ini.</div>
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
