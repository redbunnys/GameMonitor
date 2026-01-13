package database

import (
	"game-server-monitor/internal/models"
	"log"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

// Initialize sets up the database connection and runs migrations
func Initialize() error {
	var err error
	DB, err = gorm.Open(sqlite.Open("game_servers.db"), &gorm.Config{})
	if err != nil {
		return err
	}

	// Auto-migrate the schema
	err = DB.AutoMigrate(&models.Server{}, &models.User{})
	if err != nil {
		return err
	}

	// Create default admin user if no users exist
	if err := createDefaultAdmin(); err != nil {
		log.Printf("Warning: Failed to create default admin user: %v", err)
	}

	return nil
}

// createDefaultAdmin creates a default admin user if no users exist
func createDefaultAdmin() error {
	var count int64
	if err := DB.Model(&models.User{}).Count(&count).Error; err != nil {
		return err
	}

	// If users already exist, don't create default admin
	if count > 0 {
		return nil
	}

	// Create database service to use password hashing
	dbService := NewDatabaseService()

	// Create default admin user (username: admin, password: admin123)
	_, err := dbService.CreateUser("admin", "admin123")
	if err != nil {
		return err
	}

	log.Println("✅ Created default admin user (username: admin, password: admin123)")
	return nil
}
