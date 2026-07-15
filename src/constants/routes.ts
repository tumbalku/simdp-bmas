export const ROUTES = {
  home: "/",
  login: "/login",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  dashboard: "/dashboard",
  documents: "/documents",
  verification: "/verification",
  statistics: "/statistics",
  profile: "/profile",
  settings: "/settings",
  securityLog: "/security-log",
  masterData: "/master-data",
  masterDataDocuments: "/master-data/documents",
  masterDataDocumentTypes: "/master-data/documents/types",
  masterDataDocumentTypeAdd: "/master-data/documents/types/add",
  masterDataEmployees: "/master-data/employees",
  masterDataEmployeeAdd: "/master-data/employees/add",
  masterDataCategories: "/master-data/categories",
} as const;

export const routeTo = {
  documentDetail: (id: string) => `${ROUTES.documents}/${id}`,
  verificationDetail: (id: string) => `${ROUTES.verification}/${id}`,
  masterDataEmployeeDetail: (id: string) => `${ROUTES.masterDataEmployees}/${id}`,
  documentsUpload: () => `${ROUTES.documents}?upload=true`,
  loginResetSuccess: () => `${ROUTES.login}?reset=success`,
} as const;

export type RouteKey = keyof typeof ROUTES;
