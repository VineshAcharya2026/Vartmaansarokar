import { ApiErrorResponse, ApiResponse, ApiSuccessResponse } from '../types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSuccessResponse<T>(value: unknown): value is ApiSuccessResponse<T> {
  return isRecord(value) && value.success === true && 'data' in value;
}

function isErrorResponse(value: unknown): value is ApiErrorResponse {
  return isRecord(value) && value.success === false && typeof value.message === 'string';
}

export function getApiErrorMessage(value: unknown, fallback = 'Request failed') {
  if (isErrorResponse(value)) {
    return value.message;
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
  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | T | null;

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload, response.statusText || 'Request failed'));
  }

  if (isSuccessResponse<T>(payload)) {
    return payload.data;
  }

  if (isErrorResponse(payload)) {
    throw new Error(payload.message);
  }

  if (payload === null) {
    throw new Error('The server returned an empty response.');
  }

  return payload;
}

export async function fetchApi<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);

  if (response.status === 401 && typeof window !== 'undefined') {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('vartmaan-current-user');
    window.location.href = '/#/staff-login';
    throw new Error('Unauthorized. Redirecting to login.');
  }

  return parseApiResponse<T>(response);
}
