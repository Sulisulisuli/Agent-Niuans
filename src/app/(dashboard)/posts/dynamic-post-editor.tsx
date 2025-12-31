'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Sparkles, Image as ImageIcon } from 'lucide-react'
import { createWebflowPost, updateWebflowPost } from './actions'
import { generatePostContent } from './ai-actions'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { UploadCloud, X } from 'lucide-react'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { Switch } from '@/components/ui/switch'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useEffect } from 'react'
import { getWebflowItems } from './actions'
import { ImageGenerator } from './image-generator'

// Enhanced ImageUploader to support string or object value { url, alt }
function ImageUploader({ value, onChange }: { value: string | { url: string, alt?: string }, onChange: (url: string | { url: string, alt?: string }) => void }) {
    const [uploading, setUploading] = useState(false)

    // Normalize value to get URL string
    const getImageUrl = (val: any) => {
        if (!val) return ''
        if (typeof val === 'string') return val
        return val.url || ''
    }

    const currentUrl = getImageUrl(value)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const supabase = createClient()
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('post-images')
                .upload(filePath, file)

            if (uploadError) {
                throw uploadError
            }

            const { data } = supabase.storage.from('post-images').getPublicUrl(filePath)

            // If value was an object, update the url property but keep object structure?
            // Actually, for basic uploader we might as well upgrade to object structure if not already.
            // But let's respect the type. If it was string, keep string? No, Webflow prefers consistency.
            // Let's return object if we can, but onChange expects matching type.
            // For now, let's just return the object structure { url, alt: '' } to start being consistent.
            onChange({ url: data.publicUrl, alt: '' })
        } catch (error) {
            console.error('Error uploading image:', error)
            alert('Failed to upload image')
        } finally {
            setUploading(false)
        }
    }

    // Handle clearing the image
    const handleClear = () => {
        onChange('') // Or null? Typically forms handle empty string better.
    }

    if (currentUrl) {
        return (
            <div className="relative group w-full max-w-sm">
                <img src={currentUrl} alt="Uploaded" className="w-full h-48 object-cover rounded-none border border-black" />
                <button
                    onClick={handleClear}
                    className="absolute top-2 right-2 bg-white/90 p-1 hover:bg-red-50 hover:text-red-500 transition-colors border border-black"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        )
    }

    return (
        <div className="relative">
            <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="border-2 border-dashed border-gray-300 p-8 text-center hover:bg-gray-50 transition-colors group">
                <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-black">
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

interface WebflowField {
    id: string
    slug: string
    displayName: string
    type: string
    validations?: {
        options?: Array<{ id: string, name: string }>
        collectionId?: string
    }
}

interface DynamicPostEditorProps {
    fields: WebflowField[]
    collectionId: string
    token: string
    initialData?: any // Optional initial data for editing
    onSuccess?: () => void
    organizationId?: string
}

export default function DynamicPostEditor({ fields, collectionId, token, initialData, organizationId, ...props }: DynamicPostEditorProps) {
    // State to hold form values dynamic to the schema
    // Initialize with initialData if present (fieldData is usually nested in item response, but let's assume raw field map is passed)
    // If passing full item object, we might need to access item.fieldData
    const [formData, setFormData] = useState<Record<string, any>>(initialData?.fieldData || {})
    const [status, setStatus] = useState<'idle' | 'generating' | 'saving' | 'success' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState('')

    // AI State
    const [aiLoading, setAiLoading] = useState(false)
    const [prompt, setPrompt] = useState('')
    const [aiError, setAiError] = useState('')

    const [contextMode, setContextMode] = useState<'url' | 'text'>('url')
    const [contextUrl, setContextUrl] = useState('')
    const [contextText, setContextText] = useState('')
    const [generatedKeywords, setGeneratedKeywords] = useState<string[]>([])

    // Reference data storage
    const [referenceData, setReferenceData] = useState<Record<string, any[]>>({})

    const router = useRouter()

    useEffect(() => {
        const fetchReferenceData = async () => {
            const refFields = fields.filter(f => f.type === 'Reference' || f.type === 'MultiReference')
            if (refFields.length === 0) return

            console.log('Fetching reference data for fields:', refFields.map(f => f.slug))

            const newData: Record<string, any[]> = { ...referenceData }

            for (const field of refFields) {
                const targetCollectionId = field.validations?.collectionId
                if (targetCollectionId && !newData[targetCollectionId]) {
                    const res = await getWebflowItems(token, targetCollectionId)
                    if (res.items) {
                        newData[targetCollectionId] = res.items
                    }
                }
            }
            setReferenceData(newData)
        }

        fetchReferenceData()
    }, [fields, token])

    const handleAiGenerate = async () => {
        if (!prompt.trim()) return
        setAiLoading(true)
        setAiError('')
        setGeneratedKeywords([])

        const context = {
            text: contextMode === 'text' ? contextText : undefined,
            urls: contextMode === 'url' && contextUrl.trim() ? [contextUrl.trim()] : undefined
        }

        const res = await generatePostContent({ prompt, fields, context })
        setAiLoading(false)

        if (res.error) {
            setAiError(res.error)
            return
        }

        if (res.data) {
            // Extract Keywords
            if (res.data._keywords && Array.isArray(res.data._keywords)) {
                setGeneratedKeywords(res.data._keywords)
                // Remove _keywords from data so it doesn't try to map to a field (unless we have a field for it later)
                delete res.data._keywords
            }

            // Smart Merge: Only fill empty fields
            setFormData(prev => {
                const newData = { ...prev }
                Object.keys(res.data).forEach(key => {
                    // Only update if previous value is empty/undefined
                    if (!newData[key] || newData[key] === '') {
                        newData[key] = res.data[key]
                    }
                })
                return newData
            })
        }
    }

    const handleChange = (slug: string, value: any) => {
        setFormData(prev => ({ ...prev, [slug]: value }))
    }

    const cleanupStagedImages = async () => {
        const supabase = createClient()
        const imagesToDelete: string[] = []

        fields.forEach(field => {
            if (field.type === 'Image') {
                const value = formData[field.slug]
                // Handle both string and object { url, alt }
                const url = typeof value === 'object' && value?.url ? value.url : value

                // Check if it's a Supabase URL (contains our bucket name)
                if (url && typeof url === 'string' && url.includes('/post-images/')) {
                    // Extract path: everything after 'post-images/'
                    const path = url.split('/post-images/')[1]
                    if (path) imagesToDelete.push(path)
                }
            }
        })

        if (imagesToDelete.length > 0) {
            console.log('Cleaning up staged images:', imagesToDelete)
            await supabase.storage.from('post-images').remove(imagesToDelete)
        }
    }

    const handleSave = async () => {
        setStatus('saving')
        setErrorMessage('')

        let res;
        if (initialData?.id) {
            // Update existing
            res = await updateWebflowPost(token, collectionId, initialData.id, formData)
        } else {
            // Create new
            res = await createWebflowPost(token, collectionId, formData)
        }

        if (res.error) {
            setStatus('error')
            setErrorMessage(res.error)
            // alert('Error creating post: ' + res.error) // Removed alert as we show error message in UI or could be improved
        } else {
            // Success! Cleanup staged images from Supabase as Webflow has them now
            await cleanupStagedImages()

            setStatus('success')

            // Delay for success animation before redirecting
            setTimeout(() => {
                setStatus('idle')
                if (props.onSuccess) {
                    props.onSuccess()
                }
            }, 1000)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">

            {/* AI Generator Section */}
            <div className="bg-gradient-to-r from-gray-50 to-white p-6 border border-gray-100 shadow-sm relative overflow-hidden group">
                <Label className="text-[#eb4f27] font-bold tracking-widest text-xs uppercase mb-4 block">
                    AI Content Generator <span className="text-gray-400 font-normal ml-2 lowercase tracking-normal text-[10px]">(Beta)</span>
                </Label>

                <div className="space-y-4">
                    {/* Prompt Input */}
                    <div className="flex gap-2">
                        <Input
                            placeholder="Describe what you want to write about... (e.g. 'Article about future of AI in 2025')"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="rounded-none border-gray-300 focus-visible:ring-[#eb4f27] bg-white h-12 flex-1"
                            onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
                        />
                        <Button
                            onClick={handleAiGenerate}
                            disabled={aiLoading || !prompt.trim()}
                            className="rounded-none bg-[#eb4f27] hover:bg-[#eb4f27]/90 text-white min-w-[120px] h-12 px-6"
                        >
                            {aiLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Generate
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Context Injection Options */}
                    <div className="bg-white border border-gray-200 p-4">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-3">Knowledge Injection (Context)</p>

                        <div className="flex gap-4 mb-3 border-b border-gray-100 pb-2">
                            <button
                                onClick={() => setContextMode('url')}
                                className={`text-sm font-medium pb-1 transition-colors ${contextMode === 'url' ? 'text-[#eb4f27] border-b-2 border-[#eb4f27]' : 'text-gray-400 hover:text-gray-700'}`}
                            >
                                Source URLs
                            </button>
                            <button
                                onClick={() => setContextMode('text')}
                                className={`text-sm font-medium pb-1 transition-colors ${contextMode === 'text' ? 'text-[#eb4f27] border-b-2 border-[#eb4f27]' : 'text-gray-400 hover:text-gray-700'}`}
                            >
                                Paste Text
                            </button>
                        </div>

                        {contextMode === 'url' ? (
                            <Input
                                placeholder="Paste article URL (e.g. https://example.com/article)..."
                                value={contextUrl}
                                onChange={(e) => setContextUrl(e.target.value)}
                                className="rounded-none border-gray-200 text-sm h-10"
                            />
                        ) : (
                            <Textarea
                                placeholder="Paste rough notes, drafts, or snippets here..."
                                value={contextText}
                                onChange={(e) => setContextText(e.target.value)}
                                className="rounded-none border-gray-200 text-sm min-h-[80px]"
                            />
                        )}
                    </div>
                </div>

                {/* Keywords Display */}
                {generatedKeywords.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 animate-in fade-in slide-in-from-top-2">
                        <Label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Generated Keywords</Label>
                        <div className="flex flex-wrap gap-2">
                            {generatedKeywords.map((kw, i) => (
                                <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-none border border-gray-200">
                                    #{kw}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {aiError && <p className="text-red-500 text-sm mt-4 p-2 bg-red-50 border border-red-100">{aiError}</p>}
            </div>

            {/* Header / Actions */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">{initialData ? 'Edit Post' : 'New Post'}</h2>
                <div className="flex gap-4 items-center">
                    <Button
                        onClick={handleSave}
                        disabled={status !== 'idle' && status !== 'success'}
                        className="rounded-none bg-[#eb4f27] hover:bg-[#eb4f27]/90 text-white min-w-[120px]"
                    >
                        {status === 'saving' ? <Loader2 className="animate-spin" /> : status === 'success' ? 'Saved!' : (initialData ? 'Update' : 'Publish')}
                    </Button>
                </div>
            </div>

            {/* Dynamic Form Board */}
            <Card className="border-black rounded-none shadow-none">
                <CardHeader className="bg-gray-50 border-b border-black/10">
                    <CardTitle className="text-base font-medium text-gray-500">
                        Editing for Collection ID: <span className="font-mono text-black">{collectionId}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    {fields.map((field) => (
                        <div key={field.id} className="space-y-4">
                            <Label className="text-base font-bold flex items-center justify-between">
                                {field.displayName}
                                <span className="text-xs font-normal text-gray-400 font-mono bg-gray-100 px-2 py-1">{field.type}</span>
                            </Label>

                            {/* Render Input based on Type */}
                            {field.type === 'PlainText' && (
                                <Input
                                    className="rounded-none border-black h-12 text-lg"
                                    placeholder={`Enter ${field.displayName}...`}
                                    value={formData[field.slug] || ''}
                                    onChange={(e) => handleChange(field.slug, e.target.value)}
                                />
                            )}

                            {field.type === 'RichText' && (
                                <RichTextEditor
                                    value={formData[field.slug] || ''}
                                    onChange={(html) => handleChange(field.slug, html)}
                                />
                            )}

                            {field.type === 'Image' && (
                                organizationId ? (
                                    <ImageGenerator
                                        value={formData[field.slug]}
                                        onChange={(url) => handleChange(field.slug, url)}
                                        organizationId={organizationId}
                                        postContext={[
                                            formData['name'] ? `Title: ${formData['name']}` : '',
                                            formData['post-content'] ? `Content: ${formData['post-content']?.replace(/<[^>]*>?/gm, '')}` : '',
                                            formData['post-excerpt'] ? `Excerpt: ${formData['post-excerpt']}` : '',
                                            prompt ? `Instructions: ${prompt}` : '',
                                            contextText ? `Notes: ${contextText}` : ''
                                        ].filter(Boolean).join('\n\n')}
                                    />
                                ) : (
                                    <ImageUploader
                                        value={formData[field.slug]}
                                        onChange={(url) => handleChange(field.slug, url)}
                                    />
                                )
                            )}

                            {field.type === 'Number' && (
                                <Input
                                    type="number"
                                    className="rounded-none border-black h-12 text-lg"
                                    placeholder={`Enter ${field.displayName}...`}
                                    value={formData[field.slug] ?? ''}
                                    onChange={(e) => {
                                        const val = e.target.value
                                        handleChange(field.slug, val === '' ? null : parseFloat(val))
                                    }}
                                />
                            )}

                            {field.type === 'Switch' && (
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id={field.id}
                                        checked={!!formData[field.slug]}
                                        onCheckedChange={(checked) => handleChange(field.slug, checked)}
                                    />
                                    <Label htmlFor={field.id} className="text-sm font-normal text-gray-500">
                                        {formData[field.slug] ? 'Enabled' : 'Disabled'}
                                    </Label>
                                </div>
                            )}

                            {field.type === 'Option' && (
                                <Select
                                    value={formData[field.slug] || ''}
                                    onValueChange={(value) => handleChange(field.slug, value)}
                                >
                                    <SelectTrigger className="rounded-none border-black h-12">
                                        <SelectValue placeholder={`Select ${field.displayName}...`} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-none border-black">
                                        {field.validations?.options?.map((opt) => (
                                            <SelectItem key={opt.id} value={opt.id}>
                                                {opt.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {field.type === 'Reference' && (
                                <Select
                                    value={formData[field.slug] || ''}
                                    onValueChange={(value) => handleChange(field.slug, value)}
                                >
                                    <SelectTrigger className="rounded-none border-black h-12">
                                        <SelectValue placeholder={`Select ${field.displayName}...`} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-none border-black">
                                        {field.validations?.collectionId && referenceData[field.validations.collectionId]?.map((item) => (
                                            <SelectItem key={item.id} value={item.id}>
                                                {item.fieldData.name || item.fieldData.title || item.id}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {field.type === 'MultiReference' && (
                                <div className="space-y-4">
                                    <Select
                                        onValueChange={(value) => {
                                            const current = formData[field.slug] || []
                                            if (!current.includes(value)) {
                                                handleChange(field.slug, [...current, value])
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="rounded-none border-black h-12">
                                            <SelectValue placeholder={`Add ${field.displayName}...`} />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-none border-black">
                                            {field.validations?.collectionId && referenceData[field.validations.collectionId]?.map((item) => (
                                                <SelectItem key={item.id} value={item.id}>
                                                    {item.fieldData.name || item.fieldData.title || item.id}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border border-black/10 bg-gray-50/50">
                                        {(formData[field.slug] || []).length === 0 && (
                                            <span className="text-xs text-gray-400 italic p-1">No {field.displayName.toLowerCase()} selected</span>
                                        )}
                                        {(formData[field.slug] || []).map((itemId: string) => {
                                            const item = field.validations?.collectionId && referenceData[field.validations.collectionId]?.find(i => i.id === itemId)
                                            return (
                                                <Badge
                                                    key={itemId}
                                                    variant="secondary"
                                                    className="rounded-none border border-black/20 bg-white text-black px-2 py-1 flex items-center gap-1 group"
                                                >
                                                    {item?.fieldData.name || item?.fieldData.title || itemId}
                                                    <button
                                                        onClick={() => {
                                                            const current = formData[field.slug] || []
                                                            handleChange(field.slug, current.filter((id: string) => id !== itemId))
                                                        }}
                                                        className="hover:text-red-500 transition-colors"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </Badge>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Fallback for other types */}

                            {!['PlainText', 'RichText', 'Image', 'Number', 'Switch', 'Option', 'Reference', 'MultiReference'].includes(field.type) && (
                                <Input
                                    className="rounded-none border-gray-300 bg-gray-50"
                                    disabled
                                    placeholder={`Field type '${field.type}' not yet supported editor-side`}
                                />
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
