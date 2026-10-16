'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ArrowUpRight, BookOpen, Code, GitBranch, GitFork, Github, Star, Terminal } from 'lucide-react';
import { github } from '@/data/github';
import { personal } from '@/data/personal';
import { useGitHubResource } from '@/hooks/useGitHubResource';
import { getLastPushedBranch, isGitHubProfile, isGitHubRepository, isGitHubRepositoryEvents } from '@/lib/github';

function DataStatus({
  status,
  hasData,
}: {
  status: 'loading' | 'ready' | 'error';
  hasData: boolean;
}) {
  const message = status === 'loading'
    ? 'Loading from GitHub…'
    : status === 'ready'
      ? 'Synced from GitHub · cached for 5 min'
      : hasData
        ? 'Showing saved details. Open GitHub for the latest.'
        : 'Live details unavailable. You can still view this on GitHub.';

  return (
    <p role="status" className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-slate-400">
      <span
        aria-hidden="true"
        className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
          status === 'ready' ? 'bg-run-green' : 'bg-slate-500'
        }`}
      />
      {message}
    </p>
  );
}

export default function GitHub() {
  const { currentRepository } = github;
  const profile = useGitHubResource(`users/${github.username}`, isGitHubProfile);
  const repository = useGitHubResource(
    `repos/${currentRepository.owner}/${currentRepository.name}`,
    isGitHubRepository,
  );
  const pushEvents = useGitHubResource(
    `repos/${currentRepository.owner}/${currentRepository.name}/events?per_page=100`,
    isGitHubRepositoryEvents,
  );
  const [avatarFailed, setAvatarFailed] = useState(false);
  const repositoryUrl = `https://github.com/${currentRepository.owner}/${currentRepository.name}`;
  const pushedAt = repository.data?.pushed_at;
  const lastPushedBranch = getLastPushedBranch(pushEvents.data, pushedAt);
  const stats = [
    { label: 'Repos', value: profile.data?.public_repos },
    { label: 'Followers', value: profile.data?.followers },
    { label: 'Following', value: profile.data?.following },
  ];

  return (
    <section id="github" aria-labelledby="github-heading" className="bg-[#1E293B] py-24 scroll-mt-14">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-12 flex items-center gap-4">
          <Terminal aria-hidden="true" className="h-8 w-8 shrink-0 text-run-green" />
          <h2 id="github-heading" className="font-mono text-3xl font-bold tracking-tight text-white md:text-4xl">
            github.sync
          </h2>
        </div>

        <div className="grid items-stretch gap-6 md:grid-cols-2">
          <article
            aria-labelledby="github-profile-heading"
            className="glass-card flex min-w-0 flex-col p-6 md:p-8"
          >
            <div className="mb-8 flex items-center gap-2 text-sm text-slate-400">
              <Github aria-hidden="true" className="h-4 w-4" />
              <span>~/github/profile</span>
            </div>

            <div className="flex items-center gap-4">
              <Image
                src={!avatarFailed && profile.data ? profile.data.avatar_url : personal.profileImage}
                alt={`${profile.data?.name || personal.name}'s profile picture`}
                width={72}
                height={72}
                onError={() => setAvatarFailed(true)}
                className="h-18 w-18 shrink-0 rounded-full border border-slate-700 object-cover"
              />
              <div className="min-w-0">
                <h3 id="github-profile-heading" className="text-xl font-semibold text-white">
                  {profile.data?.name || personal.name}
                </h3>
                <span className="break-all text-sm text-run-green">@{github.username}</span>
              </div>
            </div>

            <p className="mt-6 text-sm leading-relaxed text-slate-300">
              {profile.data?.bio || personal.title}
            </p>

            <dl className="my-8 grid grid-cols-3 gap-2 border-y border-slate-700 py-5">
              {stats.map(stat => (
                <div key={stat.label} className="min-w-0">
                  <dt className="text-xs text-slate-400">{stat.label}</dt>
                  <dd className="mt-1 text-2xl font-semibold text-white">
                    {stat.value === undefined ? (
                      <span aria-label={profile.status === 'loading' ? 'Loading' : 'Unavailable'}>—</span>
                    ) : stat.value.toLocaleString('en-US')}
                  </dd>
                </div>
              ))}
            </dl>

            <a
              href={personal.social.github}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary mt-auto inline-flex min-h-11 items-center justify-center gap-2 self-start text-sm"
            >
              View GitHub profile
              <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" />
            </a>
            <DataStatus status={profile.status} hasData={profile.data !== null} />
          </article>

          <article
            aria-labelledby="current-work-heading"
            className="glass-card flex min-w-0 flex-col p-6 md:p-8"
          >
            <div className="mb-8 flex items-center gap-2 text-sm text-slate-400">
              <Code aria-hidden="true" className="h-4 w-4" />
              <span>~/currently_building</span>
            </div>

            <h3 id="current-work-heading" className="text-xl font-semibold text-white">
              I&apos;m currently working on
            </h3>

            <a
              href={repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex items-start gap-3 text-run-green transition-colors duration-200 hover:text-white"
            >
              <BookOpen aria-hidden="true" className="mt-1 h-5 w-5 shrink-0" />
              <span className="min-w-0 break-words">
                <span className="block text-xs text-slate-400">{currentRepository.owner} /</span>
                <span className="text-lg font-semibold">{currentRepository.name}</span>
              </span>
              <ArrowUpRight aria-hidden="true" className="mt-1 ml-auto h-4 w-4 shrink-0" />
            </a>

            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              {repository.data?.description || currentRepository.description}
            </p>

            {currentRepository.note && (
              <p className="mt-4 border-l-2 border-run-green pl-3 text-sm leading-relaxed text-slate-400">
                {currentRepository.note}
              </p>
            )}

            <div className="my-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-300">
              {repository.data?.language && (
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden="true" className="h-2 w-2 rounded-full bg-run-green" />
                  {repository.data.language}
                </span>
              )}
              {repository.data && (
                <>
                  <span className="inline-flex items-center gap-1.5">
                    <Star aria-hidden="true" className="h-4 w-4 text-slate-400" />
                    {repository.data.stargazers_count.toLocaleString('en-US')} stars
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <GitFork aria-hidden="true" className="h-4 w-4 text-slate-400" />
                    {repository.data.forks_count.toLocaleString('en-US')} forks
                  </span>
                </>
              )}
            </div>

            {pushedAt && (
              <div className="mb-6 space-y-2 text-xs text-slate-400">
                <p>
                  Last pushed{' '}
                  <time dateTime={pushedAt}>
                    {new Date(pushedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      timeZone: 'UTC',
                    })}
                  </time>
                </p>
                <p aria-live="polite" className="flex items-start gap-2">
                  <GitBranch aria-hidden="true" className="h-4 w-4 shrink-0" />
                  <span className="min-w-0">
                    {lastPushedBranch ? (
                      <>
                        on{' '}
                        <a
                          href={`${repositoryUrl}/tree/${encodeURIComponent(lastPushedBranch)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all text-slate-300 underline decoration-slate-600 underline-offset-4 transition-colors duration-200 hover:text-white hover:decoration-run-green"
                        >
                          {lastPushedBranch}
                        </a>
                      </>
                    ) : pushEvents.status === 'loading'
                      ? 'Finding push branch…'
                      : 'Push branch unavailable in public activity'}
                  </span>
                </p>
              </div>
            )}

            <a
              href={repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary mt-auto inline-flex min-h-11 items-center justify-center gap-2 self-start text-sm"
            >
              View repository
              <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" />
            </a>
            <DataStatus status={repository.status} hasData={repository.data !== null} />
          </article>
        </div>
      </div>
    </section>
  );
}
