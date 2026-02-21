import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

const SCRYPT_PARAMS = {
  N: 32768,
  r: 8,
  p: 1,
  keylen: 64,
  maxmem: 128 * 1024 * 1024,
};

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, SCRYPT_PARAMS.keylen, {
    N: SCRYPT_PARAMS.N,
    r: SCRYPT_PARAMS.r,
    p: SCRYPT_PARAMS.p,
    maxmem: SCRYPT_PARAMS.maxmem,
  });

  return `scrypt$${SCRYPT_PARAMS.N}$${SCRYPT_PARAMS.r}$${SCRYPT_PARAMS.p}$${salt.toString("base64")}$${Buffer.from(
    derived,
  ).toString("base64")}`;
}

export async function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.startsWith("scrypt$")) {
    return false;
  }

  const [scheme, n, r, p, saltBase64, hashBase64] = storedHash.split("$");
  if (scheme !== "scrypt" || !n || !r || !p || !saltBase64 || !hashBase64) {
    return false;
  }

  const salt = Buffer.from(saltBase64, "base64");
  const expected = Buffer.from(hashBase64, "base64");
  const actual = await scrypt(password, salt, expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: SCRYPT_PARAMS.maxmem,
  });

  const actualBuffer = Buffer.from(actual);
  if (actualBuffer.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expected);
}
