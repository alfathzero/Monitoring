interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  [key: string]: unknown;
}

export async function apiFetch<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const res = await fetch(url, options);
  const json: ApiResponse<T> = await res.json();
  return json;
}

export async function apiGet<T = unknown>(url: string): Promise<ApiResponse<T>> {
  return apiFetch<T>(url);
}

export async function apiPost<T = unknown>(
  url: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  const init: RequestInit = { method: "POST" };
  if (body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(body);
  }
  return apiFetch<T>(url, init);
}
