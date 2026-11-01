# Credits and source attribution

This invitation is an integration of code adapted from three open-source
projects, plus this project's own integration, artwork and wedding content.
Original licence texts are in `licenses/`. Every adapted file names its
source in its header comment.

## spring-bloom

- Repository: https://github.com/amrbody71-commits/spring-bloom
- Commit: `fc00a30b8f76aef83eb3b500951af264ebfa0453` (16 September 2026)
- Author: Abdelrahman Shaaban
- Licence: MIT for the code (`licenses/spring-bloom-LICENSE.txt`). The book
  *Spring Bloom*, its text, illustrations, cut-outs, cover and narration are
  reserved by their rights holders and **none of them are used here**.

| Original file | Here | What changed |
|---|---|---|
| `js/leaf.js` | `src/book/leaf.js` | Verbatim apart from six leaves and an ivory paper colour. The bend maths is credited in the file to a MengTo sketch, as in the original. |
| `js/book.js` | `src/book/book.js` | Ivory cloth; cover and page art come from canvas textures instead of image files. |
| `js/turn.js` | `src/book/turn.js` | Import paths only. |
| `js/textures.js` | `src/book/pages.js` | Pool structure kept; pages are painted on canvas (names, headings, monogram, gold rules) rather than loaded. |
| `js/clock.js` | `src/core/clock.js` | A `paused` flag added for the guest's pause control. |
| `js/events.js` | `src/core/events.js` | Unchanged. |
| `js/viewport.js` | `src/core/viewport.js` | Portrait fallback size. |
| `js/rng.js` | `src/core/rng.js` | Unchanged. |
| `js/camera.js` | `src/camera/camera.js` | Headroom and panel shares, far plane. |
| `js/ledger.js` | `src/camera/ledger.js` | Cut-out rows and asset loading removed; `world` and `chapter` rows and a `pose` event added. |
| `js/tour.js` | `src/timeline/tour.js` | Pointer and narration events removed; `pose`, `caption`, `phase`, `finish()`, `replay()` added. |
| `js/popup.js` | `src/popup/popup.js` | Time-driven rise, fold, stagger, overshoot, shadows and breathing kept; drives 3D groups instead of textured cut-outs. |
| `js/scene.js` | `src/world/scene.js` | GPU tier probe and renderer policy only; desk, lamp, props and post chain not used. |
| `js/app.js` | `src/main.js` | Boot shape and the `window.__invite` api object. |

## Elemental-Serenity

- Repository: https://github.com/SahilK-027/Elemental-Serenity
- Commit: `6b8cebefa0ee10e1bdd081dd342a01b3fe753e09` (17 June 2026)
- Author: Sahil K
- Licence: MIT (`licenses/Elemental-Serenity-LICENSE.txt`)
- Not used: the tent, bridge, camp, rocks and tree models, environment cube
  maps, textures, audio, the entrance screen, settings, weather, lightning,
  rain, snow and water. Blade and petal geometry here is procedural and every
  sprite is drawn on a canvas.

| Original file | Here | What changed |
|---|---|---|
| `src/Game/World/Managers/GrassManager/GrassManager.class.js`, `src/Shaders/Chunks/grass/*.glsl` | `src/world/grass.js` | Instanced blades, wind field, bend and colour mask kept; procedural blade, radial density, sand-ivory-gold colours. |
| `src/Game/World/Components/FireFlies/FireFlies.class.js`, `src/Shaders/Materials/fireflies/*.glsl` | `src/world/lights.js` | Points, curl-noise motion and flicker kept; placed on catenaries as string lights, motion scaled down, normal blending, bulbs added. |
| `src/Game/World/Components/FallingLeaves/FallingLeavesSystem.class.js` | `src/world/petals.js` | Instanced drift kept; procedural petal, seeded randomness. |
| `src/Game/World/Components/Skydome/Skydome.class.js`, `src/Shaders/Materials/skydome/*.glsl` | `src/world/sky.js` | Gradient dome kept; sun, moon, stars and seasons removed. |
| `src/Game/World/Components/Lighting/Lighting.class.js` | `src/world/lighting.js` | Four-light rig and shadow setup kept; one warm preset. |
| `src/reveal.js`, `src/Shaders/Materials/reveal/*.glsl` | `src/world/reveal.js` | Noise reveal kept; runs from book time, no button, cream colour. |

## rainy-study

- Repository: https://github.com/andyhuo520/rainy-study
- Commit: `b7c360dffd9b932c277a2201c95717e1c4f5af47` (13 September 2026)
- Author: andyhuo520
- Licence: MIT for project code (`licenses/rainy-study-LICENSE.txt`). The
  AI-generated covers and the synthesised narration are not used.

| Original file | Here | What changed |
|---|---|---|
| `src/pop-up-world.js` | `src/popup/pieces.js` | Paper-grain bump material, `mesh`/`ell`/`box`/`cone`/`star` builders, the foliage cluster, the wind sway and the floaters' bob kept; the scenery fold-from-the-foot is used in `src/popup/popup.js`. The fox, whale and rabbit worlds, the room, the renderer and controls are gone. |

## Reference only

- Wawa Sensei, *r3f-animated-book-slider-final*
  (https://github.com/wass08/r3f-animated-book-slider-final). No licence is
  published and no permission was obtained, so no code or asset from it is
  used. It was looked at as a visual reference for dimensional page movement.

## Other

- three.js (MIT), Vite (MIT), Fontsource packages for Cormorant Garamond,
  Inter and Amiri (fonts under the SIL Open Font License).
- The pavilion, dais, chapter pieces, page artwork, HTML layer, timeline,
  countdown, calendar, RSVP and contact code are this project's own.
