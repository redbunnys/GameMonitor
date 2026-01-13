package handlers

import (
	"net/http"

	"game-server-monitor/internal/auth"
	"game-server-monitor/internal/database"
	"game-server-monitor/internal/models"

	"github.com/gin-gonic/gin"
)

// AuthHandler handles authentication-related requests
type AuthHandler struct {
	dbService  *database.DatabaseService
	jwtService *auth.JWTService
}

// NewAuthHandler creates a new AuthHandler instance
func NewAuthHandler() *AuthHandler {
	return &AuthHandler{
		dbService:  database.NewDatabaseService(),
		jwtService: auth.NewJWTService(),
	}
}

// Login handles user login requests
func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request",
			"message": err.Error(),
		})
		return
	}

	// Authenticate user
	user, err := h.dbService.AuthenticateUser(req.Username, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Authentication failed",
			"message": "Invalid username or password",
		})
		return
	}

	// Generate JWT token
	token, expiresAt, err := h.jwtService.GenerateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Token generation failed",
			"message": "Failed to generate authentication token",
		})
		return
	}

	// Return successful login response
	c.JSON(http.StatusOK, models.LoginResponse{
		Token:     token,
		ExpiresAt: expiresAt,
	})
}

// GetProfile returns the current user's profile information
func (h *AuthHandler) GetProfile(c *gin.Context) {
	userID, _, err := auth.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Unauthorized",
			"message": err.Error(),
		})
		return
	}

	// Get full user information from database
	user, err := h.dbService.GetUser(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "User not found",
			"message": "User profile not found",
		})
		return
	}

	// Return user profile (password is excluded by json:"-" tag)
	c.JSON(http.StatusOK, gin.H{
		"user": user,
	})
}

// ChangePassword allows authenticated users to change their password
func (h *AuthHandler) ChangePassword(c *gin.Context) {
	userID, _, err := auth.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Unauthorized",
			"message": err.Error(),
		})
		return
	}

	var req struct {
		CurrentPassword string `json:"current_password" binding:"required"`
		NewPassword     string `json:"new_password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request",
			"message": err.Error(),
		})
		return
	}

	// Get current user
	user, err := h.dbService.GetUser(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "User not found",
			"message": "User not found",
		})
		return
	}

	// Verify current password
	_, err = h.dbService.AuthenticateUser(user.Username, req.CurrentPassword)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Authentication failed",
			"message": "Current password is incorrect",
		})
		return
	}

	// Update password
	err = h.dbService.UpdateUserPassword(userID, req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Password update failed",
			"message": "Failed to update password",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Password updated successfully",
	})
}

// ValidateToken validates a JWT token (useful for frontend token validation)
func (h *AuthHandler) ValidateToken(c *gin.Context) {
	// If we reach here, the token is valid (middleware already validated it)
	userID, username, err := auth.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Unauthorized",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"valid":    true,
		"user_id":  userID,
		"username": username,
	})
}
