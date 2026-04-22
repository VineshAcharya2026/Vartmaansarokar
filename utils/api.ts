function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSuccessResponse<T>(value: unknown): value is { success: true; data: T } {
  return isRecord(value) && value.success === true && 'data' in value;
}

function isErrorResponse(value: unknown): value is { success: false; message?: string; error?: string } {
  if (!isRecord(value) || value.success !== false) return false;
  if (typeof value.message === 'string') return true;
  if (typeof value.error === 'string') return true;
  return false;
}

export function getApiErrorMessage(value: unknown, fallback = 'Request failed') {
  if (isErrorResponse(value)) {
    if (typeof value.message === 'string') return value.message;
    if (typeof value.error === 'string') return value.error;
  }

  if (isRecord(value)) {
    if (typeof value.message === 'string') {
      return value.message;
    }

    if (typeof value.error === 'string') {
      return value.error;
    }
  }

  return fallback;
}

export async function parseApiResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | { success: true; data: T; error: null }
    | { success: false; data: null; error: string }
    | T
    | null;

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload, response.statusText || 'Request failed'));
  }

  if (isSuccessResponse<T>(payload)) {
    return payload.data;
  }

  if (isErrorResponse(payload)) {
    if (typeof payload.message === 'string') throw new Error(payload.message);
    if (typeof payload.error === 'string') throw new Error(payload.error);
  }

  if (payload === null) {
    throw new Error('The server returned an empty response.');
  }

  return payload;
}

/** Do not clear session for these URLs — 401 is expected for wrong password (same as lib/api.ts). */
function isAuthCredentialRequestUrl(input: RequestInfo | URL): boolean {
  const s =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input instanceof Request
          ? input.url
          : '';
  return /\/api\/auth\/(?:login|staff\/login|google|register|users\/login)(?:$|[?#])/i.test(s);
}

export async function fetchApi<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);

  if (response.status === 401 && typeof window !== 'undefined' && !isAuthCredentialRequestUrl(input)) {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('vartmaan-current-user');
    window.location.href = '/#/staff-login';
    throw new Error('Unauthorized. Redirecting to login.');
  }

  return parseApiResponse<T>(response);
}
