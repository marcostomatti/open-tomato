import inquirer from 'inquirer';
import type { Team } from '@linear/sdk';
import {
  getSortedProjectIssues,
  getSortedTeamProjects,
  getTeams,
  type IssueWithDependencies,
  type ProjectWithDependencies,
} from './utils/linear';

const EXIT = '__exit__';
const BACK = '__back__';

function formatPriority(priority: number): string {
  return priority === 0 ? 'P-' : `P${priority}`;
}

function formatDependencySuffix(
  blockedByIds: string[],
  blockingIds: string[],
  labelsById: Map<string, string>,
): string {
  const parts: string[] = [];

  if (blockedByIds.length > 0) {
    parts.push(
      `blocked by: ${blockedByIds
        .map((id) => labelsById.get(id) ?? id)
        .join(', ')}`,
    );
  }

  if (blockingIds.length > 0) {
    parts.push(
      `blocks: ${blockingIds
        .map((id) => labelsById.get(id) ?? id)
        .join(', ')}`,
    );
  }

  return parts.length > 0 ? ` | ${parts.join(' | ')}` : '';
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) {
    return 'n/a';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toISOString().slice(0, 10);
}

async function promptForTeam(teams: Team[]): Promise<Team | null> {
  if (teams.length === 0) {
    console.log('No teams found in this Linear workspace.');
    return null;
  }

  const { teamId } = await inquirer.prompt({
    teamId: {
      type: 'select',
      message: 'Select a Linear team',
      pageSize: 20,
      choices: [
        ...teams.map((team) => ({
          name: `${team.name}${team.key ? ` (${team.key})` : ''}`,
          value: team.id,
        })),
        new inquirer.Separator(),
        { name: 'Exit', value: EXIT },
      ],
    },
  });

  return teamId === EXIT ? null : (teams.find((team) => team.id === teamId) ?? null);
}

async function promptForProject(
  teamName: string,
  projects: ProjectWithDependencies[],
): Promise<string | null> {
  if (projects.length === 0) {
    console.log(`No active projects found for ${teamName}.`);
    return null;
  }

  const labelsById = new Map(projects.map(({ project }) => [project.id, project.name]));

  const { projectId } = await inquirer.prompt({
    projectId: {
      type: 'select',
      message: `Projects in ${teamName}`,
      pageSize: 20,
      choices: [
        ...projects.map(({ project, blockedByIds, blockingIds }) => ({
          name: `${formatPriority(project.priority)} ${project.name}${formatDependencySuffix(
            blockedByIds,
            blockingIds,
            labelsById,
          )}`,
          value: project.id,
        })),
        new inquirer.Separator(),
        { name: 'Back to teams', value: BACK },
        { name: 'Exit', value: EXIT },
      ],
    },
  });

  if (projectId === EXIT) {
    return EXIT;
  }

  return projectId === BACK ? null : projectId;
}

async function promptForIssue(
  projectName: string,
  issues: IssueWithDependencies[],
): Promise<string | null> {
  if (issues.length === 0) {
    console.log(`No active issues found for ${projectName}.`);
    return null;
  }

  const labelsById = new Map(
    issues.map(({ issue }) => [issue.id, issue.identifier]),
  );

  const { issueId } = await inquirer.prompt({
    issueId: {
      type: 'select',
      message: `Issues in ${projectName}`,
      pageSize: 20,
      choices: [
        ...issues.map(({ issue, blockedByIds, blockingIds }) => ({
          name: `${issue.identifier} ${formatPriority(issue.priority)} ${issue.title}${formatDependencySuffix(
            blockedByIds,
            blockingIds,
            labelsById,
          )}`,
          value: issue.id,
        })),
        new inquirer.Separator(),
        { name: 'Back to projects', value: BACK },
        { name: 'Exit', value: EXIT },
      ],
    },
  });

  if (issueId === EXIT) {
    return EXIT;
  }

  return issueId === BACK ? null : issueId;
}

async function showIssueDetails(
  selectedIssue: IssueWithDependencies,
  labelsById: Map<string, string>,
): Promise<'back' | 'exit'> {
  const { issue, blockedByIds, blockingIds } = selectedIssue;
  const [state, assignee, project, team] = await Promise.all([
    issue.state,
    issue.assignee,
    issue.project,
    issue.team,
  ]);

  console.clear();
  console.log(`${issue.identifier} ${issue.title}`);
  console.log('');
  console.log(`Priority: ${issue.priorityLabel}`);
  console.log(`State: ${state?.name ?? 'n/a'}`);
  console.log(`Assignee: ${assignee?.name ?? 'Unassigned'}`);
  console.log(`Team: ${team?.name ?? 'n/a'}`);
  console.log(`Project: ${project?.name ?? 'n/a'}`);
  console.log(`Created: ${formatDate(issue.createdAt)}`);
  console.log(`Updated: ${formatDate(issue.updatedAt)}`);
  console.log(`Due: ${formatDate(issue.dueDate)}`);
  console.log(
    `Blocked by: ${
      blockedByIds.length > 0
        ? blockedByIds.map((id) => labelsById.get(id) ?? id).join(', ')
        : 'none'
    }`,
  );
  console.log(
    `Blocks: ${
      blockingIds.length > 0
        ? blockingIds.map((id) => labelsById.get(id) ?? id).join(', ')
        : 'none'
    }`,
  );
  console.log(`URL: ${issue.url}`);
  console.log('');
  console.log('Description');
  console.log('-----------');
  console.log(issue.description?.trim() ? issue.description : 'No description.');
  console.log('');

  const { nextAction } = await inquirer.prompt({
    nextAction: {
      type: 'select',
      message: 'Issue details',
      choices: [
        { name: 'Back to issues', value: BACK },
        { name: 'Exit', value: EXIT },
      ],
    },
  });

  return nextAction === EXIT ? 'exit' : 'back';
}

async function run(): Promise<void> {
  while (true) {
    const teams = await getTeams();
    const selectedTeam = await promptForTeam(teams);
    if (!selectedTeam) {
      return;
    }

    while (true) {
      const projects = await getSortedTeamProjects(selectedTeam.id);
      const projectId = await promptForProject(selectedTeam.name, projects);

      if (projectId === EXIT) {
        return;
      }

      if (!projectId) {
        break;
      }

      const selectedProject = projects.find(({ project }) => project.id === projectId);
      if (!selectedProject) {
        continue;
      }

      while (true) {
        const issues = await getSortedProjectIssues(selectedProject.project.id);
        const issueLabelsById = new Map(issues.map(({ issue }) => [issue.id, issue.identifier]));
        const issueId = await promptForIssue(selectedProject.project.name, issues);

        if (issueId === EXIT) {
          return;
        }

        if (!issueId) {
          break;
        }

        const selectedIssue = issues.find(({ issue }) => issue.id === issueId);
        if (!selectedIssue) {
          continue;
        }

        const action = await showIssueDetails(selectedIssue, issueLabelsById);
        if (action === 'exit') {
          return;
        }
      }
    }
  }
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
