export interface WeatherResp {
    city: string;
    temp_c: number;
    description: string;
    time: string;
    lat?: number;
    lon?: number;
    relative_humidity_2m?: number;
    rain?: number;
}
