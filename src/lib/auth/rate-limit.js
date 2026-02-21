import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const BLOCK_MS = 15 * 60 * 1000;

function hashKey(input) {
  return createHash("sha256").update(input).digest("hex");
}

export function getRateLimitKey({ email, ipAddress }) {
  return hashKey(`${email.toLowerCase()}|${ipAddress || "unknown"}`);
}

export async function getRateLimitState(key) {
  const now = new Date();
  const existing = await prisma.loginRateLimit.findUnique({ where: { key } });
  if (!existing) {
    return { blocked: false, remainingAttempts: MAX_ATTEMPTS };
  }

  if (existing.blockedUntil && existing.blockedUntil > now) {
    return {
      blocked: true,
      blockedUntil: existing.blockedUntil,
      remainingAttempts: 0,
    };
  }

  return { blocked: false, remainingAttempts: Math.max(0, MAX_ATTEMPTS - existing.attempts) };
}

export async function registerFailedAttempt(key) {
  const now = new Date();
  const windowStartThreshold = new Date(now.getTime() - WINDOW_MS);
  const existing = await prisma.loginRateLimit.findUnique({ where: { key } });

  if (!existing) {
    await prisma.loginRateLimit.create({
      data: {
        key,
        attempts: 1,
        windowStart: now,
      },
    });
    return { blocked: false, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  if (existing.blockedUntil && existing.blockedUntil > now) {
    return { blocked: true, blockedUntil: existing.blockedUntil, remainingAttempts: 0 };
  }

  const inCurrentWindow = existing.windowStart > windowStartThreshold;
  const attempts = inCurrentWindow ? existing.attempts + 1 : 1;
  const blockedUntil = attempts >= MAX_ATTEMPTS ? new Date(now.getTime() + BLOCK_MS) : null;

  await prisma.loginRateLimit.update({
    where: { key },
    data: {
      attempts,
      windowStart: inCurrentWindow ? existing.windowStart : now,
      blockedUntil,
    },
  });

  return {
    blocked: Boolean(blockedUntil),
    blockedUntil,
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - attempts),
  };
}

export async function clearRateLimit(key) {
  await prisma.loginRateLimit.upsert({
    where: { key },
    update: { attempts: 0, blockedUntil: null, windowStart: new Date() },
    create: { key, attempts: 0, windowStart: new Date(), blockedUntil: null },
  });
}
