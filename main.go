package main

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"game-server-monitor/internal/auth"
	"game-server-monitor/internal/database"
	"game-server-monitor/internal/handlers"
	"game-server-monitor/internal/middleware"
	"game-server-monitor/internal/prober"

	"github.com/gin-gonic/gin"
)

/*
 * Copyright (c) 2026 游戏服务器监控面板開發團隊
 * * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 */

//go:embed frontend/dist/*
var frontendFS embed.FS

func main() {
	// Initialize database
	if err := database.Initialize(); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}

	// Initialize database service
	dbService := database.NewDatabaseService()

	// Initialize prober service
	proberService := prober.NewProberService(dbService)
	if err := proberService.Start(); err != nil {
		log.Fatal("Failed to start prober service:", err)
	}
	defer proberService.Stop()

	// Initialize Gin router
	r := gin.Default()

	// Setup routes
	setupRoutes(r, proberService)

	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Start server
	addr := ":" + port
	log.Printf("🚀 Starting game server monitor on %s", addr)
	log.Fatal(http.ListenAndServe(addr, r))
}

func setupRoutes(r *gin.Engine, proberService *prober.ProberService) {
	// Initialize handlers
	authHandler := handlers.NewAuthHandler()
	adminHandler := handlers.NewAdminHandler()
	serverHandler := handlers.NewServerHandler(proberService)

	// Initialize JWT service
	jwtService := auth.NewJWTService()

	// API routes
	api := r.Group("/api")
	{
		// 应用速率限制：每个IP每10秒最多20个请求
		api.Use(middleware.RateLimitMiddleware(20, 10*time.Second))

		// Public endpoints - Server status endpoints
		api.GET("/servers", serverHandler.GetServers)
		api.GET("/servers/:id", serverHandler.GetServerByID)

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
			// Server management
			admin.GET("/servers", serverHandler.GetAdminServers)
			admin.POST("/servers", serverHandler.CreateServer)
			admin.PUT("/servers/:id", serverHandler.UpdateServer)
			admin.DELETE("/servers/:id", serverHandler.DeleteServer)

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

	// Serve static assets (CSS, JS, images, etc.)
	r.StaticFS("/assets", http.FS(staticFS))

	// Also serve common static file paths
	r.StaticFS("/static", http.FS(staticFS))

	// SPA fallback - serve index.html for all non-API routes
	r.NoRoute(func(c *gin.Context) {
		path := c.Request.URL.Path

		// Don't handle API routes
		if strings.HasPrefix(path, "/api") {
			c.JSON(404, gin.H{"error": "API endpoint not found"})
			return
		}

		// Handle common static file extensions directly
		if strings.HasSuffix(path, ".js") || strings.HasSuffix(path, ".css") ||
			strings.HasSuffix(path, ".png") || strings.HasSuffix(path, ".jpg") ||
			strings.HasSuffix(path, ".jpeg") || strings.HasSuffix(path, ".gif") ||
			strings.HasSuffix(path, ".svg") || strings.HasSuffix(path, ".ico") ||
			strings.HasSuffix(path, ".woff") || strings.HasSuffix(path, ".woff2") ||
			strings.HasSuffix(path, ".ttf") || strings.HasSuffix(path, ".eot") {

			// Try to serve the requested file
			filePath := strings.TrimPrefix(path, "/")
			if file, err := staticFS.Open(filePath); err == nil {
				file.Close()
				c.FileFromFS(path, http.FS(staticFS))
				return
			}

			// If static file not found, return 404
			c.JSON(404, gin.H{"error": "Static file not found"})
			return
		}

		// For all other routes (SPA routes), serve index.html
		indexHTML, err := fs.ReadFile(staticFS, "index.html")
		if err != nil {
			c.JSON(500, gin.H{"error": "Could not serve frontend"})
			return
		}

		c.Data(200, "text/html; charset=utf-8", indexHTML)
	})
}
