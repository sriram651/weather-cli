import { DailyForecast } from "@/types/responses";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Clock, Cloud, CloudDrizzle, CloudRain, CloudSnow, CloudSun, Sun, Sunrise, Sunset, Thermometer } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Progress } from "./ui/progress";

// Helper function to get temperature gradient
function getTempGradient(tempMin: number, tempMax: number) {
    const avgTemp = (tempMin + tempMax) / 2;

    if (avgTemp >= 40) {
        return 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.15))';
    } else if (avgTemp >= 35) {
        return 'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(234, 88, 12, 0.15))';
    } else if (avgTemp >= 25) {
        return 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.15))';
    } else if (avgTemp >= 20) {
        return 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.15))';
    } else {
        return 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.15))';
    }
}

// Helper function to get weather icon
function getWeatherIcon(description: string) {
    const desc = description.toLowerCase();
    if (desc.includes('rain')) return <CloudRain className="w-6 h-6" />;
    if (desc.includes('snow')) return <CloudSnow className="w-6 h-6" />;
    if (desc.includes('drizzle')) return <CloudDrizzle className="w-6 h-6" />;
    if (desc.includes('overcast') || desc.includes('cloudy')) return <Cloud className="w-6 h-6" />;
    if (desc.includes('partly')) return <CloudSun className="w-6 h-6" />;
    return <Sun className="w-6 h-6" />;
}

// Helper function to convert ISO timestamp to time string
function isoToTime(isoString: string) {
    const date = new Date(isoString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Helper function to format daylight duration
function formatDaylightDuration(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
}

export default function ForecastCard({ forecast, unit = 'C' }: { forecast: DailyForecast; unit?: 'C' | 'F' }) {
    const {
        date,
        description,
        sunrise,
        sunset,
        temp_min,
        temp_max,
        apparent_temp_min,
        apparent_temp_max,
        precipitation_probability_min,
        precipitation_probability_max,
        daylight_duration,
    } = forecast;

    const avgPrecipProb = (precipitation_probability_min + precipitation_probability_max) / 2;

    return (
        <Card className="w-full overflow-hidden transition-all hover:shadow-lg">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="text-slate-600 dark:text-slate-300">
                            {getWeatherIcon(description)}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">{date}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Temperature Badge */}
                <div className="flex justify-center">
                    <div
                        className="relative flex px-6 py-4 items-center justify-center rounded-2xl shadow-md"
                        style={{
                            background: getTempGradient(temp_min, temp_max),
                        }}
                    >
                        <div className="absolute inset-0 rounded-2xl opacity-30 blur-lg" />
                        <div className="z-10 text-center">
                            <div className="text-3xl font-bold leading-none">
                                {Math.round(temp_min)}° / {Math.round(temp_max)}°
                                <span className="text-sm font-medium ml-1">{unit}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Precipitation Probability */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-300">Precipitation</span>
                        <span className="font-medium">{Math.round(precipitation_probability_max)}%</span>
                    </div>
                    <Progress value={precipitation_probability_max} className="h-2" />
                </div>

                {/* Accordion for more details */}
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="details" className="border-0">
                        <AccordionTrigger className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 py-2">
                            More details
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-3 pt-2">
                                {/* Sunrise & Sunset */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Sunrise className="w-4 h-4 text-amber-500" />
                                        <div>
                                            <p className="text-xs text-slate-500">Sunrise</p>
                                            <p className="font-medium">{isoToTime(sunrise)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Sunset className="w-4 h-4 text-orange-500" />
                                        <div>
                                            <p className="text-xs text-slate-500">Sunset</p>
                                            <p className="font-medium">{isoToTime(sunset)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Apparent Temperature */}
                                <div className="flex items-center gap-2 text-sm">
                                    <Thermometer className="w-4 h-4 text-blue-500" />
                                    <div>
                                        <p className="text-xs text-slate-500">Feels like</p>
                                        <p className="font-medium">
                                            {Math.round(apparent_temp_min)}° / {Math.round(apparent_temp_max)}° {unit}
                                        </p>
                                    </div>
                                </div>

                                {/* Daylight Duration */}
                                <div className="flex items-center gap-2 text-sm">
                                    <Clock className="w-4 h-4 text-purple-500" />
                                    <div>
                                        <p className="text-xs text-slate-500">Daylight</p>
                                        <p className="font-medium">{formatDaylightDuration(daylight_duration)}</p>
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    );
}