import type {
  Bookmark,
  CreateBookmarkRequest,
  UpdateBookmarkRequest,
} from '@/types/bookmark'

const BASE_URL = '/api/v1'

interface ApiOptions {
  headers?: Record<string, string>
  signal?: AbortSignal
}

// Generic API response wrapper
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

async function handleResponse<T>(response: Response): Promise<T> {
  const json = await response.json()

  if (!response.ok) {
    console.error('API Error:', json)
    throw new Error(json.error || json.message || `HTTP ${response.status}`)
  }

  // Return the data field if it exists, otherwise return the whole response
  return json.data !== undefined ? json.data : json
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

  post: async <T>(
    url: string,
    body: unknown,
    options?: ApiOptions
  ): Promise<T> => {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify(body),
      signal: options?.signal,
    })
    return handleResponse<T>(response)
  },

  put: async <T>(
    url: string,
    body: unknown,
    options?: ApiOptions
  ): Promise<T> => {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify(body),
      signal: options?.signal,
    })
    return handleResponse<T>(response)
  },

  delete: async <T>(url: string, options?: ApiOptions): Promise<T> => {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      signal: options?.signal,
    })
    return handleResponse<T>(response)
  },
}

// Bookmark API functions
export const bookmarkApi = {
  // Get all bookmarks
  getAll: () => api.get<Bookmark[]>('/bookmarks'),

  // Get a single bookmark
  getById: (id: string) => api.get<Bookmark>(`/bookmarks/${id}`),

  // Create a new bookmark
  create: (data: CreateBookmarkRequest) =>
    api.post<Bookmark>('/bookmarks', data),

  // Update an existing bookmark
  update: (id: string, data: UpdateBookmarkRequest) =>
    api.put<Bookmark>(`/bookmarks/${id}`, data),

  // Delete a bookmark
  delete: (id: string) => api.delete<void>(`/bookmarks/${id}`),
}
