# Exercise 4 — MCP

**Time:** 20 minutes  
**Goal:** Register an MCP server and use it in a real task.

You add servers with `claude mcp add`. Each server lands in one of three scopes:

| Scope | Flag | Stored in | Who sees it |
|-------|------|-----------|-------------|
| local (default) | none | `~/.claude.json` | you, in this project only |
| project | `--scope project` | `.mcp.json` in the repo root | everyone who clones the repo |
| user | `--scope user` | `~/.claude.json` | you, in every project |

---

## Option A — Filesystem MCP (easiest)

The filesystem MCP server lets Claude read and write files in directories you name, even outside the current project. You don't install it first; `npx` fetches it.

```bash
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem \
  "$HOME/Documents" "$HOME/Downloads"
```

Everything after `--` is the server command. The `--` is required: without it, Claude Code tries to read the server's flags as its own.

Check that it connected:

```bash
claude mcp list
```

You should see `filesystem: ... ✔ Connected`. Inside a Claude Code session, `/mcp` shows the same status.

**Try it:**

```
List all markdown files in my Documents folder and summarize what each one is about.
```

---

## Option B — GitHub MCP

GitHub runs an official remote MCP server. The old `@modelcontextprotocol/server-github` npm package is deprecated, so don't use it.

```bash
claude mcp add --transport http github https://api.githubcopilot.com/mcp/
```

Then, inside a session, run `/mcp` and choose **github** to sign in with OAuth in your browser. To use a personal access token instead, add `--header "Authorization: Bearer YOUR_TOKEN"` to the command.

**Try it:**

```
List my open pull requests across all repos and tell me which ones have been waiting longest for review.
```

---

## Option C — Build a minimal MCP server

If you want to build rather than install, here is a working server with one tool.

```bash
mkdir my-mcp-server && cd my-mcp-server
npm init -y
npm pkg set type=module
npm install @modelcontextprotocol/sdk zod
npm install -D typescript @types/node
mkdir src
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

`rootDir` is required: recent TypeScript versions refuse to build without it.

Create `src/index.ts`:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "time-server", version: "1.0.0" });

server.registerTool(
  "get_time",
  {
    description: "Get the current date and time",
    inputSchema: { timezone: z.string().optional().describe("IANA timezone, e.g. America/Los_Angeles") },
  },
  async ({ timezone }) => ({
    content: [
      {
        type: "text",
        text: new Date().toLocaleString("en-US", timezone ? { timeZone: timezone } : undefined),
      },
    ],
  })
);

await server.connect(new StdioServerTransport());
```

Build and register it:

```bash
npx tsc
claude mcp add time-server -- node "$PWD/dist/index.js"
claude mcp list
```

Ask Claude: `What time is it right now in Tokyo?`

A stdio server must never write to stdout except MCP messages; use `console.error` for logs.

---

## Share a server with your team

Add `--scope project` to write the server into `.mcp.json`, which you can commit:

```bash
claude mcp add --scope project --transport http github https://api.githubcopilot.com/mcp/
```

Claude Code asks each teammate to approve a project server the first time they use it. In `.mcp.json`, `${VAR}` and `${VAR:-default}` expand from the environment, so keep tokens out of the file.

To remove a server: `claude mcp remove <name>`.

---

## Reflection

- What data source would make Claude most useful in your daily work if it could access it?
- What's the difference between an MCP tool and a Bash command Claude runs directly?
- When would you build a custom MCP server vs. using a pre-built one?
- Which of your servers belong in the project scope, and which in your user scope?

---

**Go deeper:** [Introduction to Model Context Protocol](https://academy.claude.com/courses/introduction-to-model-context-protocol) on Claude Academy.

**Coming from another tool?** Codex: `codex mcp add` or `config.toml`; Cursor: `.cursor/mcp.json`; Gemini CLI: `gemini mcp add`.
