# Quick Start Guide

## Installation

```bash
cd path/to/parallel-workspaces
npm install
npm run build
```

## Running the App

```bash
npm start
```

This will:
1. Launch Electron window showing workspace status
2. Launch real Google Chrome with isolated profile
3. Enable Chrome Remote Debugging Protocol (CDP) on port 9222
4. Connect Playwright to Chrome
5. Show virtual cursor overlay (optional)

## Connecting Your AI Agent

### Option 1: Using SDK (Recommended)

```typescript
import { connectToWorkspace } from '@parallel-workspaces/sdk';

async function main() {
  const workspace = await connectToWorkspace('http://localhost:9222');
  
  // Take a screenshot
  const screenshot = await workspace.screenshot();
  console.log(`Screenshot: ${screenshot.width}x${screenshot.height}`);
  
  // Navigate to a website
  await workspace.navigate('https://example.com');
  
  // Click something
  await workspace.click(100, 200);
  
  // Type text
  await workspace.type('hello world');
  
  // Disconnect when done
  await workspace.disconnect();
}

main();
```

### Option 2: Using Playwright Directly

```typescript
import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const page = browser.contexts()[0].pages()[0];
  
  await page.goto('https://example.com');
  await page.click('button');
  const screenshot = await page.screenshot();
  
  await browser.close();
}

main();
```

## What You Get

✅ **Real Chrome**: Actual Google Chrome, not a custom browser
✅ **Persistent Sessions**: Logins, cookies, tabs survive restarts
✅ **Isolated Workspace**: Completely separate from user's normal Chrome
✅ **Agent-Agnostic**: Works with any AI agent
✅ **Full Automation**: Click, type, navigate, screenshot
✅ **Visual Feedback**: Virtual cursor shows AI actions

## Key Files

- **`apps/desktop/main.ts`** - Electron entry point, launches Chrome and Playwright
- **`packages/chrome-launcher/`** - Real Chrome launcher with CDP
- **`packages/workspace-runtime/`** - Core automation layer
- **`packages/sdk/`** - SDK for external agents
- **`packages/cursor-overlay/`** - Visual cursor overlay

## Profile Directory

Chrome profile stored at: `./profiles/ai-workspace/`

Your logins, cookies, and session data are saved here automatically.

## Debugging

### View Chrome CDP
```
http://localhost:9222/json/version
```

### Open DevTools in Electron
Press **F12** in the Electron window

### Monitor Chrome Process
Check Task Manager for `chrome.exe` process

## Common Tasks

### Clear Profile (Reset All Data)
```bash
rm -r ./profiles/ai-workspace
# App will create new profile on next start
```

### Change CDP Port
Edit `apps/desktop/main.ts`:
```typescript
cdpPort: 9223, // Change from 9222
```

### Run Headless (No Chrome Window)
Edit `apps/desktop/main.ts`:
```typescript
headless: true, // Change from false
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Chrome not found | Install Google Chrome from https://google.com/chrome |
| Port 9222 in use | Kill process on that port or change port number |
| Playwright connection fails | Make sure Chrome is running (check Task Manager) |
| Profile corrupted | Delete `./profiles/ai-workspace/` folder |
| Overlay not showing | It's optional - app works without it |

## Architecture

```
┌─────────────────────────┐
│   Your AI Agent         │
│ (Claude, GPT-4, etc.)   │
└────────────┬────────────┘
             │ SDK / Playwright
             ▼
┌─────────────────────────┐
│  WorkspaceController    │
│  Universal Interface    │
└────────────┬────────────┘
             │ Playwright
             ▼
┌─────────────────────────┐
│  Playwright + CDP       │
│  Automation Layer       │
└────────────┬────────────┘
             │ CDP Protocol
             ▼
┌─────────────────────────┐
│  Real Google Chrome     │
│  Isolated Profile       │
└─────────────────────────┘
```

## Next Steps

1. **Start the app** - `npm start`
2. **Connect your agent** - Use SDK or Playwright
3. **Implement your logic** - Build your automation
4. **Test interactions** - Click, type, screenshot
5. **Scale up** - Run multiple agents or workspaces

## Support

For issues:
1. Check console logs in Electron window
2. Verify Chrome is running
3. Test CDP endpoint: `curl http://localhost:9222/json/version`
4. Check that port 9222 is not already in use

---

**That's it!** You now have an isolated AI-controlled Chrome workspace.
