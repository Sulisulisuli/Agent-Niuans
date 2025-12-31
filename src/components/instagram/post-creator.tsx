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
    Instagram,
    Loader2,
    Image as ImageIcon,
    Sparkles,
    Send,
    AlertCircle
} from "lucide-react"
import { generateLinkedInPost } from "@/app/(dashboard)/linkedin/actions" // Reuse AI gen
import { shareOnInstagram } from "@/app/(dashboard)/posts/instagram-server-actions"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function InstagramPostCreator() {
    const [caption, setCaption] = useState("")
    const [imageUrl, setImageUrl] = useState("")
    const [isGenerating, setIsGenerating] = useState(false)
    const [isPosting, setIsPosting] = useState(false)
    const [activeTab, setActiveTab] = useState("write")

    // AI Generation State
    const [topic, setTopic] = useState("")
    const [tone, setTone] = useState("engaging")

    const handleGenerate = async () => {
        if (!topic) return
        setIsGenerating(true)
        try {
            const promptText = `Write an Instagram caption about ${topic}. Tone: ${tone}. Include hashtags.`
            const { content: generatedContent } = await generateLinkedInPost({ type: 'prompt', data: promptText })
            if (generatedContent) {
                setCaption(generatedContent)
                setActiveTab("write")
            }
        } catch (error) {
            toast.error("Failed to generate content")
        } finally {
            setIsGenerating(false)
        }
    }

    const handlePost = async () => {
        if (!imageUrl) {
            toast.error("Image is required for Instagram")
            return
        }
        setIsPosting(true)
        try {
            const result = await shareOnInstagram(imageUrl, caption || "")
            if (result.success) {
                toast.success("Posted to Instagram successfully!")
                setCaption("")
                setImageUrl("")
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
                        <TabsTrigger value="write">Create Post</TabsTrigger>
                        <TabsTrigger value="generate">AI Caption</TabsTrigger>
                    </TabsList>

                    <TabsContent value="write" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>New Instagram Post</CardTitle>
                                <CardDescription>Instagram requires an image for every post.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Image Required</AlertTitle>
                                    <AlertDescription>
                                        You must provide a valid image URL (JPEG) to post to Instagram.
                                    </AlertDescription>
                                </Alert>

                                <div className="space-y-2">
                                    <Label>Image URL (Required)</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="https://example.com/image.jpg"
                                            value={imageUrl}
                                            onChange={(e) => setImageUrl(e.target.value)}
                                        />
                                        <Button variant="outline" size="icon">
                                            <ImageIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">URL must be public and directly accessible.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Caption</Label>
                                    <Textarea
                                        placeholder="Write a caption..."
                                        className="min-h-[150px]"
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground text-right">{caption.length} / 2200</p>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="ghost" onClick={() => { setCaption(""); setImageUrl("") }}>Clear</Button>
                                <Button
                                    onClick={handlePost}
                                    disabled={isPosting || !imageUrl}
                                    className="bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] hover:opacity-90 text-white border-0"
                                >
                                    {isPosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                    Post to Instagram
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    <TabsContent value="generate" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>AI Caption Generator</CardTitle>
                                <CardDescription>Generate hashtags and captions</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Photo Description / Topic</Label>
                                    <Input
                                        placeholder="e.g., Sunset at the beach, New coffee blend..."
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
                                            <SelectItem value="engaging">Engaging</SelectItem>
                                            <SelectItem value="minimalist">Minimalist</SelectItem>
                                            <SelectItem value="funny">Funny</SelectItem>
                                            <SelectItem value="inspirational">Inspirational</SelectItem>
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
                                            Generate Caption
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
                    <CardContent className="flex justify-center">
                        <div className="bg-white border text-black rounded-lg shadow-sm overflow-hidden w-[375px] max-w-full">
                            {/* Insta Header */}
                            <div className="p-3 flex items-center justify-between border-b">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-yellow-400 to-fuchsia-600 p-[2px]">
                                        <div className="bg-white rounded-full w-full h-full p-[2px]">
                                            <div className="bg-gray-200 rounded-full w-full h-full" />
                                        </div>
                                    </div>
                                    <span className="text-sm font-semibold">your_account</span>
                                </div>
                                <div className="text-gray-900">•••</div>
                            </div>

                            {/* Image */}
                            <div className="aspect-square bg-gray-100 w-full relative">
                                {imageUrl ? (
                                    <img src={imageUrl} className="w-full h-full object-cover" alt="Preview" onError={(e) => e.currentTarget.style.display = 'none'} />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                        <ImageIcon className="h-10 w-10 mb-2" />
                                        <span className="text-xs">No image selected</span>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="p-3">
                                <div className="flex justify-between mb-3">
                                    <div className="flex gap-4">
                                        <span className="text-2xl hover:text-gray-600 cursor-pointer">♡</span>
                                        <span className="text-2xl hover:text-gray-600 cursor-pointer">💬</span>
                                        <span className="text-2xl hover:text-gray-600 cursor-pointer">✈️</span>
                                    </div>
                                    <div>
                                        <span className="text-2xl hover:text-gray-600 cursor-pointer">🔖</span>
                                    </div>
                                </div>
                                <div className="text-sm font-semibold mb-1">1,234 likes</div>
                                <div className="text-sm">
                                    <span className="font-semibold mr-2">your_account</span>
                                    <span className="whitespace-pre-wrap">{caption}</span>
                                </div>
                                <div className="text-xs text-gray-400 mt-2 uppercase">Just now</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
