import { useEffect, useState } from "react"

const FAVORITES_KEY = "weather:favorites"
const FAVORITES_LIMIT = 5

type FavouritesHook = {
    favorites: string[]
    addFavorite: (city: string) => void
    removeFavorite: (city: string) => void
    isFavorite: (city: string) => boolean
    isFull: boolean
    refetch: () => void
}

/**
 * Custom hook for managing favourite cities with localStorage persistence.
 *
 * @example
 * ```tsx
 * const { favorites, addFavorite, removeFavorite, isFavorite, refetch } = useFavourites()
 *
 * // Check if a city is saved
 * const saved = isFavorite("chennai") // true/false
 *
 * // Add a city to favorites
 * addFavorite("mumbai")
 *
 * // Remove a city from favorites
 * removeFavorite("delhi")
 *
 * // Manually refetch favorites from localStorage
 * refetch()
 *
 * // Display all favorites
 * favorites.forEach(city => console.log(city))
 * ```
 */
export default function useFavourites(): FavouritesHook {
    const [favorites, setFavorites] = useState<string[]>([])

    function refetch() {
        try {
            const raw = localStorage.getItem(FAVORITES_KEY)
            if (raw) {
                setFavorites(JSON.parse(raw) as string[])
            } else {
                setFavorites([])
            }
        } catch (e) {
            console.error("Failed to load favorites", e)
            setFavorites([])
        }
    }

    useEffect(() => {
        // Load favorites from localStorage on mount
        refetch()

        // Listen for updates from other hook instances
        const handleUpdate = () => {
            refetch()
        }

        window.addEventListener('favorites-updated', handleUpdate)

        return () => {
            window.removeEventListener('favorites-updated', handleUpdate)
        }
    }, [])

    function persistFavorites(list: string[]) {
        try {
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(list))
        } catch (e) {
            console.error("Failed to persist favorites", e)
        }
    }

    function addFavorite(city: string) {
        const normalized = city.trim().toLowerCase()
        if (!normalized) return

        // Check if already in favorites
        if (favorites.includes(normalized)) return

        // Check if favorites are full
        if (favorites.length >= FAVORITES_LIMIT) {
            console.warn(`Cannot add "${city}". Favorites limit (${FAVORITES_LIMIT}) reached.`)
            return
        }

        // Add to front
        const next = [normalized, ...favorites]

        setFavorites(next)
        persistFavorites(next)

        // Dispatch custom event to sync across hook instances
        window.dispatchEvent(new Event('favorites-updated'))
    }

    function removeFavorite(city: string) {
        const normalized = city.trim().toLowerCase()
        const next = favorites.filter((f) => f !== normalized)

        setFavorites(next)
        persistFavorites(next)

        // Dispatch custom event to sync across hook instances
        window.dispatchEvent(new Event('favorites-updated'))
    }

    function isFavorite(city: string): boolean {
        const normalized = city.trim().toLowerCase()
        return favorites.includes(normalized)
    }

    return {
        favorites,
        addFavorite,
        removeFavorite,
        isFavorite,
        isFull: favorites.length >= FAVORITES_LIMIT,
        refetch,
    }
}
