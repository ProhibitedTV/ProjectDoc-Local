import { describe, expect, it } from "vitest";

import { loadApiEnv, loadWebEnv, loadWorkerEnv } from "./index";

describe("environment loaders", () => {
  it("applies sane API defaults", () => {
    const env = loadApiEnv({});

    expect(env.API_PORT).toBe(3000);
    expect(env.API_PREFIX).toBe("api");
    expect(env.UPLOAD_MAX_BYTES).toBe(25 * 1024 * 1024);
  });

  it("parses worker polling interval", () => {
    const env = loadWorkerEnv({
      WORKER_POLL_INTERVAL_MS: "15000"
    });

    expect(env.WORKER_POLL_INTERVAL_MS).toBe(15000);
  });

  it("keeps the web client on the API prefix by default", () => {
    const env = loadWebEnv({});

    expect(env.VITE_API_BASE_URL).toBe("/api");
  });
});
