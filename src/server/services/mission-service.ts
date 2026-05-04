import {
  MissionPriority as PrismaMissionPriority,
  MissionStatus as PrismaMissionStatus,
  Prisma
} from "@prisma/client";

import type {
  MissionCreateInput,
  MissionPriorityInput,
  MissionStatusInput,
  MissionUpdateInput
} from "@/lib/validators";


import { prisma } from "@/lib/prisma";

type SpaceObjectMetadata = {
  description: string;
  category: string;
};

type MissionObject = {
  id: string;
  externalId: string;
  name: string;
  type: string;
  source: string;
  metadata: SpaceObjectMetadata;
};

export type MissionData = {
  id: string;
  title: string;
  status: MissionStatusInput;
  priority: MissionPriorityInput;
  notes: string;
  createdAt: string;
  updatedAt: string;
  object: MissionObject;
};

export type MissionFilters = {
  search?: string;
  status?: MissionStatusInput;
  priority?: MissionPriorityInput;
};

type MissionLookupResult =
  | { data: MissionData; error: null }
  | { data: null; error: string; code: "not_found" };

type MissionDeleteResult =
  | { data: { id: string; deleted: true }; error: null }
  | { data: null; error: string; code: "not_found" };

const missionStatusMap: Record<MissionStatusInput, PrismaMissionStatus> = {
  new: PrismaMissionStatus.NEW,
  monitoring: PrismaMissionStatus.MONITORING,
  critical: PrismaMissionStatus.CRITICAL,
  resolved: PrismaMissionStatus.RESOLVED
};

const missionPriorityMap: Record<MissionPriorityInput, PrismaMissionPriority> = {
  low: PrismaMissionPriority.LOW,
  medium: PrismaMissionPriority.MEDIUM,
  high: PrismaMissionPriority.HIGH
};

const missionStatusReverseMap: Record<PrismaMissionStatus, MissionStatusInput> = {
  [PrismaMissionStatus.NEW]: "new",
  [PrismaMissionStatus.MONITORING]: "monitoring",
  [PrismaMissionStatus.CRITICAL]: "critical",
  [PrismaMissionStatus.RESOLVED]: "resolved"
};

const missionPriorityReverseMap: Record<PrismaMissionPriority, MissionPriorityInput> = {
  [PrismaMissionPriority.LOW]: "low",
  [PrismaMissionPriority.MEDIUM]: "medium",
  [PrismaMissionPriority.HIGH]: "high"
};

const trackableObjectSources = new Set(["seed", "live-neows"]);
const mockNeoWsExternalIdPrefix = "neows-mock-";

function normalizeMetadata(metadataJson: unknown): SpaceObjectMetadata {
  if (!metadataJson || typeof metadataJson !== "object") {
    return {
      description: "",
      category: ""
    };
  }

  const description = typeof (metadataJson as { description?: unknown }).description === "string"
    ? (metadataJson as { description: string }).description
    : "";
  const category = typeof (metadataJson as { category?: unknown }).category === "string"
    ? (metadataJson as { category: string }).category
    : "";

  return {
    description,
    category
  };
}

function normalizeNotes(notes: string) {
  const normalizedNotes = notes.trim();

  return normalizedNotes ? normalizedNotes : null;
}

function mapMission(item: {
  id: string;
  title: string;
  status: PrismaMissionStatus;
  priority: PrismaMissionPriority;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  object: {
    id: string;
    externalId: string;
    name: string;
    type: string;
    source: string;
    metadataJson: unknown;
  };
}): MissionData {
  return {
    id: item.id,
    title: item.title,
    status: missionStatusReverseMap[item.status],
    priority: missionPriorityReverseMap[item.priority],
    notes: item.notes ?? "",
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    object: {
      id: item.object.id,
      externalId: item.object.externalId,
      name: item.object.name,
      type: item.object.type,
      source: item.object.source,
      metadata: normalizeMetadata(item.object.metadataJson)
    }
  };
}

async function findTrackableSpaceObject(objectId: string) {
  return prisma.spaceObject.findUnique({
    where: {
      id: objectId
    },
    select: {
      id: true,
      source: true,
      externalId: true
    }
  });
}

export async function listMissions(userId: string, filters: MissionFilters = {}): Promise<MissionData[]> {
  const where: Prisma.MissionWhereInput = {
    userId
  };

  if (filters.search) {
    where.title = {
      contains: filters.search,
      mode: "insensitive"
    };
  }

  if (filters.status) {
    where.status = missionStatusMap[filters.status];
  }

  if (filters.priority) {
    where.priority = missionPriorityMap[filters.priority];
  }

  const missions = await prisma.mission.findMany({
    where,
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      object: {
        select: {
          id: true,
          externalId: true,
          name: true,
          type: true,
          source: true,
          metadataJson: true
        }
      }
    },
    orderBy: [
      {
        updatedAt: "desc"
      },
      {
        createdAt: "desc"
      }
    ]
  });

  return missions.map(mapMission);
}

export async function createMission(userId: string, input: MissionCreateInput): Promise<MissionLookupResult> {
  const spaceObject = await findTrackableSpaceObject(input.objectId);

  if (
    !spaceObject
    || !trackableObjectSources.has(spaceObject.source)
    || spaceObject.externalId.startsWith(mockNeoWsExternalIdPrefix)
  ) {
    return {
      data: null,
      error: "Space object not found",
      code: "not_found"
    };
  }

  const mission = await prisma.mission.create({
    data: {
      userId,
      objectId: input.objectId,
      title: input.title,
      status: missionStatusMap[input.status],
      priority: missionPriorityMap[input.priority],
      notes: normalizeNotes(input.notes)
    },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      object: {
        select: {
          id: true,
          externalId: true,
          name: true,
          type: true,
          source: true,
          metadataJson: true
        }
      }
    }
  });

  return {
    data: mapMission(mission),
    error: null
  };
}

export async function getMissionById(userId: string, missionId: string): Promise<MissionLookupResult> {
  const mission = await prisma.mission.findFirst({
    where: {
      id: missionId,
      userId
    },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      object: {
        select: {
          id: true,
          externalId: true,
          name: true,
          type: true,
          source: true,
          metadataJson: true
        }
      }
    }
  });

  if (!mission) {
    return {
      data: null,
      error: "Mission not found",
      code: "not_found"
    };
  }

  return {
    data: mapMission(mission),
    error: null
  };
}

export async function updateMission(
  userId: string,
  missionId: string,
  input: MissionUpdateInput
): Promise<MissionLookupResult> {
  const existingMission = await prisma.mission.findFirst({
    where: {
      id: missionId,
      userId
    },
    select: {
      id: true
    }
  });

  if (!existingMission) {
    return {
      data: null,
      error: "Mission not found",
      code: "not_found"
    };
  }

  const mission = await prisma.mission.update({
    where: {
      id: missionId
    },
    data: {
      title: input.title,
      status: missionStatusMap[input.status],
      priority: missionPriorityMap[input.priority],
      notes: normalizeNotes(input.notes)
    },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      object: {
        select: {
          id: true,
          externalId: true,
          name: true,
          type: true,
          source: true,
          metadataJson: true
        }
      }
    }
  });

  return {
    data: mapMission(mission),
    error: null
  };
}

export async function deleteMission(userId: string, missionId: string): Promise<MissionDeleteResult> {
  const mission = await prisma.mission.findFirst({
    where: {
      id: missionId,
      userId
    },
    select: {
      id: true
    }
  });

  if (!mission) {
    return {
      data: null,
      error: "Mission not found",
      code: "not_found"
    };
  }

  await prisma.mission.delete({
    where: {
      id: missionId
    }
  });

  return {
    data: {
      id: missionId,
      deleted: true
    },
    error: null
  };
}
