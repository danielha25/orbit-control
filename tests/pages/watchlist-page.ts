import { expect, type Page } from "@playwright/test";

type WatchlistStatusFilter = "all" | "watching" | "paused" | "archived";

export class WatchlistPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/watchlist");
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/\/watchlist(?:\?.*)?$/);
    await expect(this.page.getByTestId("watchlist-tab-all")).toBeVisible();
    await expect(this.page.getByTestId("watchlist-tab-watching")).toBeVisible();
    await expect(this.page.getByTestId("watchlist-tab-paused")).toBeVisible();
    await expect(this.page.getByTestId("watchlist-tab-archived")).toBeVisible();
  }

  async filterByStatus(status: WatchlistStatusFilter) {
    await this.page.getByTestId(`watchlist-tab-${status}`).click();
    await expect(this.page).toHaveURL(status === "all" ? /\/watchlist$/ : new RegExp(`/watchlist\\?status=${status}$`));
  }

  async expectAnyItemVisible() {
    await expect(this.page.getByTestId("watchlist-item-list")).toBeVisible();
    await expect(this.page.locator("[data-testid^='watchlist-item-']").first()).toBeVisible();
  }

  async expectObjectVisible(name: string) {
    await expect(this.page.getByTestId("watchlist-item-list").getByText(name, { exact: true })).toBeVisible();
  }

  async expectEmptyState(message: string) {
    await expect(this.page.getByTestId("watchlist-empty-state")).toContainText(message);
  }

  async removeFirstItem() {
    await this.page.locator("[data-testid^='remove-watchlist-']").first().click();
  }
}
