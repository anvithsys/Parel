/**
 * packages/workspace-runtime/ChromeAttachment.ts
 *
 * Connects to a running Chrome instance via Chrome Remote Debugging Protocol (CDP).
 * Uses Playwright to attach to and control the dedicated Chrome workspace.
 *
 * Features:
 * - Connects to Chrome via CDP endpoint
 * - Manages page/context lifecycle
 * - Provides high-level browser automation
 * - Handles disconnection/reconnection
 * - Works ONLY with dedicated Chrome workspace (never user's desktop)
 */

import { chromium, Browser, BrowserContext, Page } from "playwright";

export interface ChromeAttachmentConfig {
  /** CDP endpoint (e.g., "http://localhost:9222") */
  cdpEndpoint: string;

  /** Timeout for connection attempts (ms) */
  connectTimeout?: number;
}

/**
 * ChromeAttachment: Playwright connection to running Chrome instance
 */
export class ChromeAttachment {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private readonly cdpEndpoint: string;
  private readonly connectTimeout: number;

  constructor(config: ChromeAttachmentConfig) {
    this.cdpEndpoint = config.cdpEndpoint;
    this.connectTimeout = config.connectTimeout || 30000;
  }

  /**
   * Connect to the running Chrome instance via CDP
   */
  async connect(): Promise<void> {
    if (this.browser) {
      console.warn("[ChromeAttachment] Already connected");
      return;
    }

    try {
      console.log(
        `[ChromeAttachment] Connecting to Chrome via CDP: ${this.cdpEndpoint}`
      );

      // Connect to Chrome via CDP
      this.browser = await chromium.connectOverCDP(this.cdpEndpoint, {
        timeout: this.connectTimeout,
      });

      console.log("[ChromeAttachment] Successfully connected to Chrome");

      // Get or create context
      const contexts = this.browser.contexts();
      if (contexts.length > 0) {
        this.context = contexts[0];
        console.log("[ChromeAttachment] Using existing browser context");
      } else {
        this.context = await this.browser.newContext();
        console.log("[ChromeAttachment] Created new browser context");
      }

      // Get or create page
      const pages = this.context.pages().filter((page) => !page.isClosed());
      const usablePage = pages.find((page) => !page.url().startsWith("devtools://")) || pages[0];
      if (usablePage) {
        this.page = usablePage;
        console.log("[ChromeAttachment] Using existing page");
      } else {
        this.page = await this.context.newPage();
        console.log("[ChromeAttachment] Created new page");
      }

      this.page.on("close", () => {
        this.page = null;
      });
    } catch (error) {
      console.error("[ChromeAttachment] Connection failed:", error);
      throw error;
    }
  }

  /**
   * Get the current page (must be connected first)
   */
  getPage(): Page {
    if (!this.page) {
      throw new Error(
        "[ChromeAttachment] Not connected. Call connect() first."
      );
    }
    return this.page;
  }

  async getOrCreatePage(): Promise<Page> {
    await this.ensureConnected();

    if (this.page && !this.page.isClosed()) {
      return this.page;
    }

    const context = this.getContext();
    const pages = context.pages().filter((page) => !page.isClosed());
    this.page = pages.find((page) => !page.url().startsWith("devtools://")) || (await context.newPage());
    this.page.on("close", () => {
      this.page = null;
    });
    return this.page;
  }

  /**
   * Get the browser instance (must be connected first)
   */
  getBrowser(): Browser {
    if (!this.browser) {
      throw new Error(
        "[ChromeAttachment] Not connected. Call connect() first."
      );
    }
    return this.browser;
  }

  /**
   * Get the context (must be connected first)
   */
  getContext(): BrowserContext {
    if (!this.context) {
      throw new Error(
        "[ChromeAttachment] Not connected. Call connect() first."
      );
    }
    return this.context;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.browser !== null && this.browser.isConnected();
  }

  /**
   * Disconnect from Chrome
   */
  async disconnect(): Promise<void> {
    if (this.page) {
      try {
        await this.page.close();
      } catch (error) {
        console.warn("[ChromeAttachment] Error closing page:", error);
      }
      this.page = null;
    }

    if (this.context) {
      try {
        await this.context.close();
      } catch (error) {
        console.warn("[ChromeAttachment] Error closing context:", error);
      }
      this.context = null;
    }

    if (this.browser) {
      try {
        await this.browser.close();
      } catch (error) {
        console.warn("[ChromeAttachment] Error closing browser:", error);
      }
      this.browser = null;
    }

    console.log("[ChromeAttachment] Disconnected from Chrome");
  }

  /**
   * Ensure connection is alive (reconnect if needed)
   */
  async ensureConnected(): Promise<void> {
    if (!this.browser || !this.browser.isConnected()) {
      console.log("[ChromeAttachment] Connection lost, reconnecting...");
      await this.disconnect();
      await this.connect();
    }
  }
}
