# Parallel Workspaces - New Architecture Guide

## Overview

Parallel Workspaces is now a **dedicated AI-controlled Chrome workspace** that runs independently from your normal desktop workflow.

**Key concept**: You continue using your computer normally. Meanwhile, an AI agent operates inside a separate, completely isolated Chrome instance. The AI never hijacks your real mouse or keyboard.

## Architecture

```
External Agent (OpenAI, Claude, etc.)
    ↓
Parallel Workspaces SDK
    ↓
Playwright/CDP Connection
    ↓
REAL Google Chrome (isolated profile)
    ↓
Persistent Sessions (logins, cookies, tabs)
```

## What's Running

### Phase 1: Chrome Workspace Launcher ✅
- **Real Chrome**: Uses actual Google Chrome executable (not a custom browser)
- **Isolated Profile**: Chrome profile stored in `./profiles/ai-workspace`
- **CDP Enabled**: Chrome Remote Debugging Protocol on port 9222
- **Persistent**: Sessions, cookies, logins survive app restarts

### Phase 2: Playwright/CDP Attachment ✅
- Playwright connects to Chrome via CDP
- Controls ONLY the dedicated Chrome workspace
- Never touches user's real mouse or keyboard
- Page automation via Playwright APIs

### Phase 3: Universal Workspace Controller ✅
- Simple, model-agnostic interface
- Supports any external AI agent
- No coupling to OpenAI, Claude, or other vendors
- Methods: `navigate()`, `click()`, `type()`, `screenshot()`

### Phase 4: Agent Integration System ✅
- SDK for external agents: `@parallel-workspaces/sdk`
- `connectToWorkspace()` function
- Provides `WorkspaceClient` and `WorkspaceController` interfaces

### Phase 5: Virtual AI Cursor Overlay ✅
- Visual overlay showing AI actions
- Smooth animations for movements and clicks
- Never interferes with real system cursor
- Gives users: "another person using another browser"

### Phase 6: Vision/Screenshot Loop ✅
- Screenshots via Playwright
- Returns Buffer (PNG image data)
- Viewport dimensions included
- Ready for AI vision models

## Project Structure

```
parallel-workspaces/
│
├── apps/
│   └── desktop/
│       └── main.ts          ← Electron entry point
│
├── packages/
│   ├── chrome-launcher/
│   │   ├── ChromeLauncher.ts ← Launches real Chrome
│   │   └── index.ts
│   │
│   ├── workspace-runtime/
│   │   ├── ChromeAttachment.ts  ← Playwright/CDP connection
│   │   ├── WorkspaceController.ts ← Universal control layer
│   │   ├── AgentAdapter.ts       ← Bridges agents → controller
│   │   ├── PersistentBrowserManager.ts ← Legacy (kept for compatibility)
│   │   ├── WorkspaceManager.ts ← Legacy (kept for compatibility)
│   │   ├── BrowserRealism.ts ← Legacy (kept for compatibility)
│   │   └── index.ts
│   │
│   ├── cursor-overlay/
│   │   ├── CursorOverlay.ts ← Visual cursor overlay
│   │   └── index.ts
│   │
│   ├── sdk/
│   │   └── index.ts ← External agent SDK
│   │
│   └── shared-types/
│       └── index.ts ← Shared TypeScript interfaces
│
├── profiles/              ← Chrome profile (created at runtime)
│   └── ai-workspace/
│       ├── Default/
│       ├── Cookies
│       └── ...
│
├── dist/                 ← Built JavaScript (gitignored)
├── node_modules/         ← Dependencies (gitignored)
├── package.json
├── tsconfig.json
└── README.md
```

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Type check
npm run typecheck

# Build
npm run build

# Run the app
npm start
```

### What Happens

1. **Electron launches**
2. **Chrome is launched** with CDP on port 9222
3. **Playwright connects** to Chrome via CDP
4. **Status window appears** showing the workspace is ready
5. **External agents** can connect to `http://localhost:9222`

### Profile Directory

The Chrome profile is stored at:
```
./profiles/ai-workspace/
```

This means:
- ✅ Logins persist across restarts
- ✅ Cookies are saved
- ✅ Browsing history is preserved
- ✅ Extensions can be installed
- ✅ All Chrome settings survive

## Integration Guide for External Agents

### Option 1: Using the SDK

```typescript
import { connectToWorkspace } from '@parallel-workspaces/sdk';

// Connect to the workspace
const workspace = await connectToWorkspace('http://localhost:9222');

// Capture screenshot
const screenshot = await workspace.screenshot();
console.log(`Screenshot: ${screenshot.width}x${screenshot.height}`);

// Navigate
await workspace.navigate('https://example.com');

// Interact
await workspace.click(100, 200);
await workspace.type('hello world');

// Scroll
await workspace.scroll(500); // scroll down 500px

// Get page info
const title = await workspace.getTitle();
const url = await workspace.getUrl();

// Disconnect
await workspace.disconnect();
```

### Option 2: Direct Playwright Connection

```typescript
import { chromium } from 'playwright';

// Connect to CDP
const browser = await chromium.connectOverCDP('http://localhost:9222');
const contexts = browser.contexts();
const context = contexts[0];
const pages = context.pages();
const page = pages[0];

// Use Playwright directly
await page.goto('https://example.com');
await page.click('a[href="/about"]');
const screenshot = await page.screenshot();

await browser.close();
```

### Option 3: Custom Agent Implementation

```typescript
import { AgentAdapter, type WorkspaceController } from '@parallel-workspaces/sdk';

class MyAgent {
  private adapter: AgentAdapter;

  constructor(controller: WorkspaceController) {
    this.adapter = new AgentAdapter(controller);
  }

  async run() {
    // Take screenshot and send to vision model
    const screenshot = await this.adapter.screenshot();
    
    // Get AI decision from your model
    const action = await myVisionModel.decide(screenshot);
    
    // Execute action
    if (action.type === 'click') {
      await this.adapter.click({ x: action.x, y: action.y });
    }
  }
}
```

## Key Design Principles

### ✅ Local-First
- No cloud backend
- No authentication required
- No accounts
- Everything runs on your machine

### ✅ Agent-Agnostic
- No coupling to OpenAI, Claude, OpenClaw, etc.
- Any AI agent can use it
- Workspace runtime is model-independent
- Just implement the `WorkspaceController` interface

### ✅ Real Browser
- Uses actual Google Chrome
- Full website compatibility
- Extensions work
- Real browser features (tabs, history, etc.)

### ✅ Never Hijacks Desktop
- Isolated Chrome process
- Dedicated profile
- Separate CDP port
- AI controls only that Chrome instance
- User's real mouse/keyboard untouched

### ✅ Persistent
- Sessions survive restarts
- Cookies are saved
- Logins remain active
- Profile directory is persistent

## What's NOT in This Project

- ❌ Custom browser engine
- ❌ Custom UI components
- ❌ Cloud infrastructure
- ❌ Account systems
- ❌ AI model/vendor lock-in
- ❌ Custom tabs or navigation
- ❌ Custom authentication

## Connecting External Agents

The workspace exposes a simple CDP endpoint. Any tool can connect:

### Generic Connection

```bash
# Any tool that supports CDP can connect to:
http://localhost:9222
```

### Agent-Specific Examples

**OpenClaw** (future integration):
```python
from parallel_workspaces import connectToWorkspace
workspace = await connectToWorkspace('http://localhost:9222')
```

**browser-use** (future integration):
```typescript
import { connectToWorkspace } from 'parallel-workspaces';
const browser = await connectToWorkspace('http://localhost:9222');
```

**OpenHands** (future integration):
```python
from parallel_workspaces.sdk import WorkspaceController
controller = WorkspaceController('http://localhost:9222')
```

## Architecture Decisions

### Why Real Chrome?
- Perfect website compatibility
- Native performance
- Extensions support
- Real user experience
- No rendering bugs

### Why CDP?
- Standard protocol (used by Puppeteer, Playwright, DevTools)
- Mature and stable
- Multi-language support
- No custom protocol needed

### Why Playwright?
- Mature library
- CDP support
- Type-safe APIs
- Good documentation
- JavaScript/TypeScript native

### Why Electron?
- Simple window management
- Runs on Windows/Mac/Linux
- Integrates well with Node.js
- Can show status UI

### Why No Backend?
- Keep it simple
- Privacy: all local
- No infrastructure costs
- Easier to maintain
- Fully offline-capable

## Development Workflow

### Watch Mode (Recommended)

**Terminal 1: Watch TypeScript**
```bash
npx tsc --watch
```

**Terminal 2: Run the app**
```bash
npm start
```

### Debugging

Press **F12** in the Electron window to open DevTools.

### Testing Integration

1. Start the app: `npm start`
2. Chrome launches with CDP on `:9222`
3. Connect externally:
   ```bash
   npx playwright inspector ws://localhost:9222
   ```

## Performance Considerations

- **Chrome startup**: ~2-3 seconds
- **Playwright connection**: ~0.5 seconds
- **Screenshot capture**: ~100-200ms
- **Click/type operations**: ~50-100ms latency

## Security Notes

- ✅ Chrome profile is local (no sync to cloud)
- ✅ Cookies/sessions are local-only
- ✅ No network traffic to external servers
- ✅ CDP is local-only (not exposed to internet by default)

To expose CDP over network (not recommended):
```bash
# Don't do this unless you know security implications
chrome.exe --remote-debugging-address=0.0.0.0 --remote-debugging-port=9222
```

## Troubleshooting

### Chrome Not Found
Make sure Google Chrome is installed on your system. The launcher checks common Windows paths.

### CDP Port Already in Use
Change the port in `main.ts`:
```typescript
cdpPort: 9223, // Use different port
```

### Profile Corruption
Delete `./profiles/ai-workspace/` folder to reset (loses logins/data).

### Playwright Connection Fails
1. Check Chrome is running: check for `chrome.exe` in Task Manager
2. Verify CDP is responding: visit `http://localhost:9222/json/version`
3. Check firewall isn't blocking localhost connections

## Next Steps

### For Users
1. Install the app
2. Start it: `npm start`
3. Chrome launches automatically
4. You can continue your work
5. External agents control the workspace

### For External Agents
1. Keep `http://localhost:9222` accessible
2. Use the SDK or Playwright directly
3. Implement your own agent logic
4. Never assume user's Chrome state

### For Contributors
1. Look in `/packages` for modules
2. Add features by extending `WorkspaceController`
3. Keep code strongly typed
4. Follow the modular structure

## Support External Agent Types

The workspace is designed to work with:

- **Vision Models**: Claude, GPT-4V, Gemini Vision
- **Autonomous Agents**: OpenHands, browser-use, OpenClaw
- **Task Automation**: Zapier, IFTTT integrations
- **Custom Bots**: Your own agent implementations
- **Headless RPA**: Test automation frameworks

## Future Enhancements

- [ ] Multiple concurrent workspaces
- [ ] WebSocket API for remote agents
- [ ] Agent performance metrics
- [ ] Workspace snapshots
- [ ] Custom Chrome extensions
- [ ] DOM extraction for better vision
- [ ] Element highlighting overlay
- [ ] Action history/replay

## Philosophy

> "Keep everything local, modular, readable, and agent-agnostic."

This project prioritizes:
1. **Simplicity** over features
2. **Local** over cloud
3. **Compatibility** over customization
4. **Modularity** over monoliths
5. **Standards** over custom protocols

---

**Parallel Workspaces**: Independent Chrome for your AI agents. Nothing more, nothing less.
