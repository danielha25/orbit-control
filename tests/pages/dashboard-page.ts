import { expect, type Page } from "@playwright/test";

export class DashboardPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/dashboard");
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/\/dashboard$/);
    await expect(this.page.getByTestId("dashboard-object-list")).toBeVisible();
    await expect(this.page.getByTestId("live-space-panel")).toBeVisible();
  }

  async expectSignedInUser(email: string) {
    await expect(this.page.getByTestId("dashboard-user-email")).toContainText(email);
  }

  async expectSeededObjectsVisible() {
    await expect(this.page.getByTestId("space-object-apod")).toBeVisible();
    await expect(this.page.getByTestId("space-object-iss")).toBeVisible();
    await expect(this.page.getByTestId("space-object-near-earth-asteroids")).toBeVisible();
    await expect(this.page.getByTestId("space-object-mars")).toHaveCount(0);
    await expect(this.page.getByTestId("space-object-jupiter")).toHaveCount(0);
  }

  async expectLiveSpaceSignalsVisible() {
    await expect(this.page.getByTestId("live-space-mode")).toContainText("Source: mock");
    await expect(this.page.getByTestId("live-apod-title")).toHaveText("Mock Astronomy Picture");
    await expect(this.page.getByTestId("live-iss-position")).toBeVisible();
    await expect(this.page.getByTestId("live-asteroid-name")).toContainText("Mock NEO 2026 QA");
  }
}
