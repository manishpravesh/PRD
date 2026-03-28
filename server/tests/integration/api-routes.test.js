import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/index.js";

describe("API routing and protection", () => {
  it("serves API root payload from /api/v1", async () => {
    const app = createApp();
    const response = await request(app).get("/api/v1");

    expect(response.status).toBe(200);
    expect(response.body.version).toBe("v1");
  });

  it("serves API root payload from /api/v1/", async () => {
    const app = createApp();
    const response = await request(app).get("/api/v1/");

    expect(response.status).toBe(200);
    expect(response.body.version).toBe("v1");
  });

  it("protects admin route without bearer token", async () => {
    const app = createApp();
    const response = await request(app).get("/api/v1/admin/health");

    expect(response.status).toBe(401);
    expect(response.body.error).toMatch(/Missing Bearer token/i);
  });

  it("returns 404 payload for unknown route", async () => {
    const app = createApp();
    const response = await request(app).get("/not-found");

    expect(response.status).toBe(404);
    expect(response.body.ok).toBe(false);
    expect(response.body.error).toMatch(/Route not found/i);
  });
});
