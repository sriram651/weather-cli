package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"time"

	"weather-cli/pkg/weather"
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
	http.HandleFunc("/weather", weatherHandler)
	addr := ":8080"
	log.Printf("server listening on http://localhost%s/", addr)
	log.Fatal(http.ListenAndServe(addr, nil))
}
