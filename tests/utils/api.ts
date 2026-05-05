import type { APIResponse, APIRequestContext } from "@playwright/test";

import type { TestUserCredentials } from "@/../tests/data/test-data";

type ApiEnvelope<T> = {
  data: T;
  error: string | null;
};

export async function registerUser(
  request: APIRequestContext,
  credentials: TestUserCredentials
) {
  return request.post("/api/auth/register", {
    data: credentials
  });
}

export async function loginUser(
  request: APIRequestContext,
  credentials: TestUserCredentials
) {
  return request.post("/api/auth/login", {
    data: credentials
  });
}

export async function logoutUser(request: APIRequestContext) {
  return request.post("/api/auth/logout");
}

export async function getCurrentUser(request: APIRequestContext) {
  return request.get("/api/auth/me");
}

export async function getDashboard(request: APIRequestContext) {
  return request.get("/api/dashboard");
}

export async function listWatchlist(request: APIRequestContext) {
  return request.get("/api/watchlist");
}

export async function addWatchlistItem(
  request: APIRequestContext,
  objectId: string
) {
  return request.post("/api/watchlist", {
    data: {
      objectId
    }
  });
}

export async function deleteWatchlistItem(
  request: APIRequestContext,
  watchlistItemId: string
) {
  return request.delete(`/api/watchlist/${watchlistItemId}`);
}

export async function createMission(
  request: APIRequestContext,
  mission: {
    objectId: string;
    title: string;
    status?: "new" | "monitoring" | "critical" | "resolved";
    priority?: "low" | "medium" | "high";
    notes?: string;
  }
) {
  return request.post("/api/missions", {
    data: {
      status: "new",
      priority: "medium",
      notes: "",
      ...mission
    }
  });
}

export async function listMissions(
  request: APIRequestContext,
  query?: {
    search?: string;
    status?: string;
    priority?: string;
  }
) {
  return request.get("/api/missions", {
    params: query
  });
}

export async function getMissionById(request: APIRequestContext, missionId: string) {
  return request.get(`/api/missions/${missionId}`);
}

export async function updateMission(
  request: APIRequestContext,
  missionId: string,
  mission: {
    title: string;
    status: "new" | "monitoring" | "critical" | "resolved";
    priority: "low" | "medium" | "high";
    notes: string;
  }
) {
  return request.patch(`/api/missions/${missionId}`, {
    data: mission
  });
}

export async function deleteMission(request: APIRequestContext, missionId: string) {
  return request.delete(`/api/missions/${missionId}`);
}

export async function readApiEnvelope<T>(
  response: APIResponse
): Promise<ApiEnvelope<T>> {
  return response.json() as Promise<ApiEnvelope<T>>;
}
