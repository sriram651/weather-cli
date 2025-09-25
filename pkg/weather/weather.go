package weather

import (
	"context"
	"time"
)

// WeatherResp is the minimal shape we return for v0.1
type WeatherResp struct {
	City        string  `json:"city"`
	TempC       float64 `json:"temp_c"`
	Description string  `json:"description"`
	Timestamp   string  `json:"time"`
	Lat         float64 `json:"lat,omitempty"`
	Lon         float64 `json:"lon,omitempty"`
}

// GetWeather returns a simple stub response for now.
// Later we'll replace the body with your existing CLI logic or call into the locations data.
func GetWeather(ctx context.Context, city string) (WeatherResp, error) {
	if city == "" {
		city = "chennai"
	}
	return WeatherResp{
		City:        city,
		TempC:       33.4,
		Description: "Partly Cloudy (stub)",
		Timestamp:   time.Now().Format(time.RFC3339),
		Lat:         13.0827,
		Lon:         80.2707,
	}, nil
}
