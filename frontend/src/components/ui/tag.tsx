import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Tag {
    id: string
    label: string
}

interface TagsProps {
    tags: Tag[]
    onClick?: (id: string) => void
    onRemove?: (id: string) => void
    className?: string
}

export default function Tags({ tags, onClick, onRemove, className }: TagsProps) {
    return (
        <ul className={cn("flex flex-wrap gap-2 p-0 m-0 list-none", className)}>
            {tags.map((tag) => (
                <li
                    key={tag.id}
                    onClick={() => onClick && onClick(tag.id)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                >
                    <span>{tag.label}</span>
                    {onRemove && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onRemove(tag.id)
                            }}
                            className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            aria-label={`Remove ${tag.label}`}
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </li>
            ))}
        </ul>
    )
}
