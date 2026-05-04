import { createSession, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type AuthUser = {
  id: string;
  email: string;
};

type ServiceResult =
  | { data: AuthUser; error: null }
  | { data: null; error: string };

export async function registerUser(email: string, password: string): Promise<ServiceResult> {
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return {
      data: null,
      error: "User already exists"
    };
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash
    },
    select: {
      id: true,
      email: true
    }
  });

  return {
    data: user,
    error: null
  };
}

export async function loginUser(email: string, password: string): Promise<ServiceResult> {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    return {
      data: null,
      error: "Invalid email or password"
    };
  }

  const passwordIsValid = await verifyPassword(password, user.passwordHash);

  if (!passwordIsValid) {
    return {
      data: null,
      error: "Invalid email or password"
    };
  }

  await createSession(user.id);

  return {
    data: {
      id: user.id,
      email: user.email
    },
    error: null
  };
}
