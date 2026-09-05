import { describe, expect, it } from "vitest";
import { UserDataService } from "../src/user-data/user-data.service";

describe("UserDataService", () => {
  it("keeps saved items scoped by user", () => {
    const service = new UserDataService();

    service.create("user-a", "favorite", "iPhone", { price: 799 });
    service.create("user-b", "favorite", "MacBook", { price: 1299 });

    expect(service.list("user-a")).toHaveLength(1);
    expect(service.list("user-a")[0].title).toBe("iPhone");
    expect(service.list("user-b")[0].title).toBe("MacBook");
  });

  it("updates and removes user-owned items", () => {
    const service = new UserDataService();
    const item = service.create("user-a", "history", "Old title", {});

    const updated = service.update("user-a", item.id, { title: "New title" });
    expect(updated.title).toBe("New title");

    service.remove("user-a", item.id);
    expect(service.list("user-a")).toEqual([]);
  });
});
