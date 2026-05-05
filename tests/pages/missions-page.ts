import { expect, type Page } from "@playwright/test";

type MissionStatus = "new" | "monitoring" | "critical" | "resolved";
type MissionPriority = "low" | "medium" | "high";

type MissionCreateInput = {
  title: string;
  notes?: string;
  status?: MissionStatus;
  priority?: MissionPriority;
};

type MissionUpdateInput = {
  title?: string;
  notes?: string;
  status?: MissionStatus;
  priority?: MissionPriority;
};

export class MissionsPage {
  constructor(private readonly page: Page) {}

  async goto(params?: Record<string, string>) {
    const query = params ? new URLSearchParams(params).toString() : "";
    await this.page.goto(`/missions${query ? `?${query}` : ""}`);
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/\/missions(?:\?.*)?$/);
    await expect(this.page.getByTestId("mission-filters-form")).toBeVisible();
    await expect(this.page.getByTestId("missions-list")).toBeVisible();
  }

  async openCreateModal() {
    await this.page.getByTestId("mission-create-open").click();
    await expect(this.page.getByTestId("mission-create-card")).toBeVisible();
    await expect(this.page.getByTestId("mission-create-title")).toBeVisible();
  }

  async createMission(input: MissionCreateInput) {
    await this.openCreateModal();

    if (input.status) {
      await this.page.getByTestId("mission-create-status").selectOption(input.status);
    }

    if (input.priority) {
      await this.page.getByTestId("mission-create-priority").selectOption(input.priority);
    }

    await this.page.getByTestId("mission-create-title").fill(input.title);

    if (input.notes) {
      await this.page.getByTestId("mission-create-notes").fill(input.notes);
    }

    await this.page.getByTestId("mission-create-submit").click();
    await this.expectDetailFor(input.title);
  }

  async expectDetailFor(title: string) {
    await expect(this.page).toHaveURL(/\/missions\/[^/]+$/);
    await expect(this.page.locator("h1, h2").filter({ hasText: title })).toBeVisible();
  }

  async expectDetailChromeVisible() {
    await expect(this.page.getByText("MISSION STATE")).toBeVisible();
    await expect(this.page.getByText("LINKED OBJECT").first()).toBeVisible();
    await expect(this.page.getByText("ACTIVITY")).toBeVisible();
    await expect(this.page.getByText("Mission created against")).toBeVisible();
  }

  async switchToEditMode() {
    await this.page.getByRole("button", { name: "Edit" }).click();
    await expect(this.page.getByTestId("mission-update-form")).toBeVisible();
  }

  async updateMission(input: MissionUpdateInput) {
    await this.switchToEditMode();

    if (input.title) {
      await this.page.getByTestId("mission-update-title").fill(input.title);
    }

    if (input.status) {
      await this.page.getByTestId("mission-update-status").selectOption(input.status);
    }

    if (input.priority) {
      await this.page.getByTestId("mission-update-priority").selectOption(input.priority);
    }

    if (input.notes) {
      await this.page.getByTestId("mission-update-notes").fill(input.notes);
    }

    await this.page.getByTestId("mission-update-submit").click();
    await expect(this.page.getByTestId("mission-update-saved")).toHaveText("Mission saved.");
  }

  async search(term: string) {
    await this.page.getByTestId("mission-filter-search").fill(term);
    await this.page.getByTestId("mission-filter-search").press("Enter");
    await expect(this.page.getByTestId("missions-list")).toBeVisible();
  }

  async filterByStatus(status: MissionStatus) {
    await this.page.getByTestId("mission-filter-status").selectOption(status);
    await this.page.getByRole("button", { name: "Apply" }).click();
    await expect(this.page.getByTestId("missions-list")).toBeVisible();
  }

  async expectMissionVisible(title: string) {
    await expect(this.page.getByText(title, { exact: true })).toBeVisible();
  }

  async expectMissionHidden(title: string) {
    await expect(this.page.getByText(title, { exact: true })).toHaveCount(0);
  }

  async confirmDeleteFromDetail() {
    await this.switchToEditMode();
    await this.page.getByTestId("mission-delete-button").click();
    await expect(this.page.getByTestId("mission-delete-confirm")).toBeVisible();
    await this.page.getByTestId("mission-delete-confirm-submit").click();
    await expect(this.page).toHaveURL(/\/missions$/);
  }

  async cancelDeleteFromDetail() {
    const missionUrl = this.page.url();

    await this.switchToEditMode();
    await this.page.getByTestId("mission-delete-button").click();
    await expect(this.page.getByTestId("mission-delete-confirm")).toBeVisible();
    await this.page.getByRole("button", { name: "Cancel" }).click();
    await expect(this.page.getByTestId("mission-delete-confirm")).toHaveCount(0);
    await expect(this.page).toHaveURL(missionUrl);
    await expect(this.page.getByTestId("mission-update-form")).toBeVisible();
  }
}
