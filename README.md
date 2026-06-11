# claude-usage-monitor

A small terminal app for poking at how much you've been using Claude Code. It reads the session logs Claude Code already writes to `~/.claude/projects` and shows you the totals.

## What it does

When you run it, you get an interactive table in your terminal showing token usage and cost. You can flip between three views:

- **By date** — what did I use today, yesterday, last week?
- **By project** — which repo is eating all my tokens?
- **By model** — Opus vs Sonnet vs Haiku breakdown

It pulls everything from the JSONL session files Claude Code writes locally.

## Install

```bash
npm install
npm link    # optional, gives you the `claude-usage` command globally
```

Or just run it directly:

```bash
npm start
```

## Usage

```bash
claude-usage
```

Once it's running:

| Key | What it does |
|-----|--------------|
| `d` | Switch to the date view |
| `p` | Switch to the project view |
| `m` | Switch to the model view |
| `r` | Reload (re-scan the session files) |
| `q` / `Esc` | Quit |

## How it works

1. Walks `~/.claude/projects` and reads every `.jsonl` session file.
2. Deduplicates messages by id (the same message can appear in multiple session files when conversations branch).
3. Adds up input/output/cache tokens per message and prices them using the model's published rates.
4. Groups the rows by whichever dimension you picked and renders a table.

## Requirements

- Node.js (anything modern enough to run TypeScript files directly via `node` — Node 22.6+ works)
- An existing `~/.claude/projects` directory with some session history

