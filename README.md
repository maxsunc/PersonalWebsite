# Max Sun's portfolio

Next.js static site with a live GitHub profile and a featured current repository.

## Development

```sh
npm ci
npm run dev
```

Run `npm run build` to generate the static website in `out/`.

## GitHub section

To change **I'm currently working on**, open `/admin/` → **Configuration** →
**Currently Working On**, paste a public GitHub repository link into
**Repository URL**, and publish. Once deployment finishes, the card uses the new
repository and loads its description, language, stars, and activity automatically.
Only the link is required; there is no need to enter the repository details.

The URL is stored in `src/data/config/current-repository.json` and can also be
edited directly. Edit `src/data/github.ts` to change the profile's GitHub username.

The profile and repository load independently from GitHub's public API in the
visitor's browser. Successful responses are cached locally for five minutes.
No server or GitHub token is required, and no API request runs during the build.
If GitHub is unavailable or rate-limited, cached data or a generic fallback
message is shown and both GitHub links remain available.

The last-pushed date is repository-wide. Its branch is resolved from matching
public push or branch-creation events, not the repository's default branch.
GitHub's activity feed can be delayed or incomplete; if no matching branch is
available (or multiple branches match), the card keeps the date and explicitly
marks the push branch as unavailable rather than guessing.
