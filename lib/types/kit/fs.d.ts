/** Atomic full-file writes: write to a temp file in the same directory, then
 * rename over the target so readers never observe a half-written JSON/JSONL/HTML
 * file after a crash or power loss. Same-directory rename keeps the operation
 * on-disk atomic on Windows and POSIX alike. The family canonicalizes on this
 * helper (see OPTIMIZATION-PLAN-2026-10-19 §N-6). */
export declare function writeFileAtomic(path: string, data: string): void;
//# sourceMappingURL=fs.d.ts.map