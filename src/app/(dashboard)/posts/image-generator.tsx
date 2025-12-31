'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UploadCloud, Loader2, RefreshCw, Download, Image as ImageIcon, Sparkles } from 'lucide-react'
import { getTemplates } from '@/app/(dashboard)/settings/templates/actions'
import { generateTemplateContent, generateImage } from './ai-actions'
import { toast } from 'sonner'
import { InteractiveTemplatePreview } from '@/components/templates/interactive-template-preview'
import { TemplateConfig, ContentData } from '@/lib/opengraph/engine'
import { toPng } from 'html-to-image'
import { createClient } from '@/utils/supabase/client'
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { AlertCircle } from 'lucide-react'

// Helper to extract URL from various formats
const getImageUrl = (value: any): string => {
    if (!value) return ''
    if (typeof value === 'string') return value
    if (typeof value === 'object' && value.url) return value.url
    return ''
}

// Helper to slugify text
const slugify = (text: string) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')        // Replace spaces with -
        .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
        .replace(/\-\-+/g, '-')      // Replace multiple - with single -
}

// Reuse the existing basic uploader for the "Upload" tab
function BasicImageUploader({ value, onChange }: { value: any, onChange: (value: any) => void }) {
    const [uploading, setUploading] = useState(false)
    const imageUrl = getImageUrl(value)
    const [altText, setAltText] = useState(value?.alt || '')

    // Update parent when alt text changes
    const handleAltChange = (newAlt: string) => {
        setAltText(newAlt)
        if (imageUrl) {
            onChange({ url: imageUrl, alt: newAlt })
        }
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const supabase = createClient()
            const fileExt = file.name.split('.').pop()
            const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name

            const sanitizedName = slugify(nameWithoutExt)
            // User requested to remove long timestamp. We'll use just the name. 
            // Supabase will overwrite if exists, which is often desired for updates.
            // If uniqueness is needed, we could check or append a short hash, but let's stick to clean names.
            const fileName = `${sanitizedName}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('post-images')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data } = supabase.storage.from('post-images').getPublicUrl(filePath)
            // Initialize with current alt text or empty
            onChange({ url: data.publicUrl, alt: altText })
        } catch (error) {
            console.error('Error uploading image:', error)
            alert('Failed to upload image')
        } finally {
            setUploading(false)
        }
    }

    if (imageUrl) {
        return (
            <div className="space-y-2">
                <div className="relative group w-full aspect-video bg-gray-100 flex items-center justify-center overflow-hidden border border-black">
                    <img src={imageUrl} alt="Uploaded" className="w-full h-full object-cover" />
                    <button
                        onClick={() => {
                            setAltText('')
                            onChange(null)
                        }}
                        className="absolute top-2 right-2 bg-white/90 p-1 hover:bg-red-50 hover:text-red-500 transition-colors border border-black z-10"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">
                        {altText ? `Alt: ${altText}` : 'No Alt Text'}
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    <Label className="whitespace-nowrap text-xs">Alt Text:</Label>
                    <Input
                        value={altText}
                        onChange={(e) => handleAltChange(e.target.value)}
                        placeholder="Describe this image for SEO..."
                        className="h-8 text-xs"
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="relative aspect-video">
            <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="w-full h-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors">
                <div className="flex flex-col items-center gap-2 text-gray-400">
                    {uploading ? (
                        <Loader2 className="h-8 w-8 animate-spin" />
                    ) : (
                        <UploadCloud className="h-8 w-8" />
                    )}
                    <span className="text-sm font-medium">
                        {uploading ? 'Uploading...' : 'Click to upload image'}
                    </span>
                </div>
            </div>
        </div>
    )
}

interface ImageGeneratorProps {
    value: any
    onChange: (value: any) => void
    organizationId: string
    postContext?: string
}

export function ImageGenerator({ value, onChange, organizationId, postContext }: ImageGeneratorProps) {
    const [templates, setTemplates] = useState<any[]>([])
    const [loadingTemplates, setLoadingTemplates] = useState(false)
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null)

    // Content state for the preview
    const [previewContent, setPreviewContent] = useState<ContentData>({
        title: 'Your Title Here',
        subtitle: 'Subtitle goes here'
    })

    // Alt text state for generated image
    // If incoming value has alt, use it as default for generated too?
    // Or keep them separate? Usually generated image matches the post, so maybe default to title?
    const [generatedAltText, setGeneratedAltText] = useState((typeof value === 'object' ? value?.alt : '') || '')

    const previewRef = useRef<HTMLDivElement>(null)
    const [generating, setGenerating] = useState(false)
    const [generatingAI, setGeneratingAI] = useState(false)


    const handleAIGenerate = async () => {
        if (!postContext) {
            toast.error('Wpisz temat posta lub treść, aby użyć Magic Fill ✨')
            return
        }
        setGeneratingAI(true)
        try {
            // 1. Generate Text & Image Prompt
            const res = await generateTemplateContent(postContext, organizationId)

            if (res.error) {
                toast.error(res.error)
            } else if (res.data) {
                setPreviewContent(prev => ({
                    ...prev,
                    title: res.data.title,
                    subtitle: res.data.subtitle
                }))

                if (res.data.imagePrompt) {
                    setGeneratedAltText(res.data.altText || res.data.title || 'Generated image')
                    toast.message('Generating image...', { description: 'Creating visual for your post' })

                    // 2. Generate Image
                    const imgRes = await generateImage(res.data.imagePrompt)

                    if (imgRes.url) {
                        // Find the first image layer with a variableId to populate
                        const imageLayer = selectedTemplate?.config?.layers?.find(
                            (l: any) => l.type === 'image' && l.variableId
                        )

                        const imageKey = imageLayer?.variableId || 'image'

                        setPreviewContent(prev => ({
                            ...prev,
                            [imageKey]: imgRes.url
                        }))
                        toast.success('Template filled & Image generated!')
                    } else {
                        toast.error(`Image generation failed: ${imgRes.error || 'Unknown error'}`)
                        console.error('Image Gen Error:', imgRes.error)
                    }
                } else {
                    toast.success('Template filled (Text only)')
                }
            }
        } catch (e) {
            console.error(e)
            toast.error('AI generation failed')
        } finally {
            setGeneratingAI(false)
        }
    }

    useEffect(() => {
        const loadTemplates = async () => {
            if (!organizationId) return
            setLoadingTemplates(true)
            const res = await getTemplates(organizationId)
            if (res.data) {
                setTemplates(res.data)
            }
            setLoadingTemplates(false)
        }
        loadTemplates()
    }, [organizationId])

    // Update alt text whenever title changes if it's currently matching or empty?
    // Or just provide a field. Let's provide a field.
    useEffect(() => {
        // Optional: Auto-populate alt text from title if empty
        if (!generatedAltText && previewContent.title && previewContent.title !== 'Your Title Here') {
            setGeneratedAltText(previewContent.title)
        }
    }, [previewContent.title])

    const handleSelectTemplate = (template: any) => {
        setSelectedTemplate(template)
        // Reset content to dummy defaults or infer from usage
        setPreviewContent({
            title: 'Your Title Here',
            subtitle: 'Subtitle goes here',
            // Pre-fill image variables if they exist in layers
            ...(template.config?.layers?.reduce((acc: any, layer: any) => {
                if (layer.variableId && layer.type === 'image') {
                    acc[layer.variableId] = '' // Initialize
                }
                return acc
            }, {}) || {})
        })
    }

    const handleGenerate = async () => {
        if (!previewRef.current) return
        setGenerating(true)

        try {
            // Target specific node to avoid capturing the wrapper mess
            // Actually previewRef is on the container.
            // The first child of InteractiveTemplatePreview's container is the scaled div (after my update).
            // But checking the DOM structure:
            // previewRef -> InteractiveTemplatePreview container -> Scaled Div -> Content

            // To be safe, let's capture the 'previewRef.current' but force styles to reset scaling.
            // Wait, if I capture the container, and force scale(1), the container itself needs to be 1200px wide.
            // If the on-screen container is 600px, setting inner scale to 1 will cause overflow (clipped) if overflow hidden.

            // Better approach:
            // 1. Get the actual content node (the scaled one).
            // 2. Capture THAT node.
            // 3. Force transform: none.

            // To do this easily via refs, I can assume the structure or traverse.
            // Or better: pass a ref down?
            // For now let's try traversing: The first child of InteractiveTemplatePreview (div) -> first child (scaled div).
            // previewRef points to the wrapper in ImageGenerator.
            // Inside is InteractiveTemplatePreview (div).
            // Inside is Scaled Div.

            const elementToCapture = previewRef.current.getElementsByClassName('template-scaler')[0] as HTMLElement
            // This is risky if structure changes.

            // Alternative: Capture the whole previewRef but enforce large dimensions on the wrapper during capture?
            // html-to-image's 'style' option applies to the cloned node.
            // If I apply { width: '1200px', height: '630px' } to the container, and { transform: 'none' } to the child?

            // Let's try capturing the `elementToCapture` (the inner scaled div) and unscaling it.
            if (!elementToCapture) throw new Error('Could not find template element')

            const configWidth = selectedTemplate.config.dimensions?.width || 1200
            const configHeight = selectedTemplate.config.dimensions?.height || 630

            const dataUrl = await toPng(elementToCapture, {
                cacheBust: true,
                width: configWidth,
                height: configHeight,
                style: {
                    transform: 'none', // Remove the scale(0.5) etc
                    width: `${configWidth}px`,
                    height: `${configHeight}px`,
                    transformOrigin: 'top left' // Reset origin just in case
                }
            })

            // Convert to Blob
            const res = await fetch(dataUrl)
            const blob = await res.blob()
            const file = new File([blob], 'generated-image.png', { type: 'image/png' })

            // Upload to Supabase
            const supabase = createClient()

            // Generate descriptive filename

            const baseName = slugify(previewContent.title || 'generated-image')
            // User requested to remove long timestamp.
            const fileName = `${baseName}.png`

            const { error: uploadError } = await supabase.storage
                .from('post-images')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            const { data } = supabase.storage.from('post-images').getPublicUrl(fileName)

            // Use the alt text from state
            onChange({ url: data.publicUrl, alt: generatedAltText || previewContent.title })

            // Optional: Switch back to "Upload" tab or show success?
            // For now, the parent will update the value, which updates both tabs.

        } catch (err) {
            console.error('Generation failed:', err)
            alert('Failed to generate image')
        } finally {
            setGenerating(false)
        }
    }

    return (
        <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-none border border-black bg-white p-0">
                <TabsTrigger
                    value="upload"
                    className="rounded-none data-[state=active]:bg-black data-[state=active]:text-white h-9"
                >
                    Direct Upload
                </TabsTrigger>
                <TabsTrigger
                    value="template"
                    className="rounded-none data-[state=active]:bg-black data-[state=active]:text-white h-9"
                >
                    From Template
                </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-4">
                <BasicImageUploader value={value} onChange={onChange} />
            </TabsContent>

            <TabsContent value="template" className="mt-4 space-y-4">
                {!selectedTemplate ? (
                    // Template List
                    <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto p-1">
                        {loadingTemplates ? (
                            <div className="col-span-2 flex justify-center py-8">
                                <Loader2 className="animate-spin text-gray-400" />
                            </div>
                        ) : templates.length === 0 ? (
                            <div className="col-span-2 text-center py-8 text-gray-500 text-sm">
                                <ImageIcon className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                No templates found. Create one in Settings.
                            </div>
                        ) : (
                            templates.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => handleSelectTemplate(t)}
                                    className="group relative aspect-[1.91/1] border border-gray-200 hover:border-black transition-all text-left bg-gray-50 overflow-hidden"
                                >
                                    {/* Mini Preview - reusing static preview logic or just rendering */}
                                    <div className="absolute inset-0 pointer-events-none transform scale-[0.25] origin-top-left w-[400%] h-[400%]">
                                        <InteractiveTemplatePreview
                                            config={t.config}
                                            content={{ title: 'Preview' }}
                                            onContentChange={() => { }}
                                            readOnly
                                        />
                                    </div>
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5" />
                                    <div className="absolute bottom-0 left-0 right-0 bg-white/90 p-2 text-xs font-bold border-t border-gray-100 truncate">
                                        {t.name}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                ) : (
                    // Editor & Generator
                    <div className="space-y-4 border border-black/10 p-4 bg-gray-50/50">
                        <div className="flex items-center justify-between mb-2">
                            <button
                                onClick={() => setSelectedTemplate(null)}
                                className="text-xs font-bold hover:underline flex items-center gap-1"
                            >
                                ← Back to Templates
                            </button>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 text-[10px] px-2 rounded-none border-purple-500 text-purple-600 hover:bg-purple-50"
                                    onClick={handleAIGenerate}
                                    disabled={generatingAI}
                                >
                                    {generatingAI ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                                    Magic Fill
                                </Button>
                                <Label className="text-xs uppercase font-bold text-gray-400">Editor</Label>
                            </div>
                        </div>

                        {/* Config Inputs */}
                        <div className="grid gap-2">
                            <Label className="text-xs">Title Text</Label>
                            <Input
                                value={previewContent.title}
                                onChange={e => setPreviewContent(prev => ({ ...prev, title: e.target.value }))}
                                className="h-8 text-xs bg-white rounded-none border-gray-300"
                            />
                            <Label className="text-xs">Subtitle Text</Label>
                            <Input
                                value={previewContent.subtitle || ''}
                                onChange={e => setPreviewContent(prev => ({ ...prev, subtitle: e.target.value }))}
                                className="h-8 text-xs bg-white rounded-none border-gray-300"
                            />

                            {/* Alt Text Input for Generator */}
                            <Label className="text-xs mt-2">Alt Text for Generated Image</Label>
                            <Input
                                value={generatedAltText}
                                onChange={e => setGeneratedAltText(e.target.value)}
                                placeholder="Describe the generated image..."
                                className="h-8 text-xs bg-white rounded-none border-gray-300"
                            />
                        </div>

                        <div className="border border-black bg-white">
                            {/* This container needs to match the dimensions we want to capture, or be responsive.
                                Ideally validation should force 1.91:1 aspect ratio. */}
                            <div className="aspect-[1.91/1] w-full relative overflow-hidden" ref={previewRef}>
                                <InteractiveTemplatePreview
                                    config={selectedTemplate.config}
                                    content={previewContent}
                                    onContentChange={setPreviewContent}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button
                                onClick={handleGenerate}
                                disabled={generating}
                                className="rounded-none bg-[#eb4f27] hover:bg-[#eb4f27]/90 text-white w-full sm:w-auto"
                            >
                                {generating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Download className="mr-2 h-4 w-4" />
                                        Use this Design
                                    </>
                                )}
                            </Button>
                        </div>

                        <div className="text-[10px] text-gray-400 text-center">
                            Note: Click on "Upload" placeholders in the preview to add your own images before generating.
                        </div>
                    </div>
                )}
            </TabsContent>
        </Tabs>
    )
}
