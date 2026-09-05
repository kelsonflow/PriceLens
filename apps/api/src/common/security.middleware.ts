import type { NextFunction, Request, Response } from "express";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function securityHeadersMiddleware(_request: Request, response: Response, next: NextFunction) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "no-referrer");
  next();
}

export function apiAccessTokenMiddleware(request: Request, response: Response, next: NextFunction) {
  const expected = process.env.API_ACCESS_TOKEN;
  if (!expected || request.path === "/health") {
    next();
    return;
  }

  const apiKey = firstHeaderValue(request.headers["x-api-key"]);
  const bearer = firstHeaderValue(request.headers.authorization)?.replace(/^Bearer\s+/i, "");
  if (apiKey === expected || bearer === expected) {
    next();
    return;
  }

  response.status(401).json({ statusCode: 401, message: "API access token required" });
}

export function rateLimitMiddleware(request: Request, response: Response, next: NextFunction) {
  const limit = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 120);
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
  if (limit <= 0 || request.path === "/health") {
    next();
    return;
  }

  const now = Date.now();
  const key = `${firstHeaderValue(request.headers["x-user-id"]) ?? request.ip}:${request.path}`;
  const current = rateLimitStore.get(key);
  const entry = current && current.resetAt > now ? current : { count: 0, resetAt: now + windowMs };
  entry.count += 1;
  rateLimitStore.set(key, entry);

  response.setHeader("RateLimit-Limit", String(limit));
  response.setHeader("RateLimit-Remaining", String(Math.max(0, limit - entry.count)));
  response.setHeader("RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

  if (entry.count > limit) {
    response.status(429).json({ statusCode: 429, message: "Rate limit exceeded" });
    return;
  }

  cleanupRateLimitStore(now);
  next();
}

function cleanupRateLimitStore(now: number) {
  if (rateLimitStore.size < 1000) return;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
