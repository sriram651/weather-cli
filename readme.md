# Weather App 🌤️

A weather application built with Go and Next.js that provides real-time weather data for Indian cities. Available as both a web application and CLI tool.

## 🌐 Web Version (v1.0)

Modern web application with Go backend and Next.js frontend.

### Features
- 🎨 **Modern UI**: Clean, responsive design with dark mode support
- 🌡️ **Real-time Weather**: Temperature (°C/°F toggle), humidity, precipitation
- ⭐ **Favorites**: Save up to 5 cities with localStorage persistence
- 🔄 **Live Updates**: Weather data refreshes every 15 minutes
- 🏙️ **Indian Cities**: Comprehensive coverage of Indian metropolitan areas

### Quick Start

#### Backend (Go Server)
```bash
# Start the API server
go run server/main.go

# Server runs on http://localhost:8080
```

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
├── server/              # Go HTTP API server
│   ├── main.go
│   └── pkg/            # Shared Go packages
│       └── weather/    # Weather API client
├── frontend/            # Next.js web application
│   ├── src/
│   │   ├── app/        # Next.js pages
│   │   ├── components/ # React components
│   │   ├── hooks/      # Custom React hooks (useFavourites)
│   │   └── types/      # TypeScript definitions
│   └── package.json
├── locations/           # City coordinates database
│   └── cities.json
└── weather_codes/       # Weather descriptions
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

Major Indian cities including Chennai, Mumbai, Delhi, Bangalore, Hyderabad, Kolkata, Pune, Coimbatore, and more. See `locations/cities.json` for the complete list.

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

### Frontend
- **Framework**: Next.js 14+ (React)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State**: React hooks (useState, useEffect)

## 📝 Environment Variables

Create a `.env` file in the root:
```env
# Add any configuration here
```

## 🚀 Development

### Backend Development
```bash
# Run server with auto-reload (requires air or similar)
go run server/main.go
```

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

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

Built with ❤️ using Go and Next.js
