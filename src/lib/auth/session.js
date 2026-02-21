import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "am_session";
const SESSION_TTL_DAYS = 14;
const SESSION_TOUCH_INTERVAL_MS = 5 * 60 * 1000;

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function getExpiryDate() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);
  return expiresAt;
}

function getClientMeta(headers) {
  const forwarded = headers.get("x-forwarded-for");
  const ipAddress = forwarded ? forwarded.split(",")[0].trim() : headers.get("x-real-ip");
  const userAgent = headers.get("user-agent");
  return { ipAddress: ipAddress || null, userAgent: userAgent || null };
}

export async function createSession({ userId, headers }) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = getExpiryDate();
  const { ipAddress, userAgent } = getClientMeta(headers);

  await prisma.userSession.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
      ipAddress,
      userAgent,
    },
  });

  return { token, expiresAt };
}

export async function validateSessionToken(token) {
  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);
  const session = await prisma.userSession.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    return null;
  }

  if (Date.now() - session.lastSeenAt.getTime() > SESSION_TOUCH_INTERVAL_MS) {
    await prisma.userSession.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date() },
    });
  }

  return session;
}

export async function getSessionFromCookieStore() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const session = await validateSessionToken(token);
  return session;
}

export function buildSessionCookie(token, expiresAt) {
  return {
    name: SESSION_COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    },
  };
}

export function buildClearedSessionCookie() {
  return {
    name: SESSION_COOKIE_NAME,
    value: "",
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    },
  };
}

export async function revokeSessionByToken(token) {
  if (!token) {
    return;
  }

  await prisma.userSession.updateMany({
    where: {
      tokenHash: hashToken(token),
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

export async function revokeAllUserSessions(userId) {
  await prisma.userSession.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}
