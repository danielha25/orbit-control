import { test, expect } from "@/../tests/fixtures/test-fixtures";
import { TEST_OBJECTS } from "@/../tests/data/test-data";
import { createMission } from "@/../tests/utils/api";
import { findSeededObjectByExternalId } from "@/../tests/utils/db";

test.describe("Missions UI coverage", () => {
  test("creates a mission through the modal and shows the detail view", async ({
    loggedInUser,
    missionsPage
  }) => {
    void loggedInUser;

    await missionsPage.goto();
    await missionsPage.expectLoaded();
    await missionsPage.createMission({
      title: "UI modal mission",
      notes: "Created through the mission composer modal."
    });
    await missionsPage.expectDetailChromeVisible();
  });

  test("updates mission status and priority from the detail view", async ({
    loggedInUser,
    missionsPage
  }) => {
    void loggedInUser;

    await missionsPage.goto();
    await missionsPage.createMission({
      title: "UI mission to update"
    });

    await missionsPage.updateMission({
      status: "critical",
      priority: "high",
      notes: "Escalated from the UI test."
    });
  });

  test("searches and filters missions created through API setup", async ({
    authenticatedRequest,
    loggedInUser,
    missionsPage
  }) => {
    void loggedInUser;

    const asteroidObject = await findSeededObjectByExternalId(TEST_OBJECTS.NEAR_EARTH_ASTEROIDS);
    expect(asteroidObject).not.toBeNull();

    await createMission(authenticatedRequest, {
      objectId: asteroidObject!.id,
      title: "UI Search Alpha monitoring target",
      status: "monitoring",
      priority: "medium"
    });
    await createMission(authenticatedRequest, {
      objectId: asteroidObject!.id,
      title: "UI Search Beta critical target",
      status: "critical",
      priority: "high"
    });

    await missionsPage.goto();
    await missionsPage.search("Alpha");
    await missionsPage.expectMissionVisible("UI Search Alpha monitoring target");
    await missionsPage.expectMissionHidden("UI Search Beta critical target");

    await missionsPage.goto();
    await missionsPage.filterByStatus("critical");
    await missionsPage.expectMissionVisible("UI Search Beta critical target");
    await missionsPage.expectMissionHidden("UI Search Alpha monitoring target");
  });

  test("cancels the styled delete dialog without removing the mission", async ({
    loggedInUser,
    missionsPage
  }) => {
    void loggedInUser;

    await missionsPage.goto();
    await missionsPage.createMission({
      title: "UI mission cancel delete"
    });

    await missionsPage.cancelDeleteFromDetail();
  });

  test("confirms the styled delete dialog and returns to the mission list", async ({
    loggedInUser,
    missionsPage
  }) => {
    void loggedInUser;

    await missionsPage.goto();
    await missionsPage.createMission({
      title: "UI mission confirm delete"
    });

    await missionsPage.confirmDeleteFromDetail();
    await missionsPage.expectLoaded();
    await missionsPage.expectMissionHidden("UI mission confirm delete");
  });
});
