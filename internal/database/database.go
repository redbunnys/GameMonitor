package database

import (
	"game-server-monitor/internal/models"

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

	return nil
}
