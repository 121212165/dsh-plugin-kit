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
const missing = (what, name) => {
    throw new Error(`${what} ${name} was never registered`);
};
export function createMockCtx(options = {}) {
    const commands = [];
    const tools = [];
    const sections = [];
    const listeners = [];
    const provided = {};
    const logs = [];
    const reflect = options.reflect ?? new Map();
    const logger = () => ({
        info: (...args) => logs.push({ level: 'info', args }),
        warn: (...args) => logs.push({ level: 'warn', args }),
        error: (...args) => logs.push({ level: 'error', args }),
        debug: (...args) => logs.push({ level: 'debug', args }),
    });
    const ctx = {
        logger,
        on(event, callback) {
            listeners.push({ event, callback });
        },
        provide(name, value) {
            provided[name] = value;
            return () => {
                delete provided[name];
            };
        },
        reflect: {
            get: (name) => reflect.get(name),
        },
        commands: { register: (definition) => commands.push(definition) },
        tools: { register: (definition) => tools.push(definition) },
        // Hosts differ in which prompt API a plugin picks; both land in `sections`.
        systemPrompt: {
            section: (section) => sections.push(section),
            context: (section) => sections.push(section),
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
export function tempDir(prefix) {
    const dir = mkdtempSync(join(tmpdir(), prefix));
    after(() => rmSync(dir, { recursive: true, force: true }));
    return dir;
}
/** Mount exactly once per harness — a second apply() would double-register. */
export function applyOnce(mount) {
    let applied = null;
    return () => {
        applied ??= mount();
        return applied;
    };
}
//# sourceMappingURL=test-harness.js.map