import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { test } from 'node:test';

import { applyOnce, createMockCtx, tempDir } from '../src/kit/test-harness.ts';

interface Cmd { name: string; handler: () => string }
interface Tool { name: string }
interface Section { name: string; text: () => string }

test('mock ctx captures commands, tools and prompt sections', () => {
  const parts = createMockCtx<Cmd, Tool, Section>();
  const ctx = parts.ctx as {
    commands: { register: (d: Cmd) => void };
    tools: { register: (d: Tool) => void };
    systemPrompt: { section: (s: Section) => void; context: (s: Section) => void };
  };
  ctx.commands.register({ name: 'ping', handler: () => 'pong' });
  ctx.tools.register({ name: 'tool_one' });
  ctx.systemPrompt.section({ name: 's1', text: () => 'a' });
  ctx.systemPrompt.context({ name: 's2', text: () => 'b' });

  assert.equal(parts.command('ping').handler(), 'pong');
  assert.equal(parts.tool('tool_one').name, 'tool_one');
  assert.equal(parts.section('s2').text(), 'b');
  assert.throws(() => parts.command('nope'), /command nope was never registered/);
});

test('provide, reflect and logger calls are observable', () => {
  const reflect = new Map<string, unknown>([['pricing-catalog', { ok: true }]]);
  const parts = createMockCtx<Cmd, Tool, Section>({ reflect });
  const ctx = parts.ctx as {
    provide: (name: string, value: unknown) => () => void;
    reflect: { get: (name: string) => unknown };
    logger: (name: string) => { warn: (...args: unknown[]) => void };
  };
  const dispose = ctx.provide('quota', 42);
  assert.equal(parts.provided.quota, 42);
  dispose();
  assert.equal(parts.provided.quota, undefined);
  assert.deepEqual(ctx.reflect.get('pricing-catalog'), { ok: true });
  ctx.logger('x').warn('careful');
  assert.deepEqual(parts.logs, [{ level: 'warn', args: ['careful'] }]);
});

test('listeners are captured by event name', () => {
  const parts = createMockCtx<Cmd, Tool, Section>();
  const ctx = parts.ctx as { on: (event: string, cb: (...args: never[]) => unknown) => void };
  ctx.on('session/event', () => 'seen');
  assert.equal((parts.listener('session/event').callback as () => unknown)(), 'seen');
  assert.throws(() => parts.listener('missing'), /listener missing was never registered/);
});

test('tempDir is created and applyOnce mounts only once', async () => {
  const dir = tempDir('dsh-kit-harness-');
  assert.ok(existsSync(dir));
  let mounts = 0;
  const mount = applyOnce(async () => {
    mounts++;
    return mounts;
  });
  assert.equal(await mount(), 1);
  assert.equal(await mount(), 1);
  assert.equal(mounts, 1);
});
