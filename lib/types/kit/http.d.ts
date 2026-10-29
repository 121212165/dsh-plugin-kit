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
export declare function githubJson<T = unknown>(url: string, options: GitHubRequestOptions): Promise<T>;
/** Raw body (bypasses base64 JSON) — for README heads and other text endpoints. */
export declare function githubText(url: string, options: GitHubRequestOptions): Promise<string>;
export declare function readTokenFromEnv(names: string[]): string | undefined;
//# sourceMappingURL=http.d.ts.map