/**
 * packages/cursor-overlay/PageCursorOverlay.ts
 *
 * Injects a visual AI cursor into the controlled Chrome page. This never moves
 * the Windows cursor and only affects the dedicated browser workspace.
 */

import type { Page } from "playwright";

declare const window: any;
declare const document: any;

export class PageCursorOverlay {
  private readonly page: Page;
  private installed = false;

  constructor(page: Page) {
    this.page = page;
  }

  async install(): Promise<void> {
    if (this.installed) {
      return;
    }

    await this.page.addInitScript(cursorOverlayScript);
    await this.page.evaluate(cursorOverlayScript);
    this.installed = true;
  }

  async moveTo(x: number, y: number): Promise<void> {
    await this.ensureInstalled();
    await this.page.evaluate(
      ({ x, y }) => (window as any).__parallelCursor?.moveTo(x, y),
      { x, y }
    );
  }

  async showClick(x: number, y: number): Promise<void> {
    await this.ensureInstalled();
    await this.page.evaluate(
      ({ x, y }) => (window as any).__parallelCursor?.click(x, y),
      { x, y }
    );
  }

  async showTyping(): Promise<void> {
    await this.ensureInstalled();
    await this.page.evaluate(() => (window as any).__parallelCursor?.typing());
  }

  private async ensureInstalled(): Promise<void> {
    if (!this.installed) {
      await this.install();
    }
  }
}

function cursorOverlayScript(): void {
  if ((window as any).__parallelCursor) {
    return;
  }

  const cursor = document.createElement("div");
  cursor.id = "parallel-ai-cursor";
  cursor.style.cssText = [
    "position:fixed",
    "left:16px",
    "top:16px",
    "width:18px",
    "height:18px",
    "border:2px solid #0f766e",
    "background:rgba(20,184,166,0.18)",
    "border-radius:999px",
    "box-shadow:0 0 0 5px rgba(20,184,166,0.12)",
    "z-index:2147483647",
    "pointer-events:none",
    "transition:left 140ms ease, top 140ms ease, transform 90ms ease, box-shadow 90ms ease",
  ].join(";");

  const label = document.createElement("div");
  label.id = "parallel-ai-cursor-label";
  label.textContent = "AI";
  label.style.cssText = [
    "position:fixed",
    "left:38px",
    "top:10px",
    "padding:3px 7px",
    "border-radius:6px",
    "background:#0f766e",
    "color:white",
    "font:600 11px system-ui,-apple-system,Segoe UI,sans-serif",
    "z-index:2147483647",
    "pointer-events:none",
    "transition:left 140ms ease, top 140ms ease, opacity 120ms ease",
  ].join(";");

  document.documentElement.append(cursor, label);

  function setPosition(x: number, y: number): void {
    cursor.style.left = `${x - 9}px`;
    cursor.style.top = `${y - 9}px`;
    label.style.left = `${x + 14}px`;
    label.style.top = `${y - 18}px`;
  }

  (window as any).__parallelCursor = {
    moveTo: setPosition,
    click: (x: number, y: number) => {
      setPosition(x, y);
      cursor.style.transform = "scale(0.72)";
      cursor.style.boxShadow = "0 0 0 10px rgba(20,184,166,0.22)";
      window.setTimeout(() => {
        cursor.style.transform = "scale(1)";
        cursor.style.boxShadow = "0 0 0 5px rgba(20,184,166,0.12)";
      }, 130);
    },
    typing: () => {
      label.textContent = "typing";
      window.setTimeout(() => {
        label.textContent = "AI";
      }, 450);
    },
  };
}
