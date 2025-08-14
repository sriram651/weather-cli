package locations

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
)

var CITIES_FILE_PATH = "./locations/cities.json"

func GetLocationByCity(city string) (Location, error) {
	citiesFileData, citiesFileError := os.ReadFile(CITIES_FILE_PATH)

	if citiesFileError != nil {
		return Location{}, citiesFileError
	}

	var citiesData map[string]Location

	// Unmarshall the file data
	unmarshalError := json.Unmarshal(citiesFileData, &citiesData)

	if unmarshalError != nil {
		return Location{}, unmarshalError
	}

	city = strings.ToLower(city)
	city = strings.Trim(city, " ")
	city = strings.ReplaceAll(city, " ", "_")

	cityLocation, ok := citiesData[city]

	if ok {
		return cityLocation, nil
	}

	return Location{}, fmt.Errorf("city not found in our Database")
}
