import type { Env } from "./index";
import { getProject } from "./service";
import { createResponse } from "./shield";

const EDGE_TTL_SECONDS = 60;

export async function handleRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const projectName = searchParams.get("projectName");
  if (!projectName) {
    return new Response("No project defined.", { status: 400 });
  }

  // Edge cache: identical badge fetches (same URL) within EDGE_TTL_SECONDS
  // are served directly from Cloudflare's cache without invoking this Worker.
  // README badges typically poll on every page view, so a 60s TTL turns
  // dozens of repeat requests into a single Worker invocation.
  const cache = caches.default;
  const cacheKey = new Request(request.url, { method: "GET" });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  try {
    const project = await getProject(env, ctx, projectName);
    if (!project) {
      return new Response("Project not found.", { status: 400 });
    }

    const status = project?.canonical_deployment?.latest_stage?.status;
    if (!status) {
      console.error({
        message: "Failed to resolve project status",
        response: project,
      });
      return new Response("Failed to resolve project status.", { status: 400 });
    }

    const response = new Response(JSON.stringify(createResponse(status)), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": `public, max-age=${EDGE_TTL_SECONDS}`,
      },
    });
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (error) {
    console.log((error as Error).toString());
    return new Response("Failed to resolve project.", { status: 400 });
  }
}
