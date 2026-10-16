# Max Sun's portfolio

Next.js static site with a live GitHub profile and a featured current repository.

## Development

```sh
npm ci
npm run dev
```

Run `npm run build` to generate the static website in `out/`.

## GitHub section

Edit `src/data/github.ts` to change the GitHub username or the repository shown
under **I'm currently working on**. Set the repository's `owner`, `name`, and
fallback `description`; optionally add a personal `note`.

The profile and repository load independently from GitHub's public API in the
visitor's browser. Successful responses are cached locally for five minutes.
No server or GitHub token is required, and no API request runs during the build.
If GitHub is unavailable or rate-limited, saved data or the configured fallback
content is shown and both GitHub links remain available.

The last-pushed date is repository-wide. Its branch is resolved from matching
public push or branch-creation events, not the repository's default branch.
GitHub's activity feed can be delayed or incomplete; if no matching branch is
available (or multiple branches match), the card keeps the date and explicitly
marks the push branch as unavailable rather than guessing.
