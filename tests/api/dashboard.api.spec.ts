import { test, expect } from "@/../tests/fixtures/test-fixtures";
import { getDashboard, loginUser, readApiEnvelope } from "@/../tests/utils/api";

type DashboardApiData = {
  featuredObject: {
    externalId: string;
    name: string;
  } | null;
  spaceObjects: Array<{
    externalId: string;
    name: string;
  }>;
  liveSpaceData: {
    mode: string;
    apod: {
      title: string;
    };
    iss: {
      latitude: number;
      longitude: number;
    };
    nearestAsteroid: {
      name: string;
    };
    errors: string[];
  };
};

test.describe("Dashboard API smoke coverage", () => {
  test("returns seeded objects and deterministic external space data", async ({
    request,
    registeredUser
  }) => {
    await loginUser(request, registeredUser);

    const response = await getDashboard(request);
    expect(response.status()).toBe(200);
    const body = await readApiEnvelope<DashboardApiData>(response);
    expect(body.error).toBeNull();
    expect(body.data.featuredObject?.externalId).toBe("apod");
    expect(body.data.spaceObjects.some((object) => object.externalId === "iss")).toBe(true);
    expect(body.data.spaceObjects.some((object) => object.externalId.startsWith("neows-mock-"))).toBe(false);
    expect(body.data.liveSpaceData.mode).toBe("mock");
    expect(body.data.liveSpaceData.apod.title).toBe("Mock Astronomy Picture");
    expect(body.data.liveSpaceData.iss.latitude).toBe(12.3456);
    expect(body.data.liveSpaceData.nearestAsteroid.name).toBe("Mock NEO 2026 QA");
    expect(body.data.liveSpaceData.errors).toEqual([]);
  });
});
