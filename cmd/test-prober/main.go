package main

import (
	"fmt"
	"game-server-monitor/internal/models"
	"game-server-monitor/internal/prober"
)

func main() {
	// Create a new prober
	p := prober.NewServerProber()

	// Test with a well-known Minecraft server (demo.minetest.net)
	fmt.Println("Testing Minecraft server probing...")

	testServer := &models.Server{
		ID:      1,
		Name:    "Demo Minecraft Server",
		Type:    "minecraft",
		Address: "demo.minetest.net",
		Port:    30000,
	}

	status := p.ProbeServer(testServer)

	fmt.Printf("Server: %s\n", testServer.Name)
	fmt.Printf("Online: %t\n", status.Online)
	fmt.Printf("Players: %d/%d\n", status.Players, status.MaxPlayers)
	fmt.Printf("Version: %s\n", status.Version)
	fmt.Printf("Ping: %dms\n", status.Ping)
	fmt.Printf("Last Updated: %s\n", status.LastUpdated.Format("2006-01-02 15:04:05"))

	// Test with an offline server
	fmt.Println("\nTesting offline server...")

	offlineServer := &models.Server{
		ID:      2,
		Name:    "Offline Server",
		Type:    "minecraft",
		Address: "192.0.2.1", // RFC 5737 test address
		Port:    25565,
	}

	offlineStatus := p.ProbeServerWithRetry(offlineServer, 1) // Only 1 retry for demo

	fmt.Printf("Server: %s\n", offlineServer.Name)
	fmt.Printf("Online: %t\n", offlineStatus.Online)
	fmt.Printf("Players: %d/%d\n", offlineStatus.Players, offlineStatus.MaxPlayers)
	fmt.Printf("Version: %s\n", offlineStatus.Version)
	fmt.Printf("Ping: %dms\n", offlineStatus.Ping)
	fmt.Printf("Last Updated: %s\n", offlineStatus.LastUpdated.Format("2006-01-02 15:04:05"))
}
