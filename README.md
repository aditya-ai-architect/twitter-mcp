# Twitter/X MCP Server

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-blueviolet)](https://modelcontextprotocol.io)
[![License: ISC](https://img.shields.io/badge/License-ISC-green.svg)](https://opensource.org/licenses/ISC)

A [Model Context Protocol](https://modelcontextprotocol.io) server that gives AI assistants full read/write access to Twitter/X through cookie-based authentication. No Developer account or OAuth app required.

---

## Features

- **12 tools** covering timelines, search, profiles, trends, posting, likes, retweets, and replies
- **Cookie-based auth** -- uses your browser session cookies, no Twitter API keys needed
- **Dual-engine architecture** -- fast HTTP via undici for reads, headless Puppeteer with stealth plugin for writes
- **Anti-bot bypass** -- puppeteer-extra-plugin-stealth avoids Twitter automation detection (error 226)
- **Auto CSRF refresh** -- ct0 tokens refreshed transparently when Twitter rotates them
- **Clean JSON output** -- nested GraphQL responses parsed into simple, structured objects
- **Type-safe** -- strict TypeScript with Zod schema validation on every tool input
- **MCP standard** -- works with Claude Desktop, Claude Code, and any MCP-compatible client

---

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- A **Twitter/X account** with an active browser session

---

## Installation

```bash
git clone https://github.com/aditya-ai-architect/twitter-mcp.git
cd twitter-mcp
npm install
npm run build
```

---

## Getting Your Twitter Cookies

1. Open [x.com](https://x.com) and log in
2. Open **Developer Tools** (F12)
3. Go to **Application** > **Cookies** > `https://x.com`
4. Copy these two values:

| Cookie | Description |
|--------|-------------|
| `auth_token` | Session authentication token |
| `ct0` | CSRF protection token |

Both cookies must come from the same active session.

---

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TWITTER_AUTH_TOKEN` | Yes | The `auth_token` cookie value |
| `TWITTER_CT0` | Yes | The `ct0` cookie value |

Create a `.env` file in the project root:

```env
TWITTER_AUTH_TOKEN=your_auth_token_here
TWITTER_CT0=your_ct0_here
```

### Claude Desktop

Add to your Claude Desktop config:

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "twitter": {
      "command": "node",
      "args": ["/absolute/path/to/twitter-mcp/build/index.js"],
      "env": {
        "TWITTER_AUTH_TOKEN": "your_auth_token_here",
        "TWITTER_CT0": "your_ct0_here"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add twitter -- node /absolute/path/to/twitter-mcp/build/index.js
```

---

## Tools

### Read Operations

| Tool | Description |
|------|-------------|
| `get_home_timeline` | Fetch tweets from the authenticated user's home timeline |
| `get_user_profile` | Get a user profile by username |
| `get_user_tweets` | Get recent tweets from a specific user |
| `get_tweet` | Get a single tweet by ID |
| `search_tweets` | Search tweets with full operator support |
| `get_trends` | Get current trending topics |

### Write Operations

| Tool | Description |
|------|-------------|
| `post_tweet` | Post a new tweet |
| `like_tweet` | Like a tweet |
| `unlike_tweet` | Remove a like |
| `retweet` | Retweet a tweet |
| `unretweet` | Remove a retweet |
| `reply_to_tweet` | Reply to a specific tweet |

---

## Architecture

```
MCP Client (Claude)  <--stdio-->  twitter-mcp Server
                                        |
                        +---------------+---------------+
                        |                               |
                 undici HTTP                    Puppeteer + Stealth
                 (Read ops)                    (Write ops)
                        |                               |
                        +---------------+---------------+
                                        |
                                  x.com GraphQL API
```

**Read operations** use direct HTTP for speed. **Write operations** use a headless browser with stealth to bypass automation detection.

---

## Development

```bash
npm run dev      # Watch mode
npm run build    # Build once
npm start        # Run the server
```

### Project Structure

```
twitter-mcp/
  src/
    index.ts              # MCP server setup and tool registration
    twitter-client.ts     # Twitter API client (HTTP + Puppeteer)
    types.ts              # TypeScript interfaces
  build/                  # Compiled output
  package.json
  tsconfig.json
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| HTTP 401/403 | Cookies expired -- extract fresh ones from browser |
| HTTP 429 | Rate limited -- wait a few minutes |
| Error 226 | Stealth browser handles this; if persistent, post manually once then retry |
| Empty responses | Twitter may have rotated GraphQL query IDs |

---

## Tech Stack

- **Runtime:** Node.js (ES2022)
- **Language:** TypeScript 5.x (strict mode)
- **MCP SDK:** @modelcontextprotocol/sdk
- **HTTP Client:** undici
- **Browser:** Puppeteer + puppeteer-extra-plugin-stealth
- **Validation:** Zod

---

## License

ISC

---

**Built by [Aditya Gaurav](https://github.com/aditya-ai-architect)**
