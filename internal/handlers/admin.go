package handlers

import (
	"net/http"
	"strconv"

	"game-server-monitor/internal/auth"
	"game-server-monitor/internal/database"
	"game-server-monitor/internal/models"

	"github.com/gin-gonic/gin"
)

// AdminHandler handles admin-related requests
type AdminHandler struct {
	dbService *database.DatabaseService
}

// NewAdminHandler creates a new AdminHandler instance
func NewAdminHandler() *AdminHandler {
	return &AdminHandler{
		dbService: database.NewDatabaseService(),
	}
}

// CreateUser creates a new admin user (admin-only endpoint)
func (h *AdminHandler) CreateUser(c *gin.Context) {
	// Verify admin is authenticated
	_, _, err := auth.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Unauthorized",
			"message": err.Error(),
		})
		return
	}

	var req struct {
		Username string `json:"username" binding:"required,min=3"`
		Password string `json:"password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request",
			"message": err.Error(),
		})
		return
	}

	// Create user
	user, err := h.dbService.CreateUser(req.Username, req.Password)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "User creation failed",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User created successfully",
		"user":    user,
	})
}

// GetUsers returns a list of all users (admin-only endpoint)
func (h *AdminHandler) GetUsers(c *gin.Context) {
	// Verify admin is authenticated
	_, _, err := auth.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Unauthorized",
			"message": err.Error(),
		})
		return
	}

	// For now, we'll implement a simple method to get all users
	// In a real application, you might want pagination and filtering
	users, err := h.getAllUsers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to retrieve users",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"users": users,
		"total": len(users),
	})
}

// DeleteUser deletes a user by ID (admin-only endpoint)
func (h *AdminHandler) DeleteUser(c *gin.Context) {
	// Verify admin is authenticated
	currentUserID, _, err := auth.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Unauthorized",
			"message": err.Error(),
		})
		return
	}

	// Get user ID from URL parameter
	userIDStr := c.Param("id")
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid user ID",
			"message": "User ID must be a valid number",
		})
		return
	}

	// Prevent admin from deleting themselves
	if uint(userID) == currentUserID {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Cannot delete self",
			"message": "You cannot delete your own account",
		})
		return
	}

	// Delete user
	err = h.dbService.UserOps.DeleteUser(uint(userID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "User deletion failed",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User deleted successfully",
	})
}

// ResetUserPassword resets a user's password (admin-only endpoint)
func (h *AdminHandler) ResetUserPassword(c *gin.Context) {
	// Verify admin is authenticated
	_, _, err := auth.GetUserFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Unauthorized",
			"message": err.Error(),
		})
		return
	}

	// Get user ID from URL parameter
	userIDStr := c.Param("id")
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid user ID",
			"message": "User ID must be a valid number",
		})
		return
	}

	var req struct {
		NewPassword string `json:"new_password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request",
			"message": err.Error(),
		})
		return
	}

	// Update user password
	err = h.dbService.UpdateUserPassword(uint(userID), req.NewPassword)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Password reset failed",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Password reset successfully",
	})
}

// getAllUsers is a helper method to get all users
// In a production system, this should be moved to the database service
func (h *AdminHandler) getAllUsers() ([]models.User, error) {
	var users []models.User
	if err := database.DB.Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}
