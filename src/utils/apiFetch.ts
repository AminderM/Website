const API_BASE = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

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
