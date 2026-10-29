/** Assembly-layer test harness shared by the family: a scripted mock dsh
 *  context the real `apply()` wires against, so mount-time registrations are
 *  exercised without a live host — and without any network.
 *
 *  Each plugin keeps its own typed captures and config defaults; this module
 *  owns the parts that were previously copied verbatim: the registration
 *  surfaces (commands/tools/prompt sections), the event hook table, `provide`
 *  and `reflect`, an apply-once guard, and a temp dir wiped after the file. */

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after } from 'node:test';

export interface Listener {
  event: string;
  callback: (...args: never[]) => unknown;
}

export interface LoggerCall {
  level: 'info' | 'warn' | 'error' | 'debug';
  args: unknown[];
}

export interface MockCtxOptions {
  /** Services readable through `ctx.reflect.get(name)` (cross-plugin sheets). */
  reflect?: Map<string, unknown>;
  /** `ctx.agents` value; plugins decide between get/list and currentInitiator. */
  agents?: unknown;
}

export interface MockCtxParts<C extends { name: string }, T extends { name: string }, S extends { name: string }> {
  ctx: Record<string, unknown>;
  commands: C[];
  tools: T[];
  sections: S[];
  listeners: Listener[];
  provided: Record<string, unknown>;
  logs: LoggerCall[];
  command(name: string): C;
  tool(name: string): T;
  section(name: string): S;
  listener(event: string): Listener;
}

const missing = (what: string, name: string): never => {
  throw new Error(`${what} ${name} was never registered`);
};

export function createMockCtx<C extends { name: string }, T extends { name: string }, S extends { name: string }>(
  options: MockCtxOptions = {},
): MockCtxParts<C, T, S> {
  const commands: C[] = [];
  const tools: T[] = [];
  const sections: S[] = [];
  const listeners: Listener[] = [];
  const provided: Record<string, unknown> = {};
  const logs: LoggerCall[] = [];
  const reflect = options.reflect ?? new Map<string, unknown>();

  const logger = () => ({
    info: (...args: unknown[]) => logs.push({ level: 'info', args }),
    warn: (...args: unknown[]) => logs.push({ level: 'warn', args }),
    error: (...args: unknown[]) => logs.push({ level: 'error', args }),
    debug: (...args: unknown[]) => logs.push({ level: 'debug', args }),
  });

  const ctx: Record<string, unknown> = {
    logger,
    on(event: string, callback: Listener['callback']) {
      listeners.push({ event, callback });
    },
    provide(name: string, value?: unknown) {
      provided[name] = value;
      return () => {
        delete provided[name];
      };
    },
    reflect: {
      get: (name: string) => reflect.get(name),
    },
    commands: { register: (definition: C) => commands.push(definition) },
    tools: { register: (definition: T) => tools.push(definition) },
    // Hosts differ in which prompt API a plugin picks; both land in `sections`.
    systemPrompt: {
      section: (section: S) => sections.push(section),
      context: (section: S) => sections.push(section),
    },
    agents: options.agents ?? { get: () => undefined, list: () => [] },
  };

  return {
    ctx,
    commands,
    tools,
    sections,
    listeners,
    provided,
    logs,
    command: (name) => commands.find((candidate) => candidate.name === name) ?? missing('command', name),
    tool: (name) => tools.find((candidate) => candidate.name === name) ?? missing('tool', name),
    section: (name) => sections.find((candidate) => candidate.name === name) ?? missing('section', name),
    listener: (event) => listeners.find((candidate) => candidate.event === event) ?? missing('listener', event),
  };
}

/** Fresh temp dir, removed after the current test file finishes. */
export function tempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/** Mount exactly once per harness — a second apply() would double-register. */
export function applyOnce<T>(mount: () => Promise<T>): () => Promise<T> {
  let applied: Promise<T> | null = null;
  return () => {
    applied ??= mount();
    return applied;
  };
}
