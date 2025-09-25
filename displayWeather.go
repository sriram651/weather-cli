package main

import (
	"fmt"
	"time"

	weather_codes "example.com/weather_codes"
)

func DisplayWeatherDetails(w WeatherResponseBody) {
	fmt.Printf("Weather Details:\n")
	fmt.Printf("  Latitude     : %.4f\n", w.Latitude)
	fmt.Printf("  Longitude     : %.4f\n", w.Longitude)
	fmt.Printf("  Timezone      : %s\n", w.Timezone)
	fmt.Printf("  Elevation     : %.2f meters\n", w.Elevation)

	customLayout := "Monday, Jan 2, 2006 - 3:04 PM"
	parsedTime, err := time.Parse(time.DateOnly+"T"+time.TimeOnly, w.Current.Time+":00")

	if err == nil {
		formattedTime := parsedTime.Local().Format(customLayout)
		fmt.Printf("  Current Time  : %v\n", formattedTime)
	} else {
		fmt.Println(err)
		fmt.Printf("  Current Time  : Unavailable\n")
	}

	fmt.Printf("  Interval      : %d %s\n", w.Current.Interval, w.CurrentUnits.Interval)
	fmt.Printf("  Rain      	: %f %s\n", w.Current.Rain, w.CurrentUnits.Rain)
	fmt.Printf("  Weather Code  : %s\n", weather_codes.GetWeatherDescription(w.Current.Weather_Code))
}
