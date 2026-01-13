package main

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"strings"

	"game-server-monitor/internal/auth"
	"game-server-monitor/internal/database"
	"game-server-monitor/internal/handlers"

	"github.com/gin-gonic/gin"
)

//go:embed frontend/dist/*
var frontendFS embed.FS

func main() {
	// Initialize database
	if err := database.Initialize(); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}

	// Initialize Gin router
	r := gin.Default()

	// Setup routes
	setupRoutes(r)

	// Start server
	log.Println("🚀 Starting game server monitor on :8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}

func setupRoutes(r *gin.Engine) {
	// Initialize handlers
	authHandler := handlers.NewAuthHandler()
	adminHandler := handlers.NewAdminHandler()

	// Initialize JWT service
	jwtService := auth.NewJWTService()

	// API routes
	api := r.Group("/api")
	{
		// Public endpoints
		api.GET("/servers", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"message": "Server list endpoint - will be implemented in task 6",
				"servers": []interface{}{},
			})
		})

		// Auth endpoints
		auth := api.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)

			// Protected auth endpoints (require valid JWT)
			authProtected := auth.Group("")
			authProtected.Use(jwtService.RequireAuth())
			{
				authProtected.GET("/profile", authHandler.GetProfile)
				authProtected.POST("/change-password", authHandler.ChangePassword)
				authProtected.POST("/validate", authHandler.ValidateToken)
			}
		}

		// Admin endpoints (require JWT authentication)
		admin := api.Group("/admin")
		admin.Use(jwtService.RequireAuth())
		{
			// Server management (will be implemented in task 6)
			admin.POST("/servers", func(c *gin.Context) {
				c.JSON(200, gin.H{"message": "Add server endpoint - will be implemented in task 6"})
			})
			admin.PUT("/servers/:id", func(c *gin.Context) {
				c.JSON(200, gin.H{"message": "Update server endpoint - will be implemented in task 6"})
			})
			admin.DELETE("/servers/:id", func(c *gin.Context) {
				c.JSON(200, gin.H{"message": "Delete server endpoint - will be implemented in task 6"})
			})

			// User management
			admin.POST("/users", adminHandler.CreateUser)
			admin.GET("/users", adminHandler.GetUsers)
			admin.DELETE("/users/:id", adminHandler.DeleteUser)
			admin.POST("/users/:id/reset-password", adminHandler.ResetUserPassword)
		}
	}

	// Static file serving for embedded frontend
	setupStaticRoutes(r)
}

func setupStaticRoutes(r *gin.Engine) {
	// Get the embedded filesystem
	staticFS, err := fs.Sub(frontendFS, "frontend/dist")
	if err != nil {
		log.Printf("Warning: Could not setup embedded frontend: %v", err)
		// Fallback for development
		r.GET("/", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"message": "Game Server Monitor API",
				"status":  "Frontend not embedded - use npm run dev in frontend/ for development",
			})
		})
		return
	}

	// Serve static assets
	r.StaticFS("/assets", http.FS(staticFS))

	// SPA fallback - serve index.html for all non-API routes
	r.NoRoute(func(c *gin.Context) {
		path := c.Request.URL.Path

		// Don't handle API routes
		if strings.HasPrefix(path, "/api") {
			c.JSON(404, gin.H{"error": "API endpoint not found"})
			return
		}

		// Try to serve the requested file
		if file, err := staticFS.Open(strings.TrimPrefix(path, "/")); err == nil {
			file.Close()
			c.FileFromFS(path, http.FS(staticFS))
			return
		}

		// Fallback to index.html for SPA routing
		indexHTML, err := fs.ReadFile(staticFS, "index.html")
		if err != nil {
			c.JSON(500, gin.H{"error": "Could not serve frontend"})
			return
		}

		c.Data(200, "text/html; charset=utf-8", indexHTML)
	})
}
