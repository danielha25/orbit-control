import { expect, type Page } from "@playwright/test";

import type { TestUserCredentials } from "@/../tests/data/test-data";

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/login");
  }

  async login(credentials: TestUserCredentials) {
    await this.page.getByTestId("login-email").fill(credentials.email);
    await this.page.getByTestId("login-password").fill(credentials.password);
    await this.page.getByTestId("login-submit").click();
  }

  async expectVisible() {
    await expect(this.page.getByTestId("login-form")).toBeVisible();
    await expect(this.page.getByTestId("login-email")).toBeVisible();
    await expect(this.page.getByTestId("login-password")).toBeVisible();
  }

  async expectError(message: string) {
    await expect(this.page.getByTestId("login-error")).toHaveText(message);
  }

  async goToRegister() {
    await this.page.getByRole("link", { name: "Create an account" }).click();
  }
}
