import { describe, expect, it } from "vitest";
import { notificationTargetUrl } from "./notification-target";

describe("notificationTargetUrl", () => {
  it("opens the offer URL for a price alert", () => {
    expect(notificationTargetUrl({ type: "price-alert", productUrl: "https://shop.example/item" })).toBe("https://shop.example/item");
  });

  it("rejects missing and unsafe URLs", () => {
    expect(notificationTargetUrl({ type: "price-alert" })).toBeUndefined();
    expect(notificationTargetUrl({ type: "price-alert", productUrl: "javascript:alert(1)" })).toBeUndefined();
  });
});
