/**
 * apps/desktop/main.ts
 *
 * Electron controller for a dedicated real Chrome workspace.
 */

import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import { ChromeLauncher, type ChromeLaunchResult } from "../../packages/chrome-launcher";
import {
  AgentAdapter,
  ChromeAttachment,
  PlaywrightWorkspaceController,
} from "../../packages/workspace-runtime";
import { ActionExecutor, searchGoogle, searchYouTube } from "../../packages/agent-runtime";
import { PageCursorOverlay } from "../../packages/cursor-overlay";
import type { Action, WorkspaceController } from "../../packages/shared-types";

let mainWindow: BrowserWindow | null = null;
let chromeProcess: ChromeLaunchResult["process"] | null = null;
let chromeAttachment: ChromeAttachment | null = null;
let workspaceController: PlaywrightWorkspaceController | null = null;
let agentAdapter: AgentAdapter | null = null;
let cursorOverlay: PageCursorOverlay | null = null;
let actionExecutor: ActionExecutor | null = null;
let statusTimer: NodeJS.Timeout | null = null;

const workspaceProfileDir = path.join("C:", "parallel-workspaces", "profiles", "ai-workspace");

const workspaceStatus = {
  chrome: "starting",
  playwright: "disconnected",
  currentTask: "Idle",
  currentAction: "None",
  url: "",
  title: "",
  lastError: "",
};

function setStatus(patch: Partial<typeof workspaceStatus>): void {
  Object.assign(workspaceStatus, patch);
  mainWindow?.webContents.send("workspace-status", workspaceStatus);
}

async function initializeChromeWorkspace(): Promise<ChromeLaunchResult> {
  console.log("[main] Starting Chrome workspace");

  const chromeResult = await ChromeLauncher.launch({
    profileId: "ai-workspace",
    cdpPort: 9222,
    cdpStartupTimeoutMs: 15000,
    profileDir: workspaceProfileDir,
    headless: false,
    additionalArgs: ["https://google.com"],
  });

  chromeProcess = chromeResult.process;
  setStatus({ chrome: "running", lastError: "" });

  chromeProcess.on("exit", (code, signal) => {
    setStatus({
      chrome: "stopped",
      playwright: "disconnected",
        lastError: `Chrome exited (${signal || (code ?? "unknown")})`,
    });
  });

  chromeAttachment = new ChromeAttachment({
    cdpEndpoint: chromeResult.cdpEndpoint,
    connectTimeout: 30000,
  });
  await chromeAttachment.connect();
  setStatus({ playwright: "connected" });

  const page = chromeAttachment.getPage();
  workspaceController = new PlaywrightWorkspaceController(page);
  agentAdapter = new AgentAdapter(workspaceController);
  void agentAdapter;

  cursorOverlay = new PageCursorOverlay(page);
  await cursorOverlay.install();

  actionExecutor = new ActionExecutor(workspaceController, {
    onActionStart: async (action) => {
      setStatus({ currentAction: describeAction(action), lastError: "" });
      if (action.type === "click") {
        await cursorOverlay?.moveTo(action.x, action.y);
      }
      if (action.type === "type" || action.type === "press") {
        await cursorOverlay?.showTyping();
      }
    },
    onActionComplete: async (action) => {
      if (action.type === "click") {
        await cursorOverlay?.showClick(action.x, action.y);
      }
      await refreshStatusSnapshot();
    },
    onActionError: (_action, error) => {
      setStatus({ lastError: error instanceof Error ? error.message : String(error) });
    },
  });

  startStatusPolling();
  await refreshStatusSnapshot();

  console.log(`[main] Chrome workspace ready at ${chromeResult.cdpEndpoint}`);
  console.log(`[main] Profile directory: ${chromeResult.profilePath}`);
  return chromeResult;
}

async function refreshStatusSnapshot(): Promise<void> {
  if (!workspaceController) {
    return;
  }

  try {
    setStatus({
      playwright: chromeAttachment?.isConnected() ? "connected" : "disconnected",
      url: await workspaceController.currentUrl(),
      title: await workspaceController.pageTitle(),
    });
  } catch (error) {
    setStatus({
      playwright: "needs reconnect",
      lastError: error instanceof Error ? error.message : String(error),
    });
  }
}

function startStatusPolling(): void {
  if (statusTimer) {
    return;
  }

  statusTimer = setInterval(() => {
    void refreshStatusSnapshot();
  }, 1500);
}

function describeAction(action: Action): string {
  switch (action.type) {
    case "navigate":
      return `Navigate: ${action.url}`;
    case "click":
      return `Click: ${Math.round(action.x)}, ${Math.round(action.y)}`;
    case "type":
      return `Type: ${action.text}`;
    case "press":
      return `Press: ${action.key}`;
    case "scroll":
      return `Scroll: ${action.delta}`;
    case "screenshot":
      return action.path ? `Screenshot: ${action.path}` : "Screenshot";
    default:
      return "Unknown action";
  }
}

function controllerThroughExecutor(): WorkspaceController {
  if (!workspaceController || !actionExecutor) {
    throw new Error("Workspace is not ready yet.");
  }

  return {
    navigate: (url) => actionExecutor!.execute({ type: "navigate", url }).then(() => undefined),
    click: (x, y) => actionExecutor!.execute({ type: "click", x, y }).then(() => undefined),
    type: (text) => actionExecutor!.execute({ type: "type", text }).then(() => undefined),
    press: (key) => actionExecutor!.execute({ type: "press", key }).then(() => undefined),
    pressKey: (key) => actionExecutor!.execute({ type: "press", key }).then(() => undefined),
    scroll: (delta) => actionExecutor!.execute({ type: "scroll", delta }).then(() => undefined),
    screenshot: () => workspaceController!.screenshot(),
    screenshotToFile: (filePath) => workspaceController!.screenshotToFile(filePath),
    waitForElement: (selector, timeoutMs) => workspaceController!.waitForElement(selector, timeoutMs),
    getTitle: () => workspaceController!.getTitle(),
    pageTitle: () => workspaceController!.pageTitle(),
    getUrl: () => workspaceController!.getUrl(),
    currentUrl: () => workspaceController!.currentUrl(),
    getViewport: () => workspaceController!.getViewport(),
  };
}

async function runPanelTask(task: "google" | "youtube", query: string): Promise<void> {
  const prompt = query || (task === "youtube" ? "MrBeast" : "Parallel Workspaces");
  setStatus({ currentTask: `${task}: ${prompt}`, currentAction: "Starting", lastError: "" });

  const controller = controllerThroughExecutor();
  if (task === "google") {
    await searchGoogle(controller, prompt);
  } else {
    await searchYouTube(controller, prompt);
  }

  setStatus({ currentTask: "Idle", currentAction: "Done" });
}

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 760,
    height: 620,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Parallel Workspaces</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; background: #f7f7f5; color: #1f2933; }
        .container { max-width: 700px; margin: 0 auto; padding: 24px; }
        h1 { margin: 0 0 4px; font-size: 24px; }
        .subtle { color: #607080; font-size: 13px; margin-bottom: 20px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .panel { background: #fff; border: 1px solid #d9ded8; border-radius: 8px; padding: 16px; }
        .wide { grid-column: 1 / -1; }
        .label { color: #607080; font-size: 12px; margin-bottom: 5px; }
        .value { font-size: 14px; min-height: 20px; word-break: break-word; }
        .ok { color: #0f766e; font-weight: 700; }
        .bad { color: #b42318; font-weight: 700; }
        .actions { display: flex; gap: 8px; margin-top: 10px; }
        input { flex: 1; min-width: 0; padding: 10px; border: 1px solid #c9d1c8; border-radius: 6px; font-size: 14px; }
        button { padding: 10px 12px; border: 1px solid #0f766e; border-radius: 6px; background: #0f766e; color: #fff; font-weight: 700; cursor: pointer; }
        button.secondary { background: #fff; color: #0f766e; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Parallel Workspaces</h1>
        <div class="subtle">Dedicated Chrome workspace controlled through Playwright/CDP. Endpoint: http://localhost:9222</div>
        <div class="grid">
          <div class="panel"><div class="label">Chrome</div><div id="chrome" class="value">starting</div></div>
          <div class="panel"><div class="label">Playwright</div><div id="playwright" class="value">disconnected</div></div>
          <div class="panel wide"><div class="label">Current task</div><div id="task" class="value">Idle</div></div>
          <div class="panel wide"><div class="label">Current action</div><div id="action" class="value">None</div></div>
          <div class="panel wide"><div class="label">Page</div><div id="page" class="value"></div></div>
          <div class="panel wide"><div class="label">Last error</div><div id="error" class="value">None</div></div>
          <div class="panel wide">
            <div class="label">Smoke test</div>
            <div class="actions">
              <input id="query" value="MrBeast" />
              <button id="youtube">Search YouTube</button>
              <button id="google" class="secondary">Search Google</button>
            </div>
          </div>
        </div>
      </div>
      <script>
        const ids = {
          chrome: document.getElementById('chrome'),
          playwright: document.getElementById('playwright'),
          task: document.getElementById('task'),
          action: document.getElementById('action'),
          page: document.getElementById('page'),
          error: document.getElementById('error'),
          query: document.getElementById('query')
        };
        window.parallel.onStatus((status) => {
          ids.chrome.textContent = status.chrome;
          ids.chrome.className = 'value ' + (status.chrome === 'running' ? 'ok' : 'bad');
          ids.playwright.textContent = status.playwright;
          ids.playwright.className = 'value ' + (status.playwright === 'connected' ? 'ok' : 'bad');
          ids.task.textContent = status.currentTask;
          ids.action.textContent = status.currentAction;
          ids.page.textContent = [status.title, status.url].filter(Boolean).join(' - ');
          ids.error.textContent = status.lastError || 'None';
        });
        document.getElementById('youtube').addEventListener('click', () => window.parallel.runSmokeTest('youtube', ids.query.value));
        document.getElementById('google').addEventListener('click', () => window.parallel.runSmokeTest('google', ids.query.value));
      </script>
    </body>
    </html>
  `;

  mainWindow.loadURL("data:text/html," + encodeURIComponent(htmlContent));
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

ipcMain.handle("run-smoke-test", async (_event, task: "google" | "youtube", query: string) => {
  try {
    await runPanelTask(task, query);
  } catch (error) {
    setStatus({
      currentAction: "Failed",
      lastError: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
});

app.whenReady().then(async () => {
  createMainWindow();
  setStatus(workspaceStatus);

  try {
    await initializeChromeWorkspace();
  } catch (error) {
    setStatus({
      chrome: "failed",
      playwright: "disconnected",
      lastError: error instanceof Error ? error.message : String(error),
    });
  }
});

app.on("window-all-closed", async () => {
  if (statusTimer) {
    clearInterval(statusTimer);
    statusTimer = null;
  }

  cursorOverlay = null;

  if (chromeAttachment) {
    try {
      await chromeAttachment.disconnect();
    } catch (error) {
      console.warn("[main] Error disconnecting Playwright:", error);
    }
  }

  if (chromeProcess) {
    try {
      await ChromeLauncher.close(chromeProcess);
    } catch (error) {
      console.warn("[main] Error closing Chrome:", error);
    }
  }

  app.quit();
});

process.on("uncaughtException", (error) => {
  console.error("[main] Uncaught exception:", error);
  setStatus({ lastError: error.message });
});
