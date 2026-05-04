import { test, expect } from "@/../tests/fixtures/test-fixtures";

test.describe("Authentication and dashboard UI smoke coverage", () => {
  test("redirects an unauthenticated visitor from dashboard to login", async ({
    dashboardPage,
    page
  }) => {
    await dashboardPage.goto();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("shows the dashboard after a successful login", async ({
    loginPage,
    dashboardPage,
    registeredUser
  }) => {
    await loginPage.goto();
    await loginPage.expectVisible();
    await loginPage.login(registeredUser);
    await dashboardPage.expectLoaded();
    await dashboardPage.expectSignedInUser(registeredUser.email);
    await dashboardPage.expectSeededObjectsVisible();
    await dashboardPage.expectLiveSpaceSignalsVisible();
  });

  test("removes access to protected pages after logout", async ({
    loginPage,
    dashboardPage,
    registeredUser,
    page
  }) => {
    await loginPage.goto();
    await loginPage.login(registeredUser);
    await dashboardPage.expectLoaded();

    await page.getByTestId("logout-button").click();
    await expect(page).toHaveURL(/\/login$/);

    await dashboardPage.goto();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("invalid login shows an error and stays on /login", async ({
    loginPage,
    page
  }) => {
    await loginPage.goto();
    await loginPage.login({
      email: "adsfadsf@gmail.com",
      password: "somepassword123"
    });

    await loginPage.expectError("Invalid email or password");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("link from login to register works", async ({
    loginPage,
    page
  }) => {
    await loginPage.goto();
    await loginPage.goToRegister();
    await expect(page).toHaveURL("/register");
    await expect(page.getByTestId("register-form")).toBeVisible();
  });
});
