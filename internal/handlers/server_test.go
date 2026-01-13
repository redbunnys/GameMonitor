package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"game-server-monitor/internal/database"
	"game-server-monitor/internal/models"
	"game-server-monitor/internal/prober"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestServerHandler_GetServers(t *testing.T) {
	// Initialize test database
	if err := database.Initialize(); err != nil {
		t.Fatal("Failed to initialize test database:", err)
	}

	// Create test services
	dbService := database.NewDatabaseService()
	proberService := prober.NewProberService(dbService)
	handler := NewServerHandler(proberService)

	// Setup Gin router
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/api/servers", handler.GetServers)

	// Test empty server list
	req, _ := http.NewRequest("GET", "/api/servers", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response models.ServerListResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, 0, response.Total)
	assert.Empty(t, response.Servers)
}

func TestServerHandler_GetServerByID_InvalidID(t *testing.T) {
	// Initialize test database
	if err := database.Initialize(); err != nil {
		t.Fatal("Failed to initialize test database:", err)
	}

	// Create test services
	dbService := database.NewDatabaseService()
	proberService := prober.NewProberService(dbService)
	handler := NewServerHandler(proberService)

	// Setup Gin router
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/api/servers/:id", handler.GetServerByID)

	// Test invalid server ID
	req, _ := http.NewRequest("GET", "/api/servers/invalid", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Invalid server ID", response["error"])
}

func TestServerHandler_GetServerByID_NotFound(t *testing.T) {
	// Initialize test database
	if err := database.Initialize(); err != nil {
		t.Fatal("Failed to initialize test database:", err)
	}

	// Create test services
	dbService := database.NewDatabaseService()
	proberService := prober.NewProberService(dbService)
	handler := NewServerHandler(proberService)

	// Setup Gin router
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/api/servers/:id", handler.GetServerByID)

	// Test non-existent server ID
	req, _ := http.NewRequest("GET", "/api/servers/999", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Server not found", response["error"])
}

func TestServerHandler_CreateServer_Unauthorized(t *testing.T) {
	// Initialize test database
	if err := database.Initialize(); err != nil {
		t.Fatal("Failed to initialize test database:", err)
	}

	// Create test services
	dbService := database.NewDatabaseService()
	proberService := prober.NewProberService(dbService)
	handler := NewServerHandler(proberService)

	// Setup Gin router
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/api/admin/servers", handler.CreateServer)

	// Test request without authentication
	validJSON := `{"name": "Test Server", "type": "minecraft", "address": "localhost", "port": 25565}`
	req, _ := http.NewRequest("POST", "/api/admin/servers", bytes.NewBufferString(validJSON))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return 401 Unauthorized since no JWT token is provided
	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Unauthorized", response["error"])
}
