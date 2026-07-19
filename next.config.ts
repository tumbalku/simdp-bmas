import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  outputFileTracingIncludes: {
    "/api/v1/employees/[id]/profile-pdf": ["./node_modules/@sparticuz/chromium/bin/**/*"],
    "app/api/v1/employees/[id]/profile-pdf/route": ["./node_modules/@sparticuz/chromium/bin/**/*"],
  },
};

export default nextConfig;
