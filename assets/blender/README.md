# Original analog TV and nighttime campsite models

## Nighttime campsite

- `campsite.blend`: editable **Midnight Campsite** scene, with the original TV referenced for composition.
- `campsite-preview.png`: native Blender lighting preview (the live website adds the stars and HTML screen).
- `../../public/models/campsite.glb`: separate environment, approximately 3.5 MB with 26 mesh objects. No textures or external dependencies.
- `../../scripts/create-campsite.py`: reproducible terrain, grass, stump with growth rings, stone-ring campfire, pine forest, log seat, blanket and lantern.
- `../../src/lib/campsite.ts`: shadow-casting campfire, animated flames/sparks, moonlight, distance fog, and procedural star-sphere shader.

Scroll down to pull the camera back; scroll up to approach the TV. **VIEW** temporarily ignores exploration zoom, then restores it. The ground extends 500 world units from the clearing, and camera pullback grows with zoom so foreground terrain is not cut by the near plane. The sky follows camera position without following camera rotation; it is back-faced, drawn behind the landscape without depth writes, and scales to cover even extreme viewport aspect ratios. Its far-plane budget is updated with its radius, so the camera cannot leave or clip through it. No star texture or sky HDRI is downloaded. Stars use two procedural populations: many faint background pinpricks and fewer brighter stars with a strongly weighted size/brightness distribution and restrained warm/cool color variation. Gaussian point-spread profiles are capped at one drawing-buffer-pixel sigma, preventing big white discs when zoomed in. Their tails stay within jittered cells to avoid square edges, while a faint noise-modulated galactic haze adds depth. The field is static in sky coordinates, without artificial sparkle animation.

The fire is an actual Three.js point light with a cached 1024px cube shadow map, not just emissive flame geometry. Both the TV and campsite receive it. The screen is also a real muted phosphor-green `RectAreaLight`, aligned with the glass and emitting forwards onto nearby objects to match the CRT picture's tint. Four small, thin area emitters tip backwards from inside the glass perimeter onto the bezel, adding soft screen spill to the TV edges without a bright outline or point-light hotspots. All five emitters follow the responsive screen dimensions and switch off with TV power (independent of volume). This is a steady CRT-matched glow, not per-frame pixel sampling; area lights do not cast shadows in Three.js. Grass receives shadows but does not cast thousands of expensive blade shadows. Hidden tabs, reduced motion, context loss, and unmount stop the animation; unmount disposes environment geometry, materials, sky, particles, and the shadow target.

Regenerate via Blender MCP, or from the repo root:

```sh
MAXSUN_PROJECT_ROOT="$PWD" blender --background assets/blender/retro-tv.blend --python scripts/create-campsite.py
```

## Analog TV

The cabinet is an original procedural Blender asset made for this portfolio, not a downloaded third-party model. No external textures, models, or HDRIs are required.

- `retro-tv.blend`: editable source; the model lives in the **Max Sun - Analog CRT** scene. Regeneration replaces only that generated scene; unrelated scenes are preserved.
- `../../public/models/retro-tv.glb`: browser model (about 2.3 MB), including individually pivoted telescopic antennas, a physical volume slider, a rear cover, cooling slots, screws, and AV/power sockets.
- `../../public/models/retro-tv-poster.webp`: 49 KB rendered fallback matching the isometric resting view.
- `../../scripts/create-retro-tv.py`: reproducible geometry, materials, labels, lighting, and export.

## Regenerate

From the repository root, with Blender on your PATH:

```sh
RENDER_TV_POSTER=1 blender --background --python scripts/create-retro-tv.py
node -e "require('sharp')('assets/blender/retro-tv-poster.png').webp({quality:88}).toFile('public/models/retro-tv-poster.webp')"
rm assets/blender/retro-tv-poster.png
```

For Blender MCP, execute the generator with `__file__` set to its absolute path (or set `MAXSUN_PROJECT_ROOT`). The script replaces its own generated scene rather than clearing unrelated scenes.

## Website integration

The glass plane, physical button positions, antenna limits, resting camera pose, and responsive framing are defined in `src/lib/television.ts` and match the generator's browser-space coordinates. `TelevisionModel.tsx` projects those positions with the same orthographic camera that renders the GLB, keeping actual HTML text, links, and keyboard-accessible button targets aligned with the model. The HTML display has a fixed 640px logical width and a height derived from the physical screen aspect ratio. Camera motion updates only its affine transform, never its layout dimensions: text, logos, spacing, and line breaks remain fixed to the glass. The normal view's single-column layout is preserved in front view instead of switching layouts at a projected-width breakpoint. Only an actual device-width breakpoint can change the cabinet/screen aspect ratio. The taller mobile cabinet is a responsive model transform, not a cropped screen.

Each physical button has its own `Button_<id>` mesh, with native HTML buttons supplying accessible input and depression/darkening feedback. **VIEW** (`Button_view`) toggles front/3D view; **POWER** (`Button_power`) toggles the CRT picture and standby LED. The channel **+** and **−** buttons cycle forward/backward through Portfolio → About me → FNAF 1, wrapping at both ends. The old volume +/- buttons are replaced with a recessed track and independently movable `VolumeThumb` (including its parented grip). A native 0–100 range is affinely projected over the track; its transparent 44px logical thumb and 172px input width match the physical thumb travel exactly. Pointer and keyboard changes update the 3D thumb without reloading the model. The TV volume controls FNAF's independent master audio level and the channel-switching static clip. FNAF persists after first tune-in but is muted whenever inactive or the TV is off. The campsite targets 60 fps for fire and sparks, using a deadline-based scheduler to avoid rounding-related frame skips on 60/120/144 Hz displays. Missed frames are skipped rather than replayed in bursts. Reduced-motion and hidden tabs stop idle animation. The camera starts angled. Click-and-drag allows unrestricted horizontal orbit, including the back; once the campsite loads, pitch is constrained above ground to prevent entering the terrain. Pointer capture holds the drag outside the cabinet; release preserves the chosen angle. There is no hover-driven motion or snap-back. Adaptive framing fits the whole model at every orbit angle.

The HTML screen and front-control hit targets are hidden and made inert when facing away from the camera. They do not float through the back of the cabinet. The physical **VIEW** button below the volume slider toggles a larger, centered, front-facing reading view; it does not request browser fullscreen. There is no floating viewport toolbar. Reading mode locks orbit but retains the same animated ambient noise, scanlines, tracking, and antenna reception effects as normal view. Camera yaw/pitch, vertical centering, and orthographic framing transition together over 650 ms with a quintic ease-in/out. The canvas keeps the same dimensions in both modes to avoid layout jumps. Rotation takes the shortest arc even after multiple complete turns. Toggling back smoothly restores the saved exploration angle; reversing mid-transition starts from the current interpolated pose. Reduced motion skips the transition, and hidden tabs settle immediately without retaining animation frames.

Drag either antenna, or focus it and use arrow keys, to adjust reception. Home resets it exactly. Drag sensitivity scales with the cabinet's displayed size. Antennas ease toward accumulated, clamped targets with an 85 ms response rather than jumping on pointer events. Actual angular speed drives a proportional reception envelope with no minimum flash: 110 ms attack, 240 ms recovery, and 100 ms without input before automatic decay. Slowing the drag immediately lowers the target intensity instead of retaining the largest disruption. The static uses the gentler noise pattern and smoothly varying opacity. Hard stops prevent unrealistic rotation or interference from motion against a stop.

Interference is suppressed during startup, when the tab is hidden, or when reduced motion is enabled. Reduced motion applies antenna angles directly without easing. Animation stops after settling, and hidden tabs, context loss, and unmount cancel pending antenna frames. All listeners and reception animation frames are also cleaned up on unmount.

Channel changes show 350 ms of full-frame static before updating the picture. Rapid presses accumulate from the requested destination and restart one timer; the last choice wins, including wraparound and reversals. Channel controls are disabled during initial startup and while off/powering on or off. Power-off cancels an unfinished tune and remembers the last displayed channel. Hidden tabs and reduced-motion preferences settle tuning immediately, without flashing, and unmount clears its timer/listeners. Camera pose, reading view, volume, screen dimensions, and contact links remain unchanged between channels. A polite screen-reader announcement identifies the active channel after tuning; there is no visible channel label or caption over static.

The About channel uses an optimized version of `public/images/pfp2.png` (the supplied profile photo) and a short bio. FNAF runs in a persistent, letterboxed iframe using the copied HTML5 runtime in `public/games/fnaf1/`. The Projects channel has been removed.

Power-off collapses only the inner broadcast layer, leaving the glass, cabinet, and controls intact. In 180 ms the picture abruptly snaps to a thin bright horizontal line, then a dot, then black, using stepped rather than eased keyframes. The flash overlay only brightens once the picture is flat. A subsequent press immediately shows full-screen static at its normal size for 500 ms, then restores the same portfolio with the intro's crossfade; there is no power-on scaling animation. View angle and volume are retained. Off/transitioning pictures are inert and hidden from accessibility, and their noise, interference, tracking, and scanbeam are paused. Rapid presses cannot start overlapping animations. Reduced motion skips the flash, hidden tabs settle immediately, and power timers/listeners are cleaned up on unmount.

On a fresh reload, the entire TV stage stays transparent and non-interactive until the model's first render (or projected fallback) is ready. This prevents the SSR-sized screen and stretched poster from flashing before their exact projection is applied. There is no reveal transition or layout change, and a `<noscript>` override keeps the static portfolio fallback visible and usable without JavaScript. Startup is 2.5 seconds of static **after the model or fallback is ready**, followed by the information screen. Controls are disabled until this initial sequence finishes. There are no boot captions, logos, progress indicators, skip buttons, scrolling sections, or expandable rows.
