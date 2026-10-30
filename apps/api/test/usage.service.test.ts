import { describe, expect, it, vi } from "vitest";
import { UsageService } from "../src/usage/usage.service";

function fixture(premium = false) {
  const documents = new Map<string, Record<string, unknown>>();
  const firestore = {
    collection: vi.fn(() => ({
      doc: (id: string) => ({ id }),
      where: () => ({ get: async () => ({ docs: [], size: 0 }) })
    })),
    runTransaction: async (work: (transaction: {
      get: (ref: { id: string }) => Promise<{ data: () => Record<string, unknown> | undefined }>;
      set: (ref: { id: string }, value: Record<string, unknown>) => void;
    }) => Promise<unknown>) => work({
      get: async (ref) => ({ data: () => documents.get(ref.id) }),
      set: (ref, value) => { documents.set(ref.id, value); }
    }),
    batch: () => ({ delete: vi.fn(), commit: vi.fn() })
  };
  const firebase = { firestore };
  const subscriptions = { isPremium: vi.fn().mockResolvedValue(premium) };
  return {
    service: new UsageService(firebase as never, subscriptions as never),
    subscriptions
  };
}

describe("UsageService", () => {
  it("allows one guest comparison and rejects the second", async () => {
    const { service, subscriptions } = fixture();
    const user = { id: "127.0.0.1", authType: "anonymous" as const };

    await expect(service.consume(user, "comparison")).resolves.toMatchObject({ plan: "guest", used: 1, limit: 1, remaining: 0 });
    await expect(service.consume(user, "comparison")).rejects.toMatchObject({ status: 429 });
    expect(subscriptions.isPremium).not.toHaveBeenCalled();
  });

  it("uses Starter limits for an authenticated free user", async () => {
    const { service } = fixture(false);
    const user = { id: "free-user", authType: "firebase" as const };

    for (let index = 1; index <= 5; index += 1) {
      await expect(service.consume(user, "comparison")).resolves.toMatchObject({ plan: "starter", used: index, limit: 5 });
    }
    await expect(service.consume(user, "comparison")).rejects.toMatchObject({ status: 429 });
  });

  it("uses Premium limits and permits international comparisons", async () => {
    const { service } = fixture(true);
    const user = { id: "premium-user", authType: "firebase" as const };

    await expect(service.consume(user, "imageRecognition")).resolves.toMatchObject({ plan: "premium", limit: 20, remaining: 19 });
    await expect(service.assertCountry(user, "US")).resolves.toBeUndefined();
  });

  it("restricts international comparisons for Starter", async () => {
    const { service } = fixture(false);
    const user = { id: "free-user", authType: "firebase" as const };

    await expect(service.assertCountry(user, "PT")).resolves.toBeUndefined();
    await expect(service.assertCountry(user, "GB")).rejects.toMatchObject({ status: 403 });
  });
});
