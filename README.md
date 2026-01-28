# 🧠 kirit

> Your second brain in the terminal. A CLI for quick notes, todos, and brainstorming.

![Version](https://img.shields.io/npm/v/kirit)
![License](https://img.shields.io/npm/l/kirit)
![Node](https://img.shields.io/node/v/kirit)

## ✨ Features

- 📝 **Quick Notes** - Capture thoughts instantly with #tag support
- ☑️ **Todo Manager** - Track tasks with priority levels (high/medium/low)
- 💡 **Idea Board** - Brainstorm and upvote your best ideas
- 🔍 **Global Search** - Find anything across notes, todos, and ideas
- 📊 **Stats Dashboard** - Track your productivity
- 💾 **Persistent Storage** - All data saved locally in `~/.kirit/`

## 📦 Installation

```bash
# Install globally
npm install -g kirit

# Or use with npx (no install)
npx kirit
```

## 🚀 Quick Start

```bash
# Add a note
kirit note "Remember to review the PR #work"

# Add a todo with priority
kirit todo "Fix the login bug" -p high

# List your todos
kirit todos

# Mark todo as done
kirit done 1

# Capture an idea
kirit idea "Build a CLI tool for developers"

# Search everything
kirit search "bug"

# View your stats
kirit stats
```

## 📖 Commands

### Notes

| Command | Alias | Description |
|---------|-------|-------------|
| `kirit note [content]` | `n` | Add a quick note |
| `kirit notes` | — | List all notes |
| `kirit notes -s <query>` | — | Search notes |
| `kirit notes -t <tag>` | — | Filter by tag |
| `kirit note-rm <index>` | `nr` | Remove a note |

### Todos

| Command | Alias | Description |
|---------|-------|-------------|
| `kirit todo [task]` | `td` | Add a todo |
| `kirit todo [task] -p high` | — | Add with priority (high/medium/low) |
| `kirit todos` | — | List pending todos |
| `kirit todos -a` | — | Show all (including done) |
| `kirit todos -s <query>` | — | Search todos |
| `kirit todos -p high` | — | Filter by priority |
| `kirit done <index>` | — | Mark as complete |
| `kirit undo <index>` | — | Mark as incomplete |
| `kirit todo-rm <index>` | `tr` | Remove a todo |

### Ideas

| Command | Alias | Description |
|---------|-------|-------------|
| `kirit idea [content]` | `i` | Capture an idea |
| `kirit ideas` | — | List all ideas |
| `kirit ideas -o votes` | — | Sort by votes |
| `kirit ideas -s <query>` | — | Search ideas |
| `kirit upvote <index>` | `up` | Upvote an idea |
| `kirit idea-rm <index>` | `ir` | Remove an idea |

### Utilities

| Command | Alias | Description |
|---------|-------|-------------|
| `kirit search <query>` | `s` | Search across everything |
| `kirit stats` | — | Show productivity stats |
| `kirit clear -t` | — | Clear completed todos |
| `kirit clear -a` | — | ⚠️ Clear ALL data |
| `kirit --help` | — | Show help |
| `kirit --version` | — | Show version |

> **Note:** All list commands (`notes`, `todos`, `ideas`) support both lowercase and uppercase options for case-insensitive search/filter.

## 🏷️ Tags

kirit automatically extracts tags from your notes:

```bash
kirit note "Meeting with the team #work #meeting"

# Later filter by tag
kirit notes -t work
```

## 📁 Data Storage

All your data is stored locally in:

- **Windows**: `%USERPROFILE%\.kirit\`
- **macOS/Linux**: `~/.kirit/`

Files:
- `notes.json` - Your notes
- `todos.json` - Your todos
- `ideas.json` - Your ideas

## 📸 Screenshots

```
╭──────────────────────────────────────────╮
│                                          │
│     _  __ ___  ___  ___  _____           │
│    | |/ /|_ _|| _ \|_ _||_   _|          │
│    | ' <  | | |   / | |   | |            │
│    |_|_\_|___||_|_\|___|  |_|            │
│                                          │
│   Quick notes • Todos • Ideas • v1.0.0   │
│                                          │
╰──────────────────────────────────────────╯

☑️  Your Todos:

[ ] 🔴 Fix the login bug
   2m ago • kirit done 2
[ ] 🟡 Review documentation  
   5m ago • kirit done 1
```

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

## 📝 License

MIT © Kirit