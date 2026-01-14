# Game Server Monitor

[中文文档](README_CN.md) | English

A modern web application for real-time monitoring of Minecraft and CS2 game server status.

## Features

- 🎮 **Multi-Protocol Support** - Monitor Minecraft and CS2 servers
- 📊 **Real-time Monitoring** - Live server status updates with automatic probing
- 🎨 **Modern UI** - Beautiful slate-themed interface with responsive design
- 🔐 **Secure Admin Panel** - JWT-based authentication with password management
- 📝 **Markdown Support** - Rich server descriptions with Markdown formatting
- 🚀 **Single Binary Deployment** - Frontend embedded in Go binary for easy deployment
- ⚡ **High Performance** - Built with Go and React for optimal performance
- 🔄 **Auto-refresh** - Configurable automatic status updates

## Tech Stack

### Backend
- **Go 1.21+** - High-performance system language
- **Gin Framework** - Lightweight HTTP web framework
- **GORM + SQLite** - ORM and embedded database
- **JWT** - Authentication
- **Protocol Libraries**:
  - `github.com/xrjr/mcutils` - Minecraft protocol
  - `github.com/rumblefrog/go-a2s` - Source Query protocol

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Modern CSS framework
- **Zustand** - State management
- **React Router** - Routing
- **Axios** - HTTP client
- **Vite** - Build tool

## Project Structure

```
game-server-monitor/
├── main.go                     # Main entry point
├── go.mod                      # Go module definition
├── build.sh                    # Production build script
├── dev.sh                      # Development script
├── internal/                   # Internal packages
│   ├── models/                 # Data models
│   ├── database/               # Database layer
│   ├── handlers/               # HTTP handlers
│   ├── auth/                   # Authentication
│   ├── middleware/             # Middleware
│   ├── prober/                 # Server probing service
│   └── cache/                  # Caching layer
└── frontend/                   # Frontend application
    ├── src/
    │   ├── components/         # React components
    │   ├── pages/              # Page components
    │   ├── stores/             # Zustand stores
    │   ├── services/           # API services
    │   └── types/              # TypeScript types
    ├── package.json
    └── vite.config.ts
```

## Getting Started

### Prerequisites
- Go 1.21+
- Node.js 18+
- pnpm (recommended) or npm

### Development Setup

1. **Install dependencies**:
   ```bash
   # Go dependencies
   go mod tidy
   
   # Frontend dependencies
   cd frontend
   pnpm install
   cd ..
   ```

2. **Start development environment**:
   ```bash
   # Using default settings
   ./dev.sh
   
   # Or with custom environment variables
   PORT=3000 JWT_SECRET=my-secret ./dev.sh
   ```
   
   This will start:
   - Frontend dev server: http://localhost:5173
   - Backend API server: http://localhost:8080 (or your custom PORT)

### Production Build

```bash
./build.sh
```

This will:
1. Build frontend to `frontend/dist/`
2. Embed frontend assets into Go binary
3. Generate single executable `game-server-monitor`

### Run Production Build

```bash
# Using default settings
./game-server-monitor

# With custom environment variables
PORT=8080 JWT_SECRET=your-secret-key GIN_MODE=release ./game-server-monitor

# Or export variables first
export PORT=8080
export JWT_SECRET=your-secret-key
export GIN_MODE=release
./game-server-monitor
```

The application will be available at http://localhost:8080 (or your custom PORT)

### Deployment

#### Using Systemd (Linux)

1. Copy the binary and create necessary directories:
   ```bash
   sudo mkdir -p /opt/game-server-monitor
   sudo cp game-server-monitor /opt/game-server-monitor/
   ```

2. Create systemd service:
   ```bash
   sudo cp game-server-monitor.service.example /etc/systemd/system/game-server-monitor.service
   sudo nano /etc/systemd/system/game-server-monitor.service
   # Update environment variables in the service file
   ```

3. Enable and start the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable game-server-monitor
   sudo systemctl start game-server-monitor
   sudo systemctl status game-server-monitor
   ```

#### Using Docker (Coming Soon)

Docker support is planned for future releases.

## Default Credentials

**Username**: `admin`  
**Password**: `admin123`

⚠️ **Important**: Change the default password immediately after first login!

## Usage

### Adding Servers

1. Log in to the admin panel
2. Click "添加新服务器" (Add New Server)
3. Fill in server details:
   - Server name
   - Game type (Minecraft or CS2)
   - Server address and port
   - Description (supports Markdown)
4. Click "保存" (Save)

### Monitoring Servers

- View all servers on the homepage
- Real-time status updates (online/offline)
- Player count and server capacity
- Response latency
- Click "查看详情" (View Details) for more information

### Managing Servers

- Edit server information
- Delete servers
- Change admin password
- View server statistics

## API Endpoints

### Public Endpoints
- `GET /api/servers` - Get all servers with status
- `GET /api/servers/:id` - Get specific server details
- `POST /api/auth/login` - Admin login

### Protected Endpoints (Require JWT)
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/validate` - Validate token

### Admin Endpoints (Require JWT)
- `GET /api/admin/servers` - Get all servers (admin view)
- `POST /api/admin/servers` - Create new server
- `PUT /api/admin/servers/:id` - Update server
- `DELETE /api/admin/servers/:id` - Delete server
- `POST /api/admin/users` - Create user
- `GET /api/admin/users` - List users
- `DELETE /api/admin/users/:id` - Delete user
- `POST /api/admin/users/:id/reset-password` - Reset user password

## Configuration

### Environment Variables

The application can be configured using environment variables. Set them directly when running the application:

```bash
# Set environment variables and run
PORT=8080 JWT_SECRET=your-secret-key ./game-server-monitor

# Or export them first
export PORT=8080
export JWT_SECRET=your-secret-key
./game-server-monitor
```

Available environment variables:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | HTTP server port | `8080` | No |
| `JWT_SECRET` | Secret key for JWT token signing | `bWHnEE0TtwPZvbspvsfb` | **Yes (Production)** |
| `GIN_MODE` | Gin framework mode (`debug` or `release`) | `debug` | No |

**⚠️ Security Warning**: Always change `JWT_SECRET` in production! Use a strong, random string.

Generate a secure JWT secret:
```bash
# Using openssl
openssl rand -base64 32

# Using Go
go run -c 'package main; import ("crypto/rand"; "encoding/base64"; "fmt"); func main() { b := make([]byte, 32); rand.Read(b); fmt.Println(base64.StdEncoding.EncodeToString(b)) }'
```

### Server Probing

The application automatically probes servers every 30 seconds. This can be configured in `internal/prober/prober.go`.

### Rate Limiting

API endpoints are rate-limited to 20 requests per 10 seconds per IP address. Configure in `main.go`.

### JWT Token

JWT tokens expire after 24 hours. Configure in `internal/auth/jwt.go`.

## Development

### Running Tests

```bash
# Backend tests
go test ./...

# Frontend tests
cd frontend
pnpm test
```

### Code Structure

- **Handlers**: HTTP request handlers in `internal/handlers/`
- **Models**: Data models in `internal/models/`
- **Database**: Database operations in `internal/database/`
- **Prober**: Server probing logic in `internal/prober/`
- **Auth**: Authentication and JWT in `internal/auth/`
- **Frontend**: React application in `frontend/src/`

## Troubleshooting

### Server Not Responding

- Check if the server address and port are correct
- Ensure the server has query protocol enabled
- Check firewall settings

### Login Issues

- Verify credentials
- Check if JWT token has expired
- Clear browser cache and try again

### Build Issues

- Ensure all dependencies are installed
- Check Go and Node.js versions
- Run `go mod tidy` and `pnpm install`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

AGPL-3.0 is a strong copyleft license that ensures:

- ✅ You can freely use, modify, and distribute this software
- ✅ You can use this software for commercial purposes
- ⚠️ If you modify this software and provide it as a network service, you must disclose your source code
- ⚠️ Any derivative works must also be licensed under AGPL-3.0
- ⚠️ You must retain the original copyright and license notices

See the [LICENSE](LICENSE) file for full details.

## Support

For issues and questions, please open an issue on GitHub.
