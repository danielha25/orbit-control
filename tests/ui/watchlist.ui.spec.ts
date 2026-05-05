import { test } from "@/../tests/fixtures/test-fixtures";

test.describe("Watchlist UI coverage", () => {
  test("adds a dashboard object and shows it on the watchlist page", async ({
    loggedInUser,
    dashboardPage,
    watchlistPage
  }) => {
    void loggedInUser;

    await dashboardPage.goto();
    await dashboardPage.addFeaturedObjectToWatchlist();

    await watchlistPage.goto();
    await watchlistPage.expectLoaded();
    await watchlistPage.expectAnyItemVisible();
    await watchlistPage.expectObjectVisible("APOD");
  });

  test("filters saved objects by watchlist status", async ({
    loggedInUser,
    dashboardPage,
    watchlistPage
  }) => {
    void loggedInUser;

    await dashboardPage.goto();
    await dashboardPage.addFeaturedObjectToWatchlist();

    await watchlistPage.goto();
    await watchlistPage.expectLoaded();

    await watchlistPage.filterByStatus("watching");
    await watchlistPage.expectObjectVisible("APOD");

    await watchlistPage.filterByStatus("paused");
    await watchlistPage.expectEmptyState("No items match this filter.");
  });

  test("removes a saved object and returns to the empty state", async ({
    loggedInUser,
    dashboardPage,
    watchlistPage
  }) => {
    void loggedInUser;

    await dashboardPage.goto();
    await dashboardPage.addFeaturedObjectToWatchlist();

    await watchlistPage.goto();
    await watchlistPage.expectAnyItemVisible();
    await watchlistPage.removeFirstItem();
    await watchlistPage.expectEmptyState("Nothing here yet.");
  });
});
