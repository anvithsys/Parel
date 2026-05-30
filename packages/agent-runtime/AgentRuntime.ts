/**
 * packages/agent-runtime/AgentRuntime.ts
 *
 * Minimal task runtime. A model or external agent can be plugged in by providing
 * a planner that maps the current browser observation to the next Action.
 */

import type { Action, AgentTask, AgentTaskStatus, WorkspaceController } from "../shared-types";
import { ActionExecutor } from "./ActionExecutor";

export interface AgentObservation {
  task: AgentTask;
  screenshot: Buffer;
  url: string;
  title: string;
}

export type AgentPlanner = (observation: AgentObservation) => Promise<Action | null>;

export interface AgentRuntimeOptions {
  controller: WorkspaceController;
  planner?: AgentPlanner;
  stepDelayMs?: number;
  maxSteps?: number;
}

export class AgentRuntime {
  private readonly controller: WorkspaceController;
  private readonly executor: ActionExecutor;
  private readonly planner?: AgentPlanner;
  private readonly stepDelayMs: number;
  private readonly maxSteps: number;
  private currentTask: AgentTask | null = null;
  private stopRequested = false;

  constructor(options: AgentRuntimeOptions) {
    this.controller = options.controller;
    this.executor = new ActionExecutor(options.controller);
    this.planner = options.planner;
    this.stepDelayMs = options.stepDelayMs ?? 250;
    this.maxSteps = options.maxSteps ?? 50;
  }

  async startTask(prompt: string): Promise<AgentTask> {
    if (!this.planner) {
      throw new Error("AgentRuntime requires a planner before it can start a model-driven task.");
    }

    this.stopRequested = false;
    this.currentTask = this.createTask(prompt, "running");

    try {
      for (let step = 0; step < this.maxSteps && !this.stopRequested; step++) {
        await this.waitWhilePaused();

        const observation = await this.observe();
        const action = await this.planner(observation);
        if (!action) {
          return this.updateTask("completed");
        }

        this.currentTask = {
          ...this.currentTask,
          currentAction: action,
          updatedAt: Date.now(),
        };
        await this.executor.execute(action);
        await delay(this.stepDelayMs);
      }

      return this.updateTask(this.stopRequested ? "stopped" : "completed");
    } catch (error) {
      return this.updateTask("failed", error instanceof Error ? error.message : String(error));
    }
  }

  stopTask(): void {
    this.stopRequested = true;
    this.updateTask("stopped");
  }

  pauseTask(): void {
    this.updateTask("paused");
  }

  resumeTask(): void {
    this.updateTask("running");
  }

  getTask(): AgentTask | null {
    return this.currentTask;
  }

  private async observe(): Promise<AgentObservation> {
    if (!this.currentTask) {
      throw new Error("No active task.");
    }

    return {
      task: this.currentTask,
      screenshot: await this.controller.screenshot(),
      url: await this.controller.currentUrl(),
      title: await this.controller.pageTitle(),
    };
  }

  private createTask(prompt: string, status: AgentTaskStatus): AgentTask {
    const now = Date.now();
    return {
      id: `task-${now}`,
      prompt,
      status,
      createdAt: now,
      updatedAt: now,
    };
  }

  private updateTask(status: AgentTaskStatus, error?: string): AgentTask {
    if (!this.currentTask) {
      throw new Error("No active task.");
    }

    this.currentTask = {
      ...this.currentTask,
      status,
      error,
      updatedAt: Date.now(),
    };
    return this.currentTask;
  }

  private async waitWhilePaused(): Promise<void> {
    while (this.currentTask?.status === "paused" && !this.stopRequested) {
      await delay(100);
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
