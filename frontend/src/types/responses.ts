export interface WeatherResp {
    city: string;
    temp_c: number;
    apparent_temperature: number;
    description: string;
    time: string;
    lat?: number;
    lon?: number;
    humidity?: number;
    rain?: number;
    precipitation_probability?: number;
    is_day?: 1 | 0;
}

export interface DailyForecast {
    date: string;
    temp_min: number;
    temp_max: number;
    apparent_temp_max: number;
    apparent_temp_min: number;
    precipitation_probability_min: number;
    precipitation_probability_max: number;
    sunrise: string;
    sunset: string;
    daylight_duration: number;
    description: string;
}

export interface DailyForecastResp {
    city: string;
    forecast: DailyForecast[];
}