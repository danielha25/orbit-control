export type AuthInput = {
  email: string;
  password: string;
};

export type WatchlistInput = {
  objectId: string;
};

export const missionStatusOptions = [
  "new",
  "monitoring",
  "critical",
  "resolved"
] as const;

export const missionPriorityOptions = [
  "low",
  "medium",
  "high"
] as const;

export type MissionStatusInput = typeof missionStatusOptions[number];

export type MissionPriorityInput = typeof missionPriorityOptions[number];

export type MissionCreateInput = {
  objectId: string;
  title: string;
  status: MissionStatusInput;
  priority: MissionPriorityInput;
  notes: string;
};

export type MissionUpdateInput = {
  title: string;
  status: MissionStatusInput;
  priority: MissionPriorityInput;
  notes: string;
};

type AuthValidationResult =
  | { data: AuthInput; error: null }
  | { data: null; error: string };

type WatchlistValidationResult =
  | { data: WatchlistInput; error: null }
  | { data: null; error: string };

type MissionCreateValidationResult =
  | { data: MissionCreateInput; error: null }
  | { data: null; error: string };

type MissionUpdateValidationResult =
  | { data: MissionUpdateInput; error: null }
  | { data: null; error: string };

function normalizeMissionStatus(value: unknown): MissionStatusInput | null {
  return typeof value === "string" && missionStatusOptions.includes(value as MissionStatusInput)
    ? value as MissionStatusInput
    : null;
}

function normalizeMissionPriority(value: unknown): MissionPriorityInput | null {
  return typeof value === "string" && missionPriorityOptions.includes(value as MissionPriorityInput)
    ? value as MissionPriorityInput
    : null;
}

export function validateAuthInput(input: unknown): AuthValidationResult {
  if (!input || typeof input !== "object") {
    return { data: null, error: "Invalid request body" };
  }

  const email = typeof (input as { email?: unknown }).email === "string"
    ? (input as { email: string }).email.trim().toLowerCase()
    : "";
  const password = typeof (input as { password?: unknown }).password === "string"
    ? (input as { password: string }).password
    : "";

  if (!email || !password) {
    return { data: null, error: "Email and password are required" };
  }

  if (!email.includes("@")) {
    return { data: null, error: "Email must be valid" };
  }

  if (password.length < 8) {
    return { data: null, error: "Password must be at least 8 characters" };
  }

  return {
    data: {
      email,
      password
    },
    error: null
  };
}

export function validateWatchlistInput(input: unknown): WatchlistValidationResult {
  if (!input || typeof input !== "object") {
    return { data: null, error: "Invalid request body" };
  }

  const objectId = typeof (input as { objectId?: unknown }).objectId === "string"
    ? (input as { objectId: string }).objectId.trim()
    : "";

  if (!objectId) {
    return { data: null, error: "Object ID is required" };
  }

  return {
    data: {
      objectId
    },
    error: null
  };
}

export function validateMissionCreateInput(input: unknown): MissionCreateValidationResult {
  if (!input || typeof input !== "object") {
    return { data: null, error: "Invalid request body" };
  }

  const objectId = typeof (input as { objectId?: unknown }).objectId === "string"
    ? (input as { objectId: string }).objectId.trim()
    : "";
  const title = typeof (input as { title?: unknown }).title === "string"
    ? (input as { title: string }).title.trim()
    : "";
  const status = normalizeMissionStatus((input as { status?: unknown }).status) ?? "new";
  const priority = normalizeMissionPriority((input as { priority?: unknown }).priority) ?? "medium";
  const notes = typeof (input as { notes?: unknown }).notes === "string"
    ? (input as { notes: string }).notes.trim()
    : "";

  if (!objectId) {
    return { data: null, error: "Object ID is required" };
  }

  if (!title) {
    return { data: null, error: "Title is required" };
  }

  return {
    data: {
      objectId,
      title,
      status,
      priority,
      notes
    },
    error: null
  };
}

export function validateMissionUpdateInput(input: unknown): MissionUpdateValidationResult {
  if (!input || typeof input !== "object") {
    return { data: null, error: "Invalid request body" };
  }

  const title = typeof (input as { title?: unknown }).title === "string"
    ? (input as { title: string }).title.trim()
    : "";
  const status = normalizeMissionStatus((input as { status?: unknown }).status);
  const priority = normalizeMissionPriority((input as { priority?: unknown }).priority);
  const notes = typeof (input as { notes?: unknown }).notes === "string"
    ? (input as { notes: string }).notes.trim()
    : "";

  if (!title) {
    return { data: null, error: "Title is required" };
  }

  if (!status) {
    return { data: null, error: "Status is required" };
  }

  if (!priority) {
    return { data: null, error: "Priority is required" };
  }

  return {
    data: {
      title,
      status,
      priority,
      notes
    },
    error: null
  };
}
