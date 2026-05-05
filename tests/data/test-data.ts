export type TestUserCredentials = {
  email: string;
  password: string;
};

export const TEST_OBJECTS = {
  APOD: "apod",
  ISS: "iss",
  NEAR_EARTH_ASTEROIDS: "near-earth-asteroids"
} as const;

function createUniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createTestUserCredentials(prefix: string): TestUserCredentials {
  return {
    email: `${prefix}-${createUniqueSuffix()}@orbit-control.local`,
    password: "Password123!"
  };
}
