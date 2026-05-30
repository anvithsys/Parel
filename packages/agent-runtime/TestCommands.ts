/**
 * packages/agent-runtime/TestCommands.ts
 *
 * Deterministic control tests to verify the dedicated Chrome workspace before
 * any AI planner is introduced.
 */

import type { WorkspaceController } from "../shared-types";

export async function openGoogle(workspace: WorkspaceController): Promise<void> {
  await workspace.navigate("https://www.google.com");
}

export async function searchGoogle(workspace: WorkspaceController, query: string): Promise<void> {
  await openGoogle(workspace);
  await workspace.click(420, 285);
  await workspace.type(query);
  await workspace.press("Enter");
}

export async function openYouTube(workspace: WorkspaceController): Promise<void> {
  await workspace.navigate("https://www.youtube.com");
}

export async function searchYouTube(workspace: WorkspaceController, query: string): Promise<void> {
  await openYouTube(workspace);
  await workspace.click(520, 120);
  await workspace.type(query);
  await workspace.press("Enter");
}
