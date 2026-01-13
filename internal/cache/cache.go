package cache

import (
	"game-server-monitor/internal/models"
	"sync"
	"time"
)

// CacheManager interface defines the contract for cache operations
type CacheManager interface {
	SetServerStatus(serverID uint, status *models.ServerStatus)
	GetServerStatus(serverID uint) (*models.ServerStatus, bool)
	GetAllServerStatuses() map[uint]*models.ServerStatus
	ClearExpiredEntries()
	Clear()
	Size() int
}

// CachedStatus wraps ServerStatus with expiration time
type CachedStatus struct {
	Status    *models.ServerStatus
	ExpiresAt time.Time
}

// MemoryCache implements CacheManager with thread-safe in-memory storage
type MemoryCache struct {
	data  map[uint]*CachedStatus
	mutex sync.RWMutex
	ttl   time.Duration
}

// NewMemoryCache creates a new MemoryCache with specified TTL
func NewMemoryCache(ttl time.Duration) CacheManager {
	cache := &MemoryCache{
		data:  make(map[uint]*CachedStatus),
		mutex: sync.RWMutex{},
		ttl:   ttl,
	}

	// Start background cleanup goroutine
	go cache.startCleanupRoutine()

	return cache
}

// SetServerStatus stores server status in cache with TTL
func (mc *MemoryCache) SetServerStatus(serverID uint, status *models.ServerStatus) {
	mc.mutex.Lock()
	defer mc.mutex.Unlock()

	mc.data[serverID] = &CachedStatus{
		Status:    status,
		ExpiresAt: time.Now().Add(mc.ttl),
	}
}

// GetServerStatus retrieves server status from cache if not expired
func (mc *MemoryCache) GetServerStatus(serverID uint) (*models.ServerStatus, bool) {
	mc.mutex.RLock()
	defer mc.mutex.RUnlock()

	cached, exists := mc.data[serverID]
	if !exists {
		return nil, false
	}

	// Check if entry has expired
	if time.Now().After(cached.ExpiresAt) {
		// Remove expired entry (we need to upgrade to write lock)
		mc.mutex.RUnlock()
		mc.mutex.Lock()
		delete(mc.data, serverID)
		mc.mutex.Unlock()
		mc.mutex.RLock()
		return nil, false
	}

	return cached.Status, true
}

// GetAllServerStatuses returns all non-expired server statuses
func (mc *MemoryCache) GetAllServerStatuses() map[uint]*models.ServerStatus {
	mc.mutex.RLock()
	defer mc.mutex.RUnlock()

	result := make(map[uint]*models.ServerStatus)
	now := time.Now()

	for serverID, cached := range mc.data {
		if now.Before(cached.ExpiresAt) {
			result[serverID] = cached.Status
		}
	}

	return result
}

// ClearExpiredEntries removes all expired entries from cache
func (mc *MemoryCache) ClearExpiredEntries() {
	mc.mutex.Lock()
	defer mc.mutex.Unlock()

	now := time.Now()
	for serverID, cached := range mc.data {
		if now.After(cached.ExpiresAt) {
			delete(mc.data, serverID)
		}
	}
}

// Clear removes all entries from cache
func (mc *MemoryCache) Clear() {
	mc.mutex.Lock()
	defer mc.mutex.Unlock()

	mc.data = make(map[uint]*CachedStatus)
}

// Size returns the current number of entries in cache
func (mc *MemoryCache) Size() int {
	mc.mutex.RLock()
	defer mc.mutex.RUnlock()

	return len(mc.data)
}

// startCleanupRoutine runs a background goroutine to periodically clean expired entries
func (mc *MemoryCache) startCleanupRoutine() {
	// Clean up expired entries every minute
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		mc.ClearExpiredEntries()
	}
}
