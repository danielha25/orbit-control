import { test as base, expect } from "@playwright/test";

import { createTestUserCredentials, type TestUserCredentials } from "@/../tests/data/test-data";
import { DashboardPage } from "@/../tests/pages/dashboard-page";
import { LoginPage } from "@/../tests/pages/login-page";
import { registerUser } from "@/../tests/utils/api";
import { deleteUserByEmail, disconnectTestPrisma } from "@/../tests/utils/db";

type TestFixtures = {
  userCredentials: TestUserCredentials;
  registeredUser: TestUserCredentials;
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  loggedInUser: TestUserCredentials;
};

export const test = base.extend<TestFixtures>({
  userCredentials: async ({}, use, testInfo) => {
    await use(createTestUserCredentials(testInfo.project.name || "test-user"));
  },

  registeredUser: async ({ request, userCredentials }, use) => {
    const response = await registerUser(request, userCredentials);
    expect(response.status()).toBe(201);
    await use(userCredentials);
    await deleteUserByEmail(userCredentials.email);
  },

  loggedInUser: async ({registeredUser, dashboardPage, loginPage}, use)=>{
    await loginPage.goto()
    await loginPage.login(registeredUser)
    await dashboardPage.expectLoaded();
    await use(registeredUser);
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  }
});

export { expect } from "@playwright/test";

base.afterAll(async () => {
  await disconnectTestPrisma();
});
