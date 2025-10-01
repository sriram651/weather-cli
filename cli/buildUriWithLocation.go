package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"

	"example.com/locations"
)

var WEATHER_API_URI = "https://api.open-meteo.com/v1/forecast?"
var REQUIRED_PARAMS = "&current=temperature_2m%2Crelative_humidity_2m%2Crain%2Cweather_code"

func BuildUriWithLocation() string {
	scanner := bufio.NewScanner(os.Stdin)

	fmt.Printf("\nType in any Indian Metro City to get the weather: ")

	scanner.Scan()

	if len(scanner.Text()) == 0 {
		fmt.Printf("\nInvalid City name, try again.")
		return ""
	}

	cityLocation, cityFindError := locations.GetLocationByCity(scanner.Text())

	if cityFindError != nil {
		fmt.Println(cityFindError)
		return ""
	}

	fmt.Printf("\nYour city's location is: %v, %v", cityLocation.Latitude, cityLocation.Longitude)

	var weatherApiUriBuilder strings.Builder

	weatherApiUriBuilder.WriteString(WEATHER_API_URI)
	weatherApiUriBuilder.WriteString("latitude=")
	weatherApiUriBuilder.WriteString(strconv.FormatFloat(cityLocation.Latitude, 'f', -1, 64))
	weatherApiUriBuilder.WriteString("&longitude=")
	weatherApiUriBuilder.WriteString(strconv.FormatFloat(cityLocation.Longitude, 'f', -1, 64))
	weatherApiUriBuilder.WriteString(REQUIRED_PARAMS)

	fmt.Printf("\nThe URI to fetch: %s\n", weatherApiUriBuilder.String())

	return weatherApiUriBuilder.String()
}
