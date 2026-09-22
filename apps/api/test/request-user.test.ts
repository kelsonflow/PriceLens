import { describe, expect, it } from "vitest";
import { resolveRequestUser } from "../src/common/request-user.decorator";

describe("resolveRequestUser", () => {
  it("uses the verified Firebase identity instead of untrusted headers", () => {
    const user = resolveRequestUser({
      headers: { "x-user-id": "spoofed-user" },
      ip: "127.0.0.1",
      firebaseUser: { uid: "firebase-user", email: "user@example.com", name: "Test User" }
    });

    expect(user).toEqual({
      id: "firebase-user",
      authType: "firebase",
      email: "user@example.com",
      name: "Test User",
      picture: undefined
    });
  });

  it("does not treat an unverified bearer token as a user id", () => {
    const user = resolveRequestUser({
      headers: { authorization: "Bearer unverified-token" },
      ip: "127.0.0.1"
    });

    expect(user.authType).toBe("anonymous");
    expect(user.id).not.toBe("unverified-token");
  });
});
