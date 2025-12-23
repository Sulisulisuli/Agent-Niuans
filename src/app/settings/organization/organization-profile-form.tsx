'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { saveOrganizationProfile } from '../actions'
import { generateBrandProfileFromUrl } from '../../posts/ai-actions'
import { Loader2, CheckCircle2, AlertCircle, Save, Sparkles } from 'lucide-react'

const profileSchema = z.object({
    industry: z.string().optional(),
    target_audience: z.string().optional(),
    brand_voice: z.string().optional(),
    content_language: z.string().optional(),
    key_values: z.string().optional(), // We'll store as comma separated string for simplicity in UI, convert to array if needed or just keep as string
    forbidden_topics: z.string().optional(),
    competitors: z.string().optional(),
    example_content: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

interface OrganizationProfileFormProps {
    initialProfile?: any
    organizationDomain?: string
}

export default function OrganizationProfileForm({ initialProfile, organizationDomain }: OrganizationProfileFormProps) {
    const [loading, setLoading] = useState(false)
    const [aiLoading, setAiLoading] = useState(false)
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            industry: initialProfile?.industry || '',
            target_audience: initialProfile?.target_audience || '',
            brand_voice: initialProfile?.brand_voice || '',
            content_language: initialProfile?.content_language || 'Polish',
            key_values: initialProfile?.key_values || '',
            forbidden_topics: initialProfile?.forbidden_topics || '',
            competitors: initialProfile?.competitors || '',
            example_content: initialProfile?.example_content || '',
        }
    })

    const onSubmit = async (data: ProfileFormValues) => {
        setLoading(true)
        setStatus('idle')
        setMessage('')

        try {
            const res = await saveOrganizationProfile(data)
            if (res.error) {
                setStatus('error')
                setMessage(res.error)
            } else {
                setStatus('success')
                setMessage('Brand profile saved successfully')
                setTimeout(() => setStatus('idle'), 3000)
            }
        } catch (error) {
            setStatus('error')
            setMessage('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleAutoFill = async () => {
        if (!organizationDomain) return
        setAiLoading(true)
        setStatus('idle')
        setMessage('')

        try {
            console.log("[handleAutoFill] Calling generateBrandProfileFromUrl with domain:", organizationDomain)
            const res = await generateBrandProfileFromUrl(organizationDomain)
            console.log("[handleAutoFill] Received response from AI:", res)

            if (res.error) {
                setStatus('error')
                setMessage(res.error)
            } else if (res.data) {
                const d = res.data
                form.setValue('industry', d.industry || '')
                form.setValue('target_audience', d.target_audience || '')
                form.setValue('brand_voice', d.brand_voice || '')
                form.setValue('content_language', d.content_language || '')
                form.setValue('key_values', d.key_values || '')
                form.setValue('forbidden_topics', d.forbidden_topics || '')
                form.setValue('competitors', d.competitors || '')
                form.setValue('example_content', d.example_content || '')

                setStatus('success')
                setMessage('Profile auto-filled from website!')
                setTimeout(() => setStatus('idle'), 3000)
            }
        } catch (e) {
            setStatus('error')
            setMessage('Failed to analyze website')
        } finally {
            setAiLoading(false)
        }
    }

    return (
        <div className="max-w-4xl">
            <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight mb-2">Brand Identity</h2>
                <p className="text-gray-500 mb-6">
                    Define your organization's voice and personality. Our AI will use this context to generate content that sounds exactly like you.
                </p>
                <p className="text-xs text-gray-400 italic">All fields below are optional but recommended for better results.</p>

                {organizationDomain && (
                    <div className="mt-4 flex justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleAutoFill}
                            disabled={aiLoading || loading}
                            className="text-[#eb4f27] border-[#eb4f27] hover:bg-[#eb4f27]/10"
                        >
                            {aiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Auto-fill from {organizationDomain}
                        </Button>
                    </div>
                )}
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                {/* Core Identity Section */}
                <div className="bg-gray-50/50 p-6 border border-gray-100 rounded-sm space-y-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#eb4f27] border-b border-gray-200 pb-2 mb-4">Core Identity</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="industry">Industry / Niche</Label>
                            <Input
                                id="industry"
                                placeholder="e.g. Organic Coffee Roastery, SaaS for HR..."
                                className="rounded-none bg-white border-gray-300"
                                {...form.register('industry')}
                            />
                            <p className="text-xs text-gray-400">What is your business about?</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="target_audience">Target Audience</Label>
                            <Input
                                id="target_audience"
                                placeholder="e.g. Gen Z, Enterprise CTOs, Busy Moms..."
                                className="rounded-none bg-white border-gray-300"
                                {...form.register('target_audience')}
                            />
                            <p className="text-xs text-gray-400">Who are you writing for?</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="brand_voice">Brand Voice</Label>
                            <Input
                                id="brand_voice"
                                placeholder="e.g. Professional, Witty, Authoritative, Friendly..."
                                className="rounded-none bg-white border-gray-300"
                                {...form.register('brand_voice')}
                            />
                            <p className="text-xs text-gray-400">Adjectives describing your tone.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="content_language">Primary Content Language</Label>
                            <Input
                                id="content_language"
                                placeholder="e.g. Polish, English, German..."
                                className="rounded-none bg-white border-gray-300"
                                {...form.register('content_language')}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="key_values">Key Values / Slogans</Label>
                        <Textarea
                            id="key_values"
                            placeholder="e.g. Sustainability first, Customer obsession, Move fast..."
                            className="rounded-none bg-white border-gray-300 min-h-[60px]"
                            {...form.register('key_values')}
                        />
                        <p className="text-xs text-gray-400">Core principles or catchphrases to weave into content.</p>
                    </div>
                </div>

                {/* Content Strategy Section */}
                <div className="bg-gray-50/50 p-6 border border-gray-100 rounded-sm space-y-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#eb4f27] border-b border-gray-200 pb-2 mb-4">Content Strategy</h3>

                    <div className="space-y-2">
                        <Label htmlFor="forbidden_topics">Forbidden Topics / Negative Constraints</Label>
                        <Textarea
                            id="forbidden_topics"
                            placeholder="e.g. Do not mention competitors X and Y. Avoid 'salesy' language. No slang."
                            className="rounded-none bg-white border-gray-300"
                            {...form.register('forbidden_topics')}
                        />
                        <p className="text-xs text-gray-400">Instructions on what the AI should AVOID.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="competitors">Competitors / Market Context</Label>
                        <Textarea
                            id="competitors"
                            placeholder="List main competitors for context (optional)..."
                            className="rounded-none bg-white border-gray-300"
                            {...form.register('competitors')}
                        />
                    </div>
                </div>

                {/* Golden Sample */}
                <div className="bg-gray-50/50 p-6 border border-gray-100 rounded-sm space-y-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#eb4f27] border-b border-gray-200 pb-2 mb-4">The "Golden" Sample</h3>
                    <div className="space-y-2">
                        <Label htmlFor="example_content">Writing Sample</Label>
                        <Textarea
                            id="example_content"
                            placeholder="Paste a paragraph of text that perfectly represents your brand voice. The AI will try to mimic this style."
                            className="rounded-none bg-white border-gray-300 min-h-[150px] font-mono text-sm"
                            {...form.register('example_content')}
                        />
                        <p className="text-xs text-gray-400">The most effective way to teach style is by example.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        type="submit"
                        disabled={loading}
                        className="rounded-none bg-black hover:bg-black/80 text-white min-w-[150px] h-12"
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Profile
                    </Button>

                    {status === 'success' && (
                        <div className="flex items-center text-green-600 text-sm font-medium animate-in fade-in slide-in-from-left-2">
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {message}
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="flex items-center text-red-600 text-sm font-medium animate-in fade-in slide-in-from-left-2">
                            <AlertCircle className="mr-2 h-4 w-4" />
                            {message}
                        </div>
                    )}
                </div>

            </form>
        </div>
    )
}
