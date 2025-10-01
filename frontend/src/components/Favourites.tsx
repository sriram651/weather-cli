"use client"

import React from "react"
import Tags from "./ui/tag"

type Props = {
    favorites: string[]
    onFetch: (city: string) => void
    onRemove: (city: string) => void
    isFull?: boolean
}

export default function Favorites({ favorites, onFetch, onRemove, isFull }: Props) {
    if (!favorites || favorites.length === 0) return null

    return (
        <div className="mt-3">
            <div className="flex flex-wrap gap-2">
                <Tags
                    onRemove={onRemove}
                    onClick={(id) => onFetch(id)}
                    tags={favorites.map(city => ({ id: city, label: city }))}
                />
            </div>
            {isFull && (
                <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    ⚠️ Favorites full (max 5). Remove one to add more.
                </div>
            )}
        </div>
    )
}
