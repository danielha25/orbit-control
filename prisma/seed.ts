import { PrismaClient, MissionPriority, MissionStatus, WatchlistItemStatus } from "@prisma/client";

const prisma = new PrismaClient();

const seededObjects = [
  {
    externalId: "apod",
    name: "APOD",
    type: "image-feed",
    source: "seed",
    metadataJson: {
      description: "NASA Astronomy Picture of the Day live media signal.",
      category: "daily-media"
    }
  },
  {
    externalId: "iss",
    name: "ISS",
    type: "station",
    source: "seed",
    metadataJson: {
      description: "International Space Station live orbital position signal.",
      category: "orbital-tracking"
    }
  },
  {
    externalId: "near-earth-asteroids",
    name: "Near-Earth Asteroids",
    type: "asteroid-feed",
    source: "seed",
    metadataJson: {
      description: "NASA NeoWs close-approach feed for near-earth object monitoring.",
      category: "near-earth-tracking"
    }
  }
] as const;

const deprecatedObjectExternalIds = [
  "mars",
  "jupiter",
  "asteroid-2026-ab1"
] as const;

const testUserEmail = "testuser@orbit-control.local";
const testUserPasswordHash = "$argon2id$v=19$m=65536,t=3,p=4$jbJ+ch801c+WLCbW9F7Wig$GMTE1qucK9MY9oAqEKBXDwgHNDfa66BWC6C6IX4jPOE";

async function main() {
  for (const object of seededObjects) {
    await prisma.spaceObject.upsert({
      where: { externalId: object.externalId },
      update: {
        name: object.name,
        type: object.type,
        source: object.source,
        metadataJson: object.metadataJson
      },
      create: object
    });
  }

  for (const externalId of deprecatedObjectExternalIds) {
    await prisma.spaceObject.updateMany({
      where: {
        externalId,
        source: "seed"
      },
      data: {
        source: "deprecated-seed",
        metadataJson: {
          description: "Deprecated deterministic target kept only to preserve existing local relations.",
          category: "deprecated"
        }
      }
    });
  }

  const testUser = await prisma.user.upsert({
    where: { email: testUserEmail },
    update: {
      passwordHash: testUserPasswordHash
    },
    create: {
      email: testUserEmail,
      passwordHash: testUserPasswordHash
    }
  });

  const issObject = await prisma.spaceObject.findUniqueOrThrow({
    where: { externalId: "iss" }
  });

  const asteroidFeedObject = await prisma.spaceObject.findUniqueOrThrow({
    where: { externalId: "near-earth-asteroids" }
  });

  await prisma.watchlistItem.upsert({
    where: {
      userId_objectId: {
        userId: testUser.id,
        objectId: issObject.id
      }
    },
    update: {
      status: WatchlistItemStatus.WATCHING
    },
    create: {
      userId: testUser.id,
      objectId: issObject.id,
      status: WatchlistItemStatus.WATCHING
    }
  });

  await prisma.mission.upsert({
    where: {
      id: "11111111-1111-1111-1111-111111111111"
    },
    update: {
      userId: testUser.id,
      objectId: asteroidFeedObject.id,
      title: "Baseline Near-Earth Asteroid Monitoring",
      status: MissionStatus.MONITORING,
      priority: MissionPriority.MEDIUM,
      notes: "Seeded mission for deterministic asteroid feed verification."
    },
    create: {
      id: "11111111-1111-1111-1111-111111111111",
      userId: testUser.id,
      objectId: asteroidFeedObject.id,
      title: "Baseline Near-Earth Asteroid Monitoring",
      status: MissionStatus.MONITORING,
      priority: MissionPriority.MEDIUM,
      notes: "Seeded mission for deterministic asteroid feed verification."
    }
  });
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
