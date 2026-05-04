import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as {
  testPrisma?: PrismaClient;
};

export const testPrisma = globalForPrisma.testPrisma ?? new PrismaClient();

if (!globalForPrisma.testPrisma) {
  globalForPrisma.testPrisma = testPrisma;
}

export async function findUserByEmail(email: string) {
  return testPrisma.user.findUnique({
    where: { email }
  });
}

export async function deleteUserByEmail(email: string) {
  await testPrisma.user.deleteMany({
    where: { email }
  });
}

export async function findSessionByUserId(userId: string) {
  return testPrisma.session.findFirst({
    where: { userId }
  });
}

export async function countSessionsByUserId(userId: string) {
  return testPrisma.session.count({
    where: { userId }
  });
}

export async function findSeededObjectByExternalId(externalId: string) {
  return testPrisma.spaceObject.findUnique({
    where: { externalId }
  });
}

export async function findMissionById(missionId: string) {
  return testPrisma.mission.findUnique({
    where: { id: missionId }
  });
}

export async function disconnectTestPrisma() {
  await testPrisma.$disconnect();
}
