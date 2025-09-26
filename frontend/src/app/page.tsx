"use client"

import { useEffect, useState } from "react"
import { WeatherResp } from "@/types/responses"
import Favorites from "@/components/Favourites"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

const FAVORITES_KEY = "weather:favorites"
const FAVORITES_LIMIT = 5

export default function Page() {
	const [city, setCity] = useState<string>("")
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [data, setData] = useState<WeatherResp | null>(null)
	const [favorites, setFavorites] = useState<string[]>([])

	useEffect(() => {
		// load favorites from localStorage on mount
		try {
			const raw = localStorage.getItem(FAVORITES_KEY)
			if (raw) {
				setFavorites(JSON.parse(raw) as string[])
			}
		} catch (e) {
			console.error("failed to load favorites", e)
			// ignore parse problems, start fresh
			setFavorites([])
		}
	}, [])

	function persistFavorites(list: string[]) {
		try {
			localStorage.setItem(FAVORITES_KEY, JSON.stringify(list))
		} catch (e) {
			console.error("failed to persist favorites", e)
			// ignore storage errors for v0.1
		}
	}

	function addFavorite(c: string) {
		const normalized = c.trim().toLowerCase()
		if (!normalized) return
		// remove duplicate if any, then unshift
		const next = [normalized, ...favorites.filter((f) => f !== normalized)]
		// limit length
		const limited = next.slice(0, FAVORITES_LIMIT)
		setFavorites(limited)
		persistFavorites(limited)
	}

	function removeFavorite(c: string) {
		const next = favorites.filter((f) => f !== c)
		setFavorites(next)
		persistFavorites(next)
	}

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
			const json = (await res.json()) as WeatherResp
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
						{loading ? "Loading..." : "Get Weather"}
					</button>
					{/* Save button only visible when we have data */}
					<button
						type="button"
						onClick={() => data && addFavorite(data.city)}
						disabled={!data}
						className="px-3 py-2 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 disabled:opacity-50 ml-2"
					>
						Save
					</button>
				</form>

				{/* Favorites quick buttons */}
				<Favorites
					favorites={favorites}
					onFetch={(c) => fetchWeatherFor(c)}
					onRemove={(c) => removeFavorite(c)}
				/>

				<div className="mt-6">
					{error && (
						<div className="text-red-700 bg-red-50 dark:bg-red-900/30 p-3 rounded">
							{error}
						</div>
					)}

					{data ? (
						<WeatherCard data={data} />
					) : (
						!error && (
							<div className="mt-4 text-sm text-slate-500">No data yet — ask for weather.</div>
						)
					)}
				</div>
			</div>
		</main>
	)
}

function WeatherCard({ data }: { data: WeatherResp }) {

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
						{data.temp_c}°C
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