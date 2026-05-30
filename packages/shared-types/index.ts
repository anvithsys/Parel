/**
 * shared-types/index.ts
 * Core type definitions shared across all packages.
 * Keep this file minimal and focused.
 */

/** Unique identifier for a workspace session */
export type WorkspaceId = string;

/** Lifecycle states a workspace can be in */
export type WorkspaceStatus = "active" | "loading" | "crashed" | "closed";

/** Persisted window state across restarts */
export interface WindowState {
  /** Window x position */
  x: number;
  /** Window y position */
  y: number;
  /** Window width in pixels */
  width: number;
  /** Window height in pixels */
  height: number;
  /** Whether window is maximized */
  isMaximized: boolean;
}

/** Configuration used to create a new workspace */
export interface WorkspaceConfig {
  /** Unique ID — used as the Electron session partition key */
  id: WorkspaceId;
  /** Human-readable label shown in the window title */
  label: string;
  /** Initial URL to load when the workspace opens */
  url: string;
  /** Window width in pixels */
  width?: number;
  /** Window height in pixels */
  height?: number;
}

/** Configuration for persistent browser workspace */
export interface PersistentBrowserConfig {
  /** Session ID for persistent partitioning */
  partitionId: string;
  /** Initial/home URL */
  homeUrl: string;
  /** Path to persist browser state (optional) */
  statePath?: string;
}

/** Universal workspace controller interface for AI agents */
export interface WorkspaceController {
  /**
   * Navigate to a URL
   * @param url The URL to navigate to
   */
  navigate(url: string): Promise<void>;

  /**
   * Click at coordinates in the viewport
   * @param x X coordinate (relative to viewport)
   * @param y Y coordinate (relative to viewport)
   */
  click(x: number, y: number): Promise<void>;

  /**
   * Type text into the focused element
   * @param text The text to type
   */
  type(text: string): Promise<void>;

  /**
   * Scroll the page
   * @param deltaY Pixels to scroll (positive = down)
   */
  scroll(deltaY: number): Promise<void>;

  /**
   * Press a keyboard key
   * @param key The key to press (e.g., "Enter", "Escape")
   */
  press(key: string): Promise<void>;

  /**
   * Backward-compatible alias for press().
   * @param key The key to press (e.g., "Enter", "Escape")
   */
  pressKey(key: string): Promise<void>;

  /**
   * Capture a screenshot of the viewport
   * @returns PNG image as Buffer
   */
  screenshot(): Promise<Buffer>;

  /**
   * Capture a screenshot and save it to disk.
   * @param filePath Local path for the PNG file
   */
  screenshotToFile(filePath: string): Promise<void>;

  /**
   * Wait for an element to be visible
   * @param selector CSS selector for the element
   * @param timeoutMs Maximum time to wait in milliseconds
   */
  waitForElement(selector: string, timeoutMs?: number): Promise<void>;

  /**
   * Get the current page title
   */
  getTitle(): Promise<string>;

  /**
   * Roadmap-compatible alias for getTitle().
   */
  pageTitle(): Promise<string>;

  /**
   * Get the current URL
   */
  getUrl(): Promise<string>;

  /**
   * Roadmap-compatible alias for getUrl().
   */
  currentUrl(): Promise<string>;

  /**
   * Get viewport dimensions
   */
  getViewport(): Promise<{ width: number; height: number }>;
}

/** Runtime state of a workspace */
export interface WorkspaceState {
  id: WorkspaceId;
  label: string;
  url: string;
  status: WorkspaceStatus;
  /** Unix timestamp of when the workspace was created */
  createdAt: number;
}

/** Generic action schema used by model adapters and external agents */
export type Action =
  | { type: "navigate"; url: string }
  | { type: "click"; x: number; y: number }
  | { type: "type"; text: string }
  | { type: "press"; key: string }
  | { type: "scroll"; delta: number }
  | { type: "screenshot"; path?: string };

/** Lifecycle state for an agent task */
export type AgentTaskStatus = "idle" | "running" | "paused" | "stopped" | "completed" | "failed";

/** Human-readable task request submitted by the desktop app or SDK */
export interface AgentTask {
  id: string;
  prompt: string;
  status: AgentTaskStatus;
  currentAction?: Action;
  error?: string;
  createdAt: number;
  updatedAt: number;
}
