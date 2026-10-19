import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { writeFileAtomic } from "../src/index.ts";

const dir = mkdtempSync(join(tmpdir(), "dsh-kit-fs-"));
test.after(() => rmSync(dir, { recursive: true, force: true }));

test("writeFileAtomic creates parent dirs and lands the payload once", () => {
  const target = join(dir, "nested", "store.json");
  writeFileAtomic(target, '{"a":1}\n');
  assert.equal(readFileSync(target, "utf8"), '{"a":1}\n');
});

test("writeFileAtomic leaves no temp artifacts behind", () => {
  const target = join(dir, "no-trace.jsonl");
  writeFileAtomic(target, "line1\n");
  writeFileAtomic(target, "line1\nline2\n");
  assert.equal(readFileSync(target, "utf8"), "line1\nline2\n");
  assert.ok(!readdirSync(dir).some((name) => name.endsWith(".tmp")), `no temp artifacts: ${readdirSync(dir)}`);
});
