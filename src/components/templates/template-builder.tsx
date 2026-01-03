'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TemplateConfig, ContentData } from '@/lib/opengraph/engine'
import { saveTemplate } from '@/app/(dashboard)/settings/templates/actions'
import { useDebounce } from 'use-debounce'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowLeft } from 'lucide-react'

// Sub-components
import { LayerSettings } from './builder/layer-settings'
import { CanvasPreview } from './builder/canvas-preview'

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

    // Generate Preview
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

    return (
        <div className="flex h-[calc(100vh-100px)] flex-col lg:flex-row gap-6">
            {/* Left Panel: Controls */}
            <Card className="w-full lg:w-[400px] flex-shrink-0 h-full overflow-hidden flex flex-col rounded-none border-black">
                <CardHeader className="border-b border-black flex-shrink-0">
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
                <CardContent className="space-y-6 pt-6 flex-1 overflow-y-auto">

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

                    {/* Layer Settings Component */}
                    <LayerSettings
                        config={config}
                        selectedLayerId={selectedLayerId}
                        updateConfig={updateConfig}
                        setSelectedLayerId={setSelectedLayerId}
                    />

                    <Button
                        className="w-full bg-[#eb4f27] hover:bg-black text-white rounded-none h-12 text-lg"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Template
                    </Button>

                </CardContent >
            </Card>

            {/* Right Panel: Preview Component */}
            <CanvasPreview
                config={config}
                debouncedConfig={debouncedConfig}
                previewUrl={previewUrl}
                isLoading={isLoading}
                selectedLayerId={selectedLayerId}
                dummyContent={DUMMY_CONTENT}
                updateConfig={updateConfig}
                setSelectedLayerId={setSelectedLayerId}
            />
        </div>
    )
}
