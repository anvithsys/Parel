# Parallel Workspaces — AI Browser Workspace

## Phase 2: Persistent Browser Workspace

A dedicated AI workspace browser built with Electron and TypeScript. Feels like "another person using another browser on your computer."

### ✨ Features

- **One Persistent Browser** — A single Chrome-like browser window dedicated to AI work
- **Session Persistence** — Logins, cookies, and browser state survive app restarts
- **Window Restoration** — Window position, size, and maximized state are saved
- **Chrome-Like Behavior** — Keyboard shortcuts, menus, and navigation work like Chrome
- **Security** — Isolated partition prevents cookies from leaking to your main browser
- **Modular Codebase** — Clean architecture ready for agent integration

### 🚀 Quick Start

#### Prerequisites

- Node.js 16+ and npm
- Windows, macOS, or Linux

#### Installation

```bash
# Clone and navigate to the project
cd parallel-workspaces

# Install dependencies
npm install

# Build TypeScript
npm run build

# Start the app
npm start
```

The app opens a browser window to google.com. You're ready to go!

#### Test Persistence

1. Log into Gmail in the browser
2. Close the app
3. Run `npm start` again
4. **Verify:** Gmail is still logged in

See [TEST_GUIDE_PHASE2.md](TEST_GUIDE_PHASE2.md) for comprehensive testing.

### 📁 Project Structure

```
parallel-workspaces/
├── apps/
│   └── desktop/
│       └── main.ts                    # Electron entry point
├── packages/
│   ├── shared-types/
│   │   └── index.ts                   # TypeScript type definitions
│   └── workspace-runtime/
│       ├── PersistentBrowserManager.ts # Core browser management
│       ├── BrowserRealism.ts           # Chrome-like behavior
│       ├── AgentAdapter.ts             # (Ready) Agent control interface
│       ├── WorkspaceManager.ts         # (Legacy Phase 1)
│       └── index.ts                    # Public API
├── package.json
├── tsconfig.json
├── TEST_GUIDE_PHASE2.md                # How to test persistence
└── AGENT_INTEGRATION_GUIDE.md          # Future agent integration
```

### 🎯 Phase 2 Implementation

#### What's Complete

✅ **PersistentBrowserManager**
- Single browser window management
- Persistent session partition (`persist:ai-workspace`)
- Window state persistence (position, size, maximized)
- Graceful lifecycle handling

✅ **BrowserRealism**
- Chrome-like menu system
- Keyboard shortcuts (Ctrl+R, F12, Ctrl+L, etc.)
- Developer tools support
- Full screen toggle

✅ **Type Definitions**
- `WindowState` — Saved window configuration
- `PersistentBrowserConfig` — Browser initialization config
- Ready for type safety

✅ **AgentAdapter** (Foundation for Phase 3)
- Screenshot capture API
- Click/type/keyboard input
- URL navigation
- JavaScript execution
- Wait/condition helpers

### 🔌 How It Works

#### Browser Persistence

The browser uses Electron's persistent partition:

```typescript
partition: "persist:ai-workspace"
```

This creates a persistent storage directory where Electron stores:
- **Cookies** — Session tokens, auth cookies
- **LocalStorage** — Site preferences, saved data
- **IndexedDB** — Rich data stores
- **Cache** — Images, scripts, stylesheets
- **Passwords** — Saved credentials (if enabled by sites)

**Result:** Log into Gmail once. It stays logged in after restart.

#### Window State Persistence

On every window move, resize, or maximize event:

```typescript
saveWindowState() → JSON file at ~/.config/parallel-workspaces/browser-state.json
```

On app start:

```typescript
loadSavedState() → Restore window exactly where user left it
```

#### Chrome-Like Behavior

Application menu system provides:
- File → New Window, Close, Exit
- Edit → Undo, Redo, Cut, Copy, Paste
- View → Reload, Dev Tools, Zoom, Full Screen
- History → Back, Forward

Keyboard shortcuts work too:
- `Ctrl+R` — Refresh
- `Ctrl+Shift+R` — Hard refresh
- `F12` — Developer tools
- `Ctrl+L` — Focus address bar
- `Ctrl++` / `Ctrl+-` — Zoom

### 🛠️ Development

#### Build

```bash
npm run build          # Compile TypeScript
npm run typecheck      # Type check only
```

#### Run

```bash
npm start              # Build and start
npm run dev            # Build and start (same as start)
```

#### Watch (During Development)

```bash
# In one terminal: compile on changes
npx tsc --watch

# In another terminal: run the app
npm start
```

### 📋 Code Guidelines

- **TypeScript strict mode enabled** — All code must be type-safe
- **Modular design** — Each class has one responsibility
- **Clear naming** — Methods and variables are self-documenting
- **Comments for complexity** — Document why, not what
- **Error handling** — Graceful failures, informative logs

### 🔮 Future Phases

#### Phase 3: Playwright Integration

Add Playwright for advanced automation:

```typescript
// Import Playwright
import { chromium } from "playwright";

// Connect to the Electron browser via CDP
const browser = await chromium.connectOverCDP(wsEndpoint);
```

See [AGENT_INTEGRATION_GUIDE.md](AGENT_INTEGRATION_GUIDE.md) for architecture.

#### Phase 4: Agent Control

External AI agents interact with browser:

```typescript
const adapter = new AgentAdapter(window);
const screenshot = await adapter.screenshot();
await adapter.click(x, y);
await adapter.type("search");
```

#### Phase 5: Virtual Cursor

See agent actions in real-time with cursor overlay.

#### Phase 6: Multi-Agent

Multiple agents can share the same browser workspace.

### 🧪 Testing

#### Automated Tests (TODO)

```bash
npm run test
```

#### Manual Testing

See [TEST_GUIDE_PHASE2.md](TEST_GUIDE_PHASE2.md) for:
- Gmail login persistence
- YouTube login persistence
- Window state restoration
- Multiple session testing

### 📊 Architecture Diagram

```
┌─────────────────────────────────────────┐
│      Electron Main Process              │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │   PersistentBrowserManager       │  │
│  │  - Manages single BrowserWindow  │  │
│  │  - Persists window state to disk │  │
│  │  - Restores on startup           │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │    BrowserRealism                │  │
│  │  - Chrome-like menus             │  │
│  │  - Keyboard shortcuts            │  │
│  │  - DevTools support              │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │   AgentAdapter (Phase 3+)        │  │
│  │  - Screenshot API                │  │
│  │  - Input simulation              │  │
│  │  - Navigation control            │  │
│  └──────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│     Electron Renderer Process           │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │    BrowserWindow                 │  │
│  │  partition: persist:ai-workspace │  │
│  │  (persistent cookies, cache)     │  │
│  │                                  │  │
│  │  ┌──────────────────────────┐   │  │
│  │  │   Chrome Content         │   │  │
│  │  │   - Websites             │   │  │
│  │  │   - Web apps             │   │  │
│  │  │   - Sessions             │   │  │
│  │  └──────────────────────────┘   │  │
│  └──────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
                ↓
         ┌──────────────┐
         │  Your Data   │
         │              │
         │  Persistent  │
         │  Partition:  │
         │ Cookies      │
         │ Cache        │
         │ LocalStorage │
         └──────────────┘
```

### 🔐 Security Model

| Component | Isolation | Details |
|-----------|-----------|---------|
| Partition | ✅ | Uses `persist:ai-workspace` separate from your browser |
| Node Integration | ❌ | Disabled — no access to file system from renderer |
| Context Isolation | ✅ | Enabled — preload scripts are sandboxed |
| Sandbox | ✅ | Enabled — renderer runs in sandboxed process |
| Cookies | ✅ | Stay in partition, don't leak to your browser |
| Sessions | ✅ | Encrypted and isolated per-partition |

### 📝 Configuration

#### Home URL

Edit `apps/desktop/main.ts`:

```typescript
const browser = new PersistentBrowserManager({
  partitionId: "ai-workspace",
  homeUrl: "https://google.com",  // Change this
  statePath: undefined,            // Or specify custom path
});
```

#### Window Defaults

Edit `packages/workspace-runtime/PersistentBrowserManager.ts`:

```typescript
const windowState = this.savedWindowState || {
  x: 100,
  y: 100,
  width: 1400,    // Default width
  height: 900,    // Default height
  isMaximized: false,
};
```

### 🐛 Troubleshooting

#### "Window doesn't open"

Check that Electron is installed:
```bash
npm install
npm run build
npm start
```

Check console for errors.

#### "Logins don't persist"

Verify:
1. Partition is `persist:ai-workspace` in BrowserWindow config
2. `browser-state.json` file exists in app data directory
3. Website allows cookies from Electron

#### "App crashes on startup"

Delete the state file and try again:
```bash
rm ~/.config/parallel-workspaces/browser-state.json
npm start
```

#### "Window position is wrong"

Check `browser-state.json` — it should have valid bounds.

### 📚 Learning Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [Playwright Documentation](https://playwright.dev/)

### 🤝 Contributing

Code should be:
- ✅ Type-safe (TypeScript strict mode)
- ✅ Well-commented (especially complex logic)
- ✅ Modular (small, focused classes)
- ✅ Tested (manual tests documented)
- ✅ Readable (clear variable names)

### 📄 License

MIT

---

**Phase 2 is complete. The browser is ready. Future phases will add agent control, Playwright integration, and external agent support.**

For agent integration roadmap, see [AGENT_INTEGRATION_GUIDE.md](AGENT_INTEGRATION_GUIDE.md).
