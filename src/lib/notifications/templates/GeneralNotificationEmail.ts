import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Heading,
  Hr,
} from "@react-email/components";

interface GeneralNotificationEmailProps {
  title: string;
  message: string;
}

export function GeneralNotificationEmail({
  title,
  message,
}: GeneralNotificationEmailProps) {
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
          title
        ),
        React.createElement(
          Text,
          { style: { fontSize: "14px", color: "#475569" } },
          message
        ),
        React.createElement(Hr, { style: { borderColor: "#e2e8f0", margin: "20px 0" } }),
        React.createElement(
          Text,
          { style: { fontSize: "12px", color: "#94a3b8", textAlign: "center" } },
          "Ini adalah email otomatis dari SiCantIK RSUD Bahteramas. Mohon tidak membalas email ini."
        )
      )
    )
  );
}
