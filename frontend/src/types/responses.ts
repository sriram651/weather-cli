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
