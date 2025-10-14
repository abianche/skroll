# End-to-End Tests

This directory contains Playwright-based end-to-end tests for the Skroll desktop application.

## Running Tests

```bash
# From repository root
pnpm --filter @skroll/desktop test:e2e

# Or from apps/desktop directory
pnpm test:e2e
```

## Setup

Before running tests for the first time, install Playwright browsers:

```bash
npx playwright install chromium
```

## Writing Tests

Tests are written using Playwright Test framework and interact with the Electron application.

Example test structure:

```typescript
import { test, expect, _electron as electron } from "@playwright/test";
import path from "node:path";

test("test name", async () => {
  const electronApp = await electron.launch({
    args: [path.join(__dirname, "..", ".webpack", "main")],
  });

  const window = await electronApp.firstWindow();
  
  // Your test assertions here
  
  await electronApp.close();
});
```

## Configuration

Test configuration is in `playwright.config.ts` at the package root.

## Test Artifacts

- Test results: `test-results/`
- HTML report: `playwright-report/`
- Screenshots: `e2e-results/`

All artifacts are git-ignored.
