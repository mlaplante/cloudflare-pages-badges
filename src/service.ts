import type { Env } from "./index";
import type { CloudflareResponse, Project } from "./types";

const handleResponse = (
  res: Response,
): Promise<CloudflareResponse<Project>> => {
  if (!res.ok) {
    throw new Error(`Invalid response: ${res.status}`);
  }
  return res.json();
};

interface CachedProject {
  cachedAt: number;
  project?: Project;
}

const cachedProjects: Record<string, CachedProject> = {};

export async function getProject(
  env: Env,
  _ctx: ExecutionContext,
  projectName: string,
): Promise<Project | undefined> {
  const cached = cachedProjects[projectName];
  if (cached?.cachedAt && Date.now() - cached.cachedAt < 60 * 1000) {
    return cached.project;
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(
    env.CLOUDFLARE_ACCOUNT_ID,
  )}/pages/projects/${encodeURIComponent(projectName)}`;
  const resp = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${env.CLOUDFLARE_API_KEY}`,
    },
  });
  const project = (await handleResponse(resp))?.result;

  cachedProjects[projectName] = {
    cachedAt: Date.now(),
    project,
  };

  return project;
}
