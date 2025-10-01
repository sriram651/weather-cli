# Weather CLI 🌤️

A simple command-line weather application built with Go that fetches real-time weather data for Indian cities.

## Features

- 🏙️ **Indian Cities Support**: Get weather for major Indian metropolitan cities
- 🌡️ **Comprehensive Weather Data**: Temperature, humidity, rain, weather conditions
- 🕐 **Real-time Information**: Live weather updates with timestamps
- 📍 **Location Details**: Latitude, longitude, elevation, and timezone
- 🚨 **Error Handling**: User-friendly error messages for invalid inputs
- 🎯 **Interactive CLI**: Simple city name input with validation

## Installation

### Prerequisites
- Go 1.19 or higher
- Internet connection for weather data

### Quick Start
1. Clone the repository:
```bash
git clone https://github.com/yourusername/weather-cli.git
cd weather-cli/cli
```

2. Run the application:
```bash
go run .
```

### Build Binary (Optional)
```bash
# Build executable
go build -o weather

# Run the binary
./weather
```

## Usage

1. Start the application:
```bash
go run .
```

2. Enter an Indian city name when prompted:
```
Type in any Indian Metro City to get the weather: chennai
```

3. View the weather details:
```
Weather Details:
  Latitude     : 13.0000
  Longitude    : 80.1250
  Timezone      : GMT
  Elevation     : 12.00 meters
  Current Time  : Thursday, Aug 14, 2025 - 4:00 PM
  Interval      : 900 seconds
  Rain          : 0.000000 mm
  Weather Code  : Overcast
```

## Supported Cities

The application currently supports major Indian metropolitan cities. To see all supported cities, check the `../locations/cities.json` file.

*Common cities include: Chennai, Mumbai, Delhi, Bangalore, Hyderabad, Kolkata, Pune, Coimbatore, Madurai, Tirunelveli, and more.*

## Project Structure

```
cli/
├── main.go                    # Main application entry point
├── go.mod                     # Go module definition
├── structs.go                 # Weather data structures
├── displayWeather.go          # Weather formatting and display
├── buildUriWithLocation.go    # API URL construction
└── returnFormat.json          # API response reference

Shared resources (in parent directory):
├── locations/                 # Location data
│   └── cities.json           # City coordinates database
└── weather_codes/            # Weather code mappings
    └── data.json            # Weather code to description mapping
```

## Error Handling

The application provides helpful error messages for common scenarios:

- **Invalid City**: "City not found in our database"
- **File Access Issues**: "File specified cannot be accessed"
- **Network Problems**: Connection and API-related errors
- **Invalid Input**: Empty or malformed city names

## API

This application uses the [Open-Meteo API](https://open-meteo.com/) for weather data:
- **Free to use**: No API key required
- **Real-time data**: 15-minute refresh intervals
- **Comprehensive**: Temperature, humidity, precipitation, weather codes

### Adding New Cities

To add support for new cities:
1. Edit `../locations/cities.json`
2. Add city name (lowercase) with latitude and longitude coordinates
3. Test with the application

## Technical Details

- **Language**: Go 1.19+
- **Architecture**: Modular package design
- **API**: RESTful HTTP requests with JSON responses
- **Data Storage**: JSON file-based city database
- **Error Handling**: Comprehensive error checking and user feedback

## License

This project is open source and available under the [MIT License](../LICENSE).

---

Built with ❤️ using Go
