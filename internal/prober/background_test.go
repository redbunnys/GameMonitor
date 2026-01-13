package prober

import (
	"game-server-monitor/internal/database"
	"testing"
	"time"
)

func TestBackgroundProber_StartStop(t *testing.T) {
	// Skip this test for now as it requires a proper database setup
	// This test would need a mock database service or test database
	t.Skip("Skipping integration test - requires database setup")
}

func TestBackgroundProber_IntervalConfiguration(t *testing.T) {
	dbService := &database.DatabaseService{}

	config := &BackgroundProberConfig{
		ProbeInterval: time.Second,
		CacheTTL:      time.Minute,
		MaxRetries:    1,
	}

	prober := NewBackgroundProber(dbService, config)

	// Test initial interval
	if prober.GetProbeInterval() != time.Second {
		t.Errorf("Expected initial interval to be 1s, got %v", prober.GetProbeInterval())
	}

	// Test setting new interval
	newInterval := 2 * time.Second
	prober.SetProbeInterval(newInterval)

	if prober.GetProbeInterval() != newInterval {
		t.Errorf("Expected interval to be %v, got %v", newInterval, prober.GetProbeInterval())
	}
}

func TestProberService_Creation(t *testing.T) {
	dbService := &database.DatabaseService{}

	// Test default service creation
	service := NewProberService(dbService)
	if service == nil {
		t.Fatal("Expected service to be created")
	}

	if service.IsRunning() {
		t.Error("Expected service to not be running initially")
	}

	// Test service with custom config
	config := &BackgroundProberConfig{
		ProbeInterval: 5 * time.Second,
		CacheTTL:      10 * time.Minute,
		MaxRetries:    5,
	}

	customService := NewProberServiceWithConfig(dbService, config)
	if customService == nil {
		t.Fatal("Expected custom service to be created")
	}

	if customService.GetProbeInterval() != 5*time.Second {
		t.Errorf("Expected custom interval to be 5s, got %v", customService.GetProbeInterval())
	}
}
