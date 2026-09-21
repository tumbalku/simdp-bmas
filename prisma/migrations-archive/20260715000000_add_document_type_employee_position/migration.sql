CREATE TABLE "DocumentTypeEmployeePosition" (
  id text PRIMARY KEY,
  "documentTypeId" text NOT NULL REFERENCES "DocumentType"(id) ON DELETE CASCADE,
  "employeePositionId" text NOT NULL REFERENCES "EmployeePosition"(id) ON DELETE CASCADE,
  UNIQUE("documentTypeId", "employeePositionId")
);
