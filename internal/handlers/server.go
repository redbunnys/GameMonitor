package handlers

import (
	"net/http"
	"strconv"

	"game-server-monitor/internal/auth"
	"game-server-monitor/internal/database"
	"game-server-monitor/internal/models"
	"game-server-monitor/internal/prober"

	"github.com/gin-gonic/gin"
)

// ServerHandler handles server-related requests
type ServerHandler struct {
	dbService     *database.DatabaseService
	proberService *prober.ProberService
}

// NewServerHandler creates a new ServerHandler instance
func NewServerHandler(proberService *prober.ProberService) *ServerHandler {
	return &ServerHandler{
		dbService:     database.NewDatabaseService(),
		proberService: proberService,
	}
}

// GetServers returns all servers with their current status
// GET /api/servers
func (h *ServerHandler) GetServers(c *gin.Context) {
	// Get all servers with their cached status from prober service
	serverListResponse, err := h.proberService.GetAllServersWithStatus()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to retrieve servers",
			"message": err.Error(),
		})
		return
	}

	// Return just the servers array, not the wrapper
	c.JSON(http.StatusOK, gin.H{
		"data": serverListResponse.Servers,
	})
}

// GetServerByID returns a specific server with its current status
// GET /api/servers/:id
func (h *ServerHandler) GetServerByID(c *gin.Context) {
	// Parse server ID from URL parameter
	serverIDStr := c.Param("id")
	serverID, err := strconv.ParseUint(serverIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid server ID",
			"message": "Server ID must be a valid number",
		})
		return
	}

	// Get server with status from prober service
	serverWithStatus, err := h.proberService.GetServerWithStatus(uint(serverID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Server not found",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": serverWithStatus,
	})
}

// Management endpoints (require authentication)

// GetAdminServers returns all servers for admin management (without status)
// GET /api/admin/servers
func (h *ServerHandler) GetAdminServers(c *gin.Context) {
	// Verify admin is authenticated
	_, _, err := auth.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Unauthorized",
			"message": err.Error(),
		})
		return
	}

	// Get all servers from database (without status for admin management)
	servers, err := h.dbService.GetAllServers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to retrieve servers",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": servers,
	})
}

// CreateServer creates a new server configuration
// POST /api/admin/servers
func (h *ServerHandler) CreateServer(c *gin.Context) {
	// Verify admin is authenticated
	_, _, err := auth.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Unauthorized",
			"message": err.Error(),
		})
		return
	}

	var req models.CreateServerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request",
			"message": err.Error(),
		})
		return
	}

	// Create server using database service (includes validation)
	server, err := h.dbService.CreateServer(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Server creation failed",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data":    server,
		"message": "Server created successfully",
	})
}

// UpdateServer updates an existing server configuration
// PUT /api/admin/servers/:id
func (h *ServerHandler) UpdateServer(c *gin.Context) {
	// Verify admin is authenticated
	_, _, err := auth.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Unauthorized",
			"message": err.Error(),
		})
		return
	}

	// Parse server ID from URL parameter
	serverIDStr := c.Param("id")
	serverID, err := strconv.ParseUint(serverIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid server ID",
			"message": "Server ID must be a valid number",
		})
		return
	}

	var req models.UpdateServerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request",
			"message": err.Error(),
		})
		return
	}

	// Update server using database service (includes validation)
	server, err := h.dbService.UpdateServer(uint(serverID), &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Server update failed",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    server,
		"message": "Server updated successfully",
	})
}

// DeleteServer deletes a server configuration
// DELETE /api/admin/servers/:id
func (h *ServerHandler) DeleteServer(c *gin.Context) {
	// Verify admin is authenticated
	_, _, err := auth.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Unauthorized",
			"message": err.Error(),
		})
		return
	}

	// Parse server ID from URL parameter
	serverIDStr := c.Param("id")
	serverID, err := strconv.ParseUint(serverIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid server ID",
			"message": "Server ID must be a valid number",
		})
		return
	}

	// Delete server using database service
	err = h.dbService.DeleteServer(uint(serverID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Server deletion failed",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Server deleted successfully",
	})
}
