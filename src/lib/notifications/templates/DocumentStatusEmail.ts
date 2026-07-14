import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
} from "@react-email/components";

interface DocumentStatusEmailProps {
  ownerName: string;
  documentTypeName: string;
  status: "APPROVED" | "REJECTED";
  note?: string | null;
}

export function DocumentStatusEmail({
  ownerName,
  documentTypeName,
  status,
  note,
}: DocumentStatusEmailProps) {
  const statusLabel = status === "APPROVED" ? "Disetujui" : "Ditolak";
  const statusColor = status === "APPROVED" ? "#10B981" : "#EF4444";

  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(
      Body,
      { style: { fontFamily: "sans-serif", backgroundColor: "#f6f9fc", padding: "10px" } },
      React.createElement(
        Container,
        {
          style: {
            backgroundColor: "#ffffff",
            padding: "20px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
          },
        },
        React.createElement(
          Heading,
          { style: { fontSize: "20px", color: "#1e293b", margin: "0 0 16px" } },
          "Status Verifikasi Dokumen"
        ),
        React.createElement(
          Text,
          { style: { fontSize: "14px", color: "#475569" } },
          React.createElement("span", null, "Halo "),
          React.createElement("strong", null, ownerName),
          React.createElement("span", null, ",")
        ),
        React.createElement(
          Text,
          { style: { fontSize: "14px", color: "#475569" } },
          React.createElement("span", null, "Dokumen "),
          React.createElement("strong", null, documentTypeName),
          React.createElement("span", null, " Anda telah diverifikasi oleh tim kepegawaian dengan status:")
        ),
        React.createElement(
          Section,
          {
            style: {
              padding: "12px",
              borderRadius: "6px",
              backgroundColor: "#f8fafc",
              borderLeft: `4px solid ${statusColor}`,
              margin: "16px 0",
            },
          },
          React.createElement(
            Text,
            { style: { margin: 0, fontSize: "16px", fontWeight: "bold", color: statusColor } },
            statusLabel
          ),
          note
            ? React.createElement(
                Text,
                { style: { margin: "8px 0 0", fontSize: "13px", color: "#64748b", fontStyle: "italic" } },
                `Catatan: "${note}"`
              )
            : null
        ),
        React.createElement(Hr, { style: { borderColor: "#e2e8f0", margin: "20px 0" } }),
        React.createElement(
          Text,
          { style: { fontSize: "12px", color: "#94a3b8", textAlign: "center" } },
          "Ini adalah email otomatis dari SIMDP RSUD Bahteramas. Mohon tidak membalas email ini."
        )
      )
    )
  );
}
