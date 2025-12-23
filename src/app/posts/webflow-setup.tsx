'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getWebflowSites, getWebflowCollections, getWebflowCollection, createNewWebflowCollection, saveWebflowConfig } from '@/app/settings/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from '@/components/ui/label'
import { ArrowRight, Loader2, Globe, Database, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface WebflowSetupProps {
    token: string
}

export default function WebflowSetup({ token }: WebflowSetupProps) {
    const [step, setStep] = useState(1) // 1 = Site, 2 = Collection, 3 = Mapping (Optional)
    const [loading, setLoading] = useState(false)
    const [sites, setSites] = useState<any[]>([])
    const [selectedSiteId, setSelectedSiteId] = useState('')
    const [collections, setCollections] = useState<any[]>([])
    const [selectedCollectionId, setSelectedCollectionId] = useState('')
    const [mapping, setMapping] = useState<Record<string, string>>({})

    const router = useRouter()

    const INTERNAL_FIELDS = [
        { id: 'post_title', name: 'Post Title', type: 'Detail' },
        { id: 'post_content', name: 'Post Content (Rich Text)', type: 'RichText' },
        { id: 'post_excerpt', name: 'Post Excerpt', type: 'Detail' },
        { id: 'featured_image', name: 'Featured Image', type: 'Image' },
        { id: 'post_slug', name: 'Post Slug', type: 'Detail' },
    ]

    useEffect(() => {
        // Initial fetch of sites
        async function fetchSites() {
            setLoading(true)
            const res = await getWebflowSites(token)
            setLoading(false)
            if (res.sites) {
                setSites(res.sites)
            } else {
                alert('Error fetching sites: ' + res.error)
            }
        }
        fetchSites()
    }, [token])

    // Step 1: Handle Site Select
    const handleSiteSelect = async (siteId: string) => {
        setSelectedSiteId(siteId)
        setLoading(true)
        const res = await getWebflowCollections(token, siteId)
        setLoading(false)

        if (res.error || !res.collections) {
            alert('Error fetching collections: ' + res.error)
            return
        }
        setCollections(res.collections)

        try {
            await saveWebflowConfig({ siteId })
        } catch (e) {
            console.error('Background save error:', e)
        }
        setStep(2)
    }

    // Step 2: Handle Collection Select OR Create
    const handleCreateCollection = async () => {
        setLoading(true)
        const res = await createNewWebflowCollection(token, selectedSiteId)

        if (res.error || !res.collection) {
            setLoading(false)
            alert('Error creating collection: ' + res.error)
            return
        }

        // Auto-configure everything for this known schema
        const newMapping = {
            'name': 'post_title',
            'slug': 'post_slug',
            'post-content': 'post_content',
            'post-excerpt': 'post_excerpt',
            'main-image': 'featured_image'
        }

        try {
            await saveWebflowConfig({
                collectionId: res.collection.id,
                fieldMapping: newMapping
            }, true) // Revalidate

            setLoading(false)
            router.refresh() // Refresh to show the main CMS UI
        } catch (e) {
            console.error(e)
            setLoading(false)
        }
    }

    const autoMapFields = (fields: any[]) => {
        const newMapping: Record<string, string> = {}
        fields.forEach(f => {
            const slug = f.slug.toLowerCase()
            const type = f.type
            if (type === 'PlainText' && (slug === 'name' || slug === 'title' || slug.includes('title'))) {
                if (!Object.values(newMapping).includes('post_title')) newMapping[f.slug] = 'post_title'
            }
            if (f.slug === 'slug') newMapping[f.slug] = 'post_slug'
            if (type === 'RichText' && (slug === 'body' || slug === 'content')) {
                if (!Object.values(newMapping).includes('post_content')) newMapping[f.slug] = 'post_content'
            }
            if (type === 'Image' && (slug === 'main-image' || slug === 'image')) {
                if (!Object.values(newMapping).includes('featured_image')) newMapping[f.slug] = 'featured_image'
            }
        })
        return newMapping
    }

    const handleCollectionSelect = async (collectionId: string) => {
        setSelectedCollectionId(collectionId)
        setLoading(true)
        const res = await getWebflowCollection(token, collectionId)
        setLoading(false)

        if (res.error || !res.collection) {
            alert('Error fetching collection fields: ' + res.error)
            return
        }

        const updatedCols = collections.map(c => c.id === collectionId ? res.collection : c)
        setCollections(updatedCols)

        const initialMapping = autoMapFields(res.collection.fields || [])
        setMapping(initialMapping)

        try {
            await saveWebflowConfig({ collectionId })
        } catch (e) { console.error(e) }

        setStep(3)
    }

    const handleFinish = async () => {
        setLoading(true)
        await saveWebflowConfig({ fieldMapping: mapping }, true)
        setLoading(false)
        router.refresh()
    }

    const getFields = () => collections.find(c => c.id === selectedCollectionId)?.fields || []
    const isMappingValid = () => Object.keys(mapping).length > 0

    return (
        <div className="max-w-2xl mx-auto py-12">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Setup Content Source</h1>
                <p className="text-gray-500">
                    Configure where your content lives in Webflow.
                </p>
                <div className="h-1 w-full bg-gray-100 mt-4 overflow-hidden rounded-full">
                    <motion.div
                        className="h-full bg-[#eb4f27]"
                        initial={{ width: 0 }}
                        animate={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>
            </div>

            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <Card className="border-black rounded-none shadow-none">
                            <CardHeader>
                                <CardTitle>Select a Webflow Site</CardTitle>
                                <CardDescription>Select the site to connect.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {loading && <div className="text-center p-4"><Loader2 className="animate-spin h-6 w-6 mx-auto" /></div>}
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

                {step === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <Card className="border-black rounded-none shadow-none">
                            <CardHeader>
                                <CardTitle>Select Collection</CardTitle>
                                <CardDescription>Where should we publish posts?</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Auto Create Option */}
                                <div className="p-4 border-2 border-[#eb4f27]/20 bg-[#eb4f27]/5 flex flex-col items-start gap-2">
                                    <div className="flex items-center gap-2 font-bold text-[#eb4f27]">
                                        <Sparkles className="h-4 w-4" />
                                        Recommended: Auto-Setup
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        Create a dedicated "Agent Niuans Posts" collection instantly. No manual mapping needed.
                                    </p>
                                    <Button
                                        className="bg-[#eb4f27] hover:bg-[#eb4f27]/90 text-white w-full rounded-none"
                                        onClick={handleCreateCollection}
                                        disabled={loading}
                                    >
                                        {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Create & Connect Now'}
                                    </Button>
                                </div>

                                <div className="text-center text-xs text-gray-400 uppercase font-bold tracking-widest my-4">- OR SELECT EXISTING -</div>

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

                {step === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <Card className="border-black rounded-none shadow-none">
                            <CardHeader>
                                <CardTitle>Map Fields</CardTitle>
                                <CardDescription>Match Webflow fields to our internal data.</CardDescription>
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
                                                <SelectValue placeholder="Ignore" />
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
                            </CardContent>
                            <CardFooter>
                                <Button
                                    onClick={handleFinish}
                                    disabled={!isMappingValid() || loading}
                                    className="w-full h-12 rounded-none bg-black hover:bg-[#eb4f27] text-white"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : 'Finish Setup'}
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
