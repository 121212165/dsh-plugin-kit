/** GitHub REST client shared by the family's scanning plugins: one fetch path
 *  for JSON and raw-text reads, per-plugin User-Agent, optional bearer token and
 *  an injectable fetch so tests never touch the network. */

export interface FetchOptions {
  token?: string | undefined;
  signal?: AbortSignal | undefined;
  fetchImpl?: typeof fetch | undefined;
}

export interface GitHubRequestOptions extends FetchOptions {
  userAgent: string;
  accept?: string | undefined;
}

async function request(url: string, options: GitHubRequestOptions): Promise<Response> {
  const headers: Record<string, string> = {
    'User-Agent': options.userAgent,
    Accept: options.accept ?? 'application/vnd.github+json',
  };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  const init: RequestInit = { headers };
  if (options.signal !== undefined) init.signal = options.signal;
  const doFetch = options.fetchImpl ?? fetch;
  const response = await doFetch(url, init);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response;
}

export async function githubJson<T = unknown>(url: string, options: GitHubRequestOptions): Promise<T> {
  return (await request(url, options)).json() as Promise<T>;
}

/** Raw body (bypasses base64 JSON) — for README heads and other text endpoints. */
export async function githubText(url: string, options: GitHubRequestOptions): Promise<string> {
  return (await request(url, options)).text();
}

export function readTokenFromEnv(names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}
