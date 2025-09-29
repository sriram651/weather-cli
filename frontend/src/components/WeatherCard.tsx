import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { WeatherResp } from "@/types/responses"

type Props = {
    data: WeatherResp
    onSave?: (city: string) => void
    unit?: "C" | "F"
}

function toF(c: number) {
    return (c * 9) / 5 + 32
}

export default function WeatherCard(props: Props) {
    const { data, onSave, unit } = props;

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
        <Card
            className="gap-2"
        >
            <CardHeader
                className="gap-1"
            >
                <CardTitle
                    className="text-xl font-semibold capitalize"
                >
                    {data.city}
                </CardTitle>
                <CardDescription>{data.description}</CardDescription>
                <CardAction>
                    <h2 className="text-xl font-semibold">
                        {temp}°{label}{" "}
                    </h2>
                </CardAction>
            </CardHeader>
            <CardContent>
                <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                    <div>{formatDisplayTime(data.time)}</div>
                    <div>Lat: {data.lat ?? "—"} Lon: {data.lon ?? "—"}</div>
                </div>
            </CardContent>
            <CardFooter>
                <details className="w-full mt-3">
                    <summary className="cursor-pointer text-sm text-slate-500">Raw JSON</summary>
                    <pre className="mt-2 p-3 rounded bg-slate-100 dark:bg-slate-900 text-xs overflow-auto">
                        {JSON.stringify(data, null, 4)}
                    </pre>
                </details>
            </CardFooter>
        </Card>
    )
}