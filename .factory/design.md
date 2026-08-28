# Scan to Study Pack — visual thesis

## Direction: pixel/demoscene reading room

The product treats a scan as a signal to be recovered, not a document to be
uploaded. The interface borrows from 1990s demoscene trackers and CRT terminal
overlays: crisp index marks, dither-like dot fields, and a page viewport that
feels like a small light table. This makes provenance feel tangible while the
reading surface stays calm.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | `#102027` | midnight blue-black background and primary text in light mode |
| `--paper` | `#f6f1e5` | warm paper surfaces |
| `--cream` | `#e7dcc8` | secondary light surfaces |
| `--signal` | `#e95835` | primary action / current-page marker |
| `--phosphor` | `#9fe870` | confirmed / ready signal |
| `--violet` | `#bc9cff` | links and focused controls |
| `--ash` | `#aebbc0` | muted dark-mode labels |
| `--warning` | `#ffcc66` | low-confidence warning |

Both explicit themes use this palette: warm paper in daylight, midnight ink in
night mode. Text pairs are chosen at 4.5:1 or better.

## Type, spacing, interaction

System `ui-monospace` gives status, page numbers, and OCR metrics the feeling
of reliable instrumentation. `Georgia` is reserved for recovered reading text,
so the artifact is visibly different from the controls around it. The rhythm is
4px based (4, 8, 12, 16, 24, 32, 48); content widths prioritize a readable
60–72-character transcript. Controls are squared, high-contrast, and use
small pixel-like corner cuts rather than generic rounded cards.

The canvas and extracted text move together: selecting a page updates both;
processing advances a segmented scanline. Motion is 180–240ms transform/opacity
only. With reduced motion, changes are immediate and the scanline is removed.

## Original asset plan and provenance

The hero is one original raster: an abstract overhead "reading signal" made of
a warm paper page, red crop guides, a phosphor text grid, and CRT scanline
texture—no people, brands, readable words, logos, watermark, or copyrighted
material. It is an atmospheric explanation of page-to-text alignment, not a
claim that OCR is magical. Generated with the factory Azure image model on
2026-08-28 from the prompt recorded in `assets/hero-reading-signal.json`.
The delivered WebP is optimized below 300 KB; all UI symbols are authored SVG.

**Prompt sheet:** subject: recovered page signal; world: quiet demoscene
reading lab; materials: recycled paper, phosphor pixels, subtle CRT texture;
light: warm desk light against midnight; palette words: ink, parchment,
signal red, acid green, lavender; lens: straight-on editorial still life;
negative list: words, letters, logos, watermark, people, brands, UI mockups,
copyrighted characters.
