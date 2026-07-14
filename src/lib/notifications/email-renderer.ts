import { render } from "@react-email/components";
import * as React from "react";

import { DocumentStatusEmail } from "./templates/DocumentStatusEmail";
import { GeneralNotificationEmail } from "./templates/GeneralNotificationEmail";

export async function renderDocumentStatusEmail(input: {
  ownerName: string;
  documentTypeName: string;
  status: "APPROVED" | "REJECTED";
  note?: string | null;
}) {
  return render(React.createElement(DocumentStatusEmail, input));
}

export async function renderGeneralNotificationEmail(input: {
  title: string;
  message: string;
}) {
  return render(React.createElement(GeneralNotificationEmail, input));
}
