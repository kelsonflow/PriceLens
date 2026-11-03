export type ApiFailureKind = "usage_guest" | "usage_starter" | "usage_premium" | "authentication" | "rate_limit" | "network" | "service";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code?: string,
    message = "Request failed",
    readonly details: Record<string, unknown> = {}
  ) { super(message); }
}

export function classifyApiFailure(cause: unknown): ApiFailureKind {
  if (!(cause instanceof ApiError)) return "network";
  if (cause.code === "MONTHLY_USAGE_LIMIT_REACHED") {
    if (cause.details.plan === "guest") return "usage_guest";
    if (cause.details.plan === "premium") return "usage_premium";
    return "usage_starter";
  }
  if (cause.status === 401 || cause.status === 403) return "authentication";
  if (cause.status === 429) return "rate_limit";
  return "service";
}
