package main

import (
	"fmt"
	"game-server-monitor/internal/models"
	"game-server-monitor/internal/prober"
)

func main() {
	// Create a new prober
	p := prober.NewServerProber()

	// Test with the real Minecraft server
	fmt.Println("Testing real Minecraft server: mc.zn.al:25567")

	testServer := &models.Server{
		ID:      1,
		Name:    "ZN.AL Minecraft Server",
		Type:    "minecraft",
		Address: "mc.zn.al",
		Port:    25567,
	}

	status := p.ProbeServer(testServer)

	fmt.Printf("=== Server Status ===\n")
	fmt.Printf("Server: %s\n", testServer.Name)
	fmt.Printf("Address: %s:%d\n", testServer.Address, testServer.Port)
	fmt.Printf("Online: %t\n", status.Online)

	if status.Online {
		fmt.Printf("Players: %d/%d\n", status.Players, status.MaxPlayers)
		fmt.Printf("Version: %s\n", status.Version)
		fmt.Printf("Ping: %dms\n", status.Ping)
	} else {
		fmt.Printf("Status: Offline\n")
	}

	fmt.Printf("Last Updated: %s\n", status.LastUpdated.Format("2006-01-02 15:04:05"))

	// Test direct probe method as well
	fmt.Println("\n=== Direct Probe Test ===")
	directStatus, err := p.ProbeMinecraft("mc.zn.al", 25567)
	if err != nil {
		fmt.Printf("Direct probe failed: %v\n", err)
	} else {
		fmt.Printf("Direct probe successful!\n")
		fmt.Printf("Players: %d/%d\n", directStatus.Players, directStatus.MaxPlayers)
		fmt.Printf("Version: %s\n", directStatus.Version)
		fmt.Printf("Ping: %dms\n", directStatus.Ping)
	}
}
