export interface GitHubProfile {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
}

export interface GitHubRepository {
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  pushed_at: string | null;
}

export interface GitHubRepositoryEvent {
  type: string;
  created_at: string;
  payload: {
    ref?: string | null;
    ref_type?: string;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

export function isGitHubProfile(value: unknown): value is GitHubProfile {
  return (
    isRecord(value) &&
    typeof value.login === 'string' &&
    isNullableString(value.name) &&
    typeof value.avatar_url === 'string' &&
    value.avatar_url.startsWith('https://avatars.githubusercontent.com/') &&
    isNullableString(value.bio) &&
    isCount(value.public_repos) &&
    isCount(value.followers) &&
    isCount(value.following)
  );
}

export function isGitHubRepository(value: unknown): value is GitHubRepository {
  return (
    isRecord(value) &&
    isNullableString(value.description) &&
    isNullableString(value.language) &&
    isCount(value.stargazers_count) &&
    isCount(value.forks_count) &&
    isNullableString(value.pushed_at) &&
    (value.pushed_at === null || Number.isFinite(Date.parse(value.pushed_at)))
  );
}

export function isGitHubRepositoryEvents(value: unknown): value is GitHubRepositoryEvent[] {
  return Array.isArray(value) && value.every(event => (
    isRecord(event) &&
    typeof event.type === 'string' &&
    typeof event.created_at === 'string' &&
    Number.isFinite(Date.parse(event.created_at)) &&
    isRecord(event.payload) &&
    (event.payload.ref === undefined || isNullableString(event.payload.ref)) &&
    (event.payload.ref_type === undefined || typeof event.payload.ref_type === 'string')
  ));
}

export function getLastPushedBranch(
  events: GitHubRepositoryEvent[] | null,
  pushedAt: string | null | undefined,
): string | null {
  if (!events || !pushedAt) return null;

  const pushedAtTime = Date.parse(pushedAt);
  if (!Number.isFinite(pushedAtTime)) return null;

  const branches = new Set<string>();

  for (const event of events) {
    // GitHub can record the activity event a few seconds after pushed_at.
    // Do not substitute an unrelated older event for the latest repository push.
    const eventTime = Date.parse(event.created_at);
    if (!Number.isFinite(eventTime) || Math.abs(eventTime - pushedAtTime) > 5000) continue;

    const ref = event.payload.ref;
    if (typeof ref !== 'string') continue;

    if (event.type === 'PushEvent' && ref.startsWith('refs/heads/')) {
      const branch = ref.slice('refs/heads/'.length);
      if (branch) branches.add(branch);
    } else if (event.type === 'CreateEvent' && event.payload.ref_type === 'branch' && ref) {
      // An initial push to a new branch may only appear as a CreateEvent.
      branches.add(ref);
    }
  }

  // A multi-branch push cannot be attributed to a single branch reliably.
  return branches.size === 1 ? branches.values().next().value ?? null : null;
}
