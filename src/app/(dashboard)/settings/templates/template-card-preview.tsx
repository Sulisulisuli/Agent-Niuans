'use client'

import { useRef, useEffect, useState } from 'react'
import { TemplateConfig, ContentData, getTemplateElement } from '@/lib/opengraph/engine'

// Dummy content for preview
const DUMMY_CONTENT: ContentData = {
    title: 'Preview Title',
    subtitle: 'Subtitle goes here',
    footer: 'Footer Text',
    author: 'Author',
    authorAvatar: 'https://placehold.co/50',
    featuredImage: 'https://placehold.co/600x400',
    date: 'Jan 1, 2024'
}

export function TemplateCardPreview({ config }: { config: TemplateConfig }) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(1)

    useEffect(() => {
        const updateScale = () => {
            if (!containerRef.current) return
            const containerWidth = containerRef.current.clientWidth
            // Default to 1200 if not specified
            const contentWidth = config.dimensions?.width || 1200
            setScale(containerWidth / contentWidth)
        }

        updateScale()
        window.addEventListener('resize', updateScale)
        return () => window.removeEventListener('resize', updateScale)
    }, [config.dimensions?.width])

    const width = config.dimensions?.width || 1200
    const height = config.dimensions?.height || 630

    return (
        <div
            ref={containerRef}
            className="w-full h-full relative overflow-hidden"
        >
            <div
                style={{
                    width: width,
                    height: height,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    // Prevent interacting with the preview
                    pointerEvents: 'none',
                    userSelect: 'none'
                }}
            >
                {getTemplateElement(config, DUMMY_CONTENT)}
            </div>
        </div>
    )
}
