# Weather App 🌤️

A weather application built with Go and Next.js that provides real-time weather data for cities worldwide. Available as both a web application and CLI tool.

## 🌐 Web Version (v1.0)

Modern web application with Go backend and Next.js frontend.

### Features
- 🎨 **Modern UI**: Clean, responsive design with dark mode support
- 🌡️ **Real-time Weather**: Temperature (°C/°F toggle), humidity, precipitation
- ⭐ **Favorites**: Save up to 5 cities with localStorage persistence
- 🔄 **Live Updates**: Weather data refreshes every 15 minutes
- ⚡ **Redis Caching**: Fast response times (~2ms vs ~500ms) with 15-minute cache
- 🏙️ **Global Cities**: Supports Indian metros plus international cities (London, NYC, Toronto, etc.)

### Quick Start

#### Backend (Go Server)
```bash
# Optional: Start Redis for caching (improves performance)
redis-server

# Start the API server
go run server/main.go

# Server runs on http://localhost:8080
```

> **Note:** Redis is optional. The server works without it but responses will be slower (when scaled).

#### Frontend (Next.js)
```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

### Project Structure
```
weather-cli/
├── server/                      # Go HTTP API server
│   ├── main.go
│   ├── pkg/                     # Shared Go packages
│   │   ├── cache/              # Redis caching layer
│   │   └── weather/            # Weather API client
│   └── REDIS_CACHING_GUIDE.md  # Caching implementation guide
├── frontend/                    # Next.js web application
│   ├── src/
│   │   ├── app/                # Next.js pages
│   │   ├── components/         # React components
│   │   ├── hooks/              # Custom React hooks (useFavourites)
│   │   └── types/              # TypeScript definitions
│   └── package.json
├── locations/                   # City coordinates database
│   └── cities.json
└── weather_codes/               # Weather descriptions
    └── data.json
```

### API Endpoints
- `GET /weather?city={city}` - Get weather for a city

Example:
```bash
curl "http://localhost:8080/weather?city=chennai"
```

---

## 💻 CLI Version (v0)

Simple command-line interface for quick weather checks.

### Quick Start
```bash
cd cli
go run .
```

Full CLI documentation: [cli/README.md](cli/README.md)

---

## 🌍 Supported Cities

Indian metros (Chennai, Mumbai, Delhi, Bangalore, Hyderabad, Kolkata, Pune, Coimbatore) and international cities (London, New York, Los Angeles, Toronto, and more). See `locations/cities.json` for the complete list.

### Adding New Cities
Edit `locations/cities.json`:
```json
{
  "cityname": {
    "lat": 12.34,
    "lon": 56.78
  }
}
```

## 🔧 Technical Stack

### Backend
- **Language**: Go 1.19+
- **API**: Open-Meteo (free, no API key required)
- **Server**: Native Go HTTP server with CORS
- **Cache**: Redis (optional, for performance optimization)
- **Dependencies**: `github.com/redis/go-redis/v9`

### Frontend
- **Framework**: Next.js 15 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State**: React hooks (useState, useEffect)

## 📝 Environment Variables

Optional configuration:

```bash
# Backend — Redis Configuration (optional, defaults to localhost:6379)
export REDIS_ADDR="localhost:6379"
export REDIS_PASSWORD=""  # Leave empty if no password

# Frontend — API URL (optional, defaults to http://localhost:8080)
export NEXT_PUBLIC_API_URL="http://localhost:8080"
```

**Redis Caching Benefits:**
- ⚡ **250x faster** responses (2ms vs 500ms)
- 💰 Reduced API calls to Open-Meteo
- 🛡️ Graceful degradation - works without Redis

## 🚀 Development

### Backend Development
```bash
# Optional: Start Redis for development
redis-server

# Run server with auto-reload (using air)
cd server
air

# Or run directly
go run server/main.go
```

For detailed Redis setup and caching architecture, see [server/REDIS_CACHING_GUIDE.md](server/REDIS_CACHING_GUIDE.md)

### Frontend Development
```bash
cd frontend
npm run dev
```

### Building for Production
```bash
# Backend
go build -o weather-server server/main.go

# Frontend
cd frontend
npm run build
npm start
```

## 🚢 Deployment

### Backend (Fly.io)
The backend is containerized via `Dockerfile` and deployed to Fly.io.

1. Install the [Fly CLI](https://fly.io/docs/flyctl/install/) and run `flyctl auth login`
2. From the repo root: `flyctl launch` (answer **No** to "Deploy now?" to review `fly.toml` first)
3. Deploy: `flyctl deploy`
4. Optional: set Redis env vars via `flyctl secrets set REDIS_ADDR=... REDIS_PASSWORD=...`

CI/CD: A GitHub Actions workflow (`.github/workflows/fly-deploy.yml`) auto-deploys on push to `master`. Requires the `FLY_API_TOKEN` secret in GitHub (Fly sets this automatically during `flyctl launch`).

### Frontend (Vercel)
1. Import the repo on [Vercel](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Set environment variable: `NEXT_PUBLIC_API_URL=https://your-backend.fly.dev`
4. Deploy — Vercel auto-detects Next.js

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

Built with ❤️ using Go and Next.js
