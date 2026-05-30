# Agent Integration Guide — Phase 3+

## Overview

The AI Workspace Browser is designed to support external AI agents in future phases. This guide explains the architecture and how to integrate agent control once the core browser is stable.

## Current Phase (Phase 2)

✅ **What's complete:**
- Single persistent browser workspace
- Session persistence (cookies, logins, etc.)
- Window state persistence
- Chrome-like keyboard shortcuts
- Modular, extensible codebase

❌ **What's NOT implemented yet:**
- Agent control logic
- Playwright integration
- Virtual cursor overlay
- IPC communication for agents
- Screenshot loop
- External agent APIs

## Architecture Overview

### Module Structure

```
workspace-runtime/
├── PersistentBrowserManager.ts    # Browser lifecycle & persistence
├── BrowserRealism.ts              # Chrome-like behavior
├── AgentAdapter.ts                # (READY) Agent control interface
├── PlaywrightAdapter.ts           # (TODO) Playwright integration
├── AgentController.ts             # (TODO) Agent orchestration
└── VirtualCursor.ts               # (TODO) Cursor visualization
```

### Integration Points

#### 1. **AgentAdapter** (Ready Now)

The `AgentAdapter` class provides the foundation for agent control:

```typescript
// Usage pattern (future)
const adapter = new AgentAdapter(window);

// Screenshot
const screenshot = await adapter.screenshot();

// Interaction
await adapter.click(100, 100);
await adapter.type("search term");
await adapter.pressKey("Enter");

// Navigation
await adapter.navigate("https://example.com");

// JavaScript execution
const result = await adapter.executeScript("document.title");
```

#### 2. **IPC Communication** (TODO)

Enable main process ↔ preload ↔ renderer communication:

```typescript
// In PersistentBrowserManager.initialize()
ipcMain.handle("agent:screenshot", async () => {
  const adapter = new AgentAdapter(window);
  return adapter.screenshot();
});

ipcMain.handle("agent:click", async (_, x, y) => {
  const adapter = new AgentAdapter(window);
  return adapter.click(x, y);
});
```

#### 3. **Playwright Integration** (TODO)

Connect to Playwright via CDP (Chrome DevTools Protocol):

```typescript
// Future: PlaywrightAdapter.ts
import { chromium } from "playwright";

export class PlaywrightAdapter {
  async connectToBrowser(wsEndpoint: string) {
    const browser = await chromium.connectOverCDP(wsEndpoint);
    // Now Playwright can control the Electron browser
  }
}
```

#### 4. **Agent Controller** (TODO)

Orchestrate agent operations:

```typescript
// Future: AgentController.ts
export class AgentController {
  constructor(private adapter: AgentAdapter) {}

  async runAgent(agentCode: string) {
    // Execute agent instructions
  }

  async captureState() {
    return this.adapter.screenshot();
  }
}
```

#### 5. **Virtual Cursor** (TODO)

Display cursor movements for transparency:

```typescript
// Future: VirtualCursor.ts
export class VirtualCursor {
  async showCursorAt(x: number, y: number) {
    // Render cursor overlay at position
  }

  async moveCursor(fromX: number, fromY: number, toX: number, toY: number) {
    // Animate cursor movement with trail
  }
}
```

## Design Principles

### Keep It Modular

- Each module has one responsibility
- Agents should not depend on browser internals
- Adapters translate between agent APIs and Electron APIs

### Security First

- Agents run in isolated contexts
- No direct process access
- IPC validates all messages
- Partition prevents cookies from leaking

### Performance

- Screenshot caching to avoid redundant captures
- Batch interactions when possible
- Debounce window events
- Lazy-load agent modules

### Extensibility

- Agent adapters follow common interface
- Easy to swap implementations (Electron → Playwright → other)
- Plugin architecture for custom integrations

## Implementation Roadmap

### Phase 3: Playwright Integration (Next)

1. Add Playwright to dependencies
2. Expose Chrome DevTools Protocol endpoint
3. Create PlaywrightAdapter for CDP connection
4. Test basic Playwright control over Electron browser

```bash
npm install playwright
```

### Phase 4: Agent Control API

1. Implement IPC handlers for agent commands
2. Create agent execution sandbox
3. Add rate limiting and permissions
4. Document agent API

### Phase 5: Virtual Cursor

1. Render cursor overlay layer
2. Animate cursor movements
3. Track interaction history
4. Display for transparency

### Phase 6: External Agents

1. Create agent process spawning
2. Implement agent-to-browser communication
3. Add authentication/authorization
4. Build agent marketplace/registry

## Testing Future Integrations

Once agent control is ready, test with:

```typescript
// Example: Automated login test
const adapter = new AgentAdapter(window);

// Go to Gmail
await adapter.navigate("https://gmail.com");
await adapter.waitFor(() => adapter.getCurrentUrl().includes("gmail"));

// Take screenshot to see login page
const screenshot = await adapter.screenshot();

// Click email field (assuming coordinates from screenshot)
await adapter.click(300, 400);

// Type email
await adapter.type("test@example.com");

// Tab to password field
await adapter.pressKey("Tab");

// Type password
await adapter.type("password123");

// Submit
await adapter.pressKey("Enter");

// Wait for success
await adapter.waitFor(
  async () => {
    const url = adapter.getCurrentUrl();
    return url.includes("inbox") || url.includes("mail");
  },
  10000
);
```

## Extension Points

### Adding a New Adapter

```typescript
// workspace-runtime/CustomAdapter.ts
export class CustomAdapter {
  constructor(private browserManager: PersistentBrowserManager) {}

  async customMethod() {
    // Implement custom behavior
  }
}
```

### Adding IPC Handlers

```typescript
// In main.ts
import { ipcMain } from "electron";

ipcMain.handle("custom:action", async (event, ...args) => {
  // Handle custom agent action
});
```

### Adding Browser Events

```typescript
// In PersistentBrowserManager.initialize()
this.window.webContents.on("crashed", () => {
  console.log("Browser crashed - notify agents");
});
```

## Security Considerations

### Before Deploying Agent Control

- [ ] Implement message validation on IPC
- [ ] Add rate limiting for agent commands
- [ ] Sandbox agent code execution
- [ ] Implement permissions system
- [ ] Audit all Electron APIs used
- [ ] Add logging for all agent actions
- [ ] Implement session isolation between agents
- [ ] Add circuit breaker for runaway agents

## Documentation for Agents

Once agent control is ready, document:

1. **Agent API Reference**
   - All available methods
   - Parameter types
   - Return types
   - Error handling

2. **Agent Examples**
   - Login automation
   - Form filling
   - Scraping
   - Interaction flows

3. **Best Practices**
   - Error handling
   - Performance optimization
   - Dealing with dynamic content
   - Testing agents

4. **Troubleshooting**
   - Common failures
   - Debugging techniques
   - Logging

## Questions to Answer Before Phase 3

1. Where will agents run? (separate process? worker? thread?)
2. How will agents authenticate to the browser?
3. What permissions model do we need?
4. How do we handle agent timeouts/crashes?
5. Should agents communicate with each other?
6. How do we version the agent API?
7. What are the performance requirements?
8. How do we handle browser crashes during agent execution?

## References

- [Electron IPC](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [Playwright CDP Connection](https://playwright.dev/docs/api/class-browser#browser-connect-over-cdp)
- [Electron Session Partitions](https://www.electronjs.org/docs/latest/api/session)
- [Electron Input Events](https://www.electronjs.org/docs/latest/api/web-contents#contentssendInputEventsevents)

---

**The infrastructure is ready. Phase 3 implementation begins when agent control is needed.**
