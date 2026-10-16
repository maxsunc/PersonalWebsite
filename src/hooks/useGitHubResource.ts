'use client';

import { useEffect, useState } from 'react';

type ResourceState<T> = {
  data: T | null;
  status: 'loading' | 'ready' | 'error';
};

const CACHE_TTL = 5 * 60 * 1000;
const REQUEST_TIMEOUT = 10 * 1000;

export function useGitHubResource<T>(
  path: string,
  validate: (value: unknown) => value is T,
): ResourceState<T> {
  const [state, setState] = useState<ResourceState<T>>({
    data: null,
    status: 'loading',
  });

  useEffect(() => {
    const controller = new AbortController();
    const cacheKey = `portfolio:github:${path}`;
    let cancelled = false;
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    async function load() {
      try {
        try {
          const stored = window.localStorage.getItem(cacheKey);
          const cached = stored ? JSON.parse(stored) : null;

          if (
            cached &&
            typeof cached.fetchedAt === 'number' &&
            cached.fetchedAt <= Date.now() &&
            validate(cached.data)
          ) {
            const fresh = Date.now() - cached.fetchedAt < CACHE_TTL;
            setState({ data: cached.data, status: fresh ? 'ready' : 'loading' });
            if (fresh) return;
          }
        } catch {
          // A corrupt cache or blocked storage must not prevent a live request.
        }

        const response = await fetch(`https://api.github.com/${path}`, {
          headers: { Accept: 'application/vnd.github+json' },
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(`GitHub returned ${response.status}`);

        const data: unknown = await response.json();
        if (!validate(data)) throw new Error('Unexpected GitHub response');
        if (cancelled) return;

        setState({ data, status: 'ready' });

        try {
          window.localStorage.setItem(
            cacheKey,
            JSON.stringify({ data, fetchedAt: Date.now() }),
          );
        } catch {
          // Live data remains usable when storage is full or disabled.
        }
      } catch {
        if (!cancelled) {
          setState(current => ({ data: current.data, status: 'error' }));
        }
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void load();

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [path, validate]);

  return state;
}
