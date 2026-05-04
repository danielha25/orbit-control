import { test, expect } from "@/../tests/fixtures/test-fixtures";
import {
  createMission,
  deleteMission,
  getMissionById,
  listMissions,
  loginUser,
  readApiEnvelope,
  updateMission
} from "@/../tests/utils/api";
import { findMissionById, findSeededObjectByExternalId } from "@/../tests/utils/db";

test.describe("Mission API smoke coverage", () => {
  test("creates updates lists and deletes a mission through the authenticated API", async ({
    request,
    registeredUser
  }) => {
    await loginUser(request, registeredUser);

    const asteroidFeedObject = await findSeededObjectByExternalId("near-earth-asteroids");
    expect(asteroidFeedObject).not.toBeNull();

    const createResponse = await createMission(request, {
      objectId: asteroidFeedObject!.id,
      title: "Track near-earth asteroid close approach",
      status: "new",
      priority: "medium",
      notes: "Initial asteroid mission created by API smoke coverage."
    });

    expect(createResponse.status()).toBe(201);
    const createBody = await readApiEnvelope<{ id: string; title: string }>(createResponse);
    expect(createBody.error).toBeNull();
    expect(createBody.data.title).toBe("Track near-earth asteroid close approach");

    const createdMission = await findMissionById(createBody.data.id);
    expect(createdMission).not.toBeNull();

    const listResponse = await listMissions(request, {
      search: "asteroid close approach"
    });
    expect(listResponse.status()).toBe(200);

    const listBody = await readApiEnvelope<Array<{ id: string; title: string }>>(listResponse);
    expect(listBody.error).toBeNull();
    expect(listBody.data.some((mission) => mission.id === createBody.data.id)).toBe(true);

    const getResponse = await getMissionById(request, createBody.data.id);
    expect(getResponse.status()).toBe(200);

    const getBody = await readApiEnvelope<{ id: string; status: string }>(getResponse);
    expect(getBody.data.id).toBe(createBody.data.id);
    expect(getBody.data.status).toBe("new");

    const updateResponse = await updateMission(request, createBody.data.id, {
      title: "Track hazardous asteroid escalation",
      status: "critical",
      priority: "high",
      notes: "Updated through API smoke coverage."
    });

    expect(updateResponse.status()).toBe(200);
    const updateBody = await readApiEnvelope<{
      title: string;
      status: string;
      priority: string;
      notes: string;
    }>(updateResponse);
    expect(updateBody.data.title).toBe("Track hazardous asteroid escalation");
    expect(updateBody.data.status).toBe("critical");
    expect(updateBody.data.priority).toBe("high");

    const updatedMission = await findMissionById(createBody.data.id);
    expect(updatedMission?.title).toBe("Track hazardous asteroid escalation");

    const deleteResponse = await deleteMission(request, createBody.data.id);
    expect(deleteResponse.status()).toBe(200);

    const deletedMission = await findMissionById(createBody.data.id);
    expect(deletedMission).toBeNull();
  });
});
