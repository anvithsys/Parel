/**
 * packages/cursor-overlay/CursorOverlay.ts
 *
 * Renders a visual AI cursor overlay on top of the Chrome workspace.
 *
 * Key principles:
 * - Overlay is above Chrome, not interfering with user input
 * - Shows AI actions: movements, clicks, scrolling
 * - Smooth animations for visibility
 * - Never touches the real system cursor
 *
 * This gives users the feeling: "another person is using another browser beside me."
 */

import { BrowserWindow, app } from "electron";
import * as path from "path";

export interface CursorOverlayConfig {
  /** The target window to overlay on */
  targetWindow: BrowserWindow;

  /** Starting x position */
  x?: number;

  /** Starting y position */
  y?: number;

  /** Cursor size in pixels (default: 20) */
  cursorSize?: number;

  /** Animation speed (default: 200 = 200px/sec) */
  animationSpeed?: number;
}

/**
 * CursorOverlay: Visual cursor for AI actions
 */
export class CursorOverlay {
  private overlayWindow: BrowserWindow | null = null;
  private readonly targetWindow: BrowserWindow;
  private currentX: number;
  private currentY: number;
  private readonly cursorSize: number;
  private readonly animationSpeed: number;
  private animationInterval: NodeJS.Timeout | null = null;
  private targetX: number;
  private targetY: number;

  constructor(config: CursorOverlayConfig) {
    this.targetWindow = config.targetWindow;
    this.currentX = config.x || 0;
    this.currentY = config.y || 0;
    this.targetX = this.currentX;
    this.targetY = this.currentY;
    this.cursorSize = config.cursorSize || 20;
    this.animationSpeed = config.animationSpeed || 200; // pixels per second
  }

  /**
   * Initialize the overlay window
   */
  async initialize(): Promise<void> {
    const bounds = this.targetWindow.getBounds();

    // Create transparent overlay window
    this.overlayWindow = new BrowserWindow({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      transparent: true,
      frame: false,
      focusable: false,
      alwaysOnTop: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: undefined,
      },
    });

    // Load overlay content
    await this.overlayWindow.loadURL(
      `data:text/html,${this.getOverlayHTML()}`
    );

    // Listen to target window moves/resizes
    this.targetWindow.on("move", () => this.syncPosition());
    this.targetWindow.on("resize", () => this.syncSize());
    this.targetWindow.on("close", () => this.close());

    // Start animation loop
    this.startAnimation();

    console.log("[CursorOverlay] Initialized");
  }

  /**
   * Get HTML content for the overlay
   */
  private getOverlayHTML(): string {
    const size = this.cursorSize;
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { margin: 0; padding: 0; overflow: hidden; }
          #cursor {
            position: fixed;
            width: ${size}px;
            height: ${size}px;
            background: radial-gradient(circle, rgba(99, 102, 241, 0.8), rgba(99, 102, 241, 0.2));
            border: 2px solid rgba(99, 102, 241, 1);
            border-radius: 50%;
            pointer-events: none;
            z-index: 99999;
            box-shadow: 0 0 10px rgba(99, 102, 241, 0.6);
            transition: all 0.05s ease-out;
          }
          #cursor.clicking {
            transform: scale(0.8);
            background: radial-gradient(circle, rgba(168, 85, 247, 0.8), rgba(168, 85, 247, 0.2));
            border-color: rgba(168, 85, 247, 1);
            box-shadow: 0 0 20px rgba(168, 85, 247, 0.8);
          }
        </style>
      </head>
      <body>
        <div id="cursor"></div>
        <script>
          window.cursorData = {
            x: 0,
            y: 0,
            clicking: false
          };

          // Listen for cursor updates from main process
          window.addEventListener('message', (event) => {
            const data = event.data;
            if (data.type === 'cursor-move') {
              const el = document.getElementById('cursor');
              el.style.left = (data.x - ${size / 2})+ 'px';
              el.style.top = (data.y - ${size / 2}) + 'px';
            } else if (data.type === 'cursor-click') {
              const el = document.getElementById('cursor');
              el.classList.add('clicking');
              setTimeout(() => el.classList.remove('clicking'), 100);
            }
          });
        </script>
      </body>
      </html>
    `;
  }

  /**
   * Move the cursor to a target position (animated)
   */
  moveTo(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
    console.log(
      `[CursorOverlay] Moving to (${x}, ${y})`
    );
  }

  /**
   * Show a click at current position
   */
  showClick(): void {
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      this.overlayWindow.webContents.send("cursor-click", {
        type: "cursor-click",
      });
    }
    console.log(
      `[CursorOverlay] Click at (${this.currentX}, ${this.currentY})`
    );
  }

  /**
   * Start animation loop
   */
  private startAnimation(): void {
    if (this.animationInterval) {
      return;
    }

    this.animationInterval = setInterval(() => {
      this.updateCursorPosition();
      this.syncOverlay();
    }, 16); // ~60fps
  }

  /**
   * Stop animation loop
   */
  private stopAnimation(): void {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
  }

  /**
   * Update cursor position towards target
   */
  private updateCursorPosition(): void {
    const dx = this.targetX - this.currentX;
    const dy = this.targetY - this.currentY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Smooth easing towards target
    const maxDelta = (this.animationSpeed / 1000) * 16; // pixels per frame

    if (distance > maxDelta) {
      const ratio = maxDelta / distance;
      this.currentX += dx * ratio;
      this.currentY += dy * ratio;
    } else {
      this.currentX = this.targetX;
      this.currentY = this.targetY;
    }
  }

  /**
   * Sync overlay with target window
   */
  private syncOverlay(): void {
    if (!this.overlayWindow || this.overlayWindow.isDestroyed()) {
      return;
    }

    // Send cursor position to overlay
    try {
      this.overlayWindow.webContents.postMessage("cursor-move", {
        type: "cursor-move",
        x: this.currentX,
        y: this.currentY,
      });
    } catch (error) {
      // Window may have closed
    }
  }

  /**
   * Sync overlay position with target window
   */
  private syncPosition(): void {
    if (!this.overlayWindow || this.overlayWindow.isDestroyed()) {
      return;
    }

    const bounds = this.targetWindow.getBounds();
    this.overlayWindow.setPosition(bounds.x, bounds.y);
  }

  /**
   * Sync overlay size with target window
   */
  private syncSize(): void {
    if (!this.overlayWindow || this.overlayWindow.isDestroyed()) {
      return;
    }

    const bounds = this.targetWindow.getBounds();
    this.overlayWindow.setSize(bounds.width, bounds.height);
  }

  /**
   * Close the overlay
   */
  close(): void {
    this.stopAnimation();

    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      this.overlayWindow.destroy();
    }
    this.overlayWindow = null;
    console.log("[CursorOverlay] Closed");
  }

  /**
   * Show/hide the overlay
   */
  setVisible(visible: boolean): void {
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      if (visible) {
        this.overlayWindow.show();
        this.startAnimation();
      } else {
        this.overlayWindow.hide();
        this.stopAnimation();
      }
    }
  }
}
