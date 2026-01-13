package auth

import (
	"game-server-monitor/internal/models"
	"net/http"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestJWTService_GenerateToken(t *testing.T) {
	jwtService := NewJWTService()

	user := &models.User{
		ID:       1,
		Username: "testuser",
	}

	token, expiresAt, err := jwtService.GenerateToken(user)

	assert.NoError(t, err)
	assert.NotEmpty(t, token)
	assert.True(t, expiresAt.After(time.Now()))
}

func TestJWTService_ValidateToken(t *testing.T) {
	jwtService := NewJWTService()

	user := &models.User{
		ID:       1,
		Username: "testuser",
	}

	// Generate a token
	token, _, err := jwtService.GenerateToken(user)
	assert.NoError(t, err)

	// Validate the token
	claims, err := jwtService.ValidateToken(token)
	assert.NoError(t, err)
	assert.Equal(t, user.ID, claims.UserID)
	assert.Equal(t, user.Username, claims.Username)
}

func TestJWTService_ValidateToken_Invalid(t *testing.T) {
	jwtService := NewJWTService()

	// Test with invalid token
	_, err := jwtService.ValidateToken("invalid-token")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "failed to parse token")
}

func TestJWTService_ExtractTokenFromHeader(t *testing.T) {
	jwtService := NewJWTService()

	// Create a test Gin context
	gin.SetMode(gin.TestMode)
	c, _ := gin.CreateTestContext(nil)

	// Test with valid Authorization header
	c.Request = &http.Request{}
	c.Request.Header = make(map[string][]string)
	c.Request.Header.Set("Authorization", "Bearer test-token")

	token, err := jwtService.ExtractTokenFromHeader(c)
	assert.NoError(t, err)
	assert.Equal(t, "test-token", token)

	// Test with missing Authorization header
	c.Request.Header.Del("Authorization")
	_, err = jwtService.ExtractTokenFromHeader(c)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "authorization header is required")

	// Test with invalid Authorization header format
	c.Request.Header.Set("Authorization", "InvalidFormat test-token")
	_, err = jwtService.ExtractTokenFromHeader(c)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "authorization header must start with 'Bearer '")
}
