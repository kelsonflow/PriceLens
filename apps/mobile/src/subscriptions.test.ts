import { describe, expect, it } from "vitest";
import { friendlySubscriptionError } from "./subscription-errors";

describe("friendlySubscriptionError", () => {
  it("hides RevenueCat DNS details and explains the recovery steps", () => {
    expect(friendlySubscriptionError('Unable to resolve host "api-production.8-lives-cat.io": No address associated with hostname'))
      .toBe("Sem ligação à loja. Verifica a Internet, desativa temporariamente a VPN ou o DNS privado e tenta novamente.");
  });

  it("uses a safe generic message for unknown store failures", () => {
    expect(friendlySubscriptionError("Unexpected SDK failure"))
      .toBe("Não foi possível comunicar com a loja. Tenta novamente.");
  });
});
