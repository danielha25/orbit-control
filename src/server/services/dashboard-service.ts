import { prisma } from "@/lib/prisma";
import { getExternalSpaceData, type ExternalSpaceData } from "@/server/services/external-space-service";

type SpaceObjectMetadata = {
  description: string;
  category: string;
  closeApproachDate?: string;
  missDistanceKm?: number;
  relativeVelocityKmH?: number;
  diameterMeters?: number;
  isPotentiallyHazardous?: boolean;
  syncedFrom?: string;
};

const activeSpaceObjectExternalIds = [
  "apod",
  "iss",
  "near-earth-asteroids"
] as const;

const LIVE_NEOWS_SOURCE = "live-neows";
const MOCK_NEOWS_EXTERNAL_ID_PREFIX = "neows-mock-";

export type DashboardObject = {
  id: string;
  externalId: string;
  name: string;
  type: string;
  source: string;
  metadata: SpaceObjectMetadata;
};

export type DashboardData = {
  featuredObject: DashboardObject | null;
  spaceObjects: DashboardObject[];
  liveSpaceData: ExternalSpaceData;
};

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
  const closeApproachDate = typeof (metadataJson as { closeApproachDate?: unknown }).closeApproachDate === "string"
    ? (metadataJson as { closeApproachDate: string }).closeApproachDate
    : undefined;
  const syncedFrom = typeof (metadataJson as { syncedFrom?: unknown }).syncedFrom === "string"
    ? (metadataJson as { syncedFrom: string }).syncedFrom
    : undefined;
  const missDistanceKm = typeof (metadataJson as { missDistanceKm?: unknown }).missDistanceKm === "number"
    ? (metadataJson as { missDistanceKm: number }).missDistanceKm
    : undefined;
  const relativeVelocityKmH = typeof (metadataJson as { relativeVelocityKmH?: unknown }).relativeVelocityKmH === "number"
    ? (metadataJson as { relativeVelocityKmH: number }).relativeVelocityKmH
    : undefined;
  const diameterMeters = typeof (metadataJson as { diameterMeters?: unknown }).diameterMeters === "number"
    ? (metadataJson as { diameterMeters: number }).diameterMeters
    : undefined;
  const isPotentiallyHazardous = typeof (metadataJson as { isPotentiallyHazardous?: unknown }).isPotentiallyHazardous === "boolean"
    ? (metadataJson as { isPotentiallyHazardous: boolean }).isPotentiallyHazardous
    : undefined;

  return {
    description,
    category,
    closeApproachDate,
    missDistanceKm,
    relativeVelocityKmH,
    diameterMeters,
    isPotentiallyHazardous,
    syncedFrom
  };
}

function getLiveNeoExternalId(asteroidId: string) {
  return `neows-${asteroidId}`;
}

function mapSpaceObject(object: {
  id: string;
  externalId: string;
  name: string;
  type: string;
  source: string;
  metadataJson: unknown;
}): DashboardObject {
  return {
    id: object.id,
    externalId: object.externalId,
    name: object.name,
    type: object.type,
    source: object.source,
    metadata: normalizeMetadata(object.metadataJson)
  };
}

async function listTrackableSpaceObjects(): Promise<DashboardObject[]> {
  const objects = await prisma.spaceObject.findMany({
    where: {
      OR: [
        {
          source: "seed",
          externalId: {
            in: [...activeSpaceObjectExternalIds]
          }
        },
        {
          source: LIVE_NEOWS_SOURCE,
          externalId: {
            not: {
              startsWith: MOCK_NEOWS_EXTERNAL_ID_PREFIX
            }
          }
        }
      ]
    },
    select: {
      id: true,
      externalId: true,
      name: true,
      type: true,
      source: true,
      metadataJson: true
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  return objects.map(mapSpaceObject).sort((left, right) => {
    const leftSeedIndex = activeSpaceObjectExternalIds.indexOf(left.externalId as typeof activeSpaceObjectExternalIds[number]);
    const rightSeedIndex = activeSpaceObjectExternalIds.indexOf(right.externalId as typeof activeSpaceObjectExternalIds[number]);

    if (leftSeedIndex !== -1 || rightSeedIndex !== -1) {
      return (leftSeedIndex === -1 ? Number.MAX_SAFE_INTEGER : leftSeedIndex)
        - (rightSeedIndex === -1 ? Number.MAX_SAFE_INTEGER : rightSeedIndex);
    }

    return left.name.localeCompare(right.name);
  });
}

async function syncLiveAsteroidObjects(liveSpaceData: ExternalSpaceData): Promise<DashboardObject[]> {
  await prisma.spaceObject.deleteMany({
    where: {
      source: LIVE_NEOWS_SOURCE,
      externalId: {
        startsWith: MOCK_NEOWS_EXTERNAL_ID_PREFIX
      },
      watchlistItems: {
        none: {}
      },
      missions: {
        none: {}
      }
    }
  });

  if (liveSpaceData.sourceModes.asteroids !== "live") {
    return [];
  }

  if (liveSpaceData.asteroids.length === 0) {
    return [];
  }

  const currentExternalIds = liveSpaceData.asteroids.map((asteroid) => getLiveNeoExternalId(asteroid.id));
  const objects = await Promise.all(liveSpaceData.asteroids.map((asteroid) => prisma.spaceObject.upsert({
    where: {
      externalId: getLiveNeoExternalId(asteroid.id)
    },
    update: {
      name: asteroid.name.replace(/[()]/g, ""),
      type: "near-earth-object",
      source: LIVE_NEOWS_SOURCE,
      metadataJson: {
        description: `NASA NeoWs close-approach object for ${asteroid.closeApproachDate}.`,
        category: "near-earth-object",
        closeApproachDate: asteroid.closeApproachDate,
        missDistanceKm: asteroid.missDistanceKm,
        relativeVelocityKmH: asteroid.relativeVelocityKmH,
        diameterMeters: asteroid.diameterMeters,
        isPotentiallyHazardous: asteroid.isPotentiallyHazardous,
        syncedFrom: "NASA NeoWs"
      }
    },
    create: {
      externalId: getLiveNeoExternalId(asteroid.id),
      name: asteroid.name.replace(/[()]/g, ""),
      type: "near-earth-object",
      source: LIVE_NEOWS_SOURCE,
      metadataJson: {
        description: `NASA NeoWs close-approach object for ${asteroid.closeApproachDate}.`,
        category: "near-earth-object",
        closeApproachDate: asteroid.closeApproachDate,
        missDistanceKm: asteroid.missDistanceKm,
        relativeVelocityKmH: asteroid.relativeVelocityKmH,
        diameterMeters: asteroid.diameterMeters,
        isPotentiallyHazardous: asteroid.isPotentiallyHazardous,
        syncedFrom: "NASA NeoWs"
      }
    },
    select: {
      id: true,
      externalId: true,
      name: true,
      type: true,
      source: true,
      metadataJson: true
    }
  })));

  await prisma.spaceObject.deleteMany({
    where: {
      source: LIVE_NEOWS_SOURCE,
      externalId: {
        notIn: currentExternalIds
      },
      watchlistItems: {
        none: {}
      },
      missions: {
        none: {}
      }
    }
  });

  return objects.map(mapSpaceObject);
}

export async function getDashboardObjects(): Promise<DashboardObject[]> {
  return listTrackableSpaceObjects();
}

export async function getDashboardData(): Promise<DashboardData> {
  const liveSpaceData = await getExternalSpaceData();
  await syncLiveAsteroidObjects(liveSpaceData);
  const spaceObjects = await listTrackableSpaceObjects();
  const featuredObject = spaceObjects.find((object) => object.externalId === "apod") ?? spaceObjects[0] ?? null;

  return {
    featuredObject,
    spaceObjects,
    liveSpaceData
  };
}
