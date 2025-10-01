"use client"

import { useState } from "react"
import { WeatherResp } from "@/types/responses"
import Favorites from "@/components/Favourites"
import { Skeleton } from "@/components/ui/skeleton"
import WeatherCard from "@/components/WeatherCard"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import useFavourites from "@/hooks/useFavourites"

export default function Page() {
	const [city, setCity] = useState<string>("")
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [data, setData] = useState<WeatherResp | null>(null)

	// Temp conversion flag
	const [unit, setUnit] = useState<"C" | "F">("C")

	// Use the custom hook for favorites management
	const { favorites, removeFavorite, isFull } = useFavourites()

	async function fetchWeatherFor(qcity?: string) {
		const queryCity = (qcity ?? city).trim()
		setError(null)
		setData(null)
		setLoading(true)
		try {
			const encoded = encodeURIComponent(queryCity || "")
			const res = await fetch(`http://localhost:8080/weather?city=${encoded}`)
			if (res.status === 404) {
				let txt = "City not found"
				try {
					const j = await res.json()
					if (j && typeof j.error === "string") txt = j.error
				} catch { }
				setError(txt)
				return
			}
			if (!res.ok) {
				let body = await res.text()
				body = body ? body : `status ${res.status}`
				setError(`Server error: ${body}`)
				return
			}
			const raw = await res.json()
			const json = raw as WeatherResp
			setData(json)
			// prefill input with canonical city string returned by API
			if (json.city) setCity(json.city)
		} catch (err: unknown) {
			if (err instanceof Error) {
				setError(err.message)
			}

			setError("unknown error")
		} finally {
			setLoading(false)
		}
	}

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault()
		await fetchWeatherFor()
	}

	return (
		<main className="min-h-screen flex items-start justify-center p-8 bg-slate-50 dark:bg-slate-900">
			<div className="w-full max-w-2xl">
				<h1 className="text-2xl font-semibold mb-4">Weather Digest — v0.1</h1>

				<form onSubmit={onSubmit} className="flex gap-3 items-center">
					<input
						value={city}
						onChange={(e) => setCity(e.target.value)}
						placeholder="Enter city (e.g. chennai)"
						className="flex-1 px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
					/>
					<button
						type="submit"
						disabled={loading}
						className="px-4 py-2 rounded bg-teal-600 text-white cursor-pointer hover:opacity-90 disabled:opacity-60 disabled:cursor-default"
					>
						{loading ? "Forecasting..." : "Get Weather"}
					</button>
				</form>

				<Favorites
					favorites={favorites}
					onFetch={(c) => fetchWeatherFor(c)}
					onRemove={(c) => removeFavorite(c)}
					isFull={isFull}
				/>

				<div className="mt-4 ml-auto flex items-center space-x-2">
					<Switch
						id="celcius-fahrenheit"
						checked={unit === "F"}
						onCheckedChange={(value) => setUnit(value ? "F" : "C")}
					/>
					<Label htmlFor="celcius-fahrenheit">
						Switch to °{unit === "C" ? "F" : "C"}
					</Label>
				</div>

				<div className="mt-6">
					{loading && (
						<Skeleton className="w-full h-60 bg-slate-200 dark:bg-slate-700" />
					)}

					{!loading && error && (
						<div className="text-red-700 bg-red-50 dark:bg-red-900/30 p-3 rounded">
							{error}
						</div>
					)}

					{!loading && !error && data && (
						<WeatherCard data={data} unit={unit} />
					)}
					{!loading && !error && !data && (
						<div className="mt-4 text-sm text-slate-500">No data yet — ask for weather.</div>
					)}
				</div>
			</div>
		</main>
	)
}
