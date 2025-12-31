'use client'

import { useState, useRef, useEffect } from 'react'
import { TemplateConfig, ContentData, getTemplateElement } from '@/lib/opengraph/engine'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface InteractiveTemplatePreviewProps {
    config: TemplateConfig
    content: ContentData
    onContentChange: (newContent: ContentData) => void
    readOnly?: boolean
}

export function InteractiveTemplatePreview({
    config,
    content,
    onContentChange,
    readOnly = false
}: InteractiveTemplatePreviewProps) {
    const [uploadingLayerId, setUploadingLayerId] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleUploadRequest = (layerId: string) => {
        if (readOnly) return
        setUploadingLayerId(layerId)
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !uploadingLayerId) return

        try {
            const supabase = createClient()
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
            const filePath = `template-uploads/${fileName}`

            // Show loading state if needed? 
            // For now, we rely on the fact that uploading is fast or we could add a local state.

            const { error: uploadError } = await supabase.storage
                .from('post-images') // Reusing existing bucket
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data } = supabase.storage.from('post-images').getPublicUrl(filePath)

            // Find the layer to get its variableId if it exists, to update content correctly
            const layer = config.layers?.find(l => l.id === uploadingLayerId)

            if (layer) {
                // If the layer is bound to a variable, update the content for that variable
                if (layer.variableId) {
                    onContentChange({
                        ...content,
                        [layer.variableId]: data.publicUrl
                    })
                } else {
                    // If it's a direct src (less common in consumer mode, but possible for static overrides)
                    // We can't easily update "config.layers" here if "config" is prop.
                    // So we assume the consumer primarily updates 'content'.
                    // If we need to update the *layer's src* permanently, we'd need onConfigChange.
                    // BUT: The requirement is likely about filling content.
                    // So we might need a way to say "This layer's content is now X".
                    // If the layer DOES NOT have a variableID, we might need to assign one or store it in a generic way?
                    // For now, let's assume valid templates for this flow HAVE variableIds like 'image1', 'image2'.
                    // OR we can allow updating a specific "overrides" mapping.
                }
            }

        } catch (error) {
            console.error('Upload failed:', error)
            alert('Failed to upload image')
        } finally {
            setUploadingLayerId(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const containerRef = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(1)

    // Calculate scale to fit parent container
    useEffect(() => {
        const updateScale = () => {
            if (containerRef.current) {
                const parentWidth = containerRef.current.offsetWidth
                const targetWidth = config.dimensions?.width || 1200
                // Don't scale up if parent is larger? Optional. 
                // Usually we just want to fit.
                const newScale = parentWidth / targetWidth
                setScale(newScale)
            }
        }

        // Use ResizeObserver for more robust sizing
        const observer = new ResizeObserver(updateScale)
        if (containerRef.current) {
            observer.observe(containerRef.current)
        }

        // Initial call
        updateScale()

        return () => observer.disconnect()
    }, [config.dimensions?.width])

    const width = config.dimensions?.width || 1200
    const height = config.dimensions?.height || 630

    return (
        <div className="relative w-full h-full overflow-hidden" ref={containerRef}>
            {/* Hidden Input for Uploads */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />

            {/* Scaled Render Engine */}
            <div
                className="origin-top-left template-scaler"
                style={{
                    width: width,
                    height: height,
                    transform: `scale(${scale})`
                }}
            >
                {getTemplateElement(
                    config,
                    content,
                    {
                        onUploadRequest: handleUploadRequest
                    }
                )}
            </div>

            {/* Loading Overlay */}
            {uploadingLayerId && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-50">
                    <Loader2 className="w-8 h-8 animate-spin text-black" />
                </div>
            )}
        </div>
    )
}
