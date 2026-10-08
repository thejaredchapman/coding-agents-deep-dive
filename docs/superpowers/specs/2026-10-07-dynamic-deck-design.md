# Dynamic Deck: Design

Date: 2026-10-07. Builds on the Angular app (PR #2).

## Direction

**Terminal workbench** (revised after the first "field manual" look resembled another app). A tab line, a file-tree contents pane, a statusline showing the mode (NORMAL, SEARCH, EXPLORE, HELP), and floating windows with titles set into the border. Day and night themes, a sans body with mono chrome (system font stacks only; the app works offline). One memorable idea: **pick your tool** and the deck re-tints around it.

- **Neutral by default.** No tool selected: neutral amber/teal accent. Selecting a tool tints the interface with that tool's hue and glyph.
- **Tools** (hue plus glyph, so color is never the only cue): Claude Code ● vermilion, Codex ▲ blue, Cursor ■ violet, Gemini CLI ◆ green. Text-safe darker variants on paper, lighter tints in dark mode; all text pairs meet 4.5:1.
- **Motion** is purposeful: a staged reveal on slide change (direction-aware), a cover sequence, and stepping animation in the hook lifecycle. Everything honors `prefers-reduced-motion`.

## Features

1. **Personalize by tool.** Picker (cover and header), remembered. Highlights that tool's column in every comparison table and dims others; "My tool" jumps to its section; its section is marked in the sidebar.
2. **Table controls.** On comparison tables: toggle tool columns, filter rows.
3. **Shortcut and command explorer.** Overlay with tool chips and a live filter, built from the deck's own tables (`explorer.json`, generated).
4. **Search and command palette.** `/` or `Ctrl/Cmd+K`: search every slide plus actions (switch theme, choose tool, open explorer).
5. **Interactive hook lifecycle.** Step through events, see what each can do, and toggle "exit code 2" to watch PreToolUse block the call.

## Constraints

Inherits the Stage 2 constraints: static build, offline, no external fonts or scripts, storage always in try/catch, phone-width layout without page scroll, keyboard operable, visible focus, `aria-live` announcements. Neutral toward all four tools.

## Verification

Unit tests for every pure piece (explorer extraction, search scoring, table enhancement, tool service, stepper); real-browser check of each feature in light and dark; reduced-motion check; phone-width check.
