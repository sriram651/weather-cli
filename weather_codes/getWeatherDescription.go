package weather_codes

import (
	"encoding/json"
	"os"
	"strconv"
)

var WEATHER_CODES_FILE_PATH = "./weather_codes/data.json"

func GetWeatherDescription(weatherCode float32) string {
	weatherCodesFileData, weatherCodeFileError := os.ReadFile(WEATHER_CODES_FILE_PATH)

	if weatherCodeFileError != nil {
		return "Weather codes data unavailable!"
	}

	var weatherCodesData map[string]string

	// Unmarshall the file data
	unmarshalError := json.Unmarshal(weatherCodesFileData, &weatherCodesData)

	if unmarshalError != nil {
		return "Corrupted weather codes data!"
	}

	weatherCodeKey := strconv.FormatFloat(float64(weatherCode), 'f', 0, 64)

	// Check if the key exists in the unmarshalled map, if not the data in the json file might be corrupted.
	description, ok := weatherCodesData[weatherCodeKey]

	if ok {
		return description
	}

	return "No matching description found!"
}
