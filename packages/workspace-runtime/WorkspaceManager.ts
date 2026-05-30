/**
 * workspace-runtime/WorkspaceManager.ts
 *
 * Manages the full lifecycle of browser workspaces.
 * Each workspace is an isolated Electron BrowserWindow
 * with its own session partition (cookies, localStorage, etc.).
 *
 * This is the core runtime module — keep it simple and readable.
 */

import { BrowserWindow, app } from "electron";
import type { WorkspaceConfig, WorkspaceId, WorkspaceState } from "../shared-types";

export class WorkspaceManager {
  /** Internal map of workspace ID → BrowserWindow */
  private windows = new Map<WorkspaceId, BrowserWindow>();

  /** Internal map of workspace ID → state snapshot */
  private states = new Map<WorkspaceId, WorkspaceState>();

  /**
   * Create a new isolated browser workspace.
   * Uses Electron's session partitioning so every workspace
   * has its own cookies, cache, and login state.
   */
  create(config: WorkspaceConfig): BrowserWindow {
    const {
      id,
      label,
      url,
      width = 1200,
      height = 800,
    } = config;

    if (this.windows.has(id)) {
      throw new Error(`Workspace "${id}" already exists.`);
    }

    const win = new BrowserWindow({
      width,
      height,
      title: `Workspace — ${label}`,
      webPreferences: {
        // Each workspace gets its own persisted session.
        // Prefix "persist:" makes Electron persist it across restarts.
        partition: `persist:${id}`,
        // Security defaults
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    // Track state
    const state: WorkspaceState = {
      id,
      label,
      url,
      status: "loading",
      createdAt: Date.now(),
    };
    this.states.set(id, state);
    this.windows.set(id, win);

    // Load the initial URL
    win.loadURL(url).then(() => {
      this.setStatus(id, "active");
    }).catch(() => {
      this.setStatus(id, "crashed");
    });

    // Clean up on close
    win.on("closed", () => {
      this.windows.delete(id);
      this.setStatus(id, "closed");
    });

    console.log(`[WorkspaceManager] Created workspace "${id}" → ${url}`);
    return win;
  }

  /** Close and destroy a workspace by ID */
  close(id: WorkspaceId): void {
    const win = this.windows.get(id);
    if (!win) {
      console.warn(`[WorkspaceManager] No workspace found with id "${id}"`);
      return;
    }
    win.close();
  }

  /** Return a snapshot of all current workspace states */
  list(): WorkspaceState[] {
    return Array.from(this.states.values());
  }

  /** Get a single workspace's BrowserWindow (if still open) */
  getWindow(id: WorkspaceId): BrowserWindow | undefined {
    return this.windows.get(id);
  }

  /** Internal helper to update status in the state map */
  private setStatus(id: WorkspaceId, status: WorkspaceState["status"]): void {
    const existing = this.states.get(id);
    if (existing) {
      this.states.set(id, { ...existing, status });
    }
  }
}
