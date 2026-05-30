/**
 * workspace-runtime/index.ts
 * Public API for the workspace-runtime package.
 */

export { WorkspaceManager } from "./WorkspaceManager";
export { PersistentBrowserManager } from "./PersistentBrowserManager";
export { BrowserRealism } from "./BrowserRealism";
export { AgentAdapter, type Screenshot, type Point, type KeyboardInput, type MouseInput } from "./AgentAdapter";
export { ChromeAttachment, type ChromeAttachmentConfig } from "./ChromeAttachment";
export { PlaywrightWorkspaceController } from "./WorkspaceController";



