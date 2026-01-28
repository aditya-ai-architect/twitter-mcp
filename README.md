# Twitter/X MCP Server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that connects AI assistants to Twitter/X using cookie-based authentication. Provides 12 tools for reading timelines, searching tweets, posting, liking, retweeting, and more — all through Twitter's internal GraphQL API.

Built with TypeScript, `@modelcontextprotocol/sdk`, and Zod for runtime validation.

---

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Getting Your Twitter Cookies](#getting-your-twitter-cookies)
- [Configuration](#configuration)
  - [Claude Desktop](#claude-desktop)
  - [Claude Code (CLI)](#claude-code-cli)
  - [Environment Variables](#environment-variables)
- [Tools Reference](#tools-reference)
  - [Read Operations](#read-operations)
  - [Write Operations](#write-operations)
- [Response Formats](#response-formats)
- [Development](#development)
- [Architecture](#architecture)
- [Troubleshooting](#troubleshooting)
- [Disclaimer](#disclaimer)
- [License](#license)

---

## Features

- **Full Twitter access** — Read timelines, search, view profiles, post tweets, like, retweet, reply
- **Cookie-based auth** — No Twitter Developer account or OAuth app required
- **Clean responses** — Deeply nested Twitter GraphQL responses are parsed into simple, readable JSON
- **Type-safe** — Written in strict TypeScript with Zod schema validation on all tool inputs
- **Lightweight** — Zero bloat, 3 source files, minimal dependencies
- **MCP standard** — Works with any MCP-compatible client (Claude Desktop, Claude Code, etc.)

---

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- A **Twitter/X account** with an active session in your browser

---

## Installation

```bash
# Clone the repository
git clone https://github.com/aditya-ai-architect/twitter-mcp.git
cd twitter-mcp

# Install dependencies
npm install

# Build
npm run build
```

---

## Getting Your Twitter Cookies

The server authenticates using two cookies from your logged-in Twitter session. Here's how to extract them:

1. Open [x.com](https://x.com) in your browser and log in
2. Open **Developer Tools** (`F12` or `Ctrl+Shift+I`)
3. Go to the **Application** tab (Chrome/Edge) or **Storage** tab (Firefox)
4. In the left sidebar, expand **Cookies** and click on `https://x.com`
5. Find and copy these two cookie values:

| Cookie | Description |
|--------|-------------|
| `auth_token` | Your session authentication token |
| `ct0` | CSRF protection token |

> **Important:** Both cookies must come from the same active session. If you log out or the session expires, you'll need to extract fresh cookies.

---

## Configuration

### Claude Desktop

Add the server to your Claude Desktop config file:

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

### Claude Code (CLI)

Add to your Claude Code MCP settings (`.claude/settings.json` or via `claude mcp add`):

```bash
claude mcp add twitter -- node /absolute/path/to/twitter-mcp/build/index.js
```

Then set the environment variables before launching, or use a `.env` file in the project directory.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TWITTER_AUTH_TOKEN` | Yes | The `auth_token` cookie from your Twitter session |
| `TWITTER_CT0` | Yes | The `ct0` CSRF cookie from your Twitter session |

You can also create a `.env` file in the project root:

```env
TWITTER_AUTH_TOKEN=your_auth_token_here
TWITTER_CT0=your_ct0_here
```

---

## Tools Reference

### Read Operations

#### `get_home_timeline`

Fetch tweets from the authenticated user's home timeline.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `count` | number | 20 | Number of tweets to fetch (1-100) |

#### `get_user_profile`

Get a Twitter user's profile information by their username.

| Parameter | Type | Description |
|-----------|------|-------------|
| `username` | string | Twitter username without the `@` symbol |

#### `get_user_tweets`

Get recent tweets posted by a specific user.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `username` | string | — | Twitter username without `@` |
| `count` | number | 20 | Number of tweets to fetch (1-100) |

#### `get_tweet`

Get a single tweet by its ID.

| Parameter | Type | Description |
|-----------|------|-------------|
| `tweet_id` | string | The tweet ID |

#### `search_tweets`

Search for tweets matching a query. Supports Twitter search operators (`from:`, `to:`, `has:`, `filter:`, etc.).

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | — | Search query string |
| `count` | number | 20 | Number of results (1-100) |

**Search operator examples:**
- `from:elonmusk` — tweets from a specific user
- `to:openai` — tweets directed at a user
- `"exact phrase"` — exact phrase match
- `has:media` — tweets containing media
- `filter:links` — tweets containing links
- `lang:en` — filter by language
- `since:2024-01-01 until:2024-12-31` — date range

#### `get_trends`

Get current trending topics on Twitter. Takes no parameters.

---

### Write Operations

#### `post_tweet`

Post a new tweet. Can also reply to an existing tweet.

| Parameter | Type | Description |
|-----------|------|-------------|
| `text` | string | Tweet text (1-280 characters) |
| `reply_to_tweet_id` | string? | Optional tweet ID to reply to |

#### `like_tweet`

Like a tweet by its ID.

| Parameter | Type | Description |
|-----------|------|-------------|
| `tweet_id` | string | The tweet ID to like |

#### `unlike_tweet`

Remove a like from a tweet.

| Parameter | Type | Description |
|-----------|------|-------------|
| `tweet_id` | string | The tweet ID to unlike |

#### `retweet`

Retweet a tweet by its ID.

| Parameter | Type | Description |
|-----------|------|-------------|
| `tweet_id` | string | The tweet ID to retweet |

#### `unretweet`

Remove a retweet.

| Parameter | Type | Description |
|-----------|------|-------------|
| `tweet_id` | string | The tweet ID to unretweet |

#### `reply_to_tweet`

Reply to a specific tweet.

| Parameter | Type | Description |
|-----------|------|-------------|
| `tweet_id` | string | The tweet ID to reply to |
| `text` | string | Reply text (1-280 characters) |

---

## Response Formats

All tools return clean, parsed JSON instead of raw Twitter GraphQL responses.

### Tweet Object

```json
{
  "id": "1234567890",
  "text": "Hello world!",
  "author": {
    "id": "9876543210",
    "username": "johndoe",
    "name": "John Doe",
    "profile_image_url": "https://pbs.twimg.com/...",
    "verified": true
  },
  "created_at": "Mon Jan 27 12:00:00 +0000 2025",
  "likes": 42,
  "retweets": 12,
  "replies": 5,
  "quotes": 3,
  "bookmarks": 7,
  "views": 1500,
  "language": "en",
  "conversation_id": "1234567890",
  "media": [
    {
      "type": "photo",
      "url": "https://pbs.twimg.com/media/...",
      "preview_url": "https://pbs.twimg.com/media/..."
    }
  ]
}
```

### User Profile Object

```json
{
  "id": "9876543210",
  "username": "johndoe",
  "name": "John Doe",
  "description": "Software engineer & builder",
  "profile_image_url": "https://pbs.twimg.com/...",
  "profile_banner_url": "https://pbs.twimg.com/...",
  "followers_count": 1500,
  "following_count": 300,
  "tweet_count": 4200,
  "verified": true,
  "created_at": "Tue Mar 15 00:00:00 +0000 2020",
  "location": "San Francisco, CA",
  "url": "https://example.com"
}
```

### Trend Item Object

```json
{
  "name": "#TrendingTopic",
  "tweet_count": 125000,
  "description": "125K posts",
  "domain": "Technology"
}
```

---

## Development

```bash
# Watch mode — recompiles on file changes
npm run dev

# Build once
npm run build

# Run directly (requires env vars)
npm start

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node build/index.js
```

### Project Structure

```
twitter-mcp/
├── src/
│   ├── index.ts              # MCP server entry, tool registration
│   ├── twitter-client.ts     # Twitter API client, auth, request/response handling
│   └── types.ts              # TypeScript interfaces (Tweet, UserProfile, TrendItem)
├── build/                    # Compiled JavaScript output
├── package.json
├── tsconfig.json
├── .env.example
└── .gitignore
```

---

## Architecture

```
┌─────────────────┐     stdio      ┌─────────────────┐    GraphQL     ┌─────────────┐
│   MCP Client    │ ◄────────────► │  twitter-mcp    │ ◄────────────► │  x.com API  │
│ (Claude, etc.)  │   JSON-RPC     │  MCP Server     │   HTTP + cookies│  (GraphQL)  │
└─────────────────┘                └─────────────────┘                └─────────────┘
```

**How it works:**

1. The MCP client (Claude Desktop, Claude Code, etc.) connects to the server via **stdio**
2. When a tool is called, the server constructs an authenticated request using your cookies
3. Requests hit Twitter's internal **GraphQL API** (`x.com/i/api/graphql/...`) — the same endpoints the web client uses
4. Raw responses are parsed into clean, simplified JSON and returned to the client

**Authentication flow per request:**
- `Cookie` header carries `auth_token` and `ct0`
- `x-csrf-token` header matches the `ct0` value
- `Authorization` header uses Twitter's public web client Bearer token

---

## Troubleshooting

### "Missing required environment variables"
Both `TWITTER_AUTH_TOKEN` and `TWITTER_CT0` must be set. Double-check your Claude Desktop config or `.env` file.

### HTTP 401 / 403 errors
Your cookies have expired. Extract fresh cookies from your browser following the [instructions above](#getting-your-twitter-cookies).

### HTTP 429 errors
You've hit Twitter's rate limit. Wait a few minutes before trying again. Different endpoints have different rate limits.

### Empty responses / no tweets returned
Twitter occasionally changes GraphQL query IDs when deploying updates. The hardcoded query IDs in `src/twitter-client.ts` may need to be refreshed. You can extract current query IDs from Twitter's web client JavaScript bundles using browser DevTools (Network tab → filter by `graphql`).

### Server won't start in Claude Desktop
- Ensure the path in your config uses **absolute paths**
- On Windows, use forward slashes (`C:/Users/...`) or escaped backslashes (`C:\\Users\\...`)
- Check Claude Desktop logs for error messages

---

## Disclaimer

This server uses Twitter's internal, undocumented GraphQL API through cookie-based session authentication. This is **not** the official Twitter API.

- Twitter may change endpoints, query IDs, or authentication requirements at any time
- Automated use of Twitter via cookies may violate Twitter's Terms of Service
- Use at your own risk and responsibility
- This project is intended for personal use and educational purposes

---

## License

ISC
