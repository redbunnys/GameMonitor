package cache

import (
	"game-server-monitor/internal/models"
	"log"
	"time"
)

// StatusCacheManager provides high-level cache operations for server statuses
type StatusCacheManager struct {
	cache CacheManager
}

// NewStatusCacheManager creates a new StatusCacheManager with default TTL of 5 minutes
func NewStatusCacheManager() *StatusCacheManager {
	return &StatusCacheManager{
		cache: NewMemoryCache(5 * time.Minute),
	}
}

// NewStatusCacheManagerWithTTL creates a new StatusCacheManager with custom TTL
func NewStatusCacheManagerWithTTL(ttl time.Duration) *StatusCacheManager {
	return &StatusCacheManager{
		cache: NewMemoryCache(ttl),
	}
}

// UpdateServerStatus updates the cached status for a server
func (scm *StatusCacheManager) UpdateServerStatus(serverID uint, status *models.ServerStatus) {
	scm.cache.SetServerStatus(serverID, status)
	log.Printf("Updated cache for server ID %d: online=%t, players=%d/%d",
		serverID, status.Online, status.Players, status.MaxPlayers)
}

// GetServerStatus retrieves cached status for a server
func (scm *StatusCacheManager) GetServerStatus(serverID uint) (*models.ServerStatus, bool) {
	return scm.cache.GetServerStatus(serverID)
}

// GetAllServerStatuses retrieves all cached server statuses
func (scm *StatusCacheManager) GetAllServerStatuses() map[uint]*models.ServerStatus {
	return scm.cache.GetAllServerStatuses()
}

// GetServerStatusWithFallback retrieves cached status or returns a default offline status
func (scm *StatusCacheManager) GetServerStatusWithFallback(serverID uint) *models.ServerStatus {
	if status, found := scm.cache.GetServerStatus(serverID); found {
		return status
	}

	// Return default offline status if not found in cache
	return &models.ServerStatus{
		Online:      false,
		Players:     0,
		MaxPlayers:  0,
		Version:     "Unknown",
		Ping:        0,
		LastUpdated: time.Now(),
	}
}

// ClearExpiredEntries removes expired entries from cache
func (scm *StatusCacheManager) ClearExpiredEntries() {
	scm.cache.ClearExpiredEntries()
}

// ClearAll removes all entries from cache
func (scm *StatusCacheManager) ClearAll() {
	scm.cache.Clear()
	log.Println("Cleared all cached server statuses")
}

// GetCacheSize returns the current number of cached entries
func (scm *StatusCacheManager) GetCacheSize() int {
	return scm.cache.Size()
}

// GetCacheStats returns cache statistics
func (scm *StatusCacheManager) GetCacheStats() map[string]interface{} {
	allStatuses := scm.cache.GetAllServerStatuses()
	onlineCount := 0

	for _, status := range allStatuses {
		if status.Online {
			onlineCount++
		}
	}

	return map[string]interface{}{
		"total_cached":    len(allStatuses),
		"online_servers":  onlineCount,
		"offline_servers": len(allStatuses) - onlineCount,
		"cache_size":      scm.cache.Size(),
	}
}
