const API_BASE = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

/** Safely extracts a string message from a FastAPI error response body */
export function parseApiError(err: any): string {
  if (!err) return 'Something went wrong.';
  // FastAPI validation errors: detail is an array of {type, loc, msg, input}
  if (Array.isArray(err.detail)) {
    return err.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
  }
  if (typeof err.detail === 'string') return err.detail;
  if (typeof err.error === 'string') return err.error;
  if (typeof err.message === 'string') return err.message;
  return 'Failed to save. Please try again.';
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const contentType = res.headers.get('content-type') || '';
    const errorText = contentType.includes('application/json')
      ? (await res.json()).detail || (await res.clone().json()).error || `${res.status}`
      : await res.text();
    throw new Error(errorText || `Request failed: ${res.status}`);
  }
  return res.json();
}
