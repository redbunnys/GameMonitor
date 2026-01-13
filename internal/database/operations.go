package database

import (
	"errors"
	"game-server-monitor/internal/models"

	"gorm.io/gorm"
)

// ServerOperations provides CRUD operations for servers
type ServerOperations struct {
	db *gorm.DB
}

// NewServerOperations creates a new ServerOperations instance
func NewServerOperations() *ServerOperations {
	return &ServerOperations{db: DB}
}

// CreateServer creates a new server in the database
func (s *ServerOperations) CreateServer(req *models.CreateServerRequest) (*models.Server, error) {
	server := &models.Server{
		Name:        req.Name,
		Type:        req.Type,
		Address:     req.Address,
		Port:        req.Port,
		Description: req.Description,
		DownloadURL: req.DownloadURL,
		Changelog:   req.Changelog,
	}

	if err := s.db.Create(server).Error; err != nil {
		return nil, err
	}

	return server, nil
}

// GetServerByID retrieves a server by its ID
func (s *ServerOperations) GetServerByID(id uint) (*models.Server, error) {
	var server models.Server
	if err := s.db.First(&server, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("server not found")
		}
		return nil, err
	}
	return &server, nil
}

// GetAllServers retrieves all servers from the database
func (s *ServerOperations) GetAllServers() ([]models.Server, error) {
	var servers []models.Server
	if err := s.db.Find(&servers).Error; err != nil {
		return nil, err
	}
	return servers, nil
}

// UpdateServer updates an existing server
func (s *ServerOperations) UpdateServer(id uint, req *models.UpdateServerRequest) (*models.Server, error) {
	var server models.Server
	if err := s.db.First(&server, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("server not found")
		}
		return nil, err
	}

	// Update fields
	server.Name = req.Name
	server.Type = req.Type
	server.Address = req.Address
	server.Port = req.Port
	server.Description = req.Description
	server.DownloadURL = req.DownloadURL
	server.Changelog = req.Changelog

	if err := s.db.Save(&server).Error; err != nil {
		return nil, err
	}

	return &server, nil
}

// DeleteServer deletes a server by its ID
func (s *ServerOperations) DeleteServer(id uint) error {
	result := s.db.Delete(&models.Server{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("server not found")
	}
	return nil
}

// UserOperations provides operations for user authentication
type UserOperations struct {
	db *gorm.DB
}

// NewUserOperations creates a new UserOperations instance
func NewUserOperations() *UserOperations {
	return &UserOperations{db: DB}
}

// CreateUser creates a new user in the database
func (u *UserOperations) CreateUser(username, passwordHash string) (*models.User, error) {
	user := &models.User{
		Username: username,
		Password: passwordHash,
	}

	if err := u.db.Create(user).Error; err != nil {
		return nil, err
	}

	return user, nil
}

// GetUserByUsername retrieves a user by username
func (u *UserOperations) GetUserByUsername(username string) (*models.User, error) {
	var user models.User
	if err := u.db.Where("username = ?", username).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return &user, nil
}

// GetUserByID retrieves a user by ID
func (u *UserOperations) GetUserByID(id uint) (*models.User, error) {
	var user models.User
	if err := u.db.First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return &user, nil
}

// UpdateUserPassword updates a user's password
func (u *UserOperations) UpdateUserPassword(id uint, passwordHash string) error {
	result := u.db.Model(&models.User{}).Where("id = ?", id).Update("password", passwordHash)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("user not found")
	}
	return nil
}

// DeleteUser deletes a user by ID
func (u *UserOperations) DeleteUser(id uint) error {
	result := u.db.Delete(&models.User{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("user not found")
	}
	return nil
}
