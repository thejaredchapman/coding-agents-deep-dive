# Exercise 5 — Hooks

**Time:** 10 minutes  
**Goal:** Install the cost tracker Stop hook and confirm it fires after a turn.

---

## Setup

The cost tracker lives in this repo at `../claude-code-updates/`.

```bash
cd ../claude-code-updates
bash install.sh
```

The installer adds this to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "Stop": [
      {
        "type": "command",
        "command": "python3 /path/to/usage_tracker.py"
      }
    ]
  }
}
```

---

## Verify it works

Start a Claude Code session and run any prompt. After Claude responds, you should see a cost block printed to the terminal:

```
  ┌─ cost tracker ───────────────────────────────────────────┐
  │  turn        $0.0041   claude-sonnet-4-6
  │  12h (1 turns)   $0.0041   [░░░░░░░░░░░░░░░░░░]
  │  today       $0.0041
  │  context      3,218 tok  [░░░░░░░░░░░░░░░░░░] 2%
  └──────────────────────────────────────────────────────────┘
```

---

## Part B — Write a PostToolUse hook (optional, 5 min)

Create a hook that logs every file write to a simple text file:

```bash
cat > /tmp/log_writes.sh << 'EOF'
#!/bin/bash
# Reads the PostToolUse JSON payload and logs file writes
INPUT=$(cat)
TOOL=$(echo "$INPUT" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('tool_name',''))" 2>/dev/null)
if [ "$TOOL" = "write_file" ] || [ "$TOOL" = "str_replace_based_edit_tool" ]; then
  echo "$(date -Iseconds) $TOOL" >> ~/.claude/write_log.txt
fi
EOF
chmod +x /tmp/log_writes.sh
```

Register it:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "type": "command",
        "command": "bash /tmp/log_writes.sh"
      }
    ]
  }
}
```

Ask Claude to edit a file, then check `~/.claude/write_log.txt`.

---

## Reflection

- What's the difference between a Stop hook and a PostToolUse hook?
- What would you use exit code 2 (block) for on a PreToolUse hook?
- What other lifecycle events would be useful to hook in your workflow?
