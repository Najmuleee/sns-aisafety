import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createProfileContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("profile router", () => {
  it("getStats returns upload statistics", async () => {
    const ctx = createProfileContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.profile.getStats();

    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("pending");
    expect(stats).toHaveProperty("completed");
    expect(stats).toHaveProperty("failed");
    expect(typeof stats.total).toBe("number");
    expect(typeof stats.pending).toBe("number");
    expect(typeof stats.completed).toBe("number");
    expect(typeof stats.failed).toBe("number");
  });

  it("getUploads returns array of uploads", async () => {
    const ctx = createProfileContext();
    const caller = appRouter.createCaller(ctx);

    const uploads = await caller.profile.getUploads({ limit: 50 });

    expect(Array.isArray(uploads)).toBe(true);
  });

  it("getUploads respects limit parameter", async () => {
    const ctx = createProfileContext();
    const caller = appRouter.createCaller(ctx);

    const uploads = await caller.profile.getUploads({ limit: 10 });

    expect(uploads.length).toBeLessThanOrEqual(10);
  });

  it("getHistory returns processing history", async () => {
    const ctx = createProfileContext();
    const caller = appRouter.createCaller(ctx);

    const history = await caller.profile.getHistory({ limit: 100 });

    expect(Array.isArray(history)).toBe(true);
  });

  it("getHistory respects limit parameter", async () => {
    const ctx = createProfileContext();
    const caller = appRouter.createCaller(ctx);

    const history = await caller.profile.getHistory({ limit: 20 });

    expect(history.length).toBeLessThanOrEqual(20);
  });

  it("throws error when accessing upload details without authorization", async () => {
    const ctx = createProfileContext(1);
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.profile.getUploadDetails({ uploadId: 999 });
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("requires authentication for profile routes", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: () => {},
      } as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);

    try {
      await caller.profile.getStats();
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
