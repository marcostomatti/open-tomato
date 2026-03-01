import {
  getSortedProjectIssues,
  getSortedTeamProjects,
  getTeams,
} from './utils/linear';
import https from 'https';
import { getRepoPath } from './utils/git';

type Selection = {
  teamId: string;
  projectId: string;
  issueId: string;
};

type BootstrapResponse = {
  success: boolean;
  status: string;
  issue_id: string;
  issue_title: string;
  branch: string;
  plan_url?: string;
  prerequisites_url?: string;
};

const BOOTSTRAP_TIMEOUT_MS = 5 * 60 * 1000;
const IS_DEV = process.env.NODE_ENV !== 'production';

async function pickNextIssue(): Promise<Selection> {
  const teams = await getTeams();

  if (teams.length === 0) {
    throw new Error('No teams found in this Linear workspace.');
  }

  for (const team of teams) {
    const projects = await getSortedTeamProjects(team.id);
    if (projects.length === 0) {
      continue;
    }

    for (const { project } of projects) {
      const issues = await getSortedProjectIssues(project.id);
      if (issues.length === 0) {
        continue;
      }

      const [topIssue] = issues;
      if (!topIssue) {
        continue;
      }

      return {
        teamId: team.id,
        projectId: project.id,
        issueId: topIssue.issue.id,
      };
    }
  }

  throw new Error('No issues found in any active project for any team.');
}

function formatBootstrapResponse(
  selection: Selection,
  response: BootstrapResponse,
): string {
  const lines = [
    'Bootstrap completed',
    '-------------------',
    `Success: ${response.success ? 'yes' : 'no'}`,
    `Status: ${response.status}`,
    `Team ID: ${selection.teamId}`,
    `Project ID: ${selection.projectId}`,
    `Issue ID: ${selection.issueId}`,
    `Linear Issue: ${response.issue_id}`,
    `Title: ${response.issue_title}`,
    `Branch: ${response.branch}`,
  ];

  if (response.plan_url) {
    lines.push(`Plan: ${response.plan_url}`);
  }

  if (response.prerequisites_url) {
    lines.push(`Prerequisites: ${response.prerequisites_url}`);
  }

  lines.push('');
  lines.push('Next step');
  lines.push('---------');
  lines.push(`git switch ${response.branch}`);

  return lines.join('\n');
}

async function bootstrap(selection: Selection): Promise<BootstrapResponse> {
  return new Promise((resolve, reject) => {
    const agent = new https.Agent({
      rejectUnauthorized: !IS_DEV,
    });

    const req = https.request(
      {
        method: 'POST',
        hostname: 'dev.bifemecanico.com',
        path: '/webhook/issue-planner',
        agent,
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: BOOTSTRAP_TIMEOUT_MS,
      },
      (res) => {
        const chunks: Buffer[] = [];

        res.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');

          if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
            reject(
              new Error(`Bootstrap request failed with status ${res.statusCode ?? 'unknown'}: ${body}`),
            );
            return;
          }

          try {
            resolve(JSON.parse(body) as BootstrapResponse);
          } catch (error) {
            reject(
              new Error(
                `Bootstrap returned a non-JSON response: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              ),
            );
          }
        });
      },
    );

    req.on('timeout', () => {
      req.destroy(new Error(`Bootstrap request timed out after ${BOOTSTRAP_TIMEOUT_MS / 1000} seconds.`));
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(
      JSON.stringify({
        repo: getRepoPath(),
        issueId: selection.issueId,
      }),
    );
    req.end();
  });
}

async function run(): Promise<void> {
  const selection = await pickNextIssue();
  const response = await bootstrap(selection);

  console.log(formatBootstrapResponse(selection, response));
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
