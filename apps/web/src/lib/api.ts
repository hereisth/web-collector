const BASE_URL = '/api/v1'

interface ApiOptions {
  headers?: Record<string, string>
  signal?: AbortSignal
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: `HTTP ${response.status}: ${response.statusText}`,
    }))
    console.error('API Error:', error)
    throw new Error(error.message || 'Request failed')
  }
  return response.json() as Promise<T>
}

export const api = {
  get: async <T>(url: string, options?: ApiOptions): Promise<T> => {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      signal: options?.signal,
    })
    return handleResponse<T>(response)
  },
}
