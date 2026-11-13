# Original analog TV model

The cabinet is an original procedural Blender asset made for this portfolio, not a downloaded third-party model. No external textures, models, or HDRIs are required.

- `retro-tv.blend`: editable source; the model lives in the **Max Sun - Analog CRT** scene. Existing Blender scenes are preserved by the generator.
- `../../public/models/retro-tv.glb`: browser model (about 1.1 MB).
- `../../public/models/retro-tv-poster.webp`: 29 KB rendered fallback while WebGL loads or if it is unavailable.
- `../../scripts/create-retro-tv.py`: reproducible geometry, materials, labels, lighting, and export.

## Regenerate

From the repository root, with Blender on your PATH:

```sh
RENDER_TV_POSTER=1 blender --background --python scripts/create-retro-tv.py
node -e "require('sharp')('assets/blender/retro-tv-poster.png').webp({quality:88}).toFile('public/models/retro-tv-poster.webp')"
rm assets/blender/retro-tv-poster.png
```

For Blender MCP, execute the generator with `__file__` set to its absolute path (or set `MAXSUN_PROJECT_ROOT`). The script creates a new scene rather than clearing the open one.

## Website integration

The glass plane and physical button positions are defined in `src/lib/television.ts` and match the generator's browser-space coordinates. `TelevisionModel.tsx` projects those positions with the same orthographic camera that renders the GLB, keeping actual HTML text, links, and keyboard-accessible button targets aligned with the model. The taller mobile cabinet is a responsive model transform, not a cropped screen.

Each physical control has its own `Button_<id>` mesh. Native buttons currently provide only depression/darkening feedback; power, channel, volume, and menu actions are intentionally unassigned. WebGL renders on load, resize, and button interaction, not in a continuous animation loop. Only the low-resolution screen noise animates, and it stops when hidden, paused, or reduced motion is enabled.

Startup is 2.5 seconds of static **after the model or fallback is ready**, followed by the information screen. There are no boot captions, logos, progress indicators, skip buttons, scrolling sections, or expandable rows.
