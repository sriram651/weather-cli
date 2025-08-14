module weather-cli

go 1.24.4

replace example.com/weather_codes => ./weather_codes

replace example.com/locations => ./locations

require example.com/weather_codes v0.0.0-00010101000000-000000000000

require example.com/locations v0.0.0-00010101000000-000000000000
