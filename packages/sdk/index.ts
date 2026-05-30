/**
 * packages/sdk/index.ts
 *
 * SDK for external AI agents to connect and interact with Parallel Workspaces.
 *
 * Usage by external agents:
 *
 *   import { connectToWorkspace } from '@parallel-workspaces/sdk';
 *
 *   const workspace = await connectToWorkspace('http://localhost:9222');
 *   const screenshot = await workspace.screenshot();
 *   await workspace.navigate('https://example.com');
 *   await workspace.click(100, 200);
 *
 * Supports any external AI agent:
 *   - OpenClaw
 *   - browser-use
 *   - OpenHands
 *   - OpenInterpreter
 *   - Claude computer-use
 *   - OpenAI computer-use
 *   - Custom agents
 */

import { chromium, Browser } from "playwright";
import {
  PlaywrightWorkspaceController,
} from "../workspace-runtime";
import { AgentAdapter } from "../workspace-runtime";
import type { WorkspaceController } from "../shared-types";

/**
 * Client for connecting to a Parallel Workspaces runtime
 */
export class WorkspaceClient {
  private browser: Browser | null = null;
  private controller: WorkspaceController | null = null;
  private adapter: AgentAdapter | null = null;
  private readonly cdpEndpoint: string;

  constructor(cdpEndpoint: string) {
    this.cdpEndpoint = cdpEndpoint;
  }

  /**
   * Connect to the workspace
   */
  async connect(): Promise<void> {
    if (this.browser) {
      console.log("[WorkspaceClient] Already connected");
      return;
    }

    console.log(
      `[WorkspaceClient] Connecting to ${this.cdpEndpoint}`
    );

    // Connect via CDP
    this.browser = await chromium.connectOverCDP(this.cdpEndpoint, {
      timeout: 30000,
    });

    // Get first context and page
    const contexts = this.browser.contexts();
    const context = contexts[0] || (await this.browser.newContext());
    const pages = context.pages();
    const page = pages[0] || (await context.newPage());

    // Create controller
    this.controller = new PlaywrightWorkspaceController(page);
    this.adapter = new AgentAdapter(this.controller);

    console.log("[WorkspaceClient] Connected successfully");
  }

  /**
   * Disconnect from the workspace
   */
  async disconnect(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (error) {
        console.error("[WorkspaceClient] Error closing:", error);
      }
      this.browser = null;
      this.controller = null;
      this.adapter = null;
    }
  }

  /**
   * Get the controller for direct access
   */
  getController(): WorkspaceController {
    if (!this.controller) {
      throw new Error(
        "[WorkspaceClient] Not connected. Call connect() first."
      );
    }
    return this.controller;
  }

  /**
   * Get the adapter for agent operations
   */
  getAdapter(): AgentAdapter {
    if (!this.adapter) {
      throw new Error(
        "[WorkspaceClient] Not connected. Call connect() first."
      );
    }
    return this.adapter;
  }

  /**
   * Convenience methods that delegate to the adapter
   */

  async screenshot() {
    return this.getAdapter().screenshot();
  }

  async navigate(url: string) {
    return this.getController().navigate(url);
  }

  async click(x: number, y: number) {
    return this.getController().click(x, y);
  }

  async type(text: string) {
    return this.getController().type(text);
  }

  async scroll(deltaY: number) {
    return this.getController().scroll(deltaY);
  }

  async press(key: string) {
    return this.getController().press(key);
  }

  async screenshotToFile(path: string) {
    return this.getController().screenshotToFile(path);
  }

  async getTitle() {
    return this.getController().getTitle();
  }

  async pageTitle() {
    return this.getController().pageTitle();
  }

  async getUrl() {
    return this.getController().getUrl();
  }

  async currentUrl() {
    return this.getController().currentUrl();
  }

  async getViewport() {
    return this.getController().getViewport();
  }
}

/**
 * Connect to a Parallel Workspaces runtime
 *
 * @param cdpEndpoint CDP endpoint (e.g., "http://localhost:9222")
 * @returns WorkspaceClient instance
 */
export async function connectToWorkspace(
  cdpEndpoint: string
): Promise<WorkspaceClient> {
  const client = new WorkspaceClient(cdpEndpoint);
  await client.connect();
  return client;
}

// Re-export types for external agents
export type { WorkspaceController } from "../shared-types";
export { AgentAdapter, type Screenshot, type Point, type KeyboardInput, type MouseInput } from "../workspace-runtime";
export type { Action, AgentTask, AgentTaskStatus } from "../shared-types";
export { ActionExecutor, AgentRuntime, openGoogle, searchGoogle, openYouTube, searchYouTube } from "../agent-runtime";
