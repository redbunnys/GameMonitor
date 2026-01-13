package prober

import (
	"context"
	"game-server-monitor/internal/cache"
	"game-server-monitor/internal/database"
	"game-server-monitor/internal/models"
	"log"
	"sync"
	"time"
)

// BackgroundProber manages background server probing tasks
type BackgroundProber struct {
	prober       ServerProber
	cacheManager *cache.StatusCacheManager
	dbService    *database.DatabaseService
	interval     time.Duration
	ctx          context.Context
	cancel       context.CancelFunc
	wg           sync.WaitGroup
	running      bool
	mutex        sync.RWMutex
}

// BackgroundProberConfig holds configuration for the background prober
type BackgroundProberConfig struct {
	ProbeInterval time.Duration
	CacheTTL      time.Duration
	MaxRetries    int
}

// DefaultBackgroundProberConfig returns default configuration
func DefaultBackgroundProberConfig() *BackgroundProberConfig {
	return &BackgroundProberConfig{
		ProbeInterval: 30 * time.Second, // Probe every 30 seconds
		CacheTTL:      5 * time.Minute,  // Cache for 5 minutes
		MaxRetries:    3,                // Retry up to 3 times
	}
}

// NewBackgroundProber creates a new background prober
func NewBackgroundProber(dbService *database.DatabaseService, config *BackgroundProberConfig) *BackgroundProber {
	if config == nil {
		config = DefaultBackgroundProberConfig()
	}

	ctx, cancel := context.WithCancel(context.Background())

	return &BackgroundProber{
		prober:       NewServerProber(),
		cacheManager: cache.NewStatusCacheManagerWithTTL(config.CacheTTL),
		dbService:    dbService,
		interval:     config.ProbeInterval,
		ctx:          ctx,
		cancel:       cancel,
		running:      false,
	}
}

// Start begins the background probing process
func (bp *BackgroundProber) Start() error {
	bp.mutex.Lock()
	defer bp.mutex.Unlock()

	if bp.running {
		return nil // Already running
	}

	bp.running = true
	bp.wg.Add(1)

	go bp.probeLoop()

	log.Printf("Background prober started with interval: %v", bp.interval)
	return nil
}

// Stop gracefully stops the background probing process
func (bp *BackgroundProber) Stop() error {
	bp.mutex.Lock()
	defer bp.mutex.Unlock()

	if !bp.running {
		return nil // Already stopped
	}

	bp.running = false
	bp.cancel()
	bp.wg.Wait()

	log.Println("Background prober stopped")
	return nil
}

// IsRunning returns whether the background prober is currently running
func (bp *BackgroundProber) IsRunning() bool {
	bp.mutex.RLock()
	defer bp.mutex.RUnlock()
	return bp.running
}

// GetCacheManager returns the cache manager instance
func (bp *BackgroundProber) GetCacheManager() *cache.StatusCacheManager {
	return bp.cacheManager
}

// SetProbeInterval updates the probe interval (takes effect on next cycle)
func (bp *BackgroundProber) SetProbeInterval(interval time.Duration) {
	bp.mutex.Lock()
	defer bp.mutex.Unlock()

	bp.interval = interval
	log.Printf("Probe interval updated to: %v", interval)
}

// GetProbeInterval returns the current probe interval
func (bp *BackgroundProber) GetProbeInterval() time.Duration {
	bp.mutex.RLock()
	defer bp.mutex.RUnlock()
	return bp.interval
}

// probeLoop is the main background probing loop
func (bp *BackgroundProber) probeLoop() {
	defer bp.wg.Done()

	// Initial probe on startup
	bp.probeAllServers()

	ticker := time.NewTicker(bp.interval)
	defer ticker.Stop()

	for {
		select {
		case <-bp.ctx.Done():
			log.Println("Background prober loop stopped")
			return
		case <-ticker.C:
			// Update ticker interval if it changed
			bp.mutex.RLock()
			currentInterval := bp.interval
			bp.mutex.RUnlock()

			if ticker.C != nil && currentInterval != bp.interval {
				ticker.Stop()
				ticker = time.NewTicker(currentInterval)
			}

			bp.probeAllServers()
		}
	}
}

// probeAllServers probes all configured servers and updates cache
func (bp *BackgroundProber) probeAllServers() {
	servers, err := bp.dbService.GetAllServers()
	if err != nil {
		log.Printf("Failed to get servers from database: %v", err)
		return
	}

	if len(servers) == 0 {
		log.Println("No servers configured for probing")
		return
	}

	log.Printf("Starting probe cycle for %d servers", len(servers))

	// Use goroutines to probe servers concurrently
	var wg sync.WaitGroup
	semaphore := make(chan struct{}, 10) // Limit concurrent probes to 10

	for _, server := range servers {
		wg.Add(1)
		go func(s models.Server) {
			defer wg.Done()

			// Acquire semaphore
			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			bp.probeAndCacheServer(&s)
		}(server)
	}

	wg.Wait()
	log.Printf("Completed probe cycle for %d servers", len(servers))
}

// probeAndCacheServer probes a single server and updates the cache
func (bp *BackgroundProber) probeAndCacheServer(server *models.Server) {
	startTime := time.Now()

	// Probe the server with retry
	status := bp.prober.ProbeServerWithRetry(server, 3)

	// Update cache with the result
	bp.cacheManager.UpdateServerStatus(server.ID, status)

	duration := time.Since(startTime)

	if status.Online {
		log.Printf("Server %s (%s:%d) - Online: %d/%d players, ping: %dms, probe time: %v",
			server.Name, server.Address, server.Port,
			status.Players, status.MaxPlayers, status.Ping, duration)
	} else {
		log.Printf("Server %s (%s:%d) - Offline, probe time: %v",
			server.Name, server.Address, server.Port, duration)
	}
}

// ForceProbeServer immediately probes a specific server and updates cache
func (bp *BackgroundProber) ForceProbeServer(serverID uint) (*models.ServerStatus, error) {
	server, err := bp.dbService.GetServer(serverID)
	if err != nil {
		return nil, err
	}

	status := bp.prober.ProbeServerWithRetry(server, 3)
	bp.cacheManager.UpdateServerStatus(server.ID, status)

	log.Printf("Force probed server %s: online=%t", server.Name, status.Online)
	return status, nil
}

// GetServerStatus retrieves server status from cache
func (bp *BackgroundProber) GetServerStatus(serverID uint) (*models.ServerStatus, bool) {
	return bp.cacheManager.GetServerStatus(serverID)
}

// GetAllServerStatuses retrieves all cached server statuses
func (bp *BackgroundProber) GetAllServerStatuses() map[uint]*models.ServerStatus {
	return bp.cacheManager.GetAllServerStatuses()
}

// GetProberStats returns statistics about the background prober
func (bp *BackgroundProber) GetProberStats() map[string]interface{} {
	stats := bp.cacheManager.GetCacheStats()
	stats["running"] = bp.IsRunning()
	stats["probe_interval"] = bp.GetProbeInterval().String()

	return stats
}
