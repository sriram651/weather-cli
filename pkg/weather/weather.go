package weather

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type WeatherResp struct {
	City        string  `json:"city"`
	TempC       float64 `json:"temp_c"`
	Description string  `json:"description"`
	Timestamp   string  `json:"time"`
	Lat         float64 `json:"lat,omitempty"`
	Lon         float64 `json:"lon,omitempty"`
}

var httpClient = &http.Client{Timeout: 10 * time.Second}

// cityEntry is a permissive struct for your locations file.
// It tries common field names so it works with small variations.
type cityEntry struct {
	Name      string  `json:"name"`
	City      string  `json:"city"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Lat       float64 `json:"lat"`
	Lon       float64 `json:"lon"`
}

// readCities tries to read locations/cities.json from the repo root.
// It returns a map keyed by lowercased city name -> (lat, lon).
func readCities() map[string][2]float64 {
	// default fallback map with Chennai
	out := map[string][2]float64{
		"chennai": {13.0827, 80.2707},
	}

	// try to read locations/cities.json relative to working dir
	paths := []string{
		"locations/cities.json",
		filepath.Join("..", "locations", "cities.json"), // in case of different cwd during tests
	}
	var data []byte
	var err error
	for _, p := range paths {
		data, err = os.ReadFile(p)
		if err == nil {
			break
		}
	}
	if err != nil || len(data) == 0 {
		// give up, return fallback
		return out
	}

	// expect either an array of objects or an object mapping names -> coords
	// Try array first
	var arr []cityEntry
	if err := json.Unmarshal(data, &arr); err == nil && len(arr) > 0 {
		for _, e := range arr {
			name := strings.ToLower(strings.TrimSpace(firstNonEmpty(e.Name, e.City)))
			if name == "" {
				continue
			}
			lat := firstNonZero(e.Lat, e.Latitude)
			lon := firstNonZero(e.Lon, e.Longitude)
			if lat != 0 || lon != 0 {
				out[name] = [2]float64{lat, lon}
			}
		}
		return out
	}

	// Try object mapping: { "chennai": { "lat": 13.0, "lon": 80.0 }, ... }
	var obj map[string]map[string]float64
	if err := json.Unmarshal(data, &obj); err == nil && len(obj) > 0 {
		for k, v := range obj {
			lat := v["lat"]
			if lat == 0 {
				lat = v["latitude"]
			}
			lon := v["lon"]
			if lon == 0 {
				lon = v["longitude"]
			}
			out[strings.ToLower(strings.TrimSpace(k))] = [2]float64{lat, lon}
		}
		return out
	}

	// If everything fails, return fallback
	return out
}

func firstNonEmpty(s1, s2 string) string {
	if strings.TrimSpace(s1) != "" {
		return s1
	}
	return s2
}

func firstNonZero(f1, f2 float64) float64 {
	if f1 != 0 {
		return f1
	}
	return f2
}

// GetWeather looks up coordinates for the city, calls Open-Meteo current_weather,
// and returns a sanitized WeatherResp.
func GetWeather(ctx context.Context, city string) (WeatherResp, error) {
	if city == "" {
		city = "chennai"
	}
	cityKey := strings.ToLower(strings.TrimSpace(city))

	cities := readCities()
	coords, ok := cities[cityKey]
	lat := coords[0]
	lon := coords[1]
	if !ok {
		// try simple heuristic: if user passed "chennai, in" or extra words, trim to first token
		first := strings.Split(cityKey, ",")[0]
		if v, ok2 := cities[first]; ok2 {
			lat, lon = v[0], v[1]
		} else {
			// keep Chennai fallback if nothing found
			lat, lon = cities["chennai"][0], cities["chennai"][1]
		}
	}

	// build Open-Meteo URL for current weather
	// timezone=auto will return time in local timezone when available
	url := fmt.Sprintf("https://api.open-meteo.com/v1/forecast?latitude=%f&longitude=%f&current_weather=true&timezone=auto", lat, lon)

	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	resp, err := httpClient.Do(req)
	if err != nil {
		return WeatherResp{}, err
	}
	defer resp.Body.Close()

	var raw struct {
		Latitude       float64 `json:"latitude"`
		Longitude      float64 `json:"longitude"`
		Generationtime float64 `json:"generationtime_ms"`
		CurrentWeather struct {
			Temperature float64 `json:"temperature"`
			WeatherCode int     `json:"weathercode"`
			Time        string  `json:"time"`
			Windspeed   float64 `json:"windspeed"`
			Winddir     float64 `json:"winddirection"`
		} `json:"current_weather"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&raw); err != nil {
		return WeatherResp{}, err
	}

	// Minimal description: you can later wire your weather_codes package here.
	desc := fmt.Sprintf("code:%d (live-open-meteo)", raw.CurrentWeather.WeatherCode)

	out := WeatherResp{
		City:        city,
		TempC:       raw.CurrentWeather.Temperature,
		Description: desc,
		Timestamp:   raw.CurrentWeather.Time,
		Lat:         raw.Latitude,
		Lon:         raw.Longitude,
	}
	return out, nil
}
