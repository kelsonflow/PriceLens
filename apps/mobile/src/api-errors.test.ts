import { describe, expect, it } from "vitest";
import { ApiError, classifyApiFailure } from "./api-errors";

describe("classifyApiFailure", () => {
  it("distinguishes account quotas", () => {
    const quota = (plan: string) => new ApiError(429, "MONTHLY_USAGE_LIMIT_REACHED", "Limit", { plan });
    expect(classifyApiFailure(quota("guest"))).toBe("usage_guest");
    expect(classifyApiFailure(quota("starter"))).toBe("usage_starter");
    expect(classifyApiFailure(quota("premium"))).toBe("usage_premium");
  });

  it("distinguishes throttling, authentication, and network failures", () => {
    expect(classifyApiFailure(new ApiError(429))).toBe("rate_limit");
    expect(classifyApiFailure(new ApiError(401))).toBe("authentication");
    expect(classifyApiFailure(new TypeError("Network request failed"))).toBe("network");
  });
});
