import { describe, it, expect } from "vitest";
import { createResponse } from "../src/shield";

describe("createResponse", () => {
  it("returns a success badge", () => {
    const res = createResponse("success");
    expect(res.schemaVersion).toBe(1);
    expect(res.label).toBe("Cloudflare Pages");
    expect(res.message).toBe("success");
    expect(res.color).toBe("success");
    expect(res.isError).toBe(false);
    expect(res.namedLogo).toBe("cloudflare");
    expect(res.cacheSeconds).toBe(60);
  });

  it("marks failure as error", () => {
    const res = createResponse("failure");
    expect(res.isError).toBe(true);
    expect(res.color).toBe("critical");
  });

  it("marks canceled as error", () => {
    const res = createResponse("canceled");
    expect(res.isError).toBe(true);
    expect(res.color).toBe("inactive");
  });

  it("maps idle and active statuses", () => {
    expect(createResponse("idle").color).toBe("informational");
    expect(createResponse("active").color).toBe("green");
  });
});
