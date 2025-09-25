package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"weather-cli/pkg/weather"
)

func weatherHandler(w http.ResponseWriter, r *http.Request) {
	city := r.URL.Query().Get("city")
	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()

	resp, err := weather.GetWeather(ctx, city)
	if err != nil {
		http.Error(w, "failed to get weather: "+err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")

	// Allow browser requests from any origin (CORS).
	// Needed so the upcoming web UI can call this API directly.
	w.Header().Set("Access-Control-Allow-Origin", "*")

	json.NewEncoder(w).Encode(resp)
}

func main() {
	http.HandleFunc("/weather", weatherHandler)
	addr := ":8080"
	log.Printf("server listening on http://localhost%s/", addr)
	log.Fatal(http.ListenAndServe(addr, nil))
}
