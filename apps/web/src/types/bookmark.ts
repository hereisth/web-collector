// Bookmark represents a saved bookmark
export interface Bookmark {
  id: string;
  title: string;
  url: string;
  created_at: string;
}

// Request body for creating a bookmark
export interface CreateBookmarkRequest {
  title: string;
  url: string;
}

// Request body for updating a bookmark
export interface UpdateBookmarkRequest {
  title?: string;
  url?: string;
}
