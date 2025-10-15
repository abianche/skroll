import { _electron as electron, ElectronApplication, expect, test } from "@playwright/test";
import { findLatestBuild, parseElectronApp } from "electron-playwright-helpers";

let electronApp: ElectronApplication;

test.beforeAll(async () => {
  // Determine the correct build directory based on the current working directory to support both terminal and extension runs
  const buildDirectory = process.cwd().endsWith("apps/desktop") ? "./out" : "./apps/desktop/out";
  const latestBuild = findLatestBuild(buildDirectory);
  const appInfo = parseElectronApp(latestBuild);

  electronApp = await electron.launch({
    args: [appInfo.main, "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu-sandbox"],
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

test.describe("Skroll", () => {
  test("should launch the app and show the main window", async ({ page }) => {
    // Wait for the first window to appear
    const window = await electronApp.firstWindow();
    expect(window).toBeTruthy();

    // Take a screenshot for verification
    await window.screenshot({ path: "e2e-results/app-launch.png" });

    // Verify the title contains "Skroll"
    const title = await window.title();
    expect(title).toContain("Skroll");
  });

  test("should display the home screen", async () => {
    const window = await electronApp.firstWindow();

    const homePage = window.getByText("Welcome to Skroll");
    await expect(homePage).toBeVisible();
  });

  test("should navigate to the editor page", async () => {
    const window = await electronApp.firstWindow();

    const scriptNavLink = window.locator("nav >> text=Script");
    await scriptNavLink.click();

    // Verify that the editor page is displayed
    const editorPage = window.getByText("Script Editor");
    await expect(editorPage).toBeVisible();
  });
});
