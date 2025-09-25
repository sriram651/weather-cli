package main

type WeatherResponseBody struct {
	Latitude     float32 `json:"latitude"`
	Longitude    float32 `json:"longitude"`
	Timezone     string  `json:"timezone"`
	Elevation    float32 `json:"elevation"`
	Current      `json:"current"`
	CurrentUnits `json:"current_units"`
}

type Current struct {
	Time         string  `json:"time"`
	Temperature  float32 `json:"temperature_2m"`
	Interval     int     `json:"interval"`
	Rain         float32 `json:"rain"`
	Weather_Code float32 `json:"weather_code"`
	RelHumidity  float32 `json:"relative_humidity_2m"`
}

type CurrentUnits struct {
	Time         string `json:"time"`
	Temperature  string `json:"temperature_2m"`
	Interval     string `json:"interval"`
	Rain         string `json:"rain"`
	Weather_Code string `json:"weather_code"`
	RelHumidity  string `json:"relative_humidity_2m"`
}
