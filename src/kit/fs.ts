/** Atomic full-file writes: write to a temp file in the same directory, then
 * rename over the target so readers never observe a half-written JSON/JSONL/HTML
 * file after a crash or power loss. Same-directory rename keeps the operation
 * on-disk atomic on Windows and POSIX alike. The family canonicalizes on this
 * helper (see OPTIMIZATION-PLAN-2026-10-19 §N-6). */

import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export function writeFileAtomic(path: string, data: string): void {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = join(dirname(path), `.${path.split(/[\\/]/).pop()}-${process.pid}-${Date.now()}.tmp`);
  writeFileSync(tmp, data, "utf8");
  renameSync(tmp, path);
}
