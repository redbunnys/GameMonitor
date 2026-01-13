package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"game-server-monitor/internal/database"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func setupTestDB(t *testing.T) {
	// Initialize test database
	err := database.Initialize()
	assert.NoError(t, err)
}

func TestAuthHandler_Login_Success(t *testing.T) {
	setupTestDB(t)

	gin.SetMode(gin.TestMode)

	authHandler := NewAuthHandler()

	// Create test request
	loginReq := map[string]string{
		"username": "admin",
		"password": "admin123",
	}

	jsonData, _ := json.Marshal(loginReq)
	req, _ := http.NewRequest("POST", "/login", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")

	// Create test context
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req

	// Call handler
	authHandler.Login(c)

	// Check response
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Contains(t, response, "token")
	assert.Contains(t, response, "expires_at")
}

func TestAuthHandler_Login_InvalidCredentials(t *testing.T) {
	setupTestDB(t)

	gin.SetMode(gin.TestMode)

	authHandler := NewAuthHandler()

	// Create test request with invalid credentials
	loginReq := map[string]string{
		"username": "admin",
		"password": "wrongpassword",
	}

	jsonData, _ := json.Marshal(loginReq)
	req, _ := http.NewRequest("POST", "/login", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")

	// Create test context
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req

	// Call handler
	authHandler.Login(c)

	// Check response
	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Authentication failed", response["error"])
}

func TestAuthHandler_Login_InvalidRequest(t *testing.T) {
	gin.SetMode(gin.TestMode)

	authHandler := NewAuthHandler()

	// Create test request with invalid JSON
	req, _ := http.NewRequest("POST", "/login", bytes.NewBuffer([]byte("invalid json")))
	req.Header.Set("Content-Type", "application/json")

	// Create test context
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req

	// Call handler
	authHandler.Login(c)

	// Check response
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Invalid request", response["error"])
}
