# Parallel Workspaces

> Isolated browser workspaces for AI agents — Windows-first, open-source desktop tool

## What is this?

Parallel Workspaces lets any external AI agent operate inside its own isolated browser environment while you continue using your computer normally.

- Each workspace has its own cookies, tabs, sessions, and login state
- Multiple workspaces can run side-by-side simultaneously
- The system is fully **agent-agnostic** — any tool can use it
- Everything runs **locally** — no cloud, no backend, no accounts

## What this is NOT

- Not an AI model
- Not an autonomous agent
- Not cloud infrastructure
- Not a custom browser or OS

## Phase 1 — Current Milestone

Two isolated Electron browser windows launch with fully separate sessions:

| Workspace | URL | Session |
|-----------|-----|---------|
| agent-1 | google.com | `persist:agent-1` |
| agent-2 | youtube.com | `persist:agent-2` |

Sessions are isolated via Electron's partition system — logging into Google in workspace 1 does **not** affect workspace 2.

## Project Structure

```
parallel-workspaces/
│
├── apps/
│   └── desktop/
│       └── main.ts          ← Electron entry point
│
├── packages/
│   ├── shared-types/
│   │   └── index.ts         ← WorkspaceConfig, WorkspaceState types
│   └── workspace-runtime/
│       ├── WorkspaceManager.ts  ← Core lifecycle manager
│       └── index.ts         ← Package exports
│
├── tsconfig.json
└── package.json
```

## Getting Started

### Prerequisites

- Node.js LTS (v18+)
- Windows OS

### Install

```bash
npm install
```

### Run

```bash
npm start
```

Two browser windows will open — each fully isolated.

## Roadmap

- **Phase 1** ✅ — Isolated workspace sessions
- **Phase 2** — Workspace manager UI panel
- **Phase 3** — Virtual cursor overlays
- **Phase 4** — Playwright control layer
- **Phase 5** — External agent adapter / SDK

## Engineering Rules

- No overengineering
- No backend, no cloud, no auth
- Everything local-first
- All abstractions must be easy for contributors to understand

## License

MIT
