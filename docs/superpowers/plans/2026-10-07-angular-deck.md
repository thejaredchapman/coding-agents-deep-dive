# Angular Interactive Deck (Stage 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** An Angular app in `app/` that presents `deck.md` as an interactive, navigable deck, with a visible "Last updated" date.

**Architecture:** `deck.md` stays the source of truth. A dependency-light Node script (`scripts/build-slides.mjs`) parses it into `app/src/assets/slides.json` (per slide: id, section, title, pre-rendered HTML) using `marked`, and stamps `updated` from `git log -1 --format=%cs -- deck.md`. The Angular app is standalone components with signals; it loads the JSON, renders slide HTML, and handles navigation, sidebar, themes, copy buttons, SVG diagrams and per-exercise checklists (localStorage). Output is static files.

**Tech Stack:** Angular 22 (standalone, signals), TypeScript, `marked` (build time only), Node 18+ `node:test`, the Angular CLI's default test runner.

**Spec:** `docs/superpowers/specs/2026-10-05-deck-upgrade-design.md` (Stage 2), amended: Angular app replaces the single-file Artifact.

## Global Constraints

- `deck.md` and the Marp PDF/HTML workflow keep working unchanged.
- Slide content is generated, never hand-copied into the app.
- Works offline once built; no runtime network calls and no external fonts or scripts.
- Light and dark themes; respects `prefers-color-scheme`; manual toggle persists.
- Layout works at phone width (no horizontal page scroll; tables scroll inside their slide).
- localStorage access is wrapped in try/catch; the app works without it.
- Accessibility: keyboard operable, visible focus, landmarks, `aria-live` slide announcements, sufficient contrast.
- "Last updated" shows the date of the last commit that touched `deck.md` (currently 2026-10-07), in the UI footer and the README.
- Commit messages end with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

---

### Task 1: Slide data build script

**Files:**
- Create: `scripts/build-slides.mjs`, `scripts/build-slides.test.mjs`, root `package.json` (scripts + `marked` devDependency)
- Output (generated, committed): `app/src/assets/slides.json`

**Interfaces:**
- Produces `slides.json`: `{ "updated": "YYYY-MM-DD", "slides": [{ "id": number, "section": string, "title": string, "html": string, "diagram"?: string }] }`. `section` is the nearest preceding top-level `# N. Name` heading; `title` is the slide's first heading text.
- Exports `parseDeck(markdown): Slide[]` for tests.

- [ ] Write failing tests (`node --test`): fences containing `---` don't split slides; front matter is skipped; section tracking; title extraction; count equals the check script's count for the real deck.
- [ ] Implement `parseDeck` and the CLI entry; run tests until green.
- [ ] Run `node scripts/build-slides.mjs`, confirm 107 slides and `updated` matches `git log -1 --format=%cs -- deck.md`.
- [ ] Commit.

### Task 2: Scaffold the Angular app

**Files:** Create `app/` with the Angular CLI (standalone, routing off, SCSS, no SSR).

- [ ] `npx @angular/cli@latest new app --routing=false --style=scss --ssr=false --skip-git --defaults`
- [ ] Verify `ng build` and the default test run pass.
- [ ] Add npm scripts at the repo root: `build:slides`, `app:start`, `app:build`.
- [ ] Commit.

### Task 3: Deck state service

**Files:** `app/src/app/deck.service.ts`, `deck.service.spec.ts`

**Interfaces:**
- `DeckService`: `slides: Signal<Slide[]>`, `index: Signal<number>`, `current: Signal<Slide>`, `sections: Signal<{name: string; firstIndex: number; count: number}[]>`, `progress: Signal<number>` (0..1), `updated: Signal<string>`, methods `next()`, `prev()`, `goTo(i)`, `goToSection(name)`. Index syncs with `location.hash` (`#/12`, 1-based) both ways. Index is clamped to range.

- [ ] Tests first: clamping, next/prev bounds, hash read on load, hash write on change, section grouping.
- [ ] Implement; run tests.
- [ ] Commit.

### Task 4: Shell, slide view, navigation

**Files:** `app.ts/html/scss`, `slide-view`, `sidebar`, `progress-bar` components.

- [ ] Keyboard: Left/Right/PageUp/PageDown, Home/End, Space (next), `t` toggles theme, `s` toggles sidebar, `?` help. Ignore keys when typing in an input.
- [ ] Swipe left/right (pointer events, threshold 50px).
- [ ] Sidebar lists sections with slide counts; current section highlighted; collapses on phone width.
- [ ] Progress bar with `role="progressbar"`; `aria-live="polite"` region announcing "Slide N of M: title".
- [ ] Footer: "Last updated {{updated}}" and slide counter.
- [ ] Commit.

### Task 5: Themes, content styling, copy buttons

**Files:** `styles.scss`, `theme.service.ts` (+ spec), slide content styles.

- [ ] CSS custom properties for light and dark; `prefers-color-scheme` default; `data-theme` override; persisted with try/catch.
- [ ] Style tables (scroll inside slide), code blocks, `.small` footnotes, inline code.
- [ ] Copy button on every `pre` (event delegation, `navigator.clipboard` with a fallback), with a visible "Copied" state.
- [ ] Commit.

### Task 6: SVG diagrams

**Files:** `diagrams/` components (hooks lifecycle, parallel subagents, putting-it-together flow, ecosystem map); mapping from slide title to diagram id in `build-slides.mjs`.

- [ ] The build script sets `diagram` for slides whose title matches; the slide view renders the diagram component above the text.
- [ ] Diagrams use theme variables so they work in both themes; each has a `<title>` and `<desc>`.
- [ ] Commit.

### Task 7: Exercise checklists

**Files:** `checklist.service.ts` (+ spec), slide-view integration.

- [ ] For slides titled `🛠 Exercise N`, show a checklist (Part A/B/C steps from `exercises/0N-*.md` headings, generated into `slides.json` as `checklist: string[]`).
- [ ] State per exercise in localStorage under a namespaced key; works without storage.
- [ ] Commit.

### Task 8: Docs, verification, build

- [ ] README: how to run (`npm run build:slides`, `npm run app:start`), where the date comes from, "Last updated" line.
- [ ] `node scripts/check-deck.mjs` still passes; `marp` render still works.
- [ ] `ng build` production passes; app tests pass; keyboard, swipe (via a pointer-event test), theme, phone-width behavior checked in a real browser with screenshots.
- [ ] Commit and push; open a PR.

---

## Self-review

- Spec Stage 2 items map to tasks: navigation and sidebar (4), progress (4), themes (5), SVG diagrams (6), copy buttons (5), checklists (7), `deck.md` source of truth (1), Marp still works (8), phone width (4/5, verified in 8).
- The added requirement, a visible "Last updated" date, is Tasks 1, 4 and 8.
