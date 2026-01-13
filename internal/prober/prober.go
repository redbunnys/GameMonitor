package prober

import (
	"fmt"
	"game-server-monitor/internal/models"
	"log"
	"time"

	"github.com/mcstatus-io/mcutil"
	"github.com/rumblefrog/go-a2s"
)

// ServerProber interface defines the contract for server probing
type ServerProber interface {
	ProbeMinecraft(address string, port int) (*models.ServerStatus, error)
	ProbeCS2(address string, port int) (*models.ServerStatus, error)
	ProbeServer(server *models.Server) *models.ServerStatus
	ProbeServerWithRetry(server *models.Server, maxRetries int) *models.ServerStatus
}

// DefaultServerProber implements the ServerProber interface
type DefaultServerProber struct {
	timeout time.Duration
}

// NewServerProber creates a new server prober with default timeout
func NewServerProber() ServerProber {
	return &DefaultServerProber{
		timeout: 5 * time.Second,
	}
}

// NewServerProberWithTimeout creates a new server prober with custom timeout
func NewServerProberWithTimeout(timeout time.Duration) ServerProber {
	return &DefaultServerProber{
		timeout: timeout,
	}
}

// ProbeMinecraft probes a Minecraft server using the mcutil library
func (p *DefaultServerProber) ProbeMinecraft(address string, port int) (*models.ServerStatus, error) {
	startTime := time.Now()

	// Query the server status
	response, err := mcutil.Status(address, uint16(port))
	if err != nil {
		return nil, fmt.Errorf("failed to query Minecraft server %s:%d: %w", address, port, err)
	}

	// Calculate ping (use response latency if available, otherwise calculate from start time)
	var ping int64
	if response.Latency > 0 {
		ping = response.Latency.Milliseconds()
	} else {
		ping = time.Since(startTime).Milliseconds()
	}

	// Parse player counts (handle nil pointers)
	var players, maxPlayers int
	if response.Players.Online != nil {
		players = int(*response.Players.Online)
	}
	if response.Players.Max != nil {
		maxPlayers = int(*response.Players.Max)
	}

	// Parse the response
	serverStatus := &models.ServerStatus{
		Online:      true,
		Players:     players,
		MaxPlayers:  maxPlayers,
		Version:     response.Version.NameClean,
		Ping:        ping,
		LastUpdated: time.Now(),
	}

	return serverStatus, nil
}

// ProbeCS2 probes a CS2/Source server using the Source Query protocol
func (p *DefaultServerProber) ProbeCS2(address string, port int) (*models.ServerStatus, error) {
	startTime := time.Now()

	// Create server address
	serverAddr := fmt.Sprintf("%s:%d", address, port)

	// Create A2S client
	client, err := a2s.NewClient(serverAddr)
	if err != nil {
		return nil, fmt.Errorf("failed to create A2S client for %s: %w", serverAddr, err)
	}
	defer client.Close()

	// Query server info
	info, err := client.QueryInfo()
	if err != nil {
		return nil, fmt.Errorf("failed to query CS2 server info %s: %w", serverAddr, err)
	}

	// Calculate ping
	ping := time.Since(startTime).Milliseconds()

	// Parse the response
	serverStatus := &models.ServerStatus{
		Online:      true,
		Players:     int(info.Players),
		MaxPlayers:  int(info.MaxPlayers),
		Version:     info.Version,
		Ping:        ping,
		LastUpdated: time.Now(),
	}

	return serverStatus, nil
}

// ProbeServer probes a server based on its type and handles errors
func (p *DefaultServerProber) ProbeServer(server *models.Server) *models.ServerStatus {
	return p.ProbeServerWithRetry(server, 3)
}

// ProbeServerWithRetry probes a server with retry mechanism and error handling
func (p *DefaultServerProber) ProbeServerWithRetry(server *models.Server, maxRetries int) *models.ServerStatus {
	var lastErr error

	for attempt := 0; attempt < maxRetries; attempt++ {
		var status *models.ServerStatus
		var err error

		switch server.Type {
		case "minecraft":
			status, err = p.ProbeMinecraft(server.Address, server.Port)
		case "cs2":
			status, err = p.ProbeCS2(server.Address, server.Port)
		default:
			log.Printf("Unknown server type '%s' for server %s", server.Type, server.Name)
			return &models.ServerStatus{
				Online:      false,
				Players:     0,
				MaxPlayers:  0,
				Version:     "Unknown",
				Ping:        0,
				LastUpdated: time.Now(),
			}
		}

		if err == nil {
			return status
		}

		lastErr = err

		// Log the attempt failure
		log.Printf("Probe attempt %d failed for server %s (%s:%d): %v",
			attempt+1, server.Name, server.Address, server.Port, err)

		// Wait before retrying (exponential backoff)
		if attempt < maxRetries-1 {
			waitTime := time.Duration(attempt+1) * time.Second
			time.Sleep(waitTime)
		}
	}

	// All attempts failed, log final error and return offline status
	log.Printf("All probe attempts failed for server %s (%s:%d): %v",
		server.Name, server.Address, server.Port, lastErr)

	return &models.ServerStatus{
		Online:      false,
		Players:     0,
		MaxPlayers:  0,
		Version:     "Unknown",
		Ping:        0,
		LastUpdated: time.Now(),
	}
}
