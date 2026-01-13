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

	// Test both Minecraft and CS2 servers
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
			Name:    "CS2 Test Server",
			Type:    "cs2",
			Address: "110.42.9.142",
			Port:    27028,
		},
	}

	fmt.Println("=== Multi-Protocol Server Monitor Test ===\n")

	for i, server := range servers {
		fmt.Printf("%d. Testing %s Server: %s (%s:%d)\n",
			i+1,
			map[string]string{"minecraft": "Minecraft", "cs2": "CS2"}[server.Type],
			server.Name,
			server.Address,
			server.Port)

		startTime := time.Now()
		status := p.ProbeServer(server)
		duration := time.Since(startTime)

		if status.Online {
			fmt.Printf("   ✅ ONLINE\n")
			fmt.Printf("   👥 Players: %d/%d", status.Players, status.MaxPlayers)

			// Calculate server load percentage
			if status.MaxPlayers > 0 {
				loadPercent := float64(status.Players) / float64(status.MaxPlayers) * 100
				fmt.Printf(" (%.1f%% full)", loadPercent)
			}
			fmt.Println()

			fmt.Printf("   🎮 Version: %s\n", status.Version)
			fmt.Printf("   📡 Ping: %dms\n", status.Ping)

			// Server load indicator
			if status.MaxPlayers > 0 {
				loadPercent := float64(status.Players) / float64(status.MaxPlayers) * 100
				var loadStatus string
				switch {
				case loadPercent >= 90:
					loadStatus = "🔴 Nearly Full"
				case loadPercent >= 70:
					loadStatus = "🟡 Busy"
				case loadPercent >= 30:
					loadStatus = "🟢 Active"
				default:
					loadStatus = "🔵 Available"
				}
				fmt.Printf("   📊 Load: %s\n", loadStatus)
			}
		} else {
			fmt.Printf("   ❌ OFFLINE\n")
		}

		fmt.Printf("   ⏱️  Response time: %v\n", duration.Round(time.Millisecond))
		fmt.Printf("   🕒 Last checked: %s\n\n", status.LastUpdated.Format("15:04:05"))
	}

	// Performance comparison
	fmt.Println("=== Performance Comparison ===")

	// Test multiple probes for performance analysis
	fmt.Println("Running 5 consecutive probes on each server...")

	for _, server := range servers {
		fmt.Printf("\n%s (%s):\n", server.Name, server.Type)

		var totalTime time.Duration
		var successCount int

		for i := 0; i < 5; i++ {
			start := time.Now()
			status := p.ProbeServer(server)
			duration := time.Since(start)
			totalTime += duration

			if status.Online {
				successCount++
				fmt.Printf("  Probe %d: ✅ %dms (Players: %d/%d)\n",
					i+1, duration.Milliseconds(), status.Players, status.MaxPlayers)
			} else {
				fmt.Printf("  Probe %d: ❌ %dms (Offline)\n",
					i+1, duration.Milliseconds())
			}
		}

		avgTime := totalTime / 5
		successRate := float64(successCount) / 5 * 100

		fmt.Printf("  📈 Average response: %v\n", avgTime.Round(time.Millisecond))
		fmt.Printf("  📊 Success rate: %.0f%%\n", successRate)
	}
}
