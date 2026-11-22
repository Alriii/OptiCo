import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "@/app";

describe("API Security and Public Endpoints", () => {
  it("GET /api/v1/health/live returns status live and uptime", async () => {
    const res = await request(app).get("/api/v1/health/live");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.status).toBe("live");
    expect(typeof res.body.data.uptimeSeconds).toBe("number");
  });

  it("enforces Helmet security headers", async () => {
    const res = await request(app).get("/api/v1/health/live");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBe("SAMEORIGIN");
  });

  it("assigns and echoes x-request-id correlation header", async () => {
    const customId = "test-correlation-12345";
    const res = await request(app)
      .get("/api/v1/health/live")
      .set("x-request-id", customId);
    expect(res.headers["x-request-id"]).toBe(customId);
  });

  it("GET /api/v1/auth/csrf-token issues a CSRF token", async () => {
    const res = await request(app).get("/api/v1/auth/csrf-token");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(typeof res.body.data.csrfToken).toBe("string");
    expect(res.body.data.csrfToken.length).toBeGreaterThan(0);
  });

  it("returns 401 for protected patient routes without session", async () => {
    const res = await request(app).get("/api/v1/patient/profile");
    expect(res.status).toBe(401);
    expect(res.body.status).toBe("error");
  });

  it("returns 401 for protected doctor routes without session", async () => {
    const res = await request(app).get("/api/v1/doctor/schedule/today");
    expect(res.status).toBe(401);
    expect(res.body.status).toBe("error");
  });

  it("returns 401 for protected staff routes without session", async () => {
    const res = await request(app).get("/api/v1/staff/appointments/pending");
    expect(res.status).toBe(401);
    expect(res.body.status).toBe("error");
  });

  it("returns 401 for protected admin routes without session", async () => {
    const res = await request(app).get("/api/v1/admin/overview");
    expect(res.status).toBe(401);
    expect(res.body.status).toBe("error");
  });

  it("returns 404 for unknown endpoints", async () => {
    const res = await request(app).get("/api/v1/nonexistent");
    expect(res.status).toBe(404);
    expect(res.body.status).toBe("error");
  });
});
