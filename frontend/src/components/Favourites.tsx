"use client"

import React from "react"
import Tags from "./ui/tag"

type Props = {
    favorites: string[]
    onFetch: (city: string) => void
    onRemove: (city: string) => void
}

export default function Favorites({ favorites, onFetch, onRemove }: Props) {
    if (!favorites || favorites.length === 0) return null

    return (
        <div className="mt-3 flex flex-wrap gap-2">
            <Tags
                onRemove={onRemove}
                onClick={(id) => onFetch(id)}
                tags={favorites.map(city => ({ id: city, label: city }))}
            />
        </div>
    )
}
