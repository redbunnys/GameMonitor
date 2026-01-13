package database

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"game-server-monitor/internal/models"

	"golang.org/x/crypto/argon2"
)

// DatabaseService provides high-level database operations
type DatabaseService struct {
	ServerOps *ServerOperations
	UserOps   *UserOperations
}

// NewDatabaseService creates a new DatabaseService instance
func NewDatabaseService() *DatabaseService {
	return &DatabaseService{
		ServerOps: NewServerOperations(),
		UserOps:   NewUserOperations(),
	}
}

// Server operations

// CreateServer creates a new server with validation
func (ds *DatabaseService) CreateServer(req *models.CreateServerRequest) (*models.Server, error) {
	// Validate server type
	if req.Type != "minecraft" && req.Type != "cs2" {
		return nil, errors.New("invalid server type: must be 'minecraft' or 'cs2'")
	}

	// Validate port range
	if req.Port < 1 || req.Port > 65535 {
		return nil, errors.New("invalid port: must be between 1 and 65535")
	}

	return ds.ServerOps.CreateServer(req)
}

// GetServer retrieves a server by ID
func (ds *DatabaseService) GetServer(id uint) (*models.Server, error) {
	return ds.ServerOps.GetServerByID(id)
}

// GetAllServers retrieves all servers
func (ds *DatabaseService) GetAllServers() ([]models.Server, error) {
	return ds.ServerOps.GetAllServers()
}

// UpdateServer updates a server with validation
func (ds *DatabaseService) UpdateServer(id uint, req *models.UpdateServerRequest) (*models.Server, error) {
	// Validate server type
	if req.Type != "minecraft" && req.Type != "cs2" {
		return nil, errors.New("invalid server type: must be 'minecraft' or 'cs2'")
	}

	// Validate port range
	if req.Port < 1 || req.Port > 65535 {
		return nil, errors.New("invalid port: must be between 1 and 65535")
	}

	return ds.ServerOps.UpdateServer(id, req)
}

// DeleteServer deletes a server
func (ds *DatabaseService) DeleteServer(id uint) error {
	return ds.ServerOps.DeleteServer(id)
}

// User operations with password hashing

// CreateUser creates a new user with hashed password
func (ds *DatabaseService) CreateUser(username, password string) (*models.User, error) {
	if username == "" || password == "" {
		return nil, errors.New("username and password are required")
	}

	// Check if user already exists
	if _, err := ds.UserOps.GetUserByUsername(username); err == nil {
		return nil, errors.New("user already exists")
	}

	// Hash password
	passwordHash, err := ds.hashPassword(password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	return ds.UserOps.CreateUser(username, passwordHash)
}

// AuthenticateUser verifies user credentials
func (ds *DatabaseService) AuthenticateUser(username, password string) (*models.User, error) {
	user, err := ds.UserOps.GetUserByUsername(username)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	if !ds.verifyPassword(password, user.Password) {
		return nil, errors.New("invalid credentials")
	}

	return user, nil
}

// GetUser retrieves a user by ID
func (ds *DatabaseService) GetUser(id uint) (*models.User, error) {
	return ds.UserOps.GetUserByID(id)
}

// UpdateUserPassword updates a user's password
func (ds *DatabaseService) UpdateUserPassword(id uint, newPassword string) error {
	if newPassword == "" {
		return errors.New("password cannot be empty")
	}

	passwordHash, err := ds.hashPassword(newPassword)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	return ds.UserOps.UpdateUserPassword(id, passwordHash)
}

// Password hashing using Argon2

func (ds *DatabaseService) hashPassword(password string) (string, error) {
	// Generate a random salt
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}

	// Hash the password using Argon2
	hash := argon2.IDKey([]byte(password), salt, 1, 64*1024, 4, 32)

	// Encode salt and hash to base64
	saltEncoded := base64.RawStdEncoding.EncodeToString(salt)
	hashEncoded := base64.RawStdEncoding.EncodeToString(hash)

	// Return the encoded string in format: salt$hash
	return fmt.Sprintf("%s$%s", saltEncoded, hashEncoded), nil
}

func (ds *DatabaseService) verifyPassword(password, hashedPassword string) bool {
	// Split the hashed password to get salt and hash
	parts := []byte(hashedPassword)
	var saltEnd int
	for i, b := range parts {
		if b == '$' {
			saltEnd = i
			break
		}
	}
	if saltEnd == 0 {
		return false
	}

	saltEncoded := string(parts[:saltEnd])
	hashEncoded := string(parts[saltEnd+1:])

	// Decode salt and hash
	salt, err := base64.RawStdEncoding.DecodeString(saltEncoded)
	if err != nil {
		return false
	}

	expectedHash, err := base64.RawStdEncoding.DecodeString(hashEncoded)
	if err != nil {
		return false
	}

	// Hash the provided password with the same salt
	actualHash := argon2.IDKey([]byte(password), salt, 1, 64*1024, 4, 32)

	// Compare hashes using constant-time comparison
	return subtle.ConstantTimeCompare(actualHash, expectedHash) == 1
}
