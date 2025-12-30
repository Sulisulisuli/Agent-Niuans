'use client'

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Sparkles, Link as LinkIcon, Send, Image as ImageIcon } from "lucide-react"
import { getPublishedArticles, generateLinkedInPost, publishToLinkedInProfile, getCollections, getSites, fetchOpenGraphImage } from "@/app/(dashboard)/linkedin/actions"
import { cn } from "@/lib/utils"

export function LinkedInPostCreator({ organizationId }: { organizationId?: string }) {
    const [content, setContent] = useState("")
    const [authorType, setAuthorType] = useState<'person' | 'organization'>('person')
    const [linkUrl, setLinkUrl] = useState("") // For "From Link" mode or "Article" media
    const [previewImageUrl, setPreviewImageUrl] = useState("") // For visualizing the link preview card
    const [prompt, setPrompt] = useState("")

    // CMS State
    const [sites, setSites] = useState<{ id: string, displayName: string, previewUrl?: string, customDomains?: { url: string }[], shortName?: string }[]>([])
    const [selectedSiteId, setSelectedSiteId] = useState("")
    const [orgDomain, setOrgDomain] = useState<string | undefined>("")

    const [collections, setCollections] = useState<{ id: string, displayName: string, slug?: string }[]>([])
    const [selectedCollectionId, setSelectedCollectionId] = useState("")
    const [selectedCmsId, setSelectedCmsId] = useState("")
    const [cmsItems, setCmsItems] = useState<{ id: string, title: string, slug?: string, fullData: any }[]>([])

    // State for actions
    const [isLoadingSites, setIsLoadingSites] = useState(false)
    const [isLoadingCollections, setIsLoadingCollections] = useState(false)
    const [isLoadingItems, setIsLoadingItems] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isPublishing, setIsPublishing] = useState(false)


    // 1. Load Sites on mount
    useEffect(() => {
        const loadSites = async () => {
            setIsLoadingSites(true) // Ensure isLoadingSites is defined
            const res = await getSites()
            if (res.sites) {
                setSites(res.sites)
                // Capture orgDomain if present
                if (res.orgDomain) setOrgDomain(res.orgDomain)

                if (res.sites.length === 1) {
                    setSelectedSiteId(res.sites[0].id)
                }
            } else if (res.error) {
                console.error("Failed to load sites:", res.error)
            }
            setIsLoadingSites(false)
        }
        loadSites()
    }, [])

    // 2. Load Collections when Site Changes
    useEffect(() => {
        if (!selectedSiteId) {
            setCollections([])
            return
        }

        const loadCollections = async () => {
            setIsLoadingCollections(true)
            const res = await getCollections(selectedSiteId)
            if (res.collections) {
                setCollections(res.collections)
            } else {
                setCollections([])
            }
            setIsLoadingCollections(false)
        }
        loadCollections()
    }, [selectedSiteId])

    // 3. Load Items when Collection Changes
    useEffect(() => {
        if (!selectedCollectionId) return

        const loadItems = async () => {
            setIsLoadingItems(true)
            const res = await getPublishedArticles(selectedCollectionId)
            if (res.items) {
                setCmsItems(res.items.map((i: any) => ({
                    id: i.id,
                    title: i.title,
                    slug: i.slug,
                    fullData: i.fullData
                })))
            } else {
                setCmsItems([])
            }
            setIsLoadingItems(false)
        }
        loadItems()
    }, [selectedCollectionId])


    const [isLoadingPreview, setIsLoadingPreview] = useState(false)

    // ... existing effects ...

    // 4. Fetch OG Image when Link URL changes
    useEffect(() => {
        const fetchOG = async () => {
            if (!linkUrl || !linkUrl.startsWith('http')) {
                setPreviewImageUrl("")
                return
            }

            setIsLoadingPreview(true)
            const res = await fetchOpenGraphImage(linkUrl)
            if (res && res.imageUrl) {
                setPreviewImageUrl(res.imageUrl)
            } else {
                setPreviewImageUrl("")
            }
            setIsLoadingPreview(false)
        }

        const timer = setTimeout(() => {
            fetchOG()
        }, 800) // Debounce 800ms

        return () => clearTimeout(timer)
    }, [linkUrl])


    const handleGenerateFromPrompt = async () => {
        if (!prompt) return
        setIsGenerating(true)
        const res = await generateLinkedInPost({ type: 'prompt', data: prompt })
        if (res.content) setContent(res.content)
        setIsGenerating(false)
    }

    const handleGenerateFromLink = async () => {
        if (!linkUrl) return
        setIsGenerating(true)
        const res = await generateLinkedInPost({ type: 'link', data: linkUrl })
        if (res.content) setContent(res.content)
        setIsGenerating(false)
    }

    const handleGenerateFromCMS = async () => {
        if (!selectedCmsId) return
        setIsGenerating(true)
        const item = cmsItems.find(i => i.id === selectedCmsId)

        if (item) {
            // Attempt to construct URL
            const site = sites.find(s => s.id === selectedSiteId)
            const collection = collections.find(c => c.id === selectedCollectionId)

            if (site && collection?.slug && item.slug) {
                let baseUrl = ""

                // 1. Organization Domain (Highest Priority from App Config)
                if (orgDomain) {
                    baseUrl = orgDomain
                }
                // 2. Webflow Custom Domain
                else if (site.customDomains && site.customDomains.length > 0) {
                    baseUrl = site.customDomains[0].url
                }

                if (baseUrl) {
                    baseUrl = baseUrl.replace(/\/$/, "")
                    if (!baseUrl.startsWith('http')) {
                        baseUrl = `https://${baseUrl}`
                    }
                    const fullUrl = `${baseUrl}/${collection.slug}/${item.slug}`
                    setLinkUrl(fullUrl)
                } else {
                    setLinkUrl("") // Reset if no custom/org domain
                }
            }

            // Pass the full data for context
            const res = await generateLinkedInPost({ type: 'cms', data: JSON.stringify(item.fullData || item) })
            if (res.content) setContent(res.content)
        }
        setIsGenerating(false)
    }

    const handlePublish = async () => {
        if (!content) return
        setIsPublishing(true)

        let title = "Shared Link"

        // Find the selected item from the state
        const selectedItem = cmsItems.find(i => i.id === selectedCmsId)

        if (selectedItem) {
            title = selectedItem.title || "New Post"
        }

        const res = await publishToLinkedInProfile(content, linkUrl, title, previewImageUrl, authorType, organizationId)
        setIsPublishing(false)
        if (res.success) {
            alert("Post published successfully!")
            setContent("")
            setLinkUrl("")
        } else {
            alert("Error publishing: " + res.error)
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-140px)]">
            {/* Left Panel: Input & Generation */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between mb-4 bg-gray-50 p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase text-gray-400">Post As:</span>
                        <div className="flex border p-0.5 bg-white rounded-md">
                            <button
                                onClick={() => setAuthorType('person')}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-semibold rounded transition-colors",
                                    authorType === 'person' ? "bg-black text-white" : "hover:bg-gray-100"
                                )}
                            >
                                Personal Profile
                            </button>
                            <button
                                onClick={() => setAuthorType('organization')}
                                disabled={!organizationId}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-semibold rounded transition-colors",
                                    !organizationId && "opacity-30 cursor-not-allowed",
                                    authorType === 'organization' ? "bg-black text-white" : "hover:bg-gray-100"
                                )}
                            >
                                Organization
                            </button>
                        </div>
                    </div>
                    {!organizationId && (
                        <span className="text-[10px] text-gray-400">Configure Org ID in settings</span>
                    )}
                </div>

                <Tabs defaultValue="cms" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="cms" className="gap-2">
                            <FileText className="h-4 w-4" />
                            From CMS
                        </TabsTrigger>
                        <TabsTrigger value="prompt" className="gap-2">
                            <Sparkles className="h-4 w-4" />
                            From Prompt
                        </TabsTrigger>
                        <TabsTrigger value="link" className="gap-2">
                            <LinkIcon className="h-4 w-4" />
                            From Link
                        </TabsTrigger>
                    </TabsList>

                    {/* CMS MODE */}
                    <TabsContent value="cms" className="space-y-4">
                        {/* Site Select */}
                        <div className="space-y-2">
                            <Label>Select Site</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedSiteId}
                                onChange={(e) => {
                                    setSelectedSiteId(e.target.value);
                                    setSelectedCollectionId("");
                                    setSelectedCmsId("");
                                }}
                                disabled={isLoadingSites}
                            >
                                <option value="" disabled>Select a site...</option>
                                {sites.map(site => (
                                    <option key={site.id} value={site.id}>{site.displayName}</option>
                                ))}
                            </select>
                        </div>

                        {/* Collection Select */}
                        <div className="space-y-2">
                            <Label>Select Collection</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedCollectionId}
                                onChange={(e) => {
                                    setSelectedCollectionId(e.target.value);
                                    setSelectedCmsId("");
                                }}
                                disabled={!selectedSiteId || isLoadingCollections}
                            >
                                <option value="" disabled>
                                    {isLoadingCollections ? "Loading collections..." : "Select a collection..."}
                                </option>
                                {collections.map(col => (
                                    <option key={col.id} value={col.id}>{col.displayName}</option>
                                ))}
                            </select>
                        </div>

                        {/* Item Select */}
                        <div className="space-y-2">
                            <Label>Select Item</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedCmsId}
                                onChange={(e) => setSelectedCmsId(e.target.value)}
                                disabled={!selectedCollectionId || isLoadingItems}
                            >
                                <option value="" disabled>
                                    {isLoadingItems ? "Loading items..." : "Select an article..."}
                                </option>
                                {cmsItems.map(item => (
                                    <option key={item.id} value={item.id}>{item.title}</option>
                                ))}
                            </select>
                        </div>

                        <Button onClick={handleGenerateFromCMS} disabled={!selectedCmsId || isGenerating} className="w-full bg-[#eb4f27] hover:bg-[#d43d18]">
                            <Sparkles className="mr-2 h-4 w-4" />
                            {isGenerating ? "Generating..." : "Generate Post from CMS"}
                        </Button>
                    </TabsContent>

                    {/* PROMPT MODE */}
                    <TabsContent value="prompt" className="space-y-4">
                        <div className="space-y-2">
                            <Label>Instructions for AI</Label>
                            <Textarea
                                placeholder="Describe what you want to write about..."
                                className="h-32 resize-none"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleGenerateFromPrompt} disabled={!prompt || isGenerating} className="w-full bg-[#eb4f27] hover:bg-[#d43d18]">
                            <Sparkles className="mr-2 h-4 w-4" />
                            {isGenerating ? "Generating..." : "Generate Post"}
                        </Button>
                    </TabsContent>

                    {/* LINK MODE */}
                    <TabsContent value="link" className="space-y-4">
                        <div className="space-y-2">
                            <Label>Article URL</Label>
                            <Input
                                placeholder="https://example.com/article"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleGenerateFromLink} disabled={!linkUrl || isGenerating} className="w-full bg-[#eb4f27] hover:bg-[#d43d18]">
                            <Sparkles className="mr-2 h-4 w-4" />
                            {isGenerating ? "Generating..." : "Generate Post from Link"}
                        </Button>
                    </TabsContent>
                </Tabs>

                {/* Editor Area */}
                <div className="border-t pt-6 space-y-4 flex-1 flex flex-col">
                    <Label>Editor & Refinement</Label>
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="flex-1 min-h-[200px] p-4 font-mono text-sm leading-relaxed resize-none"
                        placeholder="Your AI generated post will appear here for editing..."
                    />

                    <div className="space-y-2">
                        <Label>Attachment Link (Optional)</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="https://..."
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">This URL will be attached to the post as a clickable preview card.</p>
                    </div>

                    <div className="pt-2">
                        <Button className="w-full h-12 text-lg font-semibold bg-[#0077b5] hover:bg-[#006097]" onClick={handlePublish} disabled={isPublishing || !content}>
                            <Send className="mr-2 h-5 w-5" />
                            {isPublishing ? "Publishing..." : "Publish to LinkedIn"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Right Panel: Live Preview */}
            <div className="hidden lg:block bg-gray-50 rounded-xl border p-6 overflow-y-auto">
                <h3 className="font-semibold text-gray-500 mb-6 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                    Live Preview
                </h3>

                <Card className="w-full max-w-md mx-auto shadow-sm">
                    <CardContent className="p-0">
                        {/* Header */}
                        <div className="p-4 flex gap-3 border-b border-gray-50">
                            <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                            <div>
                                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                                <div className="h-3 w-20 bg-gray-100 rounded"></div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-4">
                            {content ? (
                                <p className="whitespace-pre-wrap text-sm text-gray-800">{content}</p>
                            ) : (
                                <div className="space-y-2">
                                    <div className="h-4 w-full bg-gray-100 rounded"></div>
                                    <div className="h-4 w-3/4 bg-gray-100 rounded"></div>
                                    <div className="h-4 w-5/6 bg-gray-100 rounded"></div>
                                </div>
                            )}
                        </div>

                        {/* Link Preview (if URL exists) */}
                        {linkUrl && (
                            <div className="mx-4 mb-4 rounded-md border text-gray-400 flex flex-col overflow-hidden bg-white">
                                {previewImageUrl ? (
                                    <div className="h-48 w-full bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${previewImageUrl})` }} />
                                ) : (
                                    <div className="h-48 w-full bg-gray-100 flex items-center justify-center flex-col gap-2">
                                        <ImageIcon className="h-8 w-8" />
                                        <span className="text-xs">No preview image</span>
                                    </div>
                                )}
                                <div className="p-3 bg-gray-50 border-t">
                                    <span className="text-xs font-semibold text-gray-700 block truncate">{linkUrl.replace(/^https?:\/\//, '')}</span>
                                    <span className="text-[10px] text-gray-500">example.com</span>
                                </div>
                            </div>
                        )}

                        {/* Footer Actions */}
                        <div className="border-t p-2 flex justify-between text-gray-500 text-sm px-6">
                            <span>Like</span>
                            <span>Comment</span>
                            <span>Repost</span>
                            <span>Send</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
