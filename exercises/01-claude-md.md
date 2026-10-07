# Exercise 1 — CLAUDE.md

**Time:** 15 minutes  
**Goal:** Write a CLAUDE.md that meaningfully improves Claude's behavior in a real project.

---

## Setup

Pick a project you already have on your machine — a side project, a work repo, or even this `developer_improvements` folder itself.

---

## Part A — Audit (5 min)

Open Claude Code in your chosen project. Ask:

```
What do you know about this project's conventions, toolchain, and architecture?
```

Note what Claude gets right and what it misses or guesses incorrectly.

---

## Part B — Write the CLAUDE.md (8 min)

Create `CLAUDE.md` in the project root. You can run `/init` in a Claude Code session to have Claude draft one from your codebase, then cut it down to what matters. Or write it by hand and fill in at least three of these sections:

```markdown
# Project: [name]

## Architecture
(How is the code organized? What patterns does it follow? What's off-limits?)

## Toolchain
(Package manager, test runner, linter, build command. Be exact — no ambiguity.)

## Conventions
(Naming, file structure, import style, anything Claude gets wrong.)

## Rules
(Hard constraints: files never to modify, commands never to run, patterns to always follow.)

## Common Tasks
(Describe how to do the 2-3 most common tasks in this project.)
```

**Already have an `AGENTS.md`?** If your repo has one and no `CLAUDE.md`, Claude Code reads the `AGENTS.md` as your project instructions (Claude Code v2.1.277 or later). If you add a `CLAUDE.md`, Claude reads that instead, so put `@AGENTS.md` on a line in it to include both. For instructions that are only yours and shouldn't be committed, use `CLAUDE.local.md`.

**Rules for good CLAUDE.md content:**
- Specific over general. "Use pnpm" > "use a package manager"
- What, not why. Save explanations for the README.
- Only things Claude actually needs. Don't document things it already knows.

---

## Part C — Test it (2 min)

Start a new Claude Code session in the same project and repeat the audit question:

```
What do you know about this project's conventions, toolchain, and architecture?
```

Compare the before/after. Note what improved and what's still missing.

---

## Reflection

- What did Claude misunderstand before that it now gets right?
- What didn't make it into CLAUDE.md that you thought would matter?
- What would you add after running a real task?

---

**Go deeper:** [Claude Code 101](https://academy.claude.com/courses/claude-code-101) on Claude Academy.

**Coming from another tool?** Codex reads `AGENTS.md`; Cursor reads `.cursor/rules/*.mdc` and `AGENTS.md`; Gemini CLI reads `GEMINI.md`.
