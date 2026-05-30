# Exercise 3 — Skills

**Time:** 15 minutes  
**Goal:** Build a `/standup` skill that generates a daily standup summary from your git log.

---

## Setup

Create the skills directory if it doesn't exist:

```bash
mkdir -p ~/.claude/skills
```

---

## Part A — Write the skill (8 min)

Create `~/.claude/skills/standup.md`:

```markdown
# Daily Standup Generator

Generate a standup summary from recent git activity.

## Steps

1. Run `git log --oneline --since="yesterday" --author="$(git config user.name)"` to get yesterday's commits
2. Run `git log --oneline --since="1 hour ago"` to get what's been done today so far
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
```

---

## Part B — Test it

In any git repo, run:

```
/standup
```

---

## Part C — Extend it (5 min)

Try adding one of these to your skill:

**Option A — Scope to a project:**
```markdown
Filter commits to those touching files in `src/` only.
```

**Option B — Accept a date:**
```markdown
If {{args}} contains a date (e.g. "2026-05-28"), use that as the since date instead of "yesterday".
```

**Option C — Add context:**
```markdown
After generating the standup, check if any of yesterday's commits are referenced in open GitHub issues and note the connection.
```

---

## Reflection

- How is `/standup` different from just asking "summarize my git log"?
- What other repetitive workflows in your day could become skills?
- What's the right level of detail in a skill file vs. in a CLAUDE.md?
