'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Facebook,
    Loader2,
    Image as ImageIcon,
    Type,
    Sparkles,
    Send,
    Link as LinkIcon,
    RefreshCw,
    CheckCircle2
} from "lucide-react"
import { generateLinkedInPost } from "@/app/(dashboard)/linkedin/actions" // Reuse AI gen for now
import { shareOnFacebook } from "@/app/(dashboard)/posts/facebook-server-actions"
import { toast } from "sonner"
import Image from "next/image"

export function FacebookPostCreator() {
    const [content, setContent] = useState("")
    const [mediaUrl, setMediaUrl] = useState("")
    const [linkUrl, setLinkUrl] = useState("")
    const [isGenerating, setIsGenerating] = useState(false)
    const [isPosting, setIsPosting] = useState(false)
    const [activeTab, setActiveTab] = useState("write")

    // AI Generation State
    const [topic, setTopic] = useState("")
    const [tone, setTone] = useState("professional")

    const handleGenerate = async () => {
        if (!topic) return
        setIsGenerating(true)
        try {
            const promptText = `Write a Facebook post about ${topic}. Tone: ${tone}. Keep it engaging and suitable for a business page.`
            const { content: generatedContent } = await generateLinkedInPost({ type: 'prompt', data: promptText }) // Reuse generic generator
            if (generatedContent) {
                setContent(generatedContent)
                setActiveTab("write")
            }
        } catch (error) {
            toast.error("Failed to generate content")
        } finally {
            setIsGenerating(false)
        }
    }

    const handlePost = async () => {
        if (!content) return
        setIsPosting(true)
        try {
            const result = await shareOnFacebook(content, linkUrl || undefined, mediaUrl || undefined)
            if (result.success) {
                toast.success("Posted to Facebook successfully!")
                setContent("")
                setMediaUrl("")
                setLinkUrl("")
            } else {
                toast.error("Failed to post: " + result.error)
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setIsPosting(false)
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="write">Write Post</TabsTrigger>
                        <TabsTrigger value="generate">AI Generate</TabsTrigger>
                    </TabsList>

                    <TabsContent value="write" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Compose Post</CardTitle>
                                <CardDescription>Create your Facebook update</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Post Content</Label>
                                    <Textarea
                                        placeholder="What's on your mind?"
                                        className="min-h-[150px]"
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Media URL (Image)</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="https://example.com/image.jpg"
                                            value={mediaUrl}
                                            onChange={(e) => setMediaUrl(e.target.value)}
                                        />
                                        <Button variant="outline" size="icon">
                                            <ImageIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Link URL</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="https://example.com/article"
                                            value={linkUrl}
                                            onChange={(e) => setLinkUrl(e.target.value)}
                                        />
                                        <Button variant="outline" size="icon">
                                            <LinkIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="ghost" onClick={() => setContent("")}>Clear</Button>
                                <Button
                                    onClick={handlePost}
                                    disabled={isPosting || !content}
                                    className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white"
                                >
                                    {isPosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                    Post to Facebook
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    <TabsContent value="generate" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>AI Content Generator</CardTitle>
                                <CardDescription>Let AI help you write engaging posts</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Topic or Keywords</Label>
                                    <Input
                                        placeholder="e.g., New product launch, Industry trends..."
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tone</Label>
                                    <Select value={tone} onValueChange={setTone}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="professional">Professional</SelectItem>
                                            <SelectItem value="casual">Casual</SelectItem>
                                            <SelectItem value="excited">Excited</SelectItem>
                                            <SelectItem value="informative">Informative</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    onClick={handleGenerate}
                                    disabled={isGenerating || !topic}
                                    className="w-full"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            Generate with AI
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Preview Section */}
            <div className="space-y-6">
                <Card className="bg-gray-50/50 sticky top-6">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-white border rounded-xl shadow-sm overflow-hidden max-w-[500px] mx-auto">
                            {/* Facebook Post Header */}
                            <div className="p-4 flex gap-3 items-center">
                                <div className="h-10 w-10 bg-gray-200 rounded-full flex-shrink-0" />
                                <div>
                                    <div className="font-semibold text-sm">Your Page Name</div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                        Just now · <span className="opacity-60">🌎</span>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="px-4 pb-3">
                                <p className="text-sm whitespace-pre-wrap">{content || "Your post content will appear here..."}</p>
                            </div>

                            {/* Media/Link Preview */}
                            {(mediaUrl) && (
                                <div className="relative aspect-video bg-gray-100 w-full">
                                    {/* Ideally we would generic preview here */}
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <ImageIcon className="h-8 w-8" />
                                    </div>
                                    {/* We can try to show image if valid url */}
                                    <img src={mediaUrl} className="absolute inset-0 w-full h-full object-cover" alt="Post media" onError={(e) => e.currentTarget.style.display = 'none'} />
                                </div>
                            )}

                            {/* Like Comment Share */}
                            <div className="px-4 py-3 border-t flex justify-between text-gray-500 text-sm font-medium">
                                <button className="flex items-center gap-2 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors flex-1 justify-center">
                                    <span>Like</span>
                                </button>
                                <button className="flex items-center gap-2 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors flex-1 justify-center">
                                    <span>Comment</span>
                                </button>
                                <button className="flex items-center gap-2 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors flex-1 justify-center">
                                    <span>Share</span>
                                </button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
