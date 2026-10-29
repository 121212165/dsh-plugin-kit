/** Assembly-layer test harness shared by the family: a scripted mock dsh
 *  context the real `apply()` wires against, so mount-time registrations are
 *  exercised without a live host — and without any network.
 *
 *  Each plugin keeps its own typed captures and config defaults; this module
 *  owns the parts that were previously copied verbatim: the registration
 *  surfaces (commands/tools/prompt sections), the event hook table, `provide`
 *  and `reflect`, an apply-once guard, and a temp dir wiped after the file. */
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
export interface MockCtxParts<C extends {
    name: string;
}, T extends {
    name: string;
}, S extends {
    name: string;
}> {
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
export declare function createMockCtx<C extends {
    name: string;
}, T extends {
    name: string;
}, S extends {
    name: string;
}>(options?: MockCtxOptions): MockCtxParts<C, T, S>;
/** Fresh temp dir, removed after the current test file finishes. */
export declare function tempDir(prefix: string): string;
/** Mount exactly once per harness — a second apply() would double-register. */
export declare function applyOnce<T>(mount: () => Promise<T>): () => Promise<T>;
//# sourceMappingURL=test-harness.d.ts.map