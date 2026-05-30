# Exercise 4 — MCP

**Time:** 20 minutes  
**Goal:** Register a pre-built MCP server and use it in a real task.

---

## Option A — Filesystem MCP (easiest)

The filesystem MCP server lets Claude read and write files outside your current project directory.

**Install and register:**

```bash
# Install
npm install -g @modelcontextprotocol/server-filesystem

# Add to ~/.claude/mcp.json (create if missing)
```

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/YOUR_USERNAME/Documents",
        "/Users/YOUR_USERNAME/Downloads"
      ]
    }
  }
}
```

**Try it:**

```
List all markdown files in my Documents folder and summarize what each one is about.
```

---

## Option B — GitHub MCP (if you have a GitHub token)

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token-here"
      }
    }
  }
}
```

**Try it:**

```
List my open pull requests across all repos and tell me which ones have been waiting longest for review.
```

---

## Option C — Build a minimal MCP server

If you want to build rather than install, here's the minimal structure:

```bash
mkdir my-mcp-server && cd my-mcp-server
npm init -y
npm install @modelcontextprotocol/sdk
npm install -D typescript @types/node
```

Create `src/index.ts` with a single tool that returns the current time:

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server({ name: "time-server", version: "1.0.0" }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: "get_time",
    description: "Get the current date and time",
    inputSchema: { type: "object", properties: {} }
  }]
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => ({
  content: [{ type: "text", text: new Date().toISOString() }]
}));

const transport = new StdioServerTransport();
await server.connect(transport);
```

Build, register, and ask Claude: `What time is it right now?`

---

## Reflection

- What data source would make Claude most useful in your daily work if it could access it?
- What's the difference between an MCP tool and a Bash command Claude runs directly?
- When would you build a custom MCP server vs. using a pre-built one?
