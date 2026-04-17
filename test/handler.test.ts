import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleRequest } from "../src/handler";
import type { Env } from "../src/index";

const env: Env = {
  CLOUDFLARE_ACCOUNT_ID: "acct",
  CLOUDFLARE_API_KEY: "key",
};

const ctx = {} as ExecutionContext;

describe("handleRequest", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 400 when projectName is missing", async () => {
    const res = await handleRequest(
      new Request("https://example.com/"),
      env,
      ctx,
    );
    expect(res.status).toBe(400);
    expect(await res.text()).toBe("No project defined.");
  });

  it("returns a shield response when upstream succeeds", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          errors: [],
          result: {
            canonical_deployment: { latest_stage: { status: "success" } },
          },
        }),
        { status: 200 },
      ),
    );

    const res = await handleRequest(
      new Request(`https://example.com/?projectName=unique-${Date.now()}`),
      env,
      ctx,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { message: string; isError: boolean };
    expect(body.message).toBe("success");
    expect(body.isError).toBe(false);
  });
});
