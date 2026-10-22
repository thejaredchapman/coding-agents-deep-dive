# Exercise 5 — Hooks

**Time:** 15 minutes  
**Goal:** Write three hooks: a Stop hook that reports token usage, a PostToolUse hook that logs file edits, and a PreToolUse hook that blocks a dangerous command.

Do this in a scratch project, not your real one. Hooks run with your user permissions.

---

## Your tool

The steps below were **run for real in Claude Code**. For every other tool the table gives the matching file and command from its own docs (checked 2026-10-08); we did not run those tools, so check your tool's docs if something differs.

| Tool | Where hooks go | Can it do the three hooks? |
|---|---|---|
| Aider | No hooks found | No |
| Claude Code | `.claude/settings.json` | Yes, as written |
| Codex | `~/.codex/hooks.json` or `<repo>/.codex/hooks.json`; same JSON shape | Yes: `Stop`, `PostToolUse`, `PreToolUse`; exit 2 blocks |
| Cursor | `.cursor/hooks.json`; camelCase events | Yes: `stop`, `afterFileEdit`, `preToolUse` or `beforeShellExecution`; exit 2 blocks |
| Devin Desktop | No hooks mentioned in the pages we read | No |
| Gemini CLI | Settings `hooks`; `BeforeTool`, `AfterTool` | Edit logger and blocker: yes (exit 2 blocks). The usage report depends on its payload, which we did not check |
| GitHub Copilot | `.github/hooks/*.json`; `postToolUse`, `preToolUse`, `agentStop` | Logger and reporter: yes. Blocking is not documented |

The Stop-hook usage report reads Claude Code's `transcript_path` file; other tools' payloads differ.

---

## Setup

```bash
mkdir -p ~/hooks-lab/.claude/hooks && cd ~/hooks-lab
```

You will put three scripts in `.claude/hooks/` and register them in `.claude/settings.json`.

---

## Part A — Stop hook: report token usage (5 min)

A Stop hook receives a small JSON payload on stdin. It does **not** contain token counts. It contains `transcript_path`, the file where the whole conversation is stored, and you read usage from there.

Create `.claude/hooks/usage.py`:

```python
#!/usr/bin/env python3
import json, sys

payload = json.load(sys.stdin)
usage, model = {}, "unknown"

for line in open(payload["transcript_path"]):
    entry = json.loads(line)
    if entry.get("type") == "assistant" and not entry.get("isSidechain"):
        message = entry["message"]
        if message.get("usage"):
            usage, model = message["usage"], message.get("model", model)

text = (f"{model}: {usage.get('input_tokens', 0)} in, "
        f"{usage.get('output_tokens', 0)} out, "
        f"{usage.get('cache_read_input_tokens', 0)} cache read")
print(json.dumps({"systemMessage": text}))
```

The script prints JSON with a `systemMessage` field, which Claude Code shows to you as a warning line. Plain stderr output from a successful hook only goes to the debug log, so it would be invisible.

Register it in `.claude/settings.json`:

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/usage.py\""
          }
        ]
      }
    ]
  }
}
```

Note the nesting: an event holds a list of matcher groups, and each group holds a list of hooks. `Stop` has no tool to match, so no `matcher` is needed.

Start `claude` in `~/hooks-lab`, send any prompt, and look for the usage line after the response.

**Why not stdin?** Print the raw payload once to see what you actually get: change the script's first line to `print(sys.stdin.read(), file=open("/tmp/stop.json", "w"))`. You will see fields like `session_id`, `transcript_path`, `last_assistant_message` and `stop_hook_active`, and no `usage`.

---

## Part B — PostToolUse hook: log file edits (5 min)

Create `.claude/hooks/log_edits.py`:

```python
#!/usr/bin/env python3
import json, sys, datetime, pathlib

payload = json.load(sys.stdin)
path = payload.get("tool_input", {}).get("file_path", "?")
log = pathlib.Path.home() / ".claude" / "edit_log.txt"
log.parent.mkdir(exist_ok=True)
with log.open("a") as f:
    f.write(f"{datetime.datetime.now().isoformat()} {payload['tool_name']} {path}\n")
```

Add a `PostToolUse` entry inside `"hooks"`, next to `"Stop"`. The `matcher` is the tool name. File changes use the `Edit` and `Write` tools, so match both:

```json
"PostToolUse": [
  {
    "matcher": "Edit|Write",
    "hooks": [
      {
        "type": "command",
        "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/log_edits.py\""
      }
    ]
  }
]
```

Ask Claude to create a file, then check `~/.claude/edit_log.txt`.

---

## Part C — PreToolUse hook: block a command (5 min)

Create `.claude/hooks/block_rm.py`:

```python
#!/usr/bin/env python3
import json, sys

payload = json.load(sys.stdin)
command = payload.get("tool_input", {}).get("command", "")

if "rm -rf" in command:
    print("Blocked: rm -rf is not allowed in this project.", file=sys.stderr)
    sys.exit(2)
```

Exit code 2 blocks the tool call, and the stderr text is shown to Claude so it can choose another approach. Register it with `"matcher": "Bash"` under `PreToolUse`, in the same nested shape as Part B.

Ask Claude: "delete the build directory with rm -rf build". It should be blocked and explain why.

---

## Test a hook without Claude

You can run any hook script by hand by piping it a sample payload. This is the fastest way to debug one:

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"rm -rf build"}}' \
  | python3 .claude/hooks/block_rm.py; echo "exit code: $?"
```

Expected: the `Blocked` message, then `exit code: 2`.

---

## Reflection

- What's the difference between a Stop hook and a PostToolUse hook?
- Why did the usage hook read the transcript instead of stdin?
- Exit code 2 blocks on `PreToolUse`. What does it do on `Stop`, and on `PostToolUse`?
- Which other lifecycle events (`SessionStart`, `UserPromptSubmit`, `PreCompact`, `SubagentStop`) would be useful in your workflow?

---

**Go deeper:** [Claude Code in action](https://academy.claude.com/courses/claude-code-in-action) on Claude Academy.

**Coming from another tool?** Codex hooks use the same `matcher` plus nested `hooks` JSON in `hooks.json`; Cursor uses `.cursor/hooks.json` with camelCase events; Gemini CLI puts hooks in `settings.json` with events like `BeforeTool`.
