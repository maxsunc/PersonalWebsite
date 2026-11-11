# Max Sun’s portfolio

A personal portfolio built with Next.js, TypeScript, and Tailwind CSS. A cinematic wanted-poster aesthetic: deep-black backgrounds, lime-green accents, condensed display type, monochrome photography, and subtle film grain.

## Development

```sh
npm ci
npm run dev
```

Run `npm run build` to generate the static website in `out/`. Preview that export with `npx serve out`.

## Design and navigation

`src/components/Portfolio.tsx` contains four compact views: Home, Projects, Experience, and Contact. Hash links (`#projects`, `#experience`, `#contact`) support direct links and browser back/forward without a server. The previous `#work` and `#about` links still resolve to their renamed views. The home view opens with a bold, two-line “Have you seen this man?” above a high-contrast monochrome portrait and a down-arrow at the bottom of the screen. The original photo is unchanged; its crop, grading, and vignette are CSS-only. Native scrolling moves through a sticky composition: the portrait grows slightly and slides left while Projects / Experience / Contact appear on the right. The arrow scrolls directly to the revealed links. Scrolling back reverses the transition. It has no header or screen effects. The header and its navigation remain on the other views. Other views use direct headings and factual content, without decorative captions or a footer. Contact pairs “Shoot me a message.” with email and social links. Desktop uses a shared stage; mobile stacks content with natural scrolling.

The landing transition uses a smoothstep curve for a deliberate start and settled finish, without scroll interception. Brief text and portrait entrance reveals run only on mount; there is no continuous floating, flashing, or audio. Hidden navigation is inert until revealed. With `prefers-reduced-motion`, the landing view shows a static photo-and-links layout with no scroll animation. Links retain their hover transitions; other views retain headline reveals and project preview transitions. All motion respects `prefers-reduced-motion`. Navigation has keyboard focus handling, visible focus indicators, and a skip link.

- **Theme, layout, motion:** `src/app/globals.css`
- **Scroll-driven landing view:** `src/components/LandingStory.tsx`
- **Display type:** Anton via `next/font/google` in `src/app/layout.tsx`
- **Static grain texture:** `public/images/film-grain.svg`
- **Home portrait:** `public/images/pfp2.png` (copied from the supplied `Documents/pfp2.png`; the original is untouched)
- **Featured projects:** `featuredProjects` in `src/components/Portfolio.tsx`, using entries from `src/data/projects.ts`
- **Experience:** `src/data/experience.ts`
- **Contact and social links:** `src/data/personal.ts`
- **Résumé:** `public/Max_Sun_Resume.pdf`

## Legacy components

The current-repository configuration in `src/data/config/current-repository.json` belongs to the previous GitHub section and is not displayed by the new design.

The previous section components and GitHub API utilities remain in the repository but are no longer mounted on the homepage. No ASCII or 3D background is loaded by the new design.
