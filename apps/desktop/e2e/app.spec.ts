import { _electron as electron, ElectronApplication, expect, test } from "@playwright/test";
import { findLatestBuild, parseElectronApp } from "electron-playwright-helpers";

let electronApp: ElectronApplication;

test.beforeAll(async () => {
  const latestBuild = findLatestBuild();
  const appInfo = parseElectronApp(latestBuild);

  electronApp = await electron.launch({
    args: [appInfo.main, "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu-sandbox"],
    env: { ...process.env, PW_E2E: "true" },
  });
  electronApp.on("window", async (page) => {
    const filename = page.url()?.split("/").pop();
    console.log(`Window opened: ${filename}`);

    // capture errors
    page.on("pageerror", (error) => {
      console.error(error);
    });
    // capture console messages
    page.on("console", (msg) => {
      console.log(msg.text());
    });
  });
});

test.afterAll(async () => {
  await electronApp.close();
});

test.describe("Skroll Desktop App", () => {
  test("should launch the app and show the main window", async ({ page }) => {
    // Wait for the first window to appear
    const window = await electronApp.firstWindow();
    expect(window).toBeTruthy();
    window.on("console", console.log);

    // Take a screenshot for verification
    await window.screenshot({ path: "e2e-results/app-launch.png" });

    // Verify the title contains "Skroll"
    const title = await window.title();
    expect(title).toContain("Skroll");

    await page.waitForTimeout(10000);
  });

  // test("should display the editor interface", async () => {
  //   const window = await electronApp.firstWindow();

  //   // Wait for the app to be ready
  //   await window.waitForLoadState("domcontentloaded");

  //   // Check that we can find some expected UI elements
  //   // Note: Update these selectors based on actual app structure
  //   const body = window.locator("body");
  //   await expect(body).toBeVisible();
  // });
});
