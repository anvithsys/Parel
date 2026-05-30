/**
 * workspace-runtime/AgentAdapter.ts
 *
 * Adapter layer for external AI agents to interact with the workspace.
 * Bridges agent-specific implementations with the universal WorkspaceController.
 *
 * This package exports types and helpers that external agents can use.
 * Examples:
 *   - OpenClaw
 *   - browser-use
 *   - OpenHands
 *   - OpenInterpreter
 *   - Claude computer-use agents
 *   - OpenAI computer-use agents
 */

import type { WorkspaceController } from "../shared-types";

/**
 * Represents a screenshot of the current browser state
 */
export interface Screenshot {
  /** PNG image data as Buffer */
  data: Buffer;

  /** Base64-encoded PNG image data */
  dataBase64: string;

  /** Timestamp when screenshot was taken */
  timestamp: number;

  /** Browser window width */
  width: number;

  /** Browser window height */
  height: number;
}

/**
 * Coordinates in the browser viewport
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Keyboard input event
 */
export interface KeyboardInput {
  key: string;
  /** Optional: modifier keys (shift, ctrl, alt, meta) */
  modifiers?: string[];
}

/**
 * Mouse input event
 */
export interface MouseInput {
  x: number;
  y: number;
  button?: "left" | "middle" | "right";
  clickCount?: number;
}

/**
 * AgentAdapter: Bridge between external agents and WorkspaceController
 *
 * External agents implement their own logic and use this adapter
 * to interact with the dedicated Chrome workspace.
 */
export class AgentAdapter {
  private readonly controller: WorkspaceController;

  constructor(controller: WorkspaceController) {
    this.controller = controller;
  }

  /**
   * Capture a screenshot of the browser viewport
   * @returns Screenshot data with image and metadata
   */
  async screenshot(): Promise<Screenshot> {
    const buffer = await this.controller.screenshot();
    const viewport = await this.controller.getViewport();

    return {
      data: buffer,
      dataBase64: buffer.toString("base64"),
      timestamp: Date.now(),
      width: viewport.width,
      height: viewport.height,
    };
  }

  /**
   * Perform a click action
   */
  async click(point: Point): Promise<void> {
    await this.controller.click(point.x, point.y);
  }

  /**
   * Perform a double-click action
   */
  async doubleClick(point: Point): Promise<void> {
    // Using the WorkspaceController's page for advanced operations
    const page = (this.controller as any).getPage?.();
    if (page) {
      await page.mouse.dblclick(point.x, point.y);
    } else {
      await this.controller.click(point.x, point.y);
    }
  }

  /**
   * Perform a keyboard input action
   */
  async keyboard(input: KeyboardInput): Promise<void> {
    const modifiers = input.modifiers || [];

    // Hold modifiers
    for (const mod of modifiers) {
      await this.controller.pressKey(mod);
    }

    // Press the key
    await this.controller.pressKey(input.key);
  }

  /**
   * Perform a mouse input action
   */
  async mouse(input: MouseInput): Promise<void> {
    if (input.button === "left" || !input.button) {
      for (let i = 0; i < (input.clickCount || 1); i++) {
        await this.controller.click(input.x, input.y);
      }
    } else if (input.button === "right") {
      const page = (this.controller as any).getPage?.();
      if (page) {
        await page.mouse.click(input.x, input.y, { button: "right" });
      }
    }
  }

  /**
   * Get access to the underlying controller for advanced operations
   */
  getController(): WorkspaceController {
    return this.controller;
  }
}

