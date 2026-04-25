/**
 * Development store compatibility module.
 *
 * Cloudflare D1 is the source of truth in deployed environments.
 * This file is intentionally minimal and retained for structure parity
 * with deployment documentation and local fallback experiments.
 */

export type DevStoreState = Record<string, unknown>;

let state: DevStoreState = {};

export function getDevStore(): DevStoreState {
  return state;
}

export function setDevStore(next: DevStoreState): void {
  state = { ...next };
}

export function resetDevStore(): void {
  state = {};
}
