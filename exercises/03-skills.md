# Exercise 3 — Skills

**Time:** 15 minutes  
**Goal:** Build a `/standup` skill that generates a daily standup summary from your git log.

---

## Setup

A skill is a directory with a `SKILL.md` file inside it. Create the directory:

```bash
mkdir -p ~/.claude/skills/standup
```

---

## Part A — Write the skill (8 min)

Create `~/.claude/skills/standup/SKILL.md`:

````markdown
---
name: standup
description: Generates a daily standup summary from recent git activity
argument-hint: "[date]"
---

# Daily Standup Generator

Generate a standup summary from recent git activity.

## Steps

1. Run `git log --oneline --since="yesterday midnight" --until="midnight" --author="$(git config user.name)"` to get yesterday's commits
2. Run `git log --oneline --since="midnight" --author="$(git config user.name)"` to get what's been done today so far
3. Run `git status` to see what's in progress
4. Check for any open PRs with `gh pr list --author @me` (skip if gh is not installed)

## Output format

```
**Yesterday**
- [bullet per logical piece of work, grouped from commits]

**Today**
- [in progress items from git status + any commits from today]

**Blockers**
- [list any — if none, say "none"]
```

Keep bullets to one line each. Merge related commits into one bullet.
Use past tense for yesterday, present continuous for today.
````

Use `yesterday midnight` and not plain `yesterday`: git reads `yesterday` as "24 hours ago", which drops commits from yesterday morning.

The `name` and `description` lines are the frontmatter. `description` is what Claude reads to decide when the skill is relevant, so make it specific.

---

## Part B — Test it

Skills are picked up without restarting. In any git repo, run:

```
/standup
```

The first time, Claude Code asks permission to run the `git log` commands, because they contain `$(git config user.name)`. Approve them. (In non-interactive `claude -p` runs, an allow rule like `Bash(git *)` does not cover commands containing `$(...)`, so they are denied.)

You can also ask in plain language ("write my standup from git") and Claude may load the skill on its own, because of the `description`.

---

## Part C — Extend it (5 min)

Try adding one of these to your skill:

**Option A — Scope to a project:**
```markdown
Filter commits to those touching files in `src/` only.
```

**Option B — Accept a date:**
```markdown
If $ARGUMENTS contains a date (e.g. "2026-05-28"), use that as the since date instead of "yesterday".
```
Run it as `/standup 2026-05-28`. `$ARGUMENTS` is replaced with everything you typed after the skill name.

**Option C — Pre-load the git log:**

Replace step 1 with a line that runs before Claude reads the skill, using the `!` prefix:

```markdown
## Yesterday's commits

!`git log --oneline --since="yesterday midnight" --until="midnight" --author="$(git config user.name)"`
```

**Option D — Keep it manual-only:**
```yaml
disable-model-invocation: true
```
Add this to the frontmatter so Claude never runs the skill on its own and only `/standup` does.

---

## Reflection

- How is `/standup` different from just asking "summarize my git log"?
- What other repetitive workflows in your day could become skills?
- What's the right level of detail in a skill file vs. in a CLAUDE.md?
- When would you set `disable-model-invocation: true`?
