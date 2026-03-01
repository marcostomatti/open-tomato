import {
  LinearClient,
  type Issue,
  type IssueRelation,
  type Project,
  type ProjectRelation,
  type Team,
} from '@linear/sdk';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.LINEAR_API_KEY;

if (!apiKey) {
  throw new Error('Missing LINEAR_API_KEY in environment.');
}

const linearClient = new LinearClient({ apiKey });

export type ProjectWithDependencies = {
  project: Project;
  blockedByIds: string[];
  blockingIds: string[];
};

export type IssueWithDependencies = {
  issue: Issue;
  blockedByIds: string[];
  blockingIds: string[];
};

const DEFAULT_PAGE_SIZE = 100;

function normalizePriority(priority: number): number {
  return priority === 0 ? 5 : priority;
}

function compareProjects(a: Project, b: Project): number {
  const priorityDelta = normalizePriority(a.priority) - normalizePriority(b.priority);
  if (priorityDelta !== 0) {
    return priorityDelta;
  }

  const createdAtDelta = a.createdAt.getTime() - b.createdAt.getTime();
  if (createdAtDelta !== 0) {
    return createdAtDelta;
  }

  return a.id.localeCompare(b.id);
}

function compareIssues(a: Issue, b: Issue): number {
  const priorityDelta = normalizePriority(a.priority) - normalizePriority(b.priority);
  if (priorityDelta !== 0) {
    return priorityDelta;
  }

  const numberDelta = a.number - b.number;
  if (numberDelta !== 0) {
    return numberDelta;
  }

  const createdAtDelta = a.createdAt.getTime() - b.createdAt.getTime();
  if (createdAtDelta !== 0) {
    return createdAtDelta;
  }

  return a.id.localeCompare(b.id);
}

async function collectAllNodes<T extends { id: string }>(
  connectionPromise: Promise<{
    nodes: T[];
    pageInfo: { hasNextPage: boolean };
    fetchNext(): Promise<unknown>;
  }>,
): Promise<T[]> {
  const connection = await connectionPromise;

  while (connection.pageInfo.hasNextPage) {
    await connection.fetchNext();
  }

  return connection.nodes;
}

function relationTypeToEdge(
  type: string,
  sourceId: string | undefined,
  targetId: string | undefined,
): [string, string] | null {
  if (!sourceId || !targetId) {
    return null;
  }

  const normalizedType = type.toLowerCase();
  if (!normalizedType.includes('block')) {
    return null;
  }

  if (normalizedType.includes('blocked')) {
    return [targetId, sourceId];
  }

  return [sourceId, targetId];
}

function topologicalSort<T>(
  items: T[],
  getId: (item: T) => string,
  edges: Array<[string, string]>,
  compare: (a: T, b: T) => number,
): T[] {
  const byId = new Map(items.map((item) => [getId(item), item]));
  const indegree = new Map<string, number>();
  const adjacency = new Map<string, Set<string>>();

  for (const item of items) {
    const id = getId(item);
    indegree.set(id, 0);
    adjacency.set(id, new Set());
  }

  for (const [blockerId, blockedId] of edges) {
    if (blockerId === blockedId || !byId.has(blockerId) || !byId.has(blockedId)) {
      continue;
    }

    const neighbors = adjacency.get(blockerId);
    if (!neighbors || neighbors.has(blockedId)) {
      continue;
    }

    neighbors.add(blockedId);
    indegree.set(blockedId, (indegree.get(blockedId) ?? 0) + 1);
  }

  const ready = items
    .filter((item) => (indegree.get(getId(item)) ?? 0) === 0)
    .sort(compare);
  const ordered: T[] = [];
  const seen = new Set<string>();

  while (ready.length > 0) {
    const current = ready.shift();
    if (!current) {
      break;
    }

    const currentId = getId(current);
    if (seen.has(currentId)) {
      continue;
    }

    seen.add(currentId);
    ordered.push(current);

    for (const neighborId of adjacency.get(currentId) ?? []) {
      indegree.set(neighborId, (indegree.get(neighborId) ?? 0) - 1);
      if ((indegree.get(neighborId) ?? 0) === 0) {
        const neighbor = byId.get(neighborId);
        if (neighbor && !seen.has(neighborId)) {
          ready.push(neighbor);
          ready.sort(compare);
        }
      }
    }
  }

  if (ordered.length === items.length) {
    return ordered;
  }

  const remaining = items
    .filter((item) => !seen.has(getId(item)))
    .sort(compare);

  return [...ordered, ...remaining];
}

function summarizeDependencies<T extends { id: string }>(
  items: T[],
  edges: Array<[string, string]>,
): Map<string, { blockedByIds: string[]; blockingIds: string[] }> {
  const itemIds = new Set(items.map((item) => item.id));
  const summary = new Map<string, { blockedByIds: string[]; blockingIds: string[] }>();

  for (const item of items) {
    summary.set(item.id, { blockedByIds: [], blockingIds: [] });
  }

  for (const [blockerId, blockedId] of edges) {
    if (!itemIds.has(blockerId) || !itemIds.has(blockedId) || blockerId === blockedId) {
      continue;
    }

    const blocker = summary.get(blockerId);
    const blocked = summary.get(blockedId);

    if (!blocker || !blocked) {
      continue;
    }

    if (!blocker.blockingIds.includes(blockedId)) {
      blocker.blockingIds.push(blockedId);
    }

    if (!blocked.blockedByIds.includes(blockerId)) {
      blocked.blockedByIds.push(blockerId);
    }
  }

  return summary;
}

async function getProjectRelations(project: Project): Promise<ProjectRelation[]> {
  const [relations, inverseRelations] = await Promise.all([
    collectAllNodes(project.relations({ first: DEFAULT_PAGE_SIZE })),
    collectAllNodes(project.inverseRelations({ first: DEFAULT_PAGE_SIZE })),
  ]);

  const deduped = new Map<string, ProjectRelation>();
  for (const relation of [...relations, ...inverseRelations]) {
    deduped.set(relation.id, relation);
  }

  return [...deduped.values()];
}

async function getIssueRelations(issue: Issue): Promise<IssueRelation[]> {
  const [relations, inverseRelations] = await Promise.all([
    collectAllNodes(issue.relations({ first: DEFAULT_PAGE_SIZE })),
    collectAllNodes(issue.inverseRelations({ first: DEFAULT_PAGE_SIZE })),
  ]);

  const deduped = new Map<string, IssueRelation>();
  for (const relation of [...relations, ...inverseRelations]) {
    deduped.set(relation.id, relation);
  }

  return [...deduped.values()];
}

export async function getTeams(): Promise<Team[]> {
  const teams = await collectAllNodes(linearClient.teams({ first: DEFAULT_PAGE_SIZE }));
  return teams.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getSortedTeamProjects(teamId: string): Promise<ProjectWithDependencies[]> {
  const team = await linearClient.team(teamId);
  const projects = await collectAllNodes(team.projects({ first: DEFAULT_PAGE_SIZE }));
  const activeProjects = projects.filter((project) => !project.archivedAt && !project.trashed);

  const relationGroups = await Promise.all(
    activeProjects.map(async (project) => ({
      projectId: project.id,
      relations: await getProjectRelations(project),
    })),
  );

  const edges = relationGroups.flatMap(({ relations }) =>
    relations
      .map((relation) =>
        relationTypeToEdge(relation.type, relation.projectId, relation.relatedProjectId),
      )
      .filter((edge): edge is [string, string] => edge !== null),
  );

  const summaries = summarizeDependencies(activeProjects, edges);
  const orderedProjects = topologicalSort(activeProjects, (project) => project.id, edges, compareProjects);

  return orderedProjects.map((project) => {
    const dependencySummary = summaries.get(project.id) ?? { blockedByIds: [], blockingIds: [] };
    return {
      project,
      blockedByIds: dependencySummary.blockedByIds,
      blockingIds: dependencySummary.blockingIds,
    };
  });
}

export async function getSortedProjectIssues(projectId: string): Promise<IssueWithDependencies[]> {
  const project = await linearClient.project(projectId);
  const issues = await collectAllNodes(project.issues({ first: DEFAULT_PAGE_SIZE }));
  const activeIssues = issues.filter((issue) => !issue.archivedAt && !issue.trashed);

  const relationGroups = await Promise.all(
    activeIssues.map(async (issue) => ({
      issueId: issue.id,
      relations: await getIssueRelations(issue),
    })),
  );

  const edges = relationGroups.flatMap(({ relations }) =>
    relations
      .map((relation) =>
        relationTypeToEdge(relation.type, relation.issueId, relation.relatedIssueId),
      )
      .filter((edge): edge is [string, string] => edge !== null),
  );

  const summaries = summarizeDependencies(activeIssues, edges);
  const orderedIssues = topologicalSort(activeIssues, (issue) => issue.id, edges, compareIssues);

  return orderedIssues.map((issue) => {
    const dependencySummary = summaries.get(issue.id) ?? { blockedByIds: [], blockingIds: [] };
    return {
      issue,
      blockedByIds: dependencySummary.blockedByIds,
      blockingIds: dependencySummary.blockingIds,
    };
  });
}
