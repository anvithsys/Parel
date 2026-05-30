/**
 * packages/agent-runtime/ActionExecutor.ts
 *
 * Universal action executor for dedicated Chrome workspaces.
 * It contains no model-specific logic; agents only need to produce Action objects.
 */

import type { Action, WorkspaceController } from "../shared-types";

export interface ActionExecutorEvents {
  onActionStart?: (action: Action) => void | Promise<void>;
  onActionComplete?: (action: Action) => void | Promise<void>;
  onActionError?: (action: Action, error: unknown) => void | Promise<void>;
}

export class ActionExecutor {
  private readonly controller: WorkspaceController;
  private readonly events: ActionExecutorEvents;

  constructor(controller: WorkspaceController, events: ActionExecutorEvents = {}) {
    this.controller = controller;
    this.events = events;
  }

  async execute(action: Action): Promise<Buffer | void> {
    this.validate(action);

    try {
      await this.events.onActionStart?.(action);

      let result: Buffer | void;
      switch (action.type) {
        case "navigate":
          result = await this.controller.navigate(action.url);
          break;
        case "click":
          result = await this.controller.click(action.x, action.y);
          break;
        case "type":
          result = await this.controller.type(action.text);
          break;
        case "press":
          result = await this.controller.press(action.key);
          break;
        case "scroll":
          result = await this.controller.scroll(action.delta);
          break;
        case "screenshot":
          if (action.path) {
            await this.controller.screenshotToFile(action.path);
            result = undefined;
          } else {
            result = await this.controller.screenshot();
          }
          break;
        default:
          result = assertNever(action);
      }

      await this.events.onActionComplete?.(action);
      return result;
    } catch (error) {
      await this.events.onActionError?.(action, error);
      throw error;
    }
  }

  private validate(action: Action): void {
    if (action.type === "navigate" && !/^https?:\/\//i.test(action.url)) {
      throw new Error(`Navigation URL must start with http:// or https://: ${action.url}`);
    }

    if (action.type === "click") {
      validateFiniteNumber(action.x, "x");
      validateFiniteNumber(action.y, "y");
    }

    if (action.type === "scroll") {
      validateFiniteNumber(action.delta, "delta");
    }
  }
}

function validateFiniteNumber(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`Action field "${name}" must be a finite number.`);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unsupported action: ${JSON.stringify(value)}`);
}
