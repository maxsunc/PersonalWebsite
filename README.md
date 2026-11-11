# Max Sun’s portfolio

A personal portfolio built with Next.js, TypeScript, and Tailwind CSS. A cinematic wanted-poster aesthetic: deep-black backgrounds, lime-green accents, condensed display type, an animated ASCII portrait, and subtle film grain.

## Development

```sh
npm ci
npm run dev
```

Run `npm run build` to generate the static website in `out/`. Preview that export with `npx serve out`. Run `npm run test:ascii` for the portrait data, glyph, noise, drift, CRT refresh, phosphor decay, and reduced-motion tests.

## Design and navigation

`src/components/Portfolio.tsx` contains four compact views: Home, Projects, Experience, and Contact. Hash links (`#projects`, `#experience`, `#contact`) support direct links and browser back/forward without a server. The previous `#work` and `#about` links still resolve to their renamed views. The home view opens with a bold, two-line “Have you seen this man?” above a softly blurred ASCII portrait and a down-arrow at the bottom of the screen. The portrait is made of actual text glyphs drawn to a canvas from a precomputed luminance map of Max’s photo—not a displayed photo with a text overlay. Character drift, sparse lime noise, and subtle glyph changes animate the likeness. Faint horizontal scanlines, a soft refresh band rising every nine seconds, and a short phosphor trail give only the portrait a restrained CRT treatment. The band gently brightens and perturbs the glyphs it crosses; trails decay with elapsed time and use normalized blending so they cannot accumulate into a bright smear. The original photo is unchanged and is not loaded by the landing view. Native scrolling moves through a sticky composition: the portrait grows slightly and slides left while Projects / Experience / Contact appear on the right. The arrow scrolls directly to the revealed links. Scrolling back reverses the transition. It has no header. The header and its navigation remain on the other views. Other views use direct headings and factual content, without decorative captions or a footer. Contact pairs “Shoot me a message.” with email and social links. Desktop uses a shared stage; mobile stacks content with natural scrolling.

The landing transition uses a smoothstep curve for a deliberate start and settled finish, without scroll interception. Brief heading and portrait entrance reveals run only on mount. The ASCII field renders at a capped 16 fps and pauses offscreen or in a hidden tab. A pause/resume control appears on hover or keyboard focus (always visible on touch); there is no screen shake, flashing, or audio. Hidden navigation is inert until revealed. With `prefers-reduced-motion`, the landing view shows static ASCII and links with no scroll, character animation, rolling band, or phosphor trail. Pausing also clears the band and trails; static scanlines remain. A server-rendered text portrait remains visible until the canvas is ready, or if a canvas context is unavailable. Links retain their hover transitions; other views retain headline reveals and project preview transitions. All motion respects `prefers-reduced-motion`. Navigation has keyboard focus handling, visible focus indicators, and a skip link.

- **Theme, layout, motion:** `src/app/globals.css`
- **Scroll-driven landing view:** `src/components/LandingStory.tsx`
- **Display type:** Anton via `next/font/google` in `src/app/layout.tsx`
- **Static grain texture:** `public/images/film-grain.svg`
- **ASCII renderer:** `src/components/AsciiPortrait.tsx`
- **Portrait luminance map:** `src/data/ascii-portrait.json`; regenerate with `node scripts/generate-ascii-portrait.mjs` (uses the installed Sharp dependency). The map is committed, so builds do not need to process the source photo.
- **Source portrait:** `public/images/pfp2.png` (copied from the supplied `Documents/pfp2.png`; the original is untouched)
- **Featured projects:** `featuredProjects` in `src/components/Portfolio.tsx`, using entries from `src/data/projects.ts`
- **Experience:** `src/data/experience.ts`
- **Contact and social links:** `src/data/personal.ts`
- **Résumé:** `public/Max_Sun_Resume.pdf`

## Legacy components

The current-repository configuration in `src/data/config/current-repository.json` belongs to the previous GitHub section and is not displayed by the new design.

The previous section components and GitHub API utilities remain in the repository but are no longer mounted on the homepage. No legacy terminal or 3D background is loaded by the new design; only the new portrait uses ASCII.
