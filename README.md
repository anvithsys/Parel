# Parel

A dedicated Chrome workspace for AI agents, without desktop hijacking.

Parel gives tools like OpenClaw, browser-use, Playwright scripts, and custom agents their own real Chrome window to work in. Instead of letting an agent control your real desktop, mouse, keyboard, or daily browser session, Parel launches an isolated persistent Chrome profile and exposes it through Chrome DevTools Protocol.

You keep using your computer normally. The agent works beside you in its own Chrome.

## What It Does

- Launches real Google Chrome, not an embedded browser shell
- Uses an isolated persistent Chrome profile
- Exposes a CDP endpoint at `http://localhost:9222`
- Connects Playwright to the dedicated Chrome workspace
- Provides a model-agnostic action runtime
- Supports navigation, clicks, typing, key presses, scrolling, and screenshots
- Shows a live Electron controller panel
- Shows current Chrome/Playwright status, task, action, URL, and errors
- Displays a fake AI cursor inside the controlled page
- Includes Google and YouTube smoke-test actions
- Provides an SDK for external agents and scripts

## What It Does Not Do

- It is not an AI model
- It is not a complete autonomous agent by itself
- It does not require a cloud backend
- It does not replace Chrome with a custom browser
- It does not move your real Windows mouse when agents use the CDP workspace

## Why

Many browser agents either launch their own hidden browser or use computer-control systems that can interfere with your desktop. Parel is the workspace layer: a visible, isolated Chrome environment that agents can attach to safely through CDP.

## Current Status

Parel is an early MVP. The core workspace is working:

- Dedicated Chrome launch
- Persistent isolated profile
- CDP/Playwright control
- Action executor
- SDK exports
- Live controller panel
- In-page visual cursor
- Built-in Google/YouTube smoke tests

The next big step is deeper testing with real external agents such as OpenClaw and browser-use.

## Getting Started

### Prerequisites

- Windows
- Node.js LTS
- Google Chrome

### Install

```bash
npm install
```

### Run

```bash
npm run start
```

This opens:

- the Parel controller panel
- a dedicated Chrome workspace

The Chrome workspace is exposed at:

```txt
http://localhost:9222
```

## Using With OpenClaw

### 30-Second Setup

1. Start Parel:

```bash
npm run start
```

2. In the Parel controller panel, click **Copy CDP URL**.

3. In OpenClaw, choose remote CDP, custom CDP, or attach existing browser mode.

4. Paste:

```txt
http://localhost:9222
```

That is it. OpenClaw should now operate inside Parel's dedicated Chrome workspace instead of launching or controlling your normal browser.

### Manual Setup

Start Parel first:

```bash
npm run start
```

Then configure OpenClaw to attach to Parel's CDP endpoint:

```txt
http://localhost:9222
```

Use OpenClaw's remote CDP, custom CDP, or attach-only browser mode. Do not let OpenClaw launch its own browser if you want it to use Parel's isolated workspace.

If OpenClaw asks for a WebSocket debugger URL, open:

```txt
http://localhost:9222/json/version
```

and copy the `webSocketDebuggerUrl`.

## Smoke Tests

With Parel running, you can use the controller panel buttons or run:

```bash
npm run control:google -- "Parallel Workspaces"
npm run control:youtube -- "MrBeast"
```

## Project Structure

```txt
apps/
  desktop/
    main.ts
    preload.ts
    control-test.ts

packages/
  chrome-launcher/
  workspace-runtime/
  agent-runtime/
  cursor-overlay/
  sdk/
  shared-types/
```

## Important Safety Note

Parel keeps agents isolated when they connect through the dedicated CDP workspace. If you separately grant an agent OS-level computer-use permissions, that agent may still be able to control your desktop. The safe path is to connect browser agents through Parel's Chrome/CDP endpoint.

## License

MIT
