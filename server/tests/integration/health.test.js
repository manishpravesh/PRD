import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/index.js";

describe("GET /health", () => {
  it("returns service health payload", async () => {
    const app = createApp();
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.service).toBe("golf-charity-server");
    expect(typeof response.body.timestamp).toBe("string");
  });
});
