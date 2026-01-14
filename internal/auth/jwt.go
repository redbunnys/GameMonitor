package auth

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"game-server-monitor/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// JWTService handles JWT token operations
type JWTService struct {
	secretKey []byte
	issuer    string
}

// Claims represents the JWT claims
type Claims struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// NewJWTService creates a new JWT service instance
func NewJWTService() *JWTService {
	// Get secret key from environment or use default for development
	secretKey := os.Getenv("JWT_SECRET")
	if secretKey == "" {
		secretKey = "bWHnEE0TtwPZvbspvsfb"
	}

	return &JWTService{
		secretKey: []byte(secretKey),
		issuer:    "game-server-monitor",
	}
}

// GenerateToken generates a JWT token for a user
func (j *JWTService) GenerateToken(user *models.User) (string, time.Time, error) {
	expirationTime := time.Now().Add(24 * time.Hour) // Token expires in 24 hours

	claims := &Claims{
		UserID:   user.ID,
		Username: user.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    j.issuer,
			Subject:   fmt.Sprintf("user:%d", user.ID),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(j.secretKey)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, expirationTime, nil
}

// ValidateToken validates a JWT token and returns the claims
func (j *JWTService) ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate the signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return j.secretKey, nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	// Check if token is expired
	if claims.ExpiresAt != nil && claims.ExpiresAt.Time.Before(time.Now()) {
		return nil, errors.New("token expired")
	}

	return claims, nil
}

// ExtractTokenFromHeader extracts JWT token from Authorization header
func (j *JWTService) ExtractTokenFromHeader(c *gin.Context) (string, error) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		return "", errors.New("authorization header is required")
	}

	// Check if header starts with "Bearer "
	if !strings.HasPrefix(authHeader, "Bearer ") {
		return "", errors.New("authorization header must start with 'Bearer '")
	}

	// Extract token (remove "Bearer " prefix)
	token := strings.TrimPrefix(authHeader, "Bearer ")
	if token == "" {
		return "", errors.New("token is required")
	}

	return token, nil
}

// AuthMiddleware creates a Gin middleware for JWT authentication
func (j *JWTService) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract token from header
		tokenString, err := j.ExtractTokenFromHeader(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Unauthorized",
				"message": err.Error(),
			})
			c.Abort()
			return
		}

		// Validate token
		claims, err := j.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Unauthorized",
				"message": err.Error(),
			})
			c.Abort()
			return
		}

		// Store user information in context
		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("claims", claims)

		c.Next()
	}
}

// RequireAuth is a convenience method that returns the auth middleware
func (j *JWTService) RequireAuth() gin.HandlerFunc {
	return j.AuthMiddleware()
}

// GetUserFromContext extracts user information from Gin context
func GetUserFromContext(c *gin.Context) (uint, string, error) {
	userID, exists := c.Get("user_id")
	if !exists {
		return 0, "", errors.New("user not found in context")
	}

	username, exists := c.Get("username")
	if !exists {
		return 0, "", errors.New("username not found in context")
	}

	userIDUint, ok := userID.(uint)
	if !ok {
		return 0, "", errors.New("invalid user ID type")
	}

	usernameStr, ok := username.(string)
	if !ok {
		return 0, "", errors.New("invalid username type")
	}

	return userIDUint, usernameStr, nil
}
