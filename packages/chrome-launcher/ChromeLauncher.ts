/**
 * packages/chrome-launcher/ChromeLauncher.ts
 *
 * Launches REAL Google Chrome with CDP (Chrome Remote Debugging Protocol) enabled.
 *
 * Features:
 * - Launches real Chrome executable (not Chromium)
 * - Enables remote debugging on port 9222
 * - Uses persistent user-data-dir for profile storage
 * - Sessions, cookies, logins persist across restarts
 * - Returns CDP endpoint for Playwright connection
 *
 * Windows-first implementation.
 */

import { spawn, ChildProcess } from "child_process";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

export interface ChromeLauncherConfig {
  /** Unique identifier for this workspace profile */
  profileId: string;

  /** Port for Chrome Remote Debugging Protocol (default: 9222) */
  cdpPort?: number;

  /** Startup timeout for CDP readiness in milliseconds (minimum: 10000) */
  cdpStartupTimeoutMs?: number;

  /** Custom profile directory (default: C:/parallel-workspaces/profiles/{profileId}) */
  profileDir?: string;

  /** Whether to run headless (default: false - visible Chrome window) */
  headless?: boolean;

  /** Additional Chrome command-line flags */
  additionalArgs?: string[];
}

export interface ChromeLaunchResult {
  /** CDP connection endpoint (e.g., "http://localhost:9222") */
  cdpEndpoint: string;

  /** Path to the user-data directory */
  profilePath: string;

  /** The spawned Chrome process */
  process: ChildProcess;

  /** Port that Chrome is listening on for CDP */
  cdpPort: number;
}

/**
 * ChromeLauncher: Launches real Chrome with CDP enabled
 */
export class ChromeLauncher {
  /**
   * Find Chrome executable on Windows.
   * Checks common installation paths.
   */
  private static findChromeExecutable(): string {
    const possiblePaths = [
      // User installation
      path.join(
        os.homedir(),
        "AppData\\Local\\Google\\Chrome\\Application\\chrome.exe"
      ),
      // System installation
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      // Chromium (fallback)
      path.join(
        os.homedir(),
        "AppData\\Local\\Chromium\\Application\\chrome.exe"
      ),
    ];

    for (const chromePath of possiblePaths) {
      if (fs.existsSync(chromePath)) {
        console.log(`[ChromeLauncher] Found Chrome at: ${chromePath}`);
        return chromePath;
      }
    }

    throw new Error(
      "[ChromeLauncher] Google Chrome not found. Please install Chrome on your system."
    );
  }

  /**
   * Ensure profile directory exists
   */
  private static ensureProfileDirectory(profilePath: string): void {
    if (!fs.existsSync(profilePath)) {
      fs.mkdirSync(profilePath, { recursive: true });
      console.log(
        `[ChromeLauncher] Created profile directory: ${profilePath}`
      );
    }
  }

  /**
   * Wait for Chrome to respond on CDP port
   */
  private static async waitForCdpReady(
    cdpEndpoint: string,
    maxAttempts: number = 100,
    delayMs: number = 100
  ): Promise<void> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`${cdpEndpoint}/json/version`);
        if (response.ok) {
          console.log(`[ChromeLauncher] Chrome CDP ready at ${cdpEndpoint}`);
          return;
        }
      } catch (error) {
        // Not ready yet
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    throw new Error(
      `[ChromeLauncher] Chrome CDP did not become ready at ${cdpEndpoint} after ${maxAttempts * delayMs}ms`
    );
  }

  /**
   * Launch Chrome with CDP enabled
   */
  static async launch(
    config: ChromeLauncherConfig
  ): Promise<ChromeLaunchResult> {
    const cdpPort = config.cdpPort || 9222;
    const cdpStartupTimeoutMs = Math.max(config.cdpStartupTimeoutMs || 10000, 10000);
    const profileDir =
      config.profileDir ||
      path.join("C:", "parallel-workspaces", "profiles", config.profileId);
    const chromeExecutable = this.findChromeExecutable();

    // Ensure profile directory exists
    this.ensureProfileDirectory(profileDir);

    // Build Chrome command-line arguments
    const args = [
      // Enable CDP on specified port
      `--remote-debugging-port=${cdpPort}`,

      // Use persistent isolated profile directory
      `--user-data-dir=${profileDir}`,

      // Open in a separate window for the AI workspace
      "--new-window",

      // Don't crash on startup with user-data-dir
      "--no-first-run",
      "--no-default-browser-check",

      // Performance and stability
      "--disable-extensions",
      "--disable-sync",
      "--disable-translate",

      // Add any custom args
      ...(config.additionalArgs || []),
    ];

    // Run headless if requested
    if (config.headless) {
      args.push("--headless=new");
    }

    console.log(
      `[ChromeLauncher] Launching Chrome: ${chromeExecutable} ${args.join(" ")}`
    );

    // Spawn Chrome process
    const chromeProcess = spawn(chromeExecutable, args, {
      stdio: ["ignore", "pipe", "pipe"],
      detached: false,
    });

    // Handle Chrome process events
    chromeProcess.on("error", (error) => {
      console.error("[ChromeLauncher] Chrome process error:", error);
    });

    chromeProcess.on("exit", (code, signal) => {
      const reason = signal ? `signal ${signal}` : `code ${code}`;
      console.error(
        `[ChromeLauncher] Chrome process exited unexpectedly (${reason})`
      );
    });

    chromeProcess.stdout?.on("data", (data) => {
      console.log(`[Chrome stdout] ${data.toString().trim()}`);
    });

    chromeProcess.stderr?.on("data", (data) => {
      console.log(`[Chrome stderr] ${data.toString().trim()}`);
    });

    // Wait for Chrome to be ready on CDP port
    const cdpEndpoint = `http://localhost:${cdpPort}`;
    const waitForReady = this.waitForCdpReady(cdpEndpoint, Math.ceil(cdpStartupTimeoutMs / 100), 100);
    const chromeExitPromise = new Promise<void>((_, reject) => {
      chromeProcess.on("exit", (code, signal) => {
        reject(
          new Error(
            `[ChromeLauncher] Chrome terminated before CDP became ready (code=${code}, signal=${signal})`
          )
        );
      });
    });

    await Promise.race([waitForReady, chromeExitPromise]);

    return {
      cdpEndpoint,
      profilePath: profileDir,
      process: chromeProcess,
      cdpPort,
    };
  }

  /**
   * Gracefully close Chrome process
   */
  static async close(chromeProcess: ChildProcess): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!chromeProcess || chromeProcess.killed) {
        resolve();
        return;
      }

      // Listen for exit
      chromeProcess.on("exit", () => resolve());
      chromeProcess.on("error", reject);

      // Send SIGTERM
      chromeProcess.kill("SIGTERM");

      // Force kill after timeout
      const timeout = setTimeout(() => {
        chromeProcess.kill("SIGKILL");
      }, 5000);

      chromeProcess.on("exit", () => {
        clearTimeout(timeout);
      });
    });
  }
}
