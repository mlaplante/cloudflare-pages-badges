import type { Env } from "./index";
import { getProject } from "./service";
import { createResponse } from "./shield";

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

    return new Response(JSON.stringify(createResponse(status)), {
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
    });
  } catch (error) {
    console.log((error as Error).toString());
    return new Response("Failed to resolve project.", { status: 400 });
  }
}
