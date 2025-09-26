"use client"

import { useState } from "react"
import { WeatherResp } from "@/types/responses" // you exported this — good call

// Small, intentional UI for v0.1:
// - input for city
// - button to fetch from your Go server at :8080
// - shows loading / error / pretty JSON or a simple card
export default function Page() {
	const [city, setCity] = useState<string>("")
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [data, setData] = useState<WeatherResp | null>(null)

	async function fetchWeather() {
		setError(null)
		setData(null)
		setLoading(true)
		try {
			const q = encodeURIComponent(city || "")
			const res = await fetch(`http://localhost:8080/weather?city=${q}`)
			if (!res.ok) {
				const txt = await res.text()
				throw new Error(txt || `status ${res.status}`)
			}
			const json = (await res.json()) as WeatherResp
			setData(json)
		} catch (err: unknown) {
			if (err instanceof Error) {
				setError(err.message)
			} else {
				setError("unknown error")
			}
		} finally {
			setLoading(false)
		}
	}

	return (
		<main className="min-h-screen flex items-start justify-center p-8 bg-slate-50 dark:bg-slate-900">
			<div className="w-full max-w-2xl">
				<h1 className="text-2xl font-semibold mb-4">Weather Digest — v0.1</h1>

				<div className="flex gap-3 items-center">
					<input
						value={city}
						onChange={(e) => setCity(e.target.value)}
						placeholder="Enter city (e.g. chennai)"
						className="flex-1 px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
					/>
					<button
						onClick={fetchWeather}
						disabled={loading}
						className="px-4 py-2 rounded bg-teal-600 text-white disabled:opacity-60"
					>
						{loading ? "Loading…" : "Get Weather"}
					</button>
				</div>

				<div className="mt-6">
					{error && (
						<div className="text-red-600 bg-red-50 dark:bg-red-900/30 p-3 rounded">
							Error: {error}
						</div>
					)}

					{data ? (
						<div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded shadow-sm">
							<div className="flex items-baseline justify-between">
								<h2 className="text-lg font-medium capitalize">
									{data.city} — <span className="text-sm font-normal">{data.description}</span>
								</h2>
								<div className="text-2xl font-bold">{data.temp_c.toFixed(1)}°C</div>
							</div>

							<div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
								<div>Last Updated: {data.time}</div>
								<div>Lat: {data.lat ?? "—"} Lon: {data.lon ?? "—"}</div>
							</div>

							<details className="mt-3">
								<summary className="cursor-pointer text-sm text-slate-500">Raw JSON</summary>
								<pre className="mt-2 p-3 rounded bg-slate-100 dark:bg-slate-900 text-xs overflow-auto">
									{JSON.stringify(data, null, 2)}
								</pre>
							</details>
						</div>
					) : (
						<div className="mt-4 text-sm text-slate-500">No data yet — ask for weather.</div>
					)}
				</div>
			</div>
		</main>
	)
}
