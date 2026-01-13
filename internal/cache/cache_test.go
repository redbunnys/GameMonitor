package cache

import (
	"game-server-monitor/internal/models"
	"testing"
	"time"
)

func TestMemoryCache_SetAndGet(t *testing.T) {
	cache := NewMemoryCache(time.Minute)

	status := &models.ServerStatus{
		Online:      true,
		Players:     10,
		MaxPlayers:  20,
		Version:     "1.20.1",
		Ping:        50,
		LastUpdated: time.Now(),
	}

	// Set status
	cache.SetServerStatus(1, status)

	// Get status
	retrieved, found := cache.GetServerStatus(1)
	if !found {
		t.Fatal("Expected to find cached status")
	}

	if retrieved.Online != status.Online {
		t.Errorf("Expected Online=%t, got %t", status.Online, retrieved.Online)
	}

	if retrieved.Players != status.Players {
		t.Errorf("Expected Players=%d, got %d", status.Players, retrieved.Players)
	}
}

func TestMemoryCache_Expiration(t *testing.T) {
	cache := NewMemoryCache(100 * time.Millisecond)

	status := &models.ServerStatus{
		Online:      true,
		Players:     5,
		MaxPlayers:  10,
		Version:     "1.20.1",
		Ping:        30,
		LastUpdated: time.Now(),
	}

	// Set status
	cache.SetServerStatus(1, status)

	// Should be found immediately
	_, found := cache.GetServerStatus(1)
	if !found {
		t.Fatal("Expected to find cached status immediately")
	}

	// Wait for expiration
	time.Sleep(150 * time.Millisecond)

	// Should not be found after expiration
	_, found = cache.GetServerStatus(1)
	if found {
		t.Fatal("Expected cached status to be expired")
	}
}

func TestMemoryCache_GetAllServerStatuses(t *testing.T) {
	cache := NewMemoryCache(time.Minute)

	status1 := &models.ServerStatus{Online: true, Players: 10, MaxPlayers: 20}
	status2 := &models.ServerStatus{Online: false, Players: 0, MaxPlayers: 30}

	cache.SetServerStatus(1, status1)
	cache.SetServerStatus(2, status2)

	all := cache.GetAllServerStatuses()

	if len(all) != 2 {
		t.Errorf("Expected 2 cached statuses, got %d", len(all))
	}

	if all[1].Players != 10 {
		t.Errorf("Expected server 1 to have 10 players, got %d", all[1].Players)
	}

	if all[2].Online != false {
		t.Errorf("Expected server 2 to be offline, got %t", all[2].Online)
	}
}

func TestMemoryCache_ClearExpiredEntries(t *testing.T) {
	cache := NewMemoryCache(100 * time.Millisecond)

	status := &models.ServerStatus{Online: true, Players: 5, MaxPlayers: 10}

	cache.SetServerStatus(1, status)
	cache.SetServerStatus(2, status)

	// Wait for expiration
	time.Sleep(150 * time.Millisecond)

	// Clear expired entries
	cache.ClearExpiredEntries()

	// Cache should be empty
	if cache.Size() != 0 {
		t.Errorf("Expected cache to be empty after clearing expired entries, got size %d", cache.Size())
	}
}

func TestStatusCacheManager_WithFallback(t *testing.T) {
	manager := NewStatusCacheManager()

	// Test fallback for non-existent server
	status := manager.GetServerStatusWithFallback(999)

	if status.Online != false {
		t.Errorf("Expected fallback status to be offline, got %t", status.Online)
	}

	if status.Version != "Unknown" {
		t.Errorf("Expected fallback version to be 'Unknown', got %s", status.Version)
	}
}
