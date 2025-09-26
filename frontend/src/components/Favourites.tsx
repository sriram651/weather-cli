// ui/src/components/Favorites.tsx
"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

type Props = {
    favorites: string[]
    onFetch: (city: string) => void
    onRemove: (city: string) => void
}

export default function Favorites({ favorites, onFetch, onRemove }: Props) {
    if (!favorites || favorites.length === 0) return null

    return (
        <div className="mt-3 flex flex-wrap gap-2">
            {favorites.map((f) => (
                <div key={f} className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onFetch(f)}
                        className="px-3 py-1"
                    >
                        {f}
                    </Button>
                    <button
                        onClick={() => onRemove(f)}
                        aria-label={`remove ${f}`}
                        className="inline-flex items-center justify-center rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                        title={`Remove ${f}`}
                    >
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>
    )
}
