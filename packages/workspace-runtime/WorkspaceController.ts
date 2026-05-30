/**
 * packages/workspace-runtime/WorkspaceController.ts
 *
 * Implements the universal WorkspaceController interface for controlling
 * a dedicated Chrome workspace via Playwright/CDP.
 *
 * Key principle: NO model-specific logic. This is purely a control layer.
 * External agents (OpenAI, Claude, OpenClaw, etc.) can use this interface.
 */

import { Page } from "playwright";
import type { WorkspaceController } from "../shared-types";
import * as fs from "fs/promises";
import * as path from "path";

export class PlaywrightWorkspaceController implements WorkspaceController {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(url: string): Promise<void> {
    console.log(`[WorkspaceController] Navigating to ${url}`);
    try {
      await this.page.goto(url, { waitUntil: "domcontentloaded" });
    } catch (error) {
      console.error("[WorkspaceController] Navigation failed:", error);
      throw error;
    }
  }

  async click(x: number, y: number): Promise<void> {
    console.log(`[WorkspaceController] Clicking at (${x}, ${y})`);
    try {
      await this.page.mouse.click(x, y);
    } catch (error) {
      console.error("[WorkspaceController] Click failed:", error);
      throw error;
    }
  }

  async type(text: string): Promise<void> {
    console.log(`[WorkspaceController] Typing: ${text}`);
    try {
      // Use a slower typing speed for more realistic interaction
      await this.page.keyboard.type(text, { delay: 50 });
    } catch (error) {
      console.error("[WorkspaceController] Type failed:", error);
      throw error;
    }
  }

  async scroll(deltaY: number): Promise<void> {
    console.log(`[WorkspaceController] Scrolling by ${deltaY}px`);
    try {
      await this.page.mouse.wheel(0, deltaY);
    } catch (error) {
      console.error("[WorkspaceController] Scroll failed:", error);
      throw error;
    }
  }

  async screenshot(): Promise<Buffer> {
    console.log("[WorkspaceController] Taking screenshot");
    try {
      const buffer = await this.page.screenshot({ type: "png" });
      return buffer;
    } catch (error) {
      console.error("[WorkspaceController] Screenshot failed:", error);
      throw error;
    }
  }

  async screenshotToFile(filePath: string): Promise<void> {
    console.log(`[WorkspaceController] Saving screenshot to ${filePath}`);
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      const buffer = await this.screenshot();
      await fs.writeFile(filePath, buffer);
    } catch (error) {
      console.error("[WorkspaceController] Screenshot to file failed:", error);
      throw error;
    }
  }

  async waitForElement(
    selector: string,
    timeoutMs: number = 10000
  ): Promise<void> {
    console.log(`[WorkspaceController] Waiting for element: ${selector}`);
    try {
      await this.page.waitForSelector(selector, { timeout: timeoutMs });
    } catch (error) {
      console.error("[WorkspaceController] Wait for element failed:", error);
      throw error;
    }
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }

  async pageTitle(): Promise<string> {
    return this.getTitle();
  }

  async getUrl(): Promise<string> {
    return this.page.url();
  }

  async currentUrl(): Promise<string> {
    return this.getUrl();
  }

  async getViewport(): Promise<{ width: number; height: number }> {
    const viewport = this.page.viewportSize();
    if (!viewport) {
      throw new Error("Viewport size not available");
    }
    return viewport;
  }

  /**
   * Additional convenience methods for agents
   */

  /**
   * Press a keyboard key (Escape, Enter, Tab, etc.)
   */
  async pressKey(key: string): Promise<void> {
    return this.press(key);
  }

  /**
   * Press a keyboard key (Escape, Enter, Tab, etc.)
   */
  async press(key: string): Promise<void> {
    console.log(`[WorkspaceController] Pressing key: ${key}`);
    try {
      await this.page.keyboard.press(key);
    } catch (error) {
      console.error("[WorkspaceController] Press key failed:", error);
      throw error;
    }
  }

  /**
   * Double-click at coordinates
   */
  async doubleClick(x: number, y: number): Promise<void> {
    console.log(`[WorkspaceController] Double-clicking at (${x}, ${y})`);
    try {
      await this.page.mouse.dblclick(x, y);
    } catch (error) {
      console.error("[WorkspaceController] Double-click failed:", error);
      throw error;
    }
  }

  /**
   * Right-click at coordinates
   */
  async rightClick(x: number, y: number): Promise<void> {
    console.log(`[WorkspaceController] Right-clicking at (${x}, ${y})`);
    try {
      await this.page.mouse.click(x, y, { button: "right" });
    } catch (error) {
      console.error("[WorkspaceController] Right-click failed:", error);
      throw error;
    }
  }

  /**
   * Get the underlying Playwright Page for advanced operations
   */
  getPage(): Page {
    return this.page;
  }
}
