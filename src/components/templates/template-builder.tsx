'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { TemplateConfig, ContentData, CustomLayout } from '@/lib/opengraph/engine'
import { ICONS } from '@/lib/opengraph/icons'
import { saveTemplate } from '@/app/(dashboard)/settings/templates/actions'
import { uploadImage } from '@/app/(dashboard)/settings/templates/upload-image'
import { useDebounce } from 'use-debounce'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowLeft } from 'lucide-react'

// Dummy content for preview
const DUMMY_CONTENT: ContentData = {
    title: 'Cybersecurity Trends 2025',
    subtitle: 'How AI is changing the landscape of digital defense.',
    footer: 'Agent Niuans Blog',
    author: 'Jane Doe',
    authorAvatar: 'https://placehold.co/100?text=JD',
    featuredImage: 'https://placehold.co/800x600?text=Featured',
    date: 'Oct 24, 2025'
}

const TEXT_VARIABLES = [
    { label: 'None (Static)', value: 'none' },
    { label: 'Post Title', value: 'title' },
    { label: 'Post Subtitle', value: 'subtitle' },
    { label: 'Footer / Brand', value: 'footer' },
    { label: 'Author Name', value: 'author' },
    { label: 'Publish Date', value: 'date' },
]

const IMAGE_VARIABLES = [
    { label: 'None (Make Static)', value: 'none' },
    { label: 'Featured Image', value: 'featuredImage' },
]

interface TemplateBuilderProps {
    organizationId: string
    initialTemplate?: {
        id: string
        name: string
        config: TemplateConfig
        category?: string
    }
}

export function TemplateBuilder({ organizationId, initialTemplate }: TemplateBuilderProps) {
    const router = useRouter()
    const [name, setName] = useState(initialTemplate?.name || 'New Template')
    const [config, setConfig] = useState<TemplateConfig>(initialTemplate?.config || {
        layout: 'custom',
        primaryColor: '#eb4f27',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        fontFamily: 'Inter',
        showIcon: true,
        iconName: 'Shield',
        layers: [
            { id: '1', type: 'text', x: 50, y: 50, width: 600, height: 120, styles: { color: '#000000', fontSize: 60, fontWeight: 'bold' }, content: '{{title}}' }
        ]
    })

    const [debouncedConfig] = useDebounce(config, 500)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [selectedLayerId, setSelectedLayerId] = useState<string | undefined>(undefined)

    // For Drag and Drop
    const previewContainerRef = useRef<HTMLDivElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

    // Generate Preview (Only for NON-custom layouts, or when user wants to see "final")
    // For Custom layout, we render client-side for speed
    useEffect(() => {
        if (config.layout === 'custom') {
            setIsLoading(false);
            return;
        }

        let active = true
        const generate = async () => {
            setIsLoading(true)
            try {
                const res = await fetch('/api/og/preview', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        config: debouncedConfig,
                        content: DUMMY_CONTENT
                    })
                })
                if (!res.ok) throw new Error('Failed to load preview')

                const blob = await res.blob()
                const url = URL.createObjectURL(blob)

                if (active) {
                    setPreviewUrl(prev => {
                        if (prev) URL.revokeObjectURL(prev) // Clean up old URL
                        return url
                    })
                }
            } catch (e) {
                console.error(e)
            } finally {
                if (active) setIsLoading(false)
            }
        }

        generate()
        return () => { active = false }
    }, [debouncedConfig, config.layout])

    // Save Template
    const handleSave = async () => {
        setIsSaving(true)
        try {
            const res = await saveTemplate(organizationId, {
                id: initialTemplate?.id,
                name,
                config,
                category: initialTemplate?.category
            })

            if (res.error) {
                alert(res.error)
            } else {
                router.push('/settings/templates')
                router.refresh()
            }
        } catch (e) {
            console.error(e)
            alert('Failed to save')
        } finally {
            setIsSaving(false)
        }
    }

    // Helper to update config
    const updateConfig = (key: keyof TemplateConfig, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }))
    }

    // Drag Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        const layerId = target.getAttribute('data-layer-id') || target.closest('[data-layer-id]')?.getAttribute('data-layer-id');

        if (layerId && config.layers) {
            const layer = config.layers.find(l => l.id === layerId);
            if (layer && previewContainerRef.current) {
                setSelectedLayerId(layerId);
                setIsDragging(true);

                // Calculate offset relative to the layer's top-left corner
                const rect = target.getBoundingClientRect();
                // We need to account for scaling if we scale the preview, but currently we display at native or styled size.
                // Assuming the container is relative and coordinates are absolute within it.
                // However, the event gives client coordinates.

                // Actually, simpler: just store the initial mouse position difference from the Top/Left style
                // But wait, the "target" might be the inner text. We want the layer div.
                const layerDiv = target.closest('[data-layer-id]') as HTMLElement;
                const layerRect = layerDiv.getBoundingClientRect();
                const containerRect = previewContainerRef.current.getBoundingClientRect();

                // Scale factor calculation
                const scale = containerRect.width / (config.dimensions?.width || 1200);

                // Mouse position relative to the layer
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

            // Calculate scale if we are fitting a large design into a smaller container
            // Current implementation of 'Wrapper' below uses transform: scale(...)
            // We need to invert that scale to get true pixel coordinates.
            const designWidth = config.dimensions?.width || 1200;
            const containerWidth = containerRect.width;
            const scale = containerWidth / designWidth;

            // Mouse relative to container left/top
            const relativeX = (e.clientX - containerRect.left);
            const relativeY = (e.clientY - containerRect.top);

            // True coordinates in design space
            const trueX = (relativeX / scale) - dragOffset.x;
            const trueY = (relativeY / scale) - dragOffset.y;

            // Snap to grid? Optional. For now just raw.
            // Update Layer
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
        <div className="flex h-[calc(100vh-100px)] flex-col lg:flex-row gap-6">
            {/* Left Panel: Controls */}
            <Card className="w-full lg:w-[400px] flex-shrink-0 h-full overflow-auto rounded-none border-black">
                <CardHeader className="border-b border-black">
                    <div className="flex items-center gap-2 mb-4">
                        <Button variant="ghost" size="sm" onClick={() => router.back()} className="h-8 w-8 p-0">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <CardTitle>Template Settings</CardTitle>
                    </div>
                    <div className="space-y-2">
                        <Label>Template Name</Label>
                        <Input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="rounded-none border-black focus-visible:ring-black"
                        />
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">



                    {/* Global Canvas Settings */}
                    <div className="border border-black p-4 space-y-4 bg-gray-50">
                        <Label className="text-lg font-bold">Canvas Settings</Label>

                        <div className="space-y-2">
                            <Label className="text-xs">Format / Dimensions</Label>
                            <Select
                                value={
                                    ['Open Graph', 'Instagram Square', 'Instagram Portrait', 'Instagram Story'].includes(config.dimensions?.label || '')
                                        ? JSON.stringify({ ...config.dimensions })
                                        : 'custom'
                                }
                                onValueChange={(v) => {
                                    if (v === 'custom') {
                                        updateConfig('dimensions', { width: 1200, height: 630, label: 'Custom' })
                                    } else {
                                        updateConfig('dimensions', JSON.parse(v))
                                    }
                                }}
                            >
                                <SelectTrigger className="rounded-none border-black focus:ring-black">
                                    <SelectValue placeholder="Select Format" />
                                </SelectTrigger>
                                <SelectContent className="rounded-none border-black">
                                    <SelectItem value={JSON.stringify({ width: 1200, height: 630, label: 'Open Graph' })}>Open Graph (1200x630)</SelectItem>
                                    <SelectItem value={JSON.stringify({ width: 1080, height: 1080, label: 'Instagram Square' })}>Instagram Square (1080x1080)</SelectItem>
                                    <SelectItem value={JSON.stringify({ width: 1080, height: 1350, label: 'Instagram Portrait' })}>Instagram Portrait (1080x1350)</SelectItem>
                                    <SelectItem value={JSON.stringify({ width: 1080, height: 1920, label: 'Instagram Story' })}>Instagram Story (1080x1920)</SelectItem>
                                    <SelectItem value="custom">Custom Size...</SelectItem>
                                </SelectContent>
                            </Select>

                            {config.dimensions?.label === 'Custom' && (
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-gray-500">Width (px)</Label>
                                        <Input
                                            type="number"
                                            value={config.dimensions?.width !== undefined ? config.dimensions.width : 1200}
                                            onChange={(e) => updateConfig('dimensions', { ...config.dimensions, width: parseInt(e.target.value) || 0, label: 'Custom' })}
                                            className="rounded-none border-black"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-gray-500">Height (px)</Label>
                                        <Input
                                            type="number"
                                            value={config.dimensions?.height !== undefined ? config.dimensions.height : 630}
                                            onChange={(e) => updateConfig('dimensions', { ...config.dimensions, height: parseInt(e.target.value) || 0, label: 'Custom' })}
                                            className="rounded-none border-black"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs">Background Color</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={config.backgroundColor}
                                        onChange={e => updateConfig('backgroundColor', e.target.value)}
                                        className="w-8 h-8 p-0 rounded-none border-black"
                                    />
                                    <Input
                                        value={config.backgroundColor}
                                        onChange={e => updateConfig('backgroundColor', e.target.value)}
                                        className="h-8 rounded-none border-black text-xs"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Font Family</Label>
                                <Select
                                    value={config.fontFamily}
                                    onValueChange={(v) => updateConfig('fontFamily', v)}
                                >
                                    <SelectTrigger className="rounded-none border-black focus:ring-black">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-none border-black">
                                        <SelectItem value="Inter">Inter</SelectItem>
                                        <SelectItem value="Roboto">Roboto</SelectItem>
                                        <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <div className="border border-black p-4 space-y-4 bg-gray-50">
                        <Label className="text-lg font-bold">Layers</Label>

                        {/* Background Upload */}
                        <div className="space-y-2">
                            <Label className="text-xs">Background Image</Label>
                            <div className="flex flex-col gap-2">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0]
                                        if (!file) return

                                        // Simple loading feedback
                                        const btn = e.target as HTMLInputElement;
                                        const originalText = btn.style.opacity;
                                        btn.style.opacity = '0.5';

                                        try {
                                            const formData = new FormData()
                                            formData.append('file', file)
                                            const res = await uploadImage(formData)
                                            if (res.error) alert(res.error)
                                            else if (res.publicUrl) updateConfig('backgroundImage', res.publicUrl)
                                        } catch (err) {
                                            console.error(err)
                                            alert('Upload failed')
                                        } finally {
                                            btn.style.opacity = originalText;
                                        }
                                    }}
                                    className="rounded-none border-black text-xs cursor-pointer file:cursor-pointer"
                                />
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-gray-100 p-2 text-[10px] break-all border border-gray-300">
                                        {config.backgroundImage || 'No image selected'}
                                    </div>
                                    {config.backgroundImage && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => updateConfig('backgroundImage', undefined)}
                                            className="h-auto p-2 text-xs text-red-500 hover:text-red-700 border-black rounded-none"
                                        >
                                            Clear
                                        </Button>
                                    )}
                                </div>
                                <Input
                                    value={config.backgroundImage || ''}
                                    onChange={(e) => updateConfig('backgroundImage', e.target.value)}
                                    placeholder="Or paste URL..."
                                    className="rounded-none border-black text-xs h-7"
                                />
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px]">Z-Index:</span>
                                    <Input
                                        type="number"
                                        value={config.backgroundZIndex || 0}
                                        onChange={(e) => updateConfig('backgroundZIndex', parseInt(e.target.value) || 0)}
                                        className="h-6 w-20 text-xs rounded-none border-black"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-black/20 my-2" />

                        {/* Layer List */}
                        <div className="space-y-2">
                            {config.layers?.map((layer, index) => (
                                <div
                                    key={layer.id}
                                    className={`border p-2 text-xs relative group transition-colors ${selectedLayerId === layer.id ? 'border-[#eb4f27] bg-[#fff5f2]' : 'border-black bg-white'}`}
                                    onClick={() => setSelectedLayerId(layer.id)}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold uppercase">{layer.type}</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newLayers = config.layers ? [...config.layers] : [];
                                                newLayers.splice(index, 1);
                                                updateConfig('layers', newLayers);
                                                if (selectedLayerId === layer.id) setSelectedLayerId(undefined);
                                            }}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            ×
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2">
                                        <div>
                                            <Label className="text-[10px]">X (px)</Label>
                                            <Input
                                                type="number"
                                                value={layer.x}
                                                onChange={e => {
                                                    const newLayers = [...(config.layers || [])];
                                                    newLayers[index] = { ...newLayers[index], x: parseInt(e.target.value) || 0 };
                                                    updateConfig('layers', newLayers);
                                                }}
                                                className="h-6 text-xs rounded-none border-black"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[10px]">Y (px)</Label>
                                            <Input
                                                type="number"
                                                value={layer.y}
                                                onChange={e => {
                                                    const newLayers = [...(config.layers || [])];
                                                    newLayers[index] = { ...newLayers[index], y: parseInt(e.target.value) || 0 };
                                                    updateConfig('layers', newLayers);
                                                }}
                                                className="h-6 text-xs rounded-none border-black"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[10px]">Z-Index</Label>
                                            <Input
                                                type="number"
                                                value={layer.styles.zIndex || 1}
                                                onChange={e => {
                                                    const newLayers = [...(config.layers || [])];
                                                    newLayers[index] = {
                                                        ...newLayers[index],
                                                        styles: { ...newLayers[index].styles, zIndex: parseInt(e.target.value) || 1 }
                                                    };
                                                    updateConfig('layers', newLayers);
                                                }}
                                                className="h-6 text-xs rounded-none border-black"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[10px]">Rotation (°)</Label>
                                            <Input
                                                type="number"
                                                value={layer.styles.rotation || 0}
                                                onChange={e => {
                                                    const newLayers = [...(config.layers || [])];
                                                    newLayers[index] = {
                                                        ...newLayers[index],
                                                        styles: { ...newLayers[index].styles, rotation: parseInt(e.target.value) || 0 }
                                                    };
                                                    updateConfig('layers', newLayers);
                                                }}
                                                className="h-6 text-xs rounded-none border-black"
                                            />
                                        </div>
                                        {layer.type === 'text' && (
                                            <>
                                                <div className="col-span-4 grid grid-cols-2 gap-2">
                                                    <div>
                                                        <Label className="text-[10px]">Width</Label>
                                                        <Input
                                                            type="number"
                                                            value={layer.width || 0}
                                                            onChange={e => {
                                                                const newLayers = [...(config.layers || [])];
                                                                newLayers[index] = { ...newLayers[index], width: parseInt(e.target.value) || 0 };
                                                                updateConfig('layers', newLayers);
                                                            }}
                                                            className="h-6 text-xs rounded-none border-black"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-[10px]">Height</Label>
                                                        <Input
                                                            type="number"
                                                            value={layer.height || 0}
                                                            onChange={e => {
                                                                const newLayers = [...(config.layers || [])];
                                                                newLayers[index] = { ...newLayers[index], height: parseInt(e.target.value) || 0 };
                                                                updateConfig('layers', newLayers);
                                                            }}
                                                            className="h-6 text-xs rounded-none border-black"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="col-span-4">
                                                    <Label className="text-[10px]">Data Source</Label>
                                                    <Select
                                                        value={layer.variableId || 'none'}
                                                        onValueChange={(v) => {
                                                            const newLayers = [...(config.layers || [])];
                                                            // If switching to variable, maybe clear static content or keep as fallback?
                                                            newLayers[index] = { ...newLayers[index], variableId: v === 'none' ? undefined : v };
                                                            updateConfig('layers', newLayers);
                                                        }}
                                                    >
                                                        <SelectTrigger className="h-6 text-xs rounded-none border-black">
                                                            <SelectValue placeholder="Static Text" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {TEXT_VARIABLES.map(opt => (
                                                                <SelectItem key={opt.value} value={opt.value}>
                                                                    {opt.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="col-span-4">
                                                    <Label className="text-[10px]">Content (Static Fallback)</Label>
                                                    <Input
                                                        value={layer.content}
                                                        onChange={e => {
                                                            const newLayers = [...(config.layers || [])];
                                                            newLayers[index] = { ...newLayers[index], content: e.target.value };
                                                            updateConfig('layers', newLayers);
                                                        }}
                                                        className="h-6 text-xs rounded-none border-black"
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <Label className="text-[10px]">Size</Label>
                                                    <Input
                                                        type="number"
                                                        value={layer.styles.fontSize}
                                                        onChange={e => {
                                                            const newLayers = [...(config.layers || [])];
                                                            newLayers[index] = { ...newLayers[index], styles: { ...newLayers[index].styles, fontSize: parseInt(e.target.value) } };
                                                            updateConfig('layers', newLayers);
                                                        }}
                                                        className="h-6 text-xs rounded-none border-black"
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <Label className="text-[10px]">Color</Label>
                                                    <Input
                                                        type="color"
                                                        value={layer.styles.color}
                                                        onChange={e => {
                                                            const newLayers = [...(config.layers || [])];
                                                            newLayers[index] = { ...newLayers[index], styles: { ...newLayers[index].styles, color: e.target.value } };
                                                            updateConfig('layers', newLayers);
                                                        }}
                                                        className="h-6 w-full p-0 rounded-none border-black"
                                                    />
                                                </div>
                                                <div className="col-span-1 flex items-end">
                                                    <div className="flex items-center space-x-2 h-6">
                                                        <input
                                                            type="checkbox"
                                                            id={`autofit-${layer.id}`}
                                                            checked={layer.styles.autoFit || false}
                                                            onChange={e => {
                                                                const newLayers = [...(config.layers || [])];
                                                                newLayers[index] = {
                                                                    ...newLayers[index],
                                                                    styles: { ...newLayers[index].styles, autoFit: e.target.checked }
                                                                };
                                                                updateConfig('layers', newLayers);
                                                            }}
                                                            className="h-4 w-4 rounded border-gray-300"
                                                        />
                                                        <Label htmlFor={`autofit-${layer.id}`} className="text-[10px] cursor-pointer">Auto Fit</Label>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {layer.type === 'image' && (
                                            <>
                                                <div className="col-span-4">
                                                    <Label className="text-[10px] block mb-1">Data Source</Label>
                                                    <Select
                                                        value={layer.variableId || 'none'}
                                                        onValueChange={(v) => {
                                                            const newLayers = [...(config.layers || [])];
                                                            newLayers[index] = { ...newLayers[index], variableId: v === 'none' ? undefined : v };
                                                            updateConfig('layers', newLayers);
                                                        }}
                                                    >
                                                        <SelectTrigger className="h-6 text-xs rounded-none border-black w-full">
                                                            <SelectValue placeholder="Static Image" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {IMAGE_VARIABLES.map(opt => (
                                                                <SelectItem key={opt.value} value={opt.value}>
                                                                    {opt.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {!layer.variableId && (
                                                    <div className="col-span-4 grid grid-cols-2 gap-2">
                                                        <div className="col-span-2">
                                                            <Label className="text-[10px]">Upload Image (Static)</Label>
                                                            <Input
                                                                type="file"
                                                                className="h-6 text-[10px] file:text-[10px] rounded-none border-black"
                                                                accept="image/*"
                                                                onChange={async (e) => {
                                                                    const file = e.target.files?.[0]
                                                                    if (file) {
                                                                        try {
                                                                            const formData = new FormData()
                                                                            formData.append('file', file)
                                                                            const res = await uploadImage(formData)
                                                                            if (res.error) alert(res.error)
                                                                            else if (res.publicUrl) {
                                                                                const newLayers = [...(config.layers || [])];
                                                                                newLayers[index] = { ...newLayers[index], src: res.publicUrl };
                                                                                updateConfig('layers', newLayers);
                                                                            }
                                                                        } catch (err) {
                                                                            console.error(err)
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}



                                        {layer.type === 'svg' && (
                                            <>
                                                <div className="col-span-4">
                                                    <Label className="text-[10px]">SVG Code</Label>
                                                    <Textarea
                                                        value={layer.content}
                                                        onChange={e => {
                                                            const newLayers = [...(config.layers || [])];
                                                            newLayers[index] = { ...newLayers[index], content: e.target.value };
                                                            updateConfig('layers', newLayers);
                                                        }}
                                                        className="min-h-[100px] text-[10px] font-mono rounded-none border-black p-2"
                                                        placeholder="<svg>...</svg>"
                                                    />
                                                </div>
                                                <div className="col-span-4 grid grid-cols-2 gap-2">
                                                    <div>
                                                        <Label className="text-[10px]">Width</Label>
                                                        <Input
                                                            type="number"
                                                            value={layer.width}
                                                            onChange={e => {
                                                                const newLayers = [...(config.layers || [])];
                                                                newLayers[index] = { ...newLayers[index], width: parseInt(e.target.value) || 0 };
                                                                updateConfig('layers', newLayers);
                                                            }}
                                                            className="h-6 text-xs rounded-none border-black"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-[10px]">Height</Label>
                                                        <Input
                                                            type="number"
                                                            value={layer.height}
                                                            onChange={e => {
                                                                const newLayers = [...(config.layers || [])];
                                                                newLayers[index] = { ...newLayers[index], height: parseInt(e.target.value) || 0 };
                                                                updateConfig('layers', newLayers);
                                                            }}
                                                            className="h-6 text-xs rounded-none border-black"
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        {layer.type === 'rect' && (
                                            <>
                                                <div className="col-span-2 space-y-2">
                                                    <div className="flex gap-2">
                                                        <div className="flex-1">
                                                            <Label className="text-[10px]">Width</Label>
                                                            <Input
                                                                type="number"
                                                                value={layer.width}
                                                                onChange={e => {
                                                                    const newLayers = [...(config.layers || [])];
                                                                    newLayers[index] = { ...newLayers[index], width: parseInt(e.target.value) || 0 };
                                                                    updateConfig('layers', newLayers);
                                                                }}
                                                                className="h-6 text-xs rounded-none border-black"
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <Label className="text-[10px]">Height</Label>
                                                            <Input
                                                                type="number"
                                                                value={layer.height}
                                                                onChange={e => {
                                                                    const newLayers = [...(config.layers || [])];
                                                                    newLayers[index] = { ...newLayers[index], height: parseInt(e.target.value) || 0 };
                                                                    updateConfig('layers', newLayers);
                                                                }}
                                                                className="h-6 text-xs rounded-none border-black"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <Label className="text-[10px]">Color</Label>
                                                    <Input
                                                        type="color"
                                                        value={layer.styles.backgroundColor || '#000000'}
                                                        onChange={e => {
                                                            const newLayers = [...(config.layers || [])];
                                                            newLayers[index] = { ...newLayers[index], styles: { ...newLayers[index].styles, backgroundColor: e.target.value } };
                                                            updateConfig('layers', newLayers);
                                                        }}
                                                        className="h-6 w-full p-0 rounded-none border-black"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-[10px]">Radius</Label>
                                                    <Input
                                                        type="number"
                                                        value={layer.styles.borderRadius || 0}
                                                        onChange={e => {
                                                            const newLayers = [...(config.layers || [])];
                                                            newLayers[index] = { ...newLayers[index], styles: { ...newLayers[index].styles, borderRadius: parseInt(e.target.value) || 0 } };
                                                            updateConfig('layers', newLayers);
                                                        }}
                                                        className="h-6 text-xs rounded-none border-black"
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs rounded-none border-black border-dashed flex items-center justify-center gap-1"
                                onClick={() => {
                                    const newLayers = [...(config.layers || [])];
                                    newLayers.push({
                                        id: Math.random().toString(),
                                        type: 'text',
                                        x: 100,
                                        y: 100,
                                        width: 300,
                                        height: 50,
                                        styles: { color: '#000000', fontSize: 32, fontWeight: 'bold' },
                                        content: 'New Text'
                                    });
                                    updateConfig('layers', newLayers);
                                }}
                            >
                                + Text
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs rounded-none border-black border-dashed flex items-center justify-center gap-1"
                                onClick={() => {
                                    const newLayers = [...(config.layers || [])];
                                    newLayers.push({
                                        id: Math.random().toString(),
                                        type: 'image',
                                        x: 150,
                                        y: 150,
                                        width: 200,
                                        height: 200,
                                        styles: { borderRadius: 0 },
                                        src: 'https://placehold.co/400?text=Img'
                                    });
                                    updateConfig('layers', newLayers);
                                }}
                            >
                                + Image
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs rounded-none border-black border-dashed flex items-center justify-center gap-1"
                                onClick={() => {
                                    const newLayers = [...(config.layers || [])];
                                    newLayers.push({
                                        id: Math.random().toString(),
                                        type: 'rect',
                                        x: 200,
                                        y: 200,
                                        width: 100,
                                        height: 100,
                                        styles: { backgroundColor: '#e5e7eb', borderRadius: 0 },
                                    });
                                    updateConfig('layers', newLayers);
                                }}
                            >
                                + Shape
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs rounded-none border-black border-dashed flex items-center justify-center gap-1"
                                onClick={() => {
                                    const newLayers = [...(config.layers || [])];
                                    newLayers.push({
                                        id: Math.random().toString(),
                                        type: 'svg',
                                        x: 200,
                                        y: 200,
                                        width: 100,
                                        height: 100,
                                        styles: { color: '#000000' },
                                        content: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="currentColor"/></svg>'
                                    });
                                    updateConfig('layers', newLayers);
                                }}
                            >
                                + SVG
                            </Button>
                        </div>
                    </div>







                    <Button
                        className="w-full bg-[#eb4f27] hover:bg-black text-white rounded-none h-12 text-lg"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Template
                    </Button>

                </CardContent >
            </Card >

            {/* Right Panel: Preview */}
            < div
                className="flex-1 bg-gray-100 flex items-center justify-center p-8 border border-black border-dashed min-h-[400px] overflow-hidden select-none"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp} // Stop dragging if left window
            >
                {/* 
                  Interactive Container 
                  If CUSTOM layout, we render the React elements directly for speed and DnD.
                  If others, we render the Image preview.
                */}

                {
                    config.layout === 'custom' ? (
                        <div
                            ref={previewContainerRef}
                            style={{
                                width: config.dimensions?.width || 1200,
                                height: config.dimensions?.height || 630,
                                transform: `scale(${Math.min(1, 800 / (config.dimensions?.width || 1200))})`, // Simple fit-to-screen logic
                                transformOrigin: 'center center',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                            }}
                            className="bg-white"
                            onMouseDown={handleMouseDown} // Catch events from children
                        >
                            <CustomLayout
                                config={config}
                                content={DUMMY_CONTENT}
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
                    )
                }
            </div >
        </div >
    )
}
