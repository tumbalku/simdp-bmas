export const PAGINATION = {
  defaultPage: 1,
  defaultPageSize: 10,
  defaultSecurityLogPageSize: 25,
  navbarNotificationLimit: 6,
  masterDataEntityLimit: 200,
  pageSizeOptions: [5, 10, 15, 25, 50, 100],
} as const;

export type PageSizeOption = (typeof PAGINATION.pageSizeOptions)[number];
