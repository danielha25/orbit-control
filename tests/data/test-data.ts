export type TestUserCredentials = {
  email: string;
  password: string;
};

function createUniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createTestUserCredentials(prefix: string): TestUserCredentials {
  return {
    email: `${prefix}-${createUniqueSuffix()}@orbit-control.local`,
    password: "Password123!"
  };
}
