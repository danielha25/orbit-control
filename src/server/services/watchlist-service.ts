import { prisma } from "@/lib/prisma";

type SpaceObjectMetadata = {
  description: string;
  category: string;
};

type WatchlistObject = {
  id: string;
  externalId: string;
  name: string;
  type: string;
  source: string;
  metadata: SpaceObjectMetadata;
};

export type WatchlistItemData = {
  id: string;
  status: string;
  createdAt: string;
  object: WatchlistObject;
};

type AddWatchlistResult =
  | { data: WatchlistItemData; error: null }
  | { data: null; error: string; code: "not_found" | "duplicate" };

type DeleteWatchlistResult =
  | { data: { id: string; deleted: true }; error: null }
  | { data: null; error: string; code: "not_found" };

const trackableObjectSources = new Set(["seed", "live-neows"]);
const mockNeoWsExternalIdPrefix = "neows-mock-";
const watchlistStatusReverseMap: Record<string, string> = {
  WATCHING: "watching",
  PAUSED: "paused",
  ARCHIVED: "archived"
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

  return {
    description,
    category
  };
}

function mapWatchlistItem(item: {
  id: string;
  status: string;
  createdAt: Date;
  object: {
    id: string;
    externalId: string;
    name: string;
    type: string;
    source: string;
    metadataJson: unknown;
  };
}): WatchlistItemData {
  return {
    id: item.id,
    status: watchlistStatusReverseMap[item.status] ?? item.status.toLowerCase(),
    createdAt: item.createdAt.toISOString(),
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

export async function listWatchlistItems(userId: string): Promise<WatchlistItemData[]> {
  const items = await prisma.watchlistItem.findMany({
    where: {
      userId
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
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
    orderBy: {
      createdAt: "asc"
    }
  });

  return items.map(mapWatchlistItem);
}

export async function getWatchlistObjectIds(userId: string): Promise<string[]> {
  const items = await prisma.watchlistItem.findMany({
    where: {
      userId
    },
    select: {
      objectId: true
    }
  });

  return items.map((item) => item.objectId);
}

export async function addWatchlistItem(userId: string, objectId: string): Promise<AddWatchlistResult> {
  const spaceObject = await prisma.spaceObject.findUnique({
    where: {
      id: objectId
    },
    select: {
      id: true,
      source: true,
      externalId: true
    }
  });

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

  const existingItem = await prisma.watchlistItem.findUnique({
    where: {
      userId_objectId: {
        userId,
        objectId
      }
    },
    select: {
      id: true
    }
  });

  if (existingItem) {
    return {
      data: null,
      error: "Space object already in watchlist",
      code: "duplicate"
    };
  }

  const item = await prisma.watchlistItem.create({
    data: {
      userId,
      objectId
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
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
    data: mapWatchlistItem(item),
    error: null
  };
}

export async function deleteWatchlistItem(userId: string, watchlistItemId: string): Promise<DeleteWatchlistResult> {
  const item = await prisma.watchlistItem.findFirst({
    where: {
      id: watchlistItemId,
      userId
    },
    select: {
      id: true
    }
  });

  if (!item) {
    return {
      data: null,
      error: "Watchlist item not found",
      code: "not_found"
    };
  }

  await prisma.watchlistItem.delete({
    where: {
      id: watchlistItemId
    }
  });

  return {
    data: {
      id: watchlistItemId,
      deleted: true
    },
    error: null
  };
}
