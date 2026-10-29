import assert from 'node:assert/strict';
import { test } from 'node:test';

import { githubJson, githubText, readTokenFromEnv } from '../src/index.ts';

interface Call {
  url: string;
  init: RequestInit;
}

function stubFetch(response: { ok: boolean; status: number; body?: unknown; text?: string }) {
  const calls: Call[] = [];
  const impl = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return {
      ok: response.ok,
      status: response.status,
      json: async () => response.body,
      text: async () => response.text ?? '',
    };
  }) as unknown as typeof fetch;
  return { calls, impl };
}

test('githubJson sends UA, JSON accept and bearer token', async () => {
  const { calls, impl } = stubFetch({ ok: true, status: 200, body: { total_count: 3 } });
  const payload = await githubJson<{ total_count: number }>('https://api.github.com/x', {
    userAgent: 'dsh-plugin-test',
    token: 't0k',
    fetchImpl: impl,
  });
  assert.equal(payload.total_count, 3);
  const headers = calls[0]!.init.headers as Record<string, string>;
  assert.equal(headers['User-Agent'], 'dsh-plugin-test');
  assert.equal(headers.Accept, 'application/vnd.github+json');
  assert.equal(headers.Authorization, 'Bearer t0k');
});

test('githubText can override accept and omits auth without a token', async () => {
  const { calls, impl } = stubFetch({ ok: true, status: 200, text: '# readme' });
  const body = await githubText('https://api.github.com/repos/a/b/readme', {
    userAgent: 'dsh-plugin-test',
    accept: 'application/vnd.github.raw+json',
    fetchImpl: impl,
  });
  assert.equal(body, '# readme');
  const headers = calls[0]!.init.headers as Record<string, string>;
  assert.equal(headers.Accept, 'application/vnd.github.raw+json');
  assert.equal(headers.Authorization, undefined);
});

test('non-2xx throws with status and url', async () => {
  const { impl } = stubFetch({ ok: false, status: 403 });
  await assert.rejects(
    githubJson('https://api.github.com/limited', { userAgent: 'dsh-plugin-test', fetchImpl: impl }),
    /HTTP 403 for https:\/\/api\.github\.com\/limited/,
  );
});

test('readTokenFromEnv takes the first non-empty trimmed value', () => {
  const previous = process.env.DSH_KIT_TEST_TOKEN;
  process.env.DSH_KIT_TEST_TOKEN = '  abc  ';
  try {
    assert.equal(readTokenFromEnv(['DSH_KIT_MISSING', 'DSH_KIT_TEST_TOKEN']), 'abc');
    delete process.env.DSH_KIT_TEST_TOKEN;
    assert.equal(readTokenFromEnv(['DSH_KIT_TEST_TOKEN']), undefined);
  } finally {
    if (previous === undefined) delete process.env.DSH_KIT_TEST_TOKEN;
    else process.env.DSH_KIT_TEST_TOKEN = previous;
  }
});
