import * as fs from "fs";

import chromium from "@sparticuz/chromium";
import puppeteer, { type LaunchOptions } from "puppeteer-core";

export function isServerlessPdfRuntime(env: Record<string, string | undefined> = process.env) {
  if (env.NODE_ENV === "development") return false;

  return Boolean(
    env.VERCEL ||
      env.VERCEL_ENV ||
      env.AWS_LAMBDA_FUNCTION_NAME ||
      env.AWS_EXECUTION_ENV ||
      env.LAMBDA_TASK_ROOT ||
      env.NEXT_RUNTIME
  );
}

function normalizeExecutablePath(path: string) {
  return path.replace(/\\/g, "/");
}

function findLocalBrowserExecutable(env: Record<string, string | undefined> = process.env) {
  const configuredPath = env.PUPPETEER_EXECUTABLE_PATH;
  if (configuredPath && fs.existsSync(configuredPath)) {
    return normalizeExecutablePath(configuredPath);
  }

  const candidates =
    process.platform === "win32"
      ? [
          "C:/Program Files/Google/Chrome/Application/chrome.exe",
          "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
          "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
          "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
        ]
      : [
          "/usr/bin/google-chrome-stable",
          "/usr/bin/google-chrome",
          "/usr/bin/chromium-browser",
          "/usr/bin/chromium",
        ];

  return candidates.find((candidate) => fs.existsSync(candidate));
}

async function getBrowserLaunchOptions(): Promise<LaunchOptions> {
  const args = ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=none"];

  if (isServerlessPdfRuntime()) {
    return {
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    };
  }

  const executablePath = findLocalBrowserExecutable();
  if (!executablePath) {
    throw new Error(
      "Browser lokal untuk export PDF tidak ditemukan. Isi PUPPETEER_EXECUTABLE_PATH dengan path Chrome/Edge lokal."
    );
  }

  return {
    args,
    executablePath,
    headless: true,
  };
}

export async function renderHtmlToPdfBuffer(html: string) {
  const browser = await puppeteer.launch(await getBrowserLaunchOptions());

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    return await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });
  } finally {
    await browser.close();
  }
}
