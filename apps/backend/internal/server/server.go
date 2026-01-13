package server

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/hereisth/web-collector/apps/backend/internal/model"
)

// Config holds application configuration
type Config struct {
	ServerPort        string
	ServerHost        string
	GinMode           string
	Database          DatabaseConfig
	JWTSecret         string
	JWTExpiration     string
	CORSAllowedOrigins string
}

// DatabaseConfig holds database configuration
type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

// LoadConfig loads configuration from environment variables
func LoadConfig() *Config {
	return &Config{
		ServerPort:        getEnv("SERVER_PORT", "8080"),
		ServerHost:        getEnv("SERVER_HOST", "0.0.0.0"),
		GinMode:           getEnv("GIN_MODE", "debug"),
		JWTSecret:         getEnv("JWT_SECRET", "secret"),
		JWTExpiration:     getEnv("JWT_EXPIRATION", "24h"),
		CORSAllowedOrigins: getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000"),
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", "postgres"),
			DBName:   getEnv("DB_NAME", "web_collector"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// CORS middleware
func CORS(allowedOrigins string) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", allowedOrigins)
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// Logger middleware
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery

		// Process request
		c.Next()

		// Log request
		latency := time.Since(start)
		clientIP := c.ClientIP()
		method := c.Request.Method
		statusCode := c.Writer.Status()

		if raw != "" {
			path = path + "?" + raw
		}

		log.Printf("[%s] %s %s %d %v",
			clientIP,
			method,
			path,
			statusCode,
			latency,
		)
	}
}

// Recovery middleware
func Recovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("Panic recovered: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"error":   "Internal server error",
					"message": "Something went wrong",
				})
				c.Abort()
			}
		}()
		c.Next()
	}
}

// BookmarkStore is a simple in-memory store for bookmarks (for development)
type BookmarkStore struct {
	mu        sync.RWMutex
	bookmarks []model.Bookmark
	nextID    int
}

// NewBookmarkStore creates a new bookmark store with sample data
func NewBookmarkStore() *BookmarkStore {
	return &BookmarkStore{
		bookmarks: []model.Bookmark{
			{ID: "1", Title: "Google", URL: "https://google.com", CreatedAt: time.Now()},
			{ID: "2", Title: "GitHub", URL: "https://github.com", CreatedAt: time.Now()},
			{ID: "3", Title: "Go 官方文档", URL: "https://go.dev/doc/", CreatedAt: time.Now()},
		},
		nextID: 4,
	}
}

// GetAll returns all bookmarks
func (s *BookmarkStore) GetAll() []model.Bookmark {
	s.mu.RLock()
	defer s.mu.RUnlock()
	// Return a copy to avoid data races
	result := make([]model.Bookmark, len(s.bookmarks))
	copy(result, s.bookmarks)
	return result
}

// Create adds a new bookmark
func (s *BookmarkStore) Create(title, url string) model.Bookmark {
	s.mu.Lock()
	defer s.mu.Unlock()

	bookmark := model.Bookmark{
		ID:        fmt.Sprintf("%d", s.nextID),
		Title:     title,
		URL:       url,
		CreatedAt: time.Now(),
	}
	s.nextID++
	s.bookmarks = append(s.bookmarks, bookmark)
	return bookmark
}

// GetByID returns a bookmark by ID
func (s *BookmarkStore) GetByID(id string) (model.Bookmark, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, b := range s.bookmarks {
		if b.ID == id {
			return b, true
		}
	}
	return model.Bookmark{}, false
}

// Update updates an existing bookmark
func (s *BookmarkStore) Update(id, title, url string) (model.Bookmark, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i, b := range s.bookmarks {
		if b.ID == id {
			if title != "" {
				s.bookmarks[i].Title = title
			}
			if url != "" {
				s.bookmarks[i].URL = url
			}
			return s.bookmarks[i], true
		}
	}
	return model.Bookmark{}, false
}

// Delete removes a bookmark by ID
func (s *BookmarkStore) Delete(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i, b := range s.bookmarks {
		if b.ID == id {
			s.bookmarks = append(s.bookmarks[:i], s.bookmarks[i+1:]...)
			return true
		}
	}
	return false
}

// Global bookmark store (in production, this would be a database)
var store = NewBookmarkStore()

// SetupRouter configures and returns the Gin router
func SetupRouter(cfg *Config) *gin.Engine {
	// Setup Gin mode
	if cfg.GinMode == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// Middleware
	r.Use(CORS(cfg.CORSAllowedOrigins))
	r.Use(Logger())
	r.Use(Recovery())

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"service": "web-collector-backend",
		})
	})

	// API routes
	v1 := r.Group("/api/v1")
	{
		v1.GET("/ping", func(c *gin.Context) {
			c.JSON(200, gin.H{"message": "pong"})
		})

		// Bookmark routes
		v1.GET("/bookmarks", handleGetBookmarks)
		v1.POST("/bookmarks", handleCreateBookmark)
		v1.GET("/bookmarks/:id", handleGetBookmark)
		v1.PUT("/bookmarks/:id", handleUpdateBookmark)
		v1.DELETE("/bookmarks/:id", handleDeleteBookmark)
	}

	return r
}

// handleGetBookmarks returns all bookmarks
func handleGetBookmarks(c *gin.Context) {
	bookmarks := store.GetAll()
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    bookmarks,
	})
}

// handleGetBookmark returns a single bookmark by ID
func handleGetBookmark(c *gin.Context) {
	id := c.Param("id")
	bookmark, found := store.GetByID(id)
	if !found {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Bookmark not found",
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    bookmark,
	})
}

// handleCreateBookmark creates a new bookmark
func handleCreateBookmark(c *gin.Context) {
	var req model.CreateBookmarkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	bookmark := store.Create(req.Title, req.URL)
	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    bookmark,
	})
}

// handleUpdateBookmark updates an existing bookmark
func handleUpdateBookmark(c *gin.Context) {
	id := c.Param("id")

	var req model.UpdateBookmarkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	bookmark, found := store.Update(id, req.Title, req.URL)
	if !found {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Bookmark not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    bookmark,
	})
}

// handleDeleteBookmark deletes a bookmark
func handleDeleteBookmark(c *gin.Context) {
	id := c.Param("id")

	if !store.Delete(id) {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Bookmark not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Bookmark deleted",
	})
}
