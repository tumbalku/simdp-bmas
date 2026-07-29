import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  projectSidebar: [
    "intro",
    "project-map",
    {
      type: "category",
      label: "Architecture",
      collapsed: false,
      items: [
        "architecture/overview",
        "architecture/module-boundaries",
        "architecture/data-flow",
        "architecture/database",
        "architecture/storage-and-backup-targets",
        "architecture/decisions",
      ],
    },
    {
      type: "category",
      label: "Developer Guide",
      collapsed: false,
      items: [
        "developer/setup-local",
        "developer/environment",
        "developer/workflow",
        "developer/module-development",
        "developer/testing",
        "developer/documentation-workflow",
      ],
    },
    {
      type: "category",
      label: "Operator Guide",
      collapsed: false,
      items: [
        "operator/deployment-overview",
        "operator/backup-recovery",
        "operator/local-vps-backup",
        "operator/restore-runbook",
        "operator/incident-checklist",
      ],
    },
    {
      type: "category",
      label: "Security",
      collapsed: false,
      items: ["security/auth-rbac", "security/audit-log", "security/uploads"],
    },
    {
      type: "category",
      label: "API",
      collapsed: false,
      items: ["api/overview", "api/auth", "api/documents", "api/admin"],
    },
    {
      type: "category",
      label: "User Manual",
      collapsed: false,
      items: [
        "user-manual/admin",
        "user-manual/staff",
        "user-manual/employee",
      ],
    },
    {
      type: "category",
      label: "Reference",
      collapsed: true,
      items: ["reference/glossary", "reference/source-docs"],
    },
  ],
};

export default sidebars;
