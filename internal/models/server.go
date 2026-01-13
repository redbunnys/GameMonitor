package models

import (
	"time"
)

// Server represents a game server configuration
type Server struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"not null" json:"name"`
	Type        string    `gorm:"not null" json:"type"`       // "minecraft" or "cs2"
	Address     string    `gorm:"not null" json:"address"`    // IP or domain
	Port        int       `gorm:"not null" json:"port"`       // Game port
	Description string    `json:"description"`                // Server description
	DownloadURL string    `json:"download_url"`               // Client download link
	Changelog   string    `gorm:"type:text" json:"changelog"` // Update log (Markdown)
	Version     string    `json:"version"`                    // Detected version
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// User represents an admin user
type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Username  string    `gorm:"unique;not null" json:"username"`
	Password  string    `gorm:"not null" json:"-"` // Password hash, not returned to frontend
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ServerStatus represents the current status of a game server
type ServerStatus struct {
	Online      bool      `json:"online"`
	Players     int       `json:"players"`
	MaxPlayers  int       `json:"max_players"`
	Version     string    `json:"version"`
	Ping        int64     `json:"ping"` // Response time (ms)
	LastUpdated time.Time `json:"last_updated"`
}

// ServerStatusResponse combines server config with current status
type ServerStatusResponse struct {
	Server
	Status ServerStatus `json:"status"`
}

// ServerListResponse represents the response for server list API
type ServerListResponse struct {
	Servers []ServerStatusResponse `json:"servers"`
	Total   int                    `json:"total"`
}

// CreateServerRequest represents the request to create a new server
type CreateServerRequest struct {
	Name        string `json:"name" binding:"required"`
	Type        string `json:"type" binding:"required,oneof=minecraft cs2"`
	Address     string `json:"address" binding:"required"`
	Port        int    `json:"port" binding:"required,min=1,max=65535"`
	Description string `json:"description"`
	DownloadURL string `json:"download_url"`
	Changelog   string `json:"changelog"`
}

// UpdateServerRequest represents the request to update a server
type UpdateServerRequest struct {
	Name        string `json:"name" binding:"required"`
	Type        string `json:"type" binding:"required,oneof=minecraft cs2"`
	Address     string `json:"address" binding:"required"`
	Port        int    `json:"port" binding:"required,min=1,max=65535"`
	Description string `json:"description"`
	DownloadURL string `json:"download_url"`
	Changelog   string `json:"changelog"`
}

// LoginRequest represents the login request
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse represents the login response
type LoginResponse struct {
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
}
