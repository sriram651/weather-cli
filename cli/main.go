package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
)

func main() {
	// Get the input for city name & build the URI with Lat & Long
	weatherApiUrl := BuildUriWithLocation()

	// If the Uri returned is empty, then the city was not found
	if len(weatherApiUrl) == 0 {
		return
	}

	response, err := http.Get(weatherApiUrl)

	if err != nil {
		fmt.Printf("\nError: %v", errors.Unwrap(err))
		return
	}

	defer response.Body.Close()

	fmt.Printf("\nStatus code: %v\n", response.StatusCode)

	body, readErr := io.ReadAll(response.Body)

	if readErr != nil {
		fmt.Println(readErr)
		return
	}

	var data WeatherResponseBody

	unmarshalErr := json.Unmarshal(body, &data)

	if unmarshalErr != nil {
		fmt.Printf("\nError while parsing response:\n%v", unmarshalErr)
		return
	}

	fmt.Println(data)

	DisplayWeatherDetails(data)
}
