package prober

import (
	"game-server-monitor/internal/database"
	"game-server-monitor/internal/models"
	"log"
	"time"
)

// ProberService provides a high-level interface for server probing operations
type ProberService struct {
	backgroundProber *BackgroundProber
	dbService        *database.DatabaseService
}

// NewProberService creates a new ProberService with default configuration
func NewProberService(dbService *database.DatabaseService) *ProberService {
	config := DefaultBackgroundProberConfig()
	backgroundProber := NewBackgroundProber(dbService, config)

	return &ProberService{
		backgroundProber: backgroundProber,
		dbService:        dbService,
	}
}

// NewProberServiceWithConfig creates a new ProberService with custom configuration
func NewProberServiceWithConfig(dbService *database.DatabaseService, config *BackgroundProberConfig) *ProberService {
	backgroundProber := NewBackgroundProber(dbService, config)

	return &ProberService{
		backgroundProber: backgroundProber,
		dbService:        dbService,
	}
}

// Start starts the background probing service
func (ps *ProberService) Start() error {
	log.Println("Starting prober service...")
	return ps.backgroundProber.Start()
}

// Stop stops the background probing service
func (ps *ProberService) Stop() error {
	log.Println("Stopping prober service...")
	return ps.backgroundProber.Stop()
}

// IsRunning returns whether the prober service is running
func (ps *ProberService) IsRunning() bool {
	return ps.backgroundProber.IsRunning()
}

// GetServerStatus retrieves cached server status
func (ps *ProberService) GetServerStatus(serverID uint) (*models.ServerStatus, bool) {
	return ps.backgroundProber.GetServerStatus(serverID)
}

// GetServerStatusWithFallback retrieves cached server status or returns offline status
func (ps *ProberService) GetServerStatusWithFallback(serverID uint) *models.ServerStatus {
	return ps.backgroundProber.GetCacheManager().GetServerStatusWithFallback(serverID)
}

// GetAllServerStatuses retrieves all cached server statuses
func (ps *ProberService) GetAllServerStatuses() map[uint]*models.ServerStatus {
	return ps.backgroundProber.GetAllServerStatuses()
}

// GetServerWithStatus combines server configuration with cached status
func (ps *ProberService) GetServerWithStatus(serverID uint) (*models.ServerStatusResponse, error) {
	server, err := ps.dbService.GetServer(serverID)
	if err != nil {
		return nil, err
	}

	status := ps.GetServerStatusWithFallback(serverID)

	return &models.ServerStatusResponse{
		Server: *server,
		Status: *status,
	}, nil
}

// GetAllServersWithStatus retrieves all servers with their cached statuses
func (ps *ProberService) GetAllServersWithStatus() (*models.ServerListResponse, error) {
	servers, err := ps.dbService.GetAllServers()
	if err != nil {
		return nil, err
	}

	serverResponses := make([]models.ServerStatusResponse, 0, len(servers))

	for _, server := range servers {
		status := ps.GetServerStatusWithFallback(server.ID)

		serverResponses = append(serverResponses, models.ServerStatusResponse{
			Server: server,
			Status: *status,
		})
	}

	return &models.ServerListResponse{
		Servers: serverResponses,
		Total:   len(serverResponses),
	}, nil
}

// ForceProbeServer immediately probes a specific server
func (ps *ProberService) ForceProbeServer(serverID uint) (*models.ServerStatus, error) {
	return ps.backgroundProber.ForceProbeServer(serverID)
}

// SetProbeInterval updates the probe interval
func (ps *ProberService) SetProbeInterval(interval time.Duration) {
	ps.backgroundProber.SetProbeInterval(interval)
}

// GetProbeInterval returns the current probe interval
func (ps *ProberService) GetProbeInterval() time.Duration {
	return ps.backgroundProber.GetProbeInterval()
}

// GetStats returns prober service statistics
func (ps *ProberService) GetStats() map[string]interface{} {
	return ps.backgroundProber.GetProberStats()
}

// ClearCache clears all cached server statuses
func (ps *ProberService) ClearCache() {
	ps.backgroundProber.GetCacheManager().ClearAll()
}

// GetCacheStats returns cache statistics
func (ps *ProberService) GetCacheStats() map[string]interface{} {
	return ps.backgroundProber.GetCacheManager().GetCacheStats()
}
