'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { saveWebflowToken, getWebflowSites, getWebflowCollections, getWebflowCollection, createNewWebflowCollection, saveWebflowConfig } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, CheckCircle2, Globe, Database, ArrowRight, Loader2 } from 'lucide-react'

export default function WebflowWizard() {
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [token, setToken] = useState('')
    const [sites, setSites] = useState<any[]>([])
    const [selectedSiteId, setSelectedSiteId] = useState('')
    const [collections, setCollections] = useState<any[]>([])
    const [selectedCollectionId, setSelectedCollectionId] = useState('')

    // Handling Step 1: Token
    const handleTokenSubmit = async () => {
        setLoading(true)
        const res = await getWebflowSites(token)

        if (res.error || !res.sites) {
            setLoading(false)
            alert('Error: ' + (res.error || 'Invalid Token or API Error'))
            return
        }

        const saveRes = await saveWebflowToken(token) // Save strictly to DB
        setLoading(false)

        if ((saveRes as any).error) {
            alert('Error saving token: ' + (saveRes as any).error)
            return
        }

        setSites(res.sites)
        setStep(2)
    }

    // Handling Step 2: Site Select
    const handleSiteSelect = async (siteId: string) => {
        console.log('Selected Site:', siteId)
        setSelectedSiteId(siteId)
        setLoading(true)
        const res = await getWebflowCollections(token, siteId)
        setLoading(false)

        if (res.error || !res.collections) {
            console.error('Collection Fetch Error:', res.error)
            alert('Error fetching collections: ' + (res.error || 'Unknown Error'))
            return
        }

        console.log('Collections fetched:', res.collections)
        setCollections(res.collections)

        // Await this to catch errors if any (though unlikely to block UI flow if we don't await, it's safer to see if it fails)
        try {
            await saveWebflowConfig({ siteId })
        } catch (e) {
            console.error('Background save error:', e)
        }

        setStep(3)
    }

    const [mapping, setMapping] = useState<Record<string, string>>({})

    const INTERNAL_FIELDS = [
        { id: 'post_title', name: 'Post Title', type: 'Detail' },
        { id: 'post_content', name: 'Post Content (Rich Text)', type: 'RichText' },
        { id: 'post_excerpt', name: 'Post Excerpt', type: 'Detail' },
        { id: 'featured_image', name: 'Featured Image', type: 'Image' },
        { id: 'post_slug', name: 'Post Slug', type: 'Detail' },
    ]

    // Auto-map fields based on simple heuristics
    const autoMapFields = (fields: any[]) => {
        const newMapping: Record<string, string> = {}

        fields.forEach(f => {
            const slug = f.slug.toLowerCase()
            const type = f.type

            // Title
            if (type === 'PlainText' && (slug === 'name' || slug === 'title' || slug.includes('title') || slug.includes('name'))) {
                if (!Object.values(newMapping).includes('post_title')) {
                    newMapping[f.slug] = 'post_title'
                }
            }

            // Slug
            if (f.slug === 'slug') {
                newMapping[f.slug] = 'post_slug'
            }

            // Content
            if (type === 'RichText' && (slug === 'body' || slug === 'content' || slug.includes('description') || slug.includes('post'))) {
                if (!Object.values(newMapping).includes('post_content')) {
                    newMapping[f.slug] = 'post_content'
                }
            }

            // Image
            if (type === 'Image' && (slug === 'main-image' || slug === 'thumbnail' || slug === 'image' || slug.includes('cover') || slug.includes('banner'))) {
                if (!Object.values(newMapping).includes('featured_image')) {
                    newMapping[f.slug] = 'featured_image'
                }
            }
        })
        return newMapping
    }

    // Handling Step 3: Collection Select
    const handleCollectionSelect = async (collectionId: string) => {
        setSelectedCollectionId(collectionId)

        // Fetch full fields for this collection
        setLoading(true)
        const res = await getWebflowCollection(token, collectionId)
        setLoading(false)

        if (res.error || !res.collection) {
            alert('Error fetching collection fields: ' + res.error)
            return
        }

        // Update local state with full collection details (fields)
        const updatedCols = collections.map(c => c.id === collectionId ? res.collection : c)
        setCollections(updatedCols)

        // Auto-map fields
        const initialMapping = autoMapFields(res.collection.fields || [])
        setMapping(initialMapping)

        // Background save
        try {
            await saveWebflowConfig({ collectionId })
        } catch (e) {
            console.error(e)
        }

        setStep(4)
    }

    // Handling Step 4: Finish (Save Mapping)
    const handleFinish = async () => {
        setLoading(true)
        await saveWebflowConfig({ fieldMapping: mapping }, true)
        setLoading(false)
        alert('Integration Fully Connected! 🚀')
        // In a real app, redirect to dashboard or posts
    }

    // Handling Create Collection
    const handleCreateCollection = async () => {
        setLoading(true)
        const res = await createNewWebflowCollection(token, selectedSiteId)

        if (res.error || !res.collection) {
            setLoading(false)
            alert('Error creating collection: ' + res.error)
            return
        }

        // Add to list and select it
        setCollections([...collections, res.collection])

        // Auto-configure everything for this known schema
        const newMapping = {
            'name': 'post_title',
            'slug': 'post_slug',
            'post-content': 'post_content',
            'post-excerpt': 'post_excerpt',
            'main-image': 'featured_image'
        }
        setMapping(newMapping)

        try {
            // Save config with both collectionId and mapping, effectively skipping Step 4 logic manually
            await saveWebflowConfig({
                collectionId: res.collection.id,
                fieldMapping: newMapping
            }, true) // Save and Revalidate immediately

            setLoading(false)
            alert('Collection Created & Connected Automatically! 🚀')
            // Reset/Finish
        } catch (e) {
            console.error(e)
            setLoading(false)
        }
    }

    const getFields = () => {
        return collections.find(c => c.id === selectedCollectionId)?.fields || []
    }

    const isMappingValid = () => {
        // At least one field must be mapped? Or maybe strictly the required ones?
        // For now, let's say at least 1 field mapped.
        return Object.keys(mapping).length > 0
    }

    return (
        <div className="max-w-2xl mx-auto py-12">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Connect Webflow</h1>
                <p className="text-gray-500">
                    Step {step} of 4: {step === 1 ? 'API Token' : step === 2 ? 'Select Site' : step === 3 ? 'Select Collection' : 'Map Fields'}
                </p>
                <div className="h-1 w-full bg-gray-100 mt-4 overflow-hidden">
                    <motion.div
                        className="h-full bg-[#eb4f27]"
                        initial={{ width: 0 }}
                        animate={{ width: `${(step / 4) * 100}%` }}
                    />
                </div>
            </div>

            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <Card className="border-black rounded-none shadow-none">
                            <CardHeader>
                                <CardTitle>Enter your API Token</CardTitle>
                                <CardDescription>
                                    Generate a token in Webflow Site Settings &gt; Integrations &gt; API Access.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Label>API Token</Label>
                                <Input
                                    type="password"
                                    placeholder="wdp_v2_..."
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    className="rounded-none h-12 border-black"
                                />
                            </CardContent>
                            <CardFooter>
                                <Button
                                    onClick={handleTokenSubmit}
                                    disabled={!token || loading}
                                    className="w-full h-12 rounded-none bg-black hover:bg-[#eb4f27] text-white"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : 'Connect Webflow'}
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <Card className="border-black rounded-none shadow-none">
                            <CardHeader>
                                <CardTitle>Select a Site</CardTitle>
                                <CardDescription>
                                    Which site do you want to publish content to?
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {sites.map((site) => (
                                    <div
                                        key={site.id}
                                        onClick={() => handleSiteSelect(site.id)}
                                        className="flex items-center p-4 border border-black/10 hover:border-[#eb4f27] hover:bg-[#eb4f27]/5 cursor-pointer transition-colors"
                                    >
                                        <Globe className="h-5 w-5 mr-3 text-gray-500" />
                                        <div className="flex-1">
                                            <h4 className="font-bold">{site.displayName}</h4>
                                            <p className="text-xs text-gray-500">{site.shortName}</p>
                                        </div>
                                        <ArrowRight className="h-4 w-4" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <Card className="border-black rounded-none shadow-none">
                            <CardHeader>
                                <CardTitle>Choose Collection</CardTitle>
                                <CardDescription>
                                    Select the CMS Collection where posts should be created (e.g. Blog Posts).
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 border border-black bg-gray-50 flex flex-col items-start gap-2">
                                    <div className="flex items-center gap-2 font-bold">
                                        <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : 'hidden'}`} />
                                        Don't have a collection?
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        We can create a specialized "Agent Niuans Posts" collection for you. No mapping required.
                                    </p>
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={handleCreateCollection}
                                        disabled={loading}
                                    >
                                        Create & Connect Automatically
                                    </Button>
                                </div>
                                <div className="text-xs font-bold text-gray-400 uppercase">Or select existing:</div>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {collections.map((col) => (
                                        <div
                                            key={col.id}
                                            onClick={() => handleCollectionSelect(col.id)}
                                            className="flex items-center p-4 border border-black/10 hover:border-[#eb4f27] hover:bg-[#eb4f27]/5 cursor-pointer transition-colors"
                                        >
                                            <Database className="h-5 w-5 mr-3 text-gray-500" />
                                            <div className="flex-1">
                                                <h4 className="font-bold">{col.displayName}</h4>
                                                <p className="text-xs text-gray-500">{col.slug}</p>
                                            </div>
                                            <ArrowRight className="h-4 w-4" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {step === 4 && (
                    <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <Card className="border-black rounded-none shadow-none">
                            <CardHeader>
                                <CardTitle>Map Fields</CardTitle>
                                <CardDescription>
                                    Match your Webflow Collection fields to our internal data.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {getFields().map((field: any) => (
                                    <div key={field.id} className="space-y-2">
                                        <Label className="flex items-center justify-between">
                                            <span>{field.displayName} <span className='text-gray-400 font-normal text-xs'>({field.slug})</span></span>
                                            <span className="text-xs text-gray-400 uppercase border px-1 rounded">{field.type}</span>
                                        </Label>
                                        <Select
                                            value={mapping[field.slug] || ''}
                                            onValueChange={(val) => setMapping({ ...mapping, [field.slug]: val })}
                                        >
                                            <SelectTrigger className="w-full rounded-none border-black h-12">
                                                <SelectValue placeholder="Do not map (Ignore)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">-- Ignore --</SelectItem>
                                                {INTERNAL_FIELDS.map((intField) => (
                                                    <SelectItem key={intField.id} value={intField.id}>
                                                        {intField.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}

                                {getFields().length === 0 && (
                                    <div className="text-center p-8 text-gray-500">
                                        No fields found in this collection via API.
                                    </div>
                                )}

                            </CardContent>
                            <CardFooter>
                                <Button
                                    onClick={handleFinish}
                                    disabled={!isMappingValid() || loading}
                                    className="w-full h-12 rounded-none bg-black hover:bg-[#eb4f27] text-white"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : 'Finish & Connect'}
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
