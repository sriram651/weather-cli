import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { WeatherResp } from "@/types/responses"
import { Clock, Cloud, Droplet, MapPin } from "lucide-react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"

type Props = {
    data: WeatherResp
    onSave?: (city: string) => void
    unit?: "C" | "F"
}

function toF(c: number) {
    return (c * 9) / 5 + 32
}

export default function WeatherCard(props: Props) {
    const { data, unit, onSave } = props;

    const temp = unit === "F" ? toF(data.temp_c) : data.temp_c
    const label = unit ?? "C"


    function formatDisplayTime(t?: string) {
        if (!t) return "—"
        try {
            const d = new Date(t)
            if (isNaN(d.getTime())) return t
            return d.toLocaleString(undefined, {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
                timeZoneName: "shortGeneric",
            })
        } catch {
            return t
        }
    }

    return (
        <Card className="w-full overflow-hidden">
            <CardHeader className="flex items-start justify-between gap-4 pb-2">
                {/* Left: Big temp badge */}
                <div className="flex items-center gap-4">
                    <div
                        className="relative flex p-4 w-auto aspect-square items-center justify-center rounded-full shadow-md"
                        style={{
                            background:
                                "linear-gradient(135deg, rgba(14,165,164,0.12), rgba(99,102,241,0.06))",
                        }}
                    >
                        <div className="absolute inset-0 rounded-full opacity-30 blur-lg" />
                        <div className="z-10 text-center">
                            <div className="text-3xl font-bold leading-none">
                                {Math.round(temp)}
                                <span className="text-base font-medium">°{label}</span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">Feels like {Math.round(temp)}°</div>
                        </div>
                    </div>

                    {/* Right: City + condition */}
                    <div>
                        <CardTitle className="text-lg font-semibold capitalize">{data.city}</CardTitle>
                        <div className="mt-1 flex items-center gap-2">
                            <Badge variant="secondary">{data.description}</Badge>
                            <span className="text-xs text-slate-400">• {formatDisplayTime(data.time)}</span>
                        </div>
                    </div>
                </div>

                {/* Actions: Save / small meta */}
                <div className="flex flex-col items-end gap-2">
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1">
                            <MapPin size={14} />
                            <span className="font-mono text-xs">
                                {data.lat ?? "—"}, {data.lon ?? "—"}
                            </span>
                        </div>
                    </div>

                    {onSave && (
                        <Button onClick={() => onSave(data.city)} size="sm">
                            Save
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="pt-2">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                        <Cloud className="mt-1 text-slate-500" />
                        <div>
                            <div className="text-xs text-slate-500">Condition</div>
                            <div className="font-medium">{data.description}</div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Droplet className="mt-1 text-slate-500" />
                        <div>
                            <div className="text-xs text-slate-500">Humidity</div>
                            <div className="font-mono">{data.humidity ?? "—"}%</div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Clock className="mt-1 text-slate-500" />
                        <div>
                            <div className="text-xs text-slate-500">Local Time</div>
                            <div className="font-medium">{formatDisplayTime(data.time)}</div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="mt-1 text-slate-500">🌧️</div>
                        <div>
                            <div className="text-xs text-slate-500">Precipitation</div>
                            <div className="font-mono">{(data.rain ?? 0).toFixed(2)} mm</div>
                        </div>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="pt-3">
                <details className="w-full">
                    <summary className="cursor-pointer text-sm text-slate-500">Show raw JSON</summary>
                    <pre className="mt-2 p-3 rounded bg-slate-100 dark:bg-slate-900 text-xs overflow-auto">
                        {JSON.stringify(data, null, 4)}
                    </pre>
                </details>
            </CardFooter>
        </Card>
    )
}