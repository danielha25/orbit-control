import { test, expect } from "@/../tests/fixtures/test-fixtures";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  readApiEnvelope,
  registerUser
} from "@/../tests/utils/api";
import {
  countSessionsByUserId,
  deleteUserByEmail,
  findSessionByUserId,
  findUserByEmail
} from "@/../tests/utils/db";

test.describe("Authentication API smoke coverage", () => {
  test("creates a session on login and removes it on logout", async ({
    request,
    registeredUser
  }) => {
    const loginResponse = await loginUser(request, registeredUser);
    expect(loginResponse.status()).toBe(200);

    const user = await findUserByEmail(registeredUser.email);
    expect(user).not.toBeNull();

    const createdSession = await findSessionByUserId(user!.id);
    expect(createdSession).not.toBeNull();

    const meResponse = await getCurrentUser(request);
    expect(meResponse.status()).toBe(200);

    const meBody = await readApiEnvelope<{ id: string; email: string }>(meResponse);
    expect(meBody.error).toBeNull();
    expect(meBody.data.email).toBe(registeredUser.email);

    const logoutResponse = await logoutUser(request);
    expect(logoutResponse.status()).toBe(200);

    const remainingSessions = await countSessionsByUserId(user!.id);
    expect(remainingSessions).toBe(0);

    const meAfterLogoutResponse = await getCurrentUser(request);
    expect(meAfterLogoutResponse.status()).toBe(401);
  });

  test("rejects login when the password is invalid", async ({
    request,
    registeredUser
  }) => {
    const invalidLoginResponse = await loginUser(request, {
      email: registeredUser.email,
      password: "WrongPassword123!"
    });

    expect(invalidLoginResponse.status()).toBe(401);

    const invalidLoginBody = await readApiEnvelope<null>(invalidLoginResponse);
    expect(invalidLoginBody.data).toBeNull();
    expect(invalidLoginBody.error).toBe("Invalid email or password");
  });

  test("rejects /me without an active session", async ({ request }) => {
    const response = await getCurrentUser(request);

    expect(response.status()).toBe(401);

    const body = await readApiEnvelope<null>(response);
    expect(body.data).toBeNull();
    expect(body.error).toBe("Unauthorized");
  });

  test("successfully creates a user", async ({ request, userCredentials }) => {
    try {
      const newUser = await registerUser(request, userCredentials);
      expect(newUser.status()).toBe(201);

      const response = await readApiEnvelope<{ id: string; email: string }>(newUser);
      expect(response.error).toBeNull();
      expect(response.data.email).toBe(userCredentials.email);

      const foundUser = await findUserByEmail(userCredentials.email);
      expect(foundUser).not.toBeNull();
      expect(foundUser?.email).toBe(userCredentials.email);
    } finally {
      await deleteUserByEmail(userCredentials.email);
    }
  });


  test("rejects registering a duplicate email", async ({ request, registeredUser }) => {
    const response = await registerUser(request, registeredUser);

    expect(response.status()).toBe(400);

    const body = await readApiEnvelope<null>(response);
    expect(body.data).toBeNull();
    expect(body.error).toBe("User already exists");
  });

  test("login with invalid body returns 400 response", async ({ request }) => {
    const loginRequest = await loginUser(request, {
      email: "user@example.com",
      password: ""
    });

    expect(loginRequest.status()).toBe(400);

    const response = await readApiEnvelope<null>(loginRequest);
    expect(response.error).toBe("Email and password are required");
    expect(response.data).toBeNull();
  });
});
