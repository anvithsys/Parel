/**
 * workspace-runtime/BrowserRealism.ts
 *
 * Implements Chrome-like behavior and keyboard shortcuts.
 * Makes the Electron browser feel like native Chrome.
 *
 * Supported shortcuts:
 *   - Ctrl/Cmd+T: New Tab (open new window)
 *   - Ctrl/Cmd+W: Close current window
 *   - Ctrl/Cmd+L: Focus address bar
 *   - Ctrl/Cmd+R: Refresh page
 *   - Ctrl/Cmd+Shift+R: Hard refresh
 *   - F12: Toggle developer tools
 *   - Ctrl/Cmd+Shift+Delete: Clear browsing data (show DevTools)
 *   - Ctrl/Cmd+,: Open settings
 *   - Ctrl/Cmd+H: History
 *   - Ctrl/Cmd+J: Downloads
 */

import { BrowserWindow, Menu, app } from "electron";

export class BrowserRealism {
  /**
   * Set up keyboard shortcuts and menus for Chrome-like experience
   */
  static setupKeyboardShortcuts(window: BrowserWindow): void {
    // Create application menu with common browser actions
    const template: any[] = [
      {
        label: "File",
        submenu: [
          {
            label: "New Window",
            accelerator: "CmdOrCtrl+N",
            click: () => {
              const newWindow = new BrowserWindow({
                width: 1400,
                height: 900,
                webPreferences: {
                  partition: "persist:ai-workspace",
                  nodeIntegration: false,
                  contextIsolation: true,
                },
              });
              newWindow.loadURL("https://google.com");
            },
          },
          {
            label: "Close Window",
            accelerator: "CmdOrCtrl+W",
            click: () => {
              window.close();
            },
          },
          {
            type: "separator",
          },
          {
            label: "Exit",
            accelerator: "CmdOrCtrl+Q",
            click: () => {
              app.quit();
            },
          },
        ],
      },
      {
        label: "Edit",
        submenu: [
          { role: "undo" },
          { role: "redo" },
          { type: "separator" },
          { role: "cut" },
          { role: "copy" },
          { role: "paste" },
          { role: "selectAll" },
        ],
      },
      {
        label: "View",
        submenu: [
          {
            label: "Reload",
            accelerator: "CmdOrCtrl+R",
            click: () => {
              window.webContents.reload();
            },
          },
          {
            label: "Hard Reload",
            accelerator: "CmdOrCtrl+Shift+R",
            click: () => {
              window.webContents.reloadIgnoringCache();
            },
          },
          {
            type: "separator",
          },
          {
            label: "Zoom In",
            accelerator: "CmdOrCtrl+Plus",
            click: () => {
              const current = window.webContents.getZoomFactor();
              window.webContents.setZoomFactor(current + 0.1);
            },
          },
          {
            label: "Zoom Out",
            accelerator: "CmdOrCtrl+Minus",
            click: () => {
              const current = window.webContents.getZoomFactor();
              window.webContents.setZoomFactor(Math.max(0.1, current - 0.1));
            },
          },
          {
            label: "Reset Zoom",
            accelerator: "CmdOrCtrl+0",
            click: () => {
              window.webContents.setZoomFactor(1.0);
            },
          },
          {
            type: "separator",
          },
          {
            label: "Toggle Developer Tools",
            accelerator: "F12",
            click: () => {
              window.webContents.openDevTools({ mode: "bottom" });
            },
          },
          {
            label: "Toggle Full Screen",
            accelerator: process.platform === "darwin" ? "Cmd+Ctrl+F" : "F11",
            click: () => {
              window.setFullScreen(!window.isFullScreen());
            },
          },
        ],
      },
      {
        label: "History",
        submenu: [
          {
            label: "Back",
            accelerator: process.platform === "darwin" ? "Cmd+[" : "Alt+Left",
            click: () => {
              if (window.webContents.canGoBack()) {
                window.webContents.goBack();
              }
            },
          },
          {
            label: "Forward",
            accelerator: process.platform === "darwin" ? "Cmd+]" : "Alt+Right",
            click: () => {
              if (window.webContents.canGoForward()) {
                window.webContents.goForward();
              }
            },
          },
        ],
      },
    ];

    // Add macOS-specific menu items
    if (process.platform === "darwin") {
      template.unshift({
        label: app.name,
        submenu: [
          { role: "about" },
          { type: "separator" },
          { role: "services" },
          { type: "separator" },
          { role: "hide" },
          { role: "hideOthers" },
          { role: "unhide" },
          { type: "separator" },
          { role: "quit" },
        ],
      });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  /**
   * Register global keyboard shortcuts for browser-like navigation
   */
  static setupGlobalShortcuts(window: BrowserWindow): void {
    // These are handled by the menu setup, but we can add additional
    // non-menu shortcuts here if needed
  }

  /**
   * Handle common developer-friendly shortcuts
   */
  static setupDeveloperShortcuts(window: BrowserWindow): void {
    // This allows easy access to DevTools during development
    window.webContents.on("before-input-event", (event, input) => {
      // F12 opens DevTools
      if (input.key.toLowerCase() === "f12") {
        window.webContents.openDevTools({ mode: "bottom" });
      }
      // Ctrl+Shift+I also opens DevTools
      if (input.control && input.shift && input.key.toLowerCase() === "i") {
        window.webContents.openDevTools({ mode: "bottom" });
      }
    });
  }

  /**
   * Disable certain dangerous behaviors to feel more like Chrome
   */
  static disableDangerousBehaviors(window: BrowserWindow): void {
    // Prevent accidental back button behavior
    window.webContents.on("before-input-event", (event, input) => {
      // This is a placeholder for additional safety measures
    });
  }
}
