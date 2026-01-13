package prober

import (
	"game-server-monitor/internal/models"
	"testing"
	"time"
)

func TestNewServerProber(t *testing.T) {
	prober := NewServerProber()
	if prober == nil {
		t.Fatal("Expected prober to be created, got nil")
	}

	defaultProber, ok := prober.(*DefaultServerProber)
	if !ok {
		t.Fatal("Expected DefaultServerProber type")
	}

	if defaultProber.timeout != 5*time.Second {
		t.Errorf("Expected default timeout of 5s, got %v", defaultProber.timeout)
	}
}

func TestNewServerProberWithTimeout(t *testing.T) {
	customTimeout := 10 * time.Second
	prober := NewServerProberWithTimeout(customTimeout)

	defaultProber, ok := prober.(*DefaultServerProber)
	if !ok {
		t.Fatal("Expected DefaultServerProber type")
	}

	if defaultProber.timeout != customTimeout {
		t.Errorf("Expected timeout of %v, got %v", customTimeout, defaultProber.timeout)
	}
}

func TestProbeServerWithUnknownType(t *testing.T) {
	prober := NewServerProber()

	server := &models.Server{
		ID:      1,
		Name:    "Test Server",
		Type:    "unknown",
		Address: "localhost",
		Port:    25565,
	}

	status := prober.ProbeServer(server)

	if status.Online {
		t.Error("Expected server to be offline for unknown type")
	}

	if status.Version != "Unknown" {
		t.Errorf("Expected version to be 'Unknown', got %s", status.Version)
	}
}

func TestProbeServerWithRetryOfflineServer(t *testing.T) {
	prober := NewServerProber()

	// Use a non-existent server
	server := &models.Server{
		ID:      1,
		Name:    "Offline Server",
		Type:    "minecraft",
		Address: "192.0.2.1", // RFC 5737 test address that should not respond
		Port:    25565,
	}

	status := prober.ProbeServerWithRetry(server, 1) // Only 1 retry for faster test

	if status.Online {
		t.Error("Expected server to be offline")
	}

	if status.Players != 0 {
		t.Errorf("Expected 0 players, got %d", status.Players)
	}

	if status.MaxPlayers != 0 {
		t.Errorf("Expected 0 max players, got %d", status.MaxPlayers)
	}
}
