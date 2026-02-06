# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio website for Max Sun (maxsun.ca). Static site using vanilla HTML5, CSS3, and JavaScript with no build process or framework dependencies.

## Development

**Local development:** Open `index.html` directly in a browser or use a local HTTP server:
```bash
python -m http.server
```

**Deployment:** Automatic via GitHub Actions on push to `main` branch. Deploys to GitHub Pages at maxsun.ca.

## Architecture

Three core files:
- **index.html** - Single-page structure with 7 sections (nav, hero, about, experience, skills, projects, contact)
- **style.css** - Design system with CSS variables, responsive breakpoints at 768px and 480px
- **script.js** - Interactive features initialized in DOMContentLoaded listener

### CSS Design System

Variables defined in `:root`:
- Colors: Primary (#f59e0b), Secondary (#1f2937), Accent (#10b981)
- Typography: JetBrains Mono + Inter fonts
- Transitions: Fast (0.15s), Base (0.3s), Slow (0.5s)

Dark mode via `prefers-color-scheme: dark`. Reduced motion support via `prefers-reduced-motion`.

### JavaScript Features

- Custom cursor with follower element
- Navbar hide/show on scroll direction
- Intersection Observer for scroll animations
- Typewriter effect on hero subtitle
- Web Audio API for hover sounds
- Easter eggs: Konami code (party mode), profile image clicks (spin)

New features should be added as functions initialized in the `DOMContentLoaded` event listener.

## Common Tasks

**Add a project:** Duplicate a `project-card` div in index.html, add thumbnail to `images/`

**Add a skill:** Duplicate a `skill-card` div in index.html, add icon to `images/`

**Modify animations:** Keyframes defined in style.css (lines 776-936)

**Change theme colors:** Edit CSS variables in `:root {}` block
