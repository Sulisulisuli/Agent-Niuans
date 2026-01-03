'use client'

import { useRef, useState, useEffect } from 'react'
import { TemplateConfig, ContentData, CustomLayout } from '@/lib/opengraph/engine'
import { Loader2 } from 'lucide-react'

interface CanvasPreviewProps {
    config: TemplateConfig
    debouncedConfig: TemplateConfig
    previewUrl: string | null
    isLoading: boolean
    selectedLayerId: string | undefined
    dummyContent: ContentData
    updateConfig: (key: keyof TemplateConfig, value: any) => void
    setSelectedLayerId: (id: string | undefined) => void
}

export function CanvasPreview({
    config,
    debouncedConfig,
    previewUrl,
    isLoading,
    selectedLayerId,
    dummyContent,
    updateConfig,
    setSelectedLayerId,
}: CanvasPreviewProps) {
    // For Drag and Drop
    const previewContainerRef = useRef<HTMLDivElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

    const handleMouseDown = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        const layerId = target.getAttribute('data-layer-id') || target.closest('[data-layer-id]')?.getAttribute('data-layer-id');

        if (layerId && config.layers) {
            const layer = config.layers.find(l => l.id === layerId);
            if (layer && previewContainerRef.current) {
                setSelectedLayerId(layerId);
                setIsDragging(true);

                const layerDiv = target.closest('[data-layer-id]') as HTMLElement;
                const layerRect = layerDiv.getBoundingClientRect();
                const containerRect = previewContainerRef.current.getBoundingClientRect();
                const scale = containerRect.width / (config.dimensions?.width || 1200);

                setDragOffset({
                    x: (e.clientX - layerRect.left) / scale,
                    y: (e.clientY - layerRect.top) / scale
                });
            }
        }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && selectedLayerId && previewContainerRef.current && config.layers) {
            e.preventDefault();
            const containerRect = previewContainerRef.current.getBoundingClientRect();
            const designWidth = config.dimensions?.width || 1200;
            const containerWidth = containerRect.width;
            const scale = containerWidth / designWidth;

            const relativeX = (e.clientX - containerRect.left);
            const relativeY = (e.clientY - containerRect.top);

            const trueX = (relativeX / scale) - dragOffset.x;
            const trueY = (relativeY / scale) - dragOffset.y;

            const newLayers = config.layers.map(l => {
                if (l.id === selectedLayerId) {
                    return { ...l, x: Math.round(trueX), y: Math.round(trueY) }
                }
                return l;
            });
            updateConfig('layers', newLayers);
        }
    }

    const handleMouseUp = () => {
        setIsDragging(false);
    }

    return (
        <div
            className="flex-1 bg-gray-100 flex items-center justify-center p-4 lg:p-8 border border-black border-dashed min-h-[400px] overflow-hidden select-none"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {config.layout === 'custom' ? (
                <div
                    ref={previewContainerRef}
                    style={{
                        width: config.dimensions?.width || 1200,
                        height: config.dimensions?.height || 630,
                        transform: `scale(${Math.min(1, 800 / (config.dimensions?.width || 1200))})`,
                        transformOrigin: 'center center',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                    }}
                    className="bg-white"
                    onMouseDown={handleMouseDown}
                >
                    <CustomLayout
                        config={config}
                        content={dummyContent}
                        selectedLayerId={selectedLayerId}
                        onLayerSelect={(id) => setSelectedLayerId(id)}
                    />
                </div>
            ) : (
                <>
                    {isLoading && !previewUrl && <Loader2 className="h-10 w-10 animate-spin text-gray-400" />}
                    {previewUrl && (
                        <div className="relative shadow-2xl transition-opacity duration-200" style={{ opacity: isLoading ? 0.7 : 1 }}>
                            <img
                                src={previewUrl}
                                alt="Preview"
                                className="max-w-full h-auto border border-black"
                                style={{ maxHeight: 'calc(100vh - 200px)' }}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
