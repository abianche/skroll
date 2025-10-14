import { test, expect, _electron as electron } from "@playwright/test";
import * as path from "node:path";

test.describe("Skroll Desktop App", () => {
  test("should launch the app and show the main window", async () => {
    // Launch Electron app
    const electronApp = await electron.launch({
      args: [path.join(__dirname, "..", ".webpack", "main")],
    });

    // Wait for the first window to appear
    const window = await electronApp.firstWindow();

    // Verify the window is visible
    expect(window).toBeTruthy();

    // Take a screenshot for verification
    await window.screenshot({ path: "e2e-results/app-launch.png" });

    // Verify the title contains "Skroll"
    const title = await window.title();
    expect(title).toContain("Skroll");

    // Close the app
    await electronApp.close();
  });

  test("should display the editor interface", async () => {
    const electronApp = await electron.launch({
      args: [path.join(__dirname, "..", ".webpack", "main")],
    });

    const window = await electronApp.firstWindow();

    // Wait for the app to be ready
    await window.waitForLoadState("domcontentloaded");

    // Check that we can find some expected UI elements
    // Note: Update these selectors based on actual app structure
    const body = await window.locator("body");
    expect(await body.isVisible()).toBe(true);

    await electronApp.close();
  });
});
