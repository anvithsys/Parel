# Development Guide

## Quick Commands

```bash
# Install dependencies
npm install

# Type check
npm run typecheck

# Build TypeScript
npm run build

# Run the app
npm start

# Development mode (with watch)
npm run dev
```

## Development Workflow

### Set Up Watch Mode

Open TWO terminals:

**Terminal 1: Watch TypeScript**
```bash
npx tsc --watch
```

**Terminal 2: Run the app**
```bash
npm start
```

Now when you edit files, TypeScript recompiles automatically.

### Debugging with DevTools

Inside the running app, press `F12` to open Electron DevTools.

You can inspect:
- HTML/DOM
- Console logs
- Network requests
- Storage (cookies, localStorage)
- Resources

### Viewing App Logs

When you run `npm start`, look at the console output:

```
[main] AI Workspace Browser starting...
[PersistentBrowserManager] Restored window state from disk
[PersistentBrowserManager] Loaded browser with URL: https://google.com
[main] Browser window initialized successfully
[main] Sessions, cookies, and logins are persistent across restarts
```

These logs come from `console.log()` calls in the main process.

## File Structure

### Entry Points

- **`apps/desktop/main.ts`** — Electron main process
  - Starts the browser
  - Handles app lifecycle
  - Error handling

### Core Modules

- **`packages/workspace-runtime/PersistentBrowserManager.ts`**
  - Browser window management
  - State persistence
  - Lifecycle

- **`packages/workspace-runtime/BrowserRealism.ts`**
  - Application menu
  - Keyboard shortcuts
  - Chrome-like behavior

- **`packages/workspace-runtime/AgentAdapter.ts`**
  - Interface for agent control (Phase 3+)
  - Screenshot, click, type, etc.

### Types

- **`packages/shared-types/index.ts`**
  - Shared TypeScript definitions
  - `WindowState`, `PersistentBrowserConfig`, etc.

## Common Development Tasks

### Add a New Keyboard Shortcut

Edit `packages/workspace-runtime/BrowserRealism.ts`:

```typescript
{
  label: "My Custom Action",
  accelerator: "CmdOrCtrl+Shift+X",
  click: () => {
    // Your code here
  },
}
```

### Add a New Application Menu Item

Edit `packages/workspace-runtime/BrowserRealism.ts` in `setupKeyboardShortcuts()`:

```typescript
{
  label: "Tools",
  submenu: [
    {
      label: "My Tool",
      click: () => {
        // Your code
      },
    },
  ],
}
```

### Change Home URL

Edit `apps/desktop/main.ts`:

```typescript
const browser = new PersistentBrowserManager({
  partitionId: "ai-workspace",
  homeUrl: "https://your-url.com",  // Change this
});
```

### Debug Window State

The window state is saved to:
```
~/.config/parallel-workspaces/browser-state.json
```

You can inspect it to see the saved coordinates and size.

### Force Reset All State

Delete all app data:

```bash
# Linux/macOS
rm -rf ~/.config/parallel-workspaces/

# Windows
rmdir /s %APPDATA%\parallel-workspaces
```

Then restart the app.

## Testing Changes

### Manual Testing

1. Make a code change
2. Save the file
3. TypeScript recompiles (in watch mode)
4. Close the app (if open)
5. Run `npm start`
6. Test your changes

### Testing Persistence

1. Change something (e.g., log into Gmail)
2. Close the app
3. Run `npm start`
4. Verify the change persisted

See [TEST_GUIDE_PHASE2.md](TEST_GUIDE_PHASE2.md) for comprehensive tests.

## Code Style

### Naming Conventions

- **Classes**: PascalCase
  ```typescript
  class PersistentBrowserManager { }
  class BrowserRealism { }
  ```

- **Methods/Functions**: camelCase
  ```typescript
  async initialize() { }
  private loadSavedState() { }
  ```

- **Constants**: UPPER_SNAKE_CASE
  ```typescript
  const DEFAULT_WIDTH = 1400;
  const DEFAULT_HEIGHT = 900;
  ```

- **Types/Interfaces**: PascalCase
  ```typescript
  interface WindowState { }
  type WorkspaceId = string;
  ```

### Comments

Good comments explain **why**, not **what**:

```typescript
// ✅ Good: Explains the reasoning
// Use a persistent partition so sessions survive app restarts.
// Prefix "persist:" makes Electron persist it across restarts.
partition: `persist:${this.partitionId}`,

// ❌ Bad: Describes what the code does (obvious)
// Set the partition
partition: `persist:${this.partitionId}`,
```

### Error Handling

Always provide context in error messages:

```typescript
// ✅ Good: Clear error message
throw new Error(`Failed to load URL: ${this.homeUrl} — ${error}`);

// ❌ Bad: Vague error
throw new Error("Failed");
```

## Package Management

### Adding Dependencies

If you need to add a package:

```bash
npm install package-name
npm run build
```

Current dependencies:
- `electron` — Desktop app framework
- `typescript` — Type checking
- `@types/node` — Node.js types
- `@types/react` — React types (for future UI)

### TypeScript Versions

We use TypeScript 6.x (strict mode enabled).

Check your version:
```bash
npx tsc --version
```

## Performance Tips

### Screenshot Loop (Future)

When taking screenshots in a loop, add delays:

```typescript
// Avoid hammering the CPU
for (let i = 0; i < 100; i++) {
  const screenshot = await adapter.screenshot();
  await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
}
```

### Debouncing Window Events

Window events fire frequently. Consider debouncing:

```typescript
let saveTimeout: NodeJS.Timeout;

window.on('move', () => {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveWindowState();
  }, 500); // Wait 500ms after last move
});
```

## Debugging Tips

### Console Logs

Add logs to track execution:

```typescript
console.log("[main] Starting...");
console.log("[BrowserManager] Window bounds:", window.getBounds());
```

Prefix with module name `[ModuleName]` for clarity.

### Check Electron Version

```bash
npm list electron
```

### File System Debugging

Check where files are being saved:

```typescript
console.log("App data:", app.getPath("userData"));
console.log("Config:", path.join(app.getPath("userData"), "browser-state.json"));
```

### Network Debugging

Use DevTools to inspect network requests:
1. Press F12 in the app
2. Go to Network tab
3. Reload the page
4. See all requests

### Storage Debugging

Check cookies and localStorage:
1. Press F12
2. Go to Application tab
3. Expand Storage
4. Click Cookies to see saved sessions

## Project Conventions

### Module Organization

```typescript
/**
 * ModuleName.ts
 *
 * Description of what this module does.
 * Keep it concise but complete.
 */

import { SomeDependency } from "./path";
import type { SomeType } from "./types";

// Constants at top
const DEFAULT_VALUE = 123;

// Class definition
export class ModuleName {
  private field: string;

  constructor(config: Config) {
    // Initialize
  }

  /**
   * Public method description
   */
  public async doSomething(): Promise<Result> {
    // Implementation
  }

  /**
   * Private method description
   */
  private internalMethod(): void {
    // Implementation
  }
}
```

### Error Messages

Use consistent formatting:

```typescript
// ✅ Consistent error messages
throw new Error(`[ModuleName] Failed to do X: ${error}`);

// ✅ Include context
throw new Error(`[WorkspaceManager] No workspace found with id "${id}"`);
```

## Resources

- [Electron Main Process](https://www.electronjs.org/docs/latest/tutorial/process-model#the-main-process)
- [Electron IPC](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js Documentation](https://nodejs.org/docs/)

---

**Happy coding! Report issues and improvements in the project repository.**
