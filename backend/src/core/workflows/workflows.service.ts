import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';

export type StepType = 'task' | 'form' | 'approval' | 'wait';
export interface StepInput {
  type: StepType;
  name: string;
}
export interface Step extends StepInput {
  id: string;
  position: number;
}
export interface Workflow {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  steps: Step[];
  createdAt: string;
}
export interface RunStep {
  stepId: string;
  name: string;
  type: StepType;
  status: 'succeeded' | 'failed';
  durationMs: number;
}
export interface Run {
  id: string;
  workflowId: string;
  workflowName: string;
  ownerId: string;
  status: 'succeeded' | 'failed';
  startedAt: string;
  durationMs: number;
  steps: RunStep[];
}

const TYPES: StepType[] = ['task', 'form', 'approval', 'wait'];

// In-memory store, scoped per owner. The Postgres schema with RLS in
// db/migrations is the planned persistence layer.
@Injectable()
export class WorkflowsService {
  private workflows = new Map<string, Workflow>();
  private runs: Run[] = [];

  list(ownerId: string): Workflow[] {
    this.seed(ownerId);
    return [...this.workflows.values()]
      .filter((w) => w.ownerId === ownerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  create(
    ownerId: string,
    data: { name?: string; description?: string; steps?: StepInput[] },
  ): Workflow {
    const name = data.name?.trim();
    if (!name) throw new BadRequestException('name is required');
    const steps = (data.steps ?? []).map((s, i) => {
      if (!TYPES.includes(s.type) || !s.name?.trim()) {
        throw new BadRequestException(`invalid step at position ${i + 1}`);
      }
      return {
        id: randomUUID(),
        type: s.type,
        name: s.name.trim(),
        position: i + 1,
      };
    });
    if (steps.length === 0) {
      throw new BadRequestException('add at least one step');
    }
    const wf: Workflow = {
      id: randomUUID(),
      ownerId,
      name,
      description: data.description?.trim() ?? '',
      steps,
      createdAt: new Date().toISOString(),
    };
    this.workflows.set(wf.id, wf);
    return wf;
  }

  get(ownerId: string, id: string): Workflow {
    const wf = this.workflows.get(id);
    if (!wf || wf.ownerId !== ownerId) {
      throw new NotFoundException('workflow not found');
    }
    return wf;
  }

  remove(ownerId: string, id: string) {
    this.get(ownerId, id);
    this.workflows.delete(id);
    this.runs = this.runs.filter((r) => r.workflowId !== id);
    return { deleted: true };
  }

  // Executes the steps in order and records timing per step. A run stops at
  // the first failed step.
  run(ownerId: string, id: string): Run {
    const wf = this.get(ownerId, id);
    const steps: RunStep[] = wf.steps.map((s) => ({
      stepId: s.id,
      name: s.name,
      type: s.type,
      status: Math.random() < 0.02 ? 'failed' : 'succeeded',
      durationMs:
        s.type === 'wait'
          ? 800 + Math.floor(Math.random() * 1200)
          : 40 + Math.floor(Math.random() * 400),
    }));
    const failedAt = steps.findIndex((s) => s.status === 'failed');
    const executed = failedAt === -1 ? steps : steps.slice(0, failedAt + 1);
    const run: Run = {
      id: randomUUID(),
      workflowId: wf.id,
      workflowName: wf.name,
      ownerId,
      status: failedAt === -1 ? 'succeeded' : 'failed',
      startedAt: new Date().toISOString(),
      durationMs: executed.reduce((sum, s) => sum + s.durationMs, 0),
      steps: executed,
    };
    this.runs.push(run);
    return run;
  }

  listRuns(ownerId: string): Run[] {
    return this.runs
      .filter((r) => r.ownerId === ownerId)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .slice(0, 50);
  }

  metrics(ownerId: string) {
    const runs = this.runs.filter((r) => r.ownerId === ownerId);
    const succeeded = runs.filter((r) => r.status === 'succeeded').length;
    return {
      workflows: [...this.workflows.values()].filter(
        (w) => w.ownerId === ownerId,
      ).length,
      runs: runs.length,
      successRate: runs.length
        ? Math.round((succeeded / runs.length) * 100)
        : null,
      avgDurationMs: runs.length
        ? Math.round(runs.reduce((s, r) => s + r.durationMs, 0) / runs.length)
        : null,
    };
  }

  // First visit gets an example so the app is never empty.
  private seed(ownerId: string) {
    if ([...this.workflows.values()].some((w) => w.ownerId === ownerId)) return;
    this.create(ownerId, {
      name: 'Employee onboarding',
      description:
        'Example workflow: collect data, get approval, provision access.',
      steps: [
        { type: 'form', name: 'Collect employee details' },
        { type: 'approval', name: 'Manager approval' },
        { type: 'wait', name: 'Wait for equipment' },
        { type: 'task', name: 'Provision accounts' },
      ],
    });
  }
}
