package main

import (
	"fmt"
	"game-server-monitor/internal/models"
	"game-server-monitor/internal/prober"
	"time"
)

func main() {
	// Create a new prober
	p := prober.NewServerProber()

	// Test multiple servers
	servers := []*models.Server{
		{
			ID:      1,
			Name:    "ZN.AL Minecraft Server",
			Type:    "minecraft",
			Address: "mc.zn.al",
			Port:    25567,
		},
		{
			ID:      2,
			Name:    "Offline Test Server",
			Type:    "minecraft",
			Address: "192.0.2.1", // RFC 5737 test address
			Port:    25565,
		},
		{
			ID:      3,
			Name:    "Invalid Domain Server",
			Type:    "minecraft",
			Address: "this-domain-does-not-exist.invalid",
			Port:    25565,
		},
	}

	fmt.Println("=== Multi-Server Probe Test ===\n")

	for i, server := range servers {
		fmt.Printf("%d. Testing: %s (%s:%d)\n", i+1, server.Name, server.Address, server.Port)

		startTime := time.Now()
		status := p.ProbeServerWithRetry(server, 1) // Only 1 retry for faster testing
		duration := time.Since(startTime)

		if status.Online {
			fmt.Printf("   ✅ ONLINE - Players: %d/%d, Version: %s, Ping: %dms\n",
				status.Players, status.MaxPlayers, status.Version, status.Ping)
		} else {
			fmt.Printf("   ❌ OFFLINE - Version: %s\n", status.Version)
		}

		fmt.Printf("   ⏱️  Total probe time: %v\n\n", duration.Round(time.Millisecond))
	}

	// Test concurrent probing
	fmt.Println("=== Concurrent Probe Test ===")
	fmt.Println("Probing ZN.AL server 3 times concurrently...")

	type result struct {
		id       int
		status   *models.ServerStatus
		err      error
		duration time.Duration
	}

	results := make(chan result, 3)

	for i := 0; i < 3; i++ {
		go func(id int) {
			start := time.Now()
			status, err := p.ProbeMinecraft("mc.zn.al", 25567)
			results <- result{
				id:       id + 1,
				status:   status,
				err:      err,
				duration: time.Since(start),
			}
		}(i)
	}

	// Collect results
	for i := 0; i < 3; i++ {
		r := <-results
		if r.err != nil {
			fmt.Printf("Probe %d: ❌ Failed - %v (took %v)\n", r.id, r.err, r.duration.Round(time.Millisecond))
		} else {
			fmt.Printf("Probe %d: ✅ Success - %d/%d players, %dms ping (took %v)\n",
				r.id, r.status.Players, r.status.MaxPlayers, r.status.Ping, r.duration.Round(time.Millisecond))
		}
	}
}
