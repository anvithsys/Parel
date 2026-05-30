/**
 * workspace-runtime/PersistentBrowserManager.ts
 *
 * Manages a single persistent browser workspace.
 * Handles:
 *   - Window state persistence (position, size, maximized state)
 *   - Session persistence (cookies, localStorage, accounts)
 *   - Graceful recovery from crashes
 *   - Real Chrome-like behavior
 *
 * This is Phase 2 — ONE dedicated AI workspace browser.
 */

import { BrowserWindow, app, ipcMain } from "electron";
import * as fs from "fs";
import * as path from "path";
import type { PersistentBrowserConfig, WindowState } from "../shared-types";
import { BrowserRealism } from "./BrowserRealism";

export class PersistentBrowserManager {
  private window: BrowserWindow | null = null;
  private readonly partitionId: string;
  private readonly homeUrl: string;
  private readonly stateFilePath: string;
  private savedWindowState: WindowState | null = null;

  constructor(config: PersistentBrowserConfig) {
    this.partitionId = config.partitionId;
    this.homeUrl = config.homeUrl;
    this.stateFilePath =
      config.statePath ||
      path.join(app.getPath("userData"), "browser-state.json");

    this.loadSavedState();
  }

  /**
   * Initialize and create the persistent browser window.
   * Restores previous state if available (position, size, maximized state).
   * Uses persistent partition so sessions survive restarts.
   */
  async initialize(): Promise<BrowserWindow> {
    if (this.window && !this.window.isDestroyed()) {
      console.warn("[PersistentBrowserManager] Window already initialized");
      return this.window;
    }

    const windowState = this.savedWindowState || {
      x: 100,
      y: 100,
      width: 1400,
      height: 900,
      isMaximized: false,
    };

    this.window = new BrowserWindow({
      x: windowState.x,
      y: windowState.y,
      width: windowState.width,
      height: windowState.height,
      title: "AI Workspace Browser",
      webPreferences: {
        // Persistent partition survives app restarts — cookies, localStorage, etc. stay
        partition: `persist:${this.partitionId}`,
        // Security
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        // Chrome-like preload setup (optional)
        preload: undefined,
      },
    });

    // Restore maximized state if it was before
    if (windowState.isMaximized) {
      this.window.maximize();
    }

    // Set up Chrome-like behavior
    BrowserRealism.setupKeyboardShortcuts(this.window);
    BrowserRealism.setupDeveloperShortcuts(this.window);

    // Handle window events
    this.window.on("closed", () => {
      this.window = null;
    });

    this.window.on("resize", () => {
      this.saveWindowState();
    });

    this.window.on("move", () => {
      this.saveWindowState();
    });

    this.window.on("maximize", () => {
      this.saveWindowState();
    });

    this.window.on("unmaximize", () => {
      this.saveWindowState();
    });

    // Load initial URL (typically Google or home page)
    try {
      await this.window.loadURL(this.homeUrl);
      console.log(
        `[PersistentBrowserManager] Loaded browser with URL: ${this.homeUrl}`
      );
    } catch (error) {
      console.error(
        `[PersistentBrowserManager] Failed to load URL: ${this.homeUrl}`,
        error
      );
    }

    return this.window;
  }

  /**
   * Get the current window instance (if open)
   */
  getWindow(): BrowserWindow | null {
    return this.window;
  }

  /**
   * Navigate to a URL in the browser
   */
  navigate(url: string): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.loadURL(url);
    }
  }

  /**
   * Load and parse saved window state from disk
   */
  private loadSavedState(): void {
    try {
      if (fs.existsSync(this.stateFilePath)) {
        const data = fs.readFileSync(this.stateFilePath, "utf-8");
        this.savedWindowState = JSON.parse(data) as WindowState;
        console.log(
          "[PersistentBrowserManager] Restored window state from disk"
        );
      }
    } catch (error) {
      console.error("[PersistentBrowserManager] Failed to load window state:", error);
      this.savedWindowState = null;
    }
  }

  /**
   * Save current window state (position, size, maximized) to disk
   */
  private saveWindowState(): void {
    if (!this.window || this.window.isDestroyed()) {
      return;
    }

    try {
      const bounds = this.window.getBounds();
      const state: WindowState = {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        isMaximized: this.window.isMaximized(),
      };

      fs.writeFileSync(
        this.stateFilePath,
        JSON.stringify(state, null, 2),
        "utf-8"
      );
    } catch (error) {
      console.error("[PersistentBrowserManager] Failed to save window state:", error);
    }
  }

  /**
   * Close the browser window gracefully
   */
  close(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.close();
    }
  }

  /**
   * Force save state on app quit
   */
  onAppQuit(): void {
    this.saveWindowState();
  }
}

