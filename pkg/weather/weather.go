package weather

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
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
	WeatherCode int     `json:"weather_code"`
	Humidity    float64 `json:"relative_humidity_2m"`
	Rain        float64 `json:"rain"`
}

// Reusable HTTP client with a 10s timeout.
// Saves resources vs creating new clients for every request,
// and avoids hanging forever if the API is slow.
var httpClient = &http.Client{Timeout: 10 * time.Second}

// cityEntry is an internal helper for decoding cities.json.
// It tolerates different field names (name/city, lat/latitude, lon/longitude).
// Not exported (lowercase c) because it's only used inside this package.
type cityEntry struct {
	Name      string  `json:"name"`
	City      string  `json:"city"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Lat       float64 `json:"lat"`
	Lon       float64 `json:"lon"`
}

// readCities loads locations/cities.json into a map: cityName -> [lat, lon].
// 1. Always starts with a Chennai fallback (so it never breaks).
// 2. Tries to parse JSON as array of cityEntry objects.
// 3. If that fails, tries JSON as object map (name -> coords).
// 4. Falls back to Chennai only if everything fails.
func readCities() (map[string][2]float64, error) {
	// try to read locations/cities.json relative to working dir or parent
	paths := []string{
		"locations/cities.json",
		filepath.Join("..", "locations", "cities.json"),
	}

	var data []byte
	var lastErr error
	for _, p := range paths {
		data, lastErr = os.ReadFile(p)
		if lastErr == nil && len(data) > 0 {
			break
		}
	}

	if lastErr != nil || len(data) == 0 {
		return nil, fmt.Errorf("readCities: failed to read locations/cities.json: %w", lastErr)
	}

	out := make(map[string][2]float64)

	// try array-of-objects first
	var arr []cityEntry
	if err := json.Unmarshal(data, &arr); err == nil && len(arr) > 0 {
		for _, e := range arr {
			name := strings.ToLower(strings.TrimSpace(firstNonEmpty(e.Name, e.City)))
			if name == "" {
				continue
			}
			lat := firstNonZero(e.Lat, e.Latitude)
			lon := firstNonZero(e.Lon, e.Longitude)
			// only add if we have non-zero coords
			if lat != 0 || lon != 0 {
				out[name] = [2]float64{lat, lon}
			}
		}
		if len(out) == 0 {
			return nil, fmt.Errorf("readCities: parsed file but found no valid entries")
		}
		return out, nil
	}

	// try object mapping: { "city": { "lat": .., "lon": .. }, ... }
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
			if lat != 0 || lon != 0 {
				out[strings.ToLower(strings.TrimSpace(k))] = [2]float64{lat, lon}
			}
		}
		if len(out) == 0 {
			return nil, fmt.Errorf("readCities: parsed object but found no valid coords")
		}
		return out, nil
	}

	// everything failed
	return nil, fmt.Errorf("readCities: unsupported JSON structure or empty file")
}

// firstNonEmpty picks the first non-blank string.
// Useful for preferring Name over City when decoding cities.json.
func firstNonEmpty(s1, s2 string) string {
	if strings.TrimSpace(s1) != "" {
		return s1
	}
	return s2
}

// firstNonZero picks the first non-zero float.
// Useful for preferring Lat over Latitude, Lon over Longitude, etc.
func firstNonZero(f1, f2 float64) float64 {
	if f1 != 0 {
		return f1
	}
	return f2
}

// GetWeather looks up coordinates for the city, calls Open-Meteo current_weather,
// and returns a sanitized WeatherResp.
// near the top of pkg/weather/weather.go add these imports if not present:
//   "context"
//   "encoding/json"
//   "fmt"
//   "io"
//   "net/http"
//   "strings"
//   "errors"

var (
	ErrCitiesUnavailable = errors.New("cities data unavailable")
	ErrCityNotFound      = errors.New("city not found")
)

func GetWeather(ctx context.Context, city string) (WeatherResp, error) {
	if strings.TrimSpace(city) == "" {
		return WeatherResp{}, fmt.Errorf("city name is required")
	}
	cityKey := strings.ToLower(strings.TrimSpace(city))

	cities, err := readCities()
	if err != nil {
		// propagate a clear error; handler will map to 500
		return WeatherResp{}, fmt.Errorf("%w: %v", ErrCitiesUnavailable, err)
	}

	// Try exact key first, then a simple heuristic (trim after comma)
	coords, ok := cities[cityKey]
	if !ok {
		first := strings.Split(cityKey, ",")[0]
		if v, ok2 := cities[first]; ok2 {
			coords = v
		} else {
			// Let the caller decide to return 404
			return WeatherResp{}, ErrCityNotFound
		}
	}

	lat := coords[0]
	lon := coords[1]

	// build Open-Meteo URL for current weather
	url := fmt.Sprintf("https://api.open-meteo.com/v1/forecast?latitude=%f&longitude=%f&current_weather=true&timezone=auto", lat, lon)

	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	resp, err := httpClient.Do(req)
	if err != nil {
		return WeatherResp{}, fmt.Errorf("upstream request failed: %w", err)
	}
	defer resp.Body.Close()

	// if upstream returns non-200, capture body to help debugging
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return WeatherResp{}, fmt.Errorf("upstream error %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}

	var raw struct {
		Latitude       float64 `json:"latitude"`
		Longitude      float64 `json:"longitude"`
		Generationtime float64 `json:"generationtime_ms"`
		CurrentWeather struct {
			Temperature float64 `json:"temperature"`
			WeatherCode int     `json:"weather_code"`
			Time        string  `json:"time"`
			Windspeed   float64 `json:"windspeed"`
			Winddir     float64 `json:"winddirection"`
			Humidity    float64 `json:"relative_humidity_2m"`
			Rain        float64 `json:"rain"`
		} `json:"current_weather"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&raw); err != nil {
		return WeatherResp{}, fmt.Errorf("decode failed: %w", err)
	}

	codes := loadWeatherCodes()
	desc, ok := codes[raw.CurrentWeather.WeatherCode]
	if !ok {
		desc = fmt.Sprintf("Unknown code %d", raw.CurrentWeather.WeatherCode)
	}
	fmt.Printf("Weather: %+v\n", raw)

	out := WeatherResp{
		City:        city,
		TempC:       raw.CurrentWeather.Temperature,
		Description: desc,
		Timestamp:   raw.CurrentWeather.Time,
		Lat:         raw.Latitude,
		Lon:         raw.Longitude,
		Humidity:    raw.CurrentWeather.Humidity,
		Rain:        raw.CurrentWeather.Rain,
	}
	return out, nil
}

func loadWeatherCodes() map[int]string {
	file := "weather_codes/data.json"
	data, err := os.ReadFile(file)
	if err != nil {
		// fallback minimal map
		return map[int]string{
			0: "Clear sky",
			1: "Mainly clear",
			2: "Partly cloudy",
			3: "Overcast",
		}
	}
	var m map[string]string
	if err := json.Unmarshal(data, &m); err != nil {
		return map[int]string{}
	}
	out := make(map[int]string)
	for k, v := range m {
		var code int
		fmt.Sscanf(k, "%d", &code)
		out[code] = v
	}
	return out
}
