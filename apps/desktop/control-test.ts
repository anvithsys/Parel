/**
 * apps/desktop/control-test.ts
 *
 * Runs deterministic Playwright/CDP smoke commands against an already running
 * dedicated Chrome workspace. Start the app first, then run one of these:
 *
 *   npm run control:google -- "Parallel Workspaces"
 *   npm run control:youtube -- "MrBeast"
 */

import { connectToWorkspace } from "../../packages/sdk";
import {
  openGoogle,
  openYouTube,
  searchGoogle,
  searchYouTube,
} from "../../packages/agent-runtime";

async function main(): Promise<void> {
  const command = process.argv[2] || "google";
  const query = process.argv.slice(3).join(" ");
  const endpoint = process.env.PARALLEL_WORKSPACE_CDP || "http://localhost:9222";
  const client = await connectToWorkspace(endpoint);
  const workspace = client.getController();

  try {
    switch (command) {
      case "open-google":
        await openGoogle(workspace);
        break;
      case "google":
      case "search-google":
        await searchGoogle(workspace, query || "Parallel Workspaces");
        break;
      case "open-youtube":
        await openYouTube(workspace);
        break;
      case "youtube":
      case "search-youtube":
        await searchYouTube(workspace, query || "MrBeast");
        break;
      default:
        throw new Error(`Unknown command "${command}". Use google, youtube, open-google, or open-youtube.`);
    }
  } finally {
    await client.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
