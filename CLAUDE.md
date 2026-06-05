# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio website for Max Sun (maxsun.ca). Built with Next.js 14+ App Router, TypeScript, and Tailwind CSS. Features an elegant space/galaxy theme with Spline 3D integration.

## Development

**Local development:**
```bash
npm run dev
```

**Build for production:**
```bash
npm run build
```

**Test static export:**
```bash
npm run build && npx serve out
```

**Deployment:** Automatic via GitHub Actions on push to `main` branch. Static export deploys to GitHub Pages at maxsun.ca.

## Architecture

```
src/
├── app/
│   ├── layout.tsx       # Root layout with Inter + JetBrains Mono fonts
│   ├── page.tsx         # Main page assembling all sections
│   └── globals.css      # Tailwind + custom space theme CSS
├── components/
│   ├── layout/
│   │   └── Navigation.tsx    # Orbital dots navigation
│   ├── sections/
│   │   ├── Hero.tsx          # Spline 3D + intro
│   │   ├── About.tsx
│   │   ├── Experience.tsx
│   │   ├── Skills.tsx
│   │   ├── Projects.tsx
│   │   └── Contact.tsx
│   └── effects/
│       ├── SplineScene.tsx   # Client component wrapper for Spline
│       └── StarField.tsx     # CSS twinkling stars background
├── data/
│   ├── personal.ts, experience.ts, skills.ts, projects.ts
└── hooks/
    └── useInView.ts          # Intersection Observer hook
public/
├── images/              # All image assets
└── CNAME               # Custom domain (maxsun.ca)
```

### Design System

**Colors (space theme):**
- Backgrounds: `#0a0a0f` (void), `#0f0f18` (dark), `#1a1a2e` (card)
- Accents: `#ff6b9d` (nebula pink), `#c084fc` (nebula purple), `#8b5cf6` (violet)
- Text: `#f8fafc` (primary), `#a1a1aa` (secondary)

**Typography:** Inter (headings/body), JetBrains Mono (code)

**Key CSS classes:**
- `.glass-card` - Glass-morphism cards with purple border glow
- `.gradient-text` - Pink-to-purple gradient text
- `.hover-lift` - Subtle lift effect on hover
- `.scroll-reveal`, `.stagger-children` - Scroll animations

## Common Tasks

**Add a project:** Add entry to `src/data/projects.ts`

**Add a skill:** Add entry to `src/data/skills.ts`, add icon to `public/images/`

**Modify theme colors:** Edit CSS variables in `src/app/globals.css`

**Add a section:** Create component in `src/components/sections/`, import in `page.tsx`

## Static Export Config

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
};
```
