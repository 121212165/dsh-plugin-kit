/** GitHub REST client shared by the family's scanning plugins: one fetch path
 *  for JSON and raw-text reads, per-plugin User-Agent, optional bearer token and
 *  an injectable fetch so tests never touch the network. */
async function request(url, options) {
    const headers = {
        'User-Agent': options.userAgent,
        Accept: options.accept ?? 'application/vnd.github+json',
    };
    if (options.token)
        headers.Authorization = `Bearer ${options.token}`;
    const init = { headers };
    if (options.signal !== undefined)
        init.signal = options.signal;
    const doFetch = options.fetchImpl ?? fetch;
    const response = await doFetch(url, init);
    if (!response.ok)
        throw new Error(`HTTP ${response.status} for ${url}`);
    return response;
}
export async function githubJson(url, options) {
    return (await request(url, options)).json();
}
/** Raw body (bypasses base64 JSON) — for README heads and other text endpoints. */
export async function githubText(url, options) {
    return (await request(url, options)).text();
}
export function readTokenFromEnv(names) {
    for (const name of names) {
        const value = process.env[name]?.trim();
        if (value)
            return value;
    }
    return undefined;
}
//# sourceMappingURL=http.js.map