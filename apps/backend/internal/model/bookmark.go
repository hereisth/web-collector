package model

import "time"

// Bookmark represents a saved bookmark
type Bookmark struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	URL       string    `json:"url"`
	CreatedAt time.Time `json:"created_at"`
}

// CreateBookmarkRequest represents the request body for creating a bookmark
type CreateBookmarkRequest struct {
	Title string `json:"title" binding:"required"`
	URL   string `json:"url" binding:"required"`
}

// UpdateBookmarkRequest represents the request body for updating a bookmark
type UpdateBookmarkRequest struct {
	Title string `json:"title"`
	URL   string `json:"url"`
}
