import { test, expect } from "@/../tests/fixtures/test-fixtures";
import { TEST_OBJECTS } from "@/../tests/data/test-data";
import {
  addWatchlistItem,
  deleteWatchlistItem,
  listWatchlist,
  readApiEnvelope
} from "@/../tests/utils/api";
import {
  findSeededObjectByExternalId,
  findUserByEmail,
  findWatchlistItemById,
  findWatchlistItemByUserAndObject
} from "@/../tests/utils/db";

type WatchlistApiItem = {
  id: string;
  status: string;
  object: {
    id: string;
    externalId: string;
  };
};

test.describe("Watchlist API smoke coverage", () => {
  test("adds lists and deletes a watchlist item through the authenticated API", async ({
    authenticatedRequest,
    registeredUser
  }) => {
    const apodObject = await findSeededObjectByExternalId(TEST_OBJECTS.APOD);
    expect(apodObject).not.toBeNull();

    const addResponse = await addWatchlistItem(authenticatedRequest, apodObject!.id);
    expect(addResponse.status()).toBe(201);

    const addBody = await readApiEnvelope<WatchlistApiItem>(addResponse);
    expect(addBody.error).toBeNull();
    expect(addBody.data.status).toBe("watching");
    expect(addBody.data.object.externalId).toBe(TEST_OBJECTS.APOD);

    const user = await findUserByEmail(registeredUser.email);
    expect(user).not.toBeNull();

    const createdItem = await findWatchlistItemByUserAndObject(user!.id, apodObject!.id);
    expect(createdItem?.id).toBe(addBody.data.id);

    const listResponse = await listWatchlist(authenticatedRequest);
    expect(listResponse.status()).toBe(200);

    const listBody = await readApiEnvelope<WatchlistApiItem[]>(listResponse);
    expect(listBody.error).toBeNull();
    expect(listBody.data.some((item) => item.id === addBody.data.id)).toBe(true);

    const deleteResponse = await deleteWatchlistItem(authenticatedRequest, addBody.data.id);
    expect(deleteResponse.status()).toBe(200);

    const deletedItem = await findWatchlistItemById(addBody.data.id);
    expect(deletedItem).toBeNull();
  });

  test("rejects adding the same object twice for one user", async ({
    authenticatedRequest
  }) => {
    const issObject = await findSeededObjectByExternalId(TEST_OBJECTS.ISS);
    expect(issObject).not.toBeNull();

    const firstAddResponse = await addWatchlistItem(authenticatedRequest, issObject!.id);
    expect(firstAddResponse.status()).toBe(201);

    const duplicateResponse = await addWatchlistItem(authenticatedRequest, issObject!.id);
    expect(duplicateResponse.status()).toBe(400);

    const duplicateBody = await readApiEnvelope<null>(duplicateResponse);
    expect(duplicateBody.data).toBeNull();
    expect(duplicateBody.error).toBe("Space object already in watchlist");
  });

  test("rejects watchlist access without an active session", async ({ request }) => {
    const response = await listWatchlist(request);
    expect(response.status()).toBe(401);

    const body = await readApiEnvelope<null>(response);
    expect(body.data).toBeNull();
    expect(body.error).toBe("Unauthorized");
  });
});
