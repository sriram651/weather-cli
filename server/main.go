package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"time"
	"weather-cli/server/pkg/cache"
	"weather-cli/server/pkg/weather"
)

func weatherHandler(w http.ResponseWriter, r *http.Request) {
	// Allow browser requests from any origin (CORS).
	// Needed so the upcoming web UI can call this API directly.
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	// Respond quickly to preflight requests.
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	city := r.URL.Query().Get("city")
	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	resp, err := weather.GetWeather(ctx, city)
	if err != nil {
		// map package-level errors to proper HTTP codes
		if errors.Is(err, weather.ErrCityNotFound) {
			w.Header().Set("Content-Type", "application/json")
			// CORS header already set above
			http.Error(w, `{"error":"city not found"}`, http.StatusNotFound)
			return
		}
		log.Printf("GetWeather error: %v\n", err)
		w.Header().Set("Content-Type", "application/json")
		http.Error(w, `{"error":"upstream or server error"}`, http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(resp)
}

func main() {
	// Initialize Redis cache
	// Read Redis configuration from environment variables with defaults
	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "localhost:6379" // Default Redis address
	}
	redisPassword := os.Getenv("REDIS_PASSWORD") // Empty if no password

	log.Printf("Connecting to Redis at %s...", redisAddr)
	cacheClient, err := cache.NewClient(redisAddr, redisPassword, 0)
	if err != nil {
		log.Printf("⚠️  Failed to connect to Redis: %v", err)
		log.Printf("⚠️  Running WITHOUT cache - API calls will not be cached")
	} else {
		log.Printf("✅ Redis connected successfully")
		// Set the cache client for weather package to use
		weather.SetCacheClient(cacheClient)
		defer cacheClient.Close()
	}

	http.HandleFunc("/weather", weatherHandler)
	addr := ":8080"
	log.Printf("🚀 Go Server started, listening on http://localhost%s/", addr)
	log.Fatal(http.ListenAndServe(addr, nil))
}
