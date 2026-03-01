import {
  getSortedProjectIssues,
  getSortedTeamProjects,
  getTeams,
} from './utils/linear';

type Selection = {
  teamId: string;
  projectId: string;
  issueId: string;
};

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

async function run(): Promise<void> {
  const selection = await pickNextIssue();
  console.log(JSON.stringify(selection, null, 2));
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
