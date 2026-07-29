import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const deploymentUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3001";

const config: Config = {
  title: "SIMDP Documentation",
  tagline: "Dokumentasi arsitektur, operasi, keamanan, dan panduan penggunaan SiCantIK.",
  favicon: "img/logo.svg",

  url: process.env.DOCS_SITE_URL ?? deploymentUrl,
  baseUrl: process.env.DOCS_BASE_URL ?? "/",

  organizationName: "tumbalku",
  projectName: "simdp-bmas",

  onBrokenLinks: "throw",
  i18n: {
    defaultLocale: "id",
    locales: ["id"],
  },

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },

  themes: ["@docusaurus/theme-mermaid"],

  presets: [
    [
      "classic",
      {
        docs: {
          routeBasePath: "/",
          sidebarPath: "./sidebars.ts",
          editUrl:
            "https://github.com/tumbalku/simdp-bmas/tree/development/documentation/",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: "img/logo.svg",
    navbar: {
      title: "SIMDP",
      logo: {
        alt: "SIMDP",
        src: "img/logo.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "projectSidebar",
          position: "left",
          label: "Dokumentasi",
        },
        {
          href: "https://github.com/tumbalku/simdp-bmas",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Panduan",
          items: [
            {
              label: "Mulai Dari Sini",
              to: "/",
            },
            {
              label: "Developer",
              to: "/developer/setup-local",
            },
            {
              label: "Operator",
              to: "/operator/deployment-overview",
            },
          ],
        },
        {
          title: "Project",
          items: [
            {
              label: "Repository",
              href: "https://github.com/tumbalku/simdp-bmas",
            },
          ],
        },
      ],
      copyright: `Copyright ${new Date().getFullYear()} SIMDP BMAS.`,
    },
    prism: {
      additionalLanguages: ["bash", "powershell", "json", "sql"],
    },
    colorMode: {
      defaultMode: "light",
      respectPrefersColorScheme: true,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
