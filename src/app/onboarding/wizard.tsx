'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createOrganization } from './actions'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, Building2, Globe } from 'lucide-react'

export default function OnboardingWizard() {
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        companyName: '',
        companyDomain: ''
    })

    const handleNext = () => {
        if (step === 1 && formData.companyName) setStep(2)
    }

    const handleSubmit = async (formData: FormData) => {
        setLoading(true)
        const res = await createOrganization(formData)
        if (res?.error) {
            alert(res.error)
            setLoading(false)
        }
        // If success, it redirects, so no need to stop loading
    }

    return (
        <form action={handleSubmit} className="w-full max-w-md mx-auto">
            <div className="mb-10 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center bg-[#eb4f27] text-white mb-6">
                    <Building2 className="h-6 w-6" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white mb-2">
                    Setup your Workspace
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Let’s get your agency ready for automation.
                </p>
            </div>

            <div className="relative min-h-[200px]">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6"
                        >
                            <div className="space-y-4">
                                <Label htmlFor="companyName" className="text-base">What is your Company Name?</Label>
                                <Input
                                    id="companyName"
                                    name="companyName"
                                    type="text"
                                    placeholder="Acme Corp"
                                    required
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                    className="h-14 text-lg border-black focus-visible:ring-black focus-visible:ring-offset-0 rounded-none bg-white"
                                    autoFocus
                                />
                                <p className="text-sm text-gray-400">This will be the name of your shared workspace.</p>
                            </div>

                            <Button
                                type="button"
                                onClick={handleNext}
                                disabled={!formData.companyName}
                                className="w-full h-12 bg-black hover:bg-[#eb4f27] text-white font-medium rounded-none transition-colors duration-200"
                            >
                                Continue
                            </Button>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6"
                        >
                            {/* Hidden input to pass first step data */}
                            <input type="hidden" name="companyName" value={formData.companyName} />

                            <div className="space-y-4">
                                <Label htmlFor="companyDomain" className="text-base">What is your Website Domain?</Label>
                                <div className="relative">
                                    <Globe className="absolute left-4 top-4 h-6 w-6 text-gray-400" />
                                    <Input
                                        id="companyDomain"
                                        name="companyDomain"
                                        type="text"
                                        placeholder="acme.com"
                                        required
                                        value={formData.companyDomain}
                                        onChange={(e) => setFormData({ ...formData, companyDomain: e.target.value })}
                                        className="h-14 text-lg pl-12 border-black focus-visible:ring-black focus-visible:ring-offset-0 rounded-none bg-white"
                                        autoFocus
                                    />
                                </div>
                                <p className="text-sm text-gray-400">We use this to fetch your brand assets (Logo, Fonts) automatically.</p>
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setStep(1)}
                                    className="flex-1 h-12 border-black hover:bg-gray-100 rounded-none"
                                >
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!formData.companyDomain || loading}
                                    className="flex-[2] h-12 bg-black hover:bg-[#eb4f27] text-white font-medium rounded-none transition-colors duration-200"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : 'Create Workspace'}
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Step Indicators */}
            <div className="flex justify-center gap-2 mt-12">
                <div className={`h-1.5 w-8 transition-colors ${step >= 1 ? 'bg-black' : 'bg-gray-200'}`} />
                <div className={`h-1.5 w-8 transition-colors ${step >= 2 ? 'bg-black' : 'bg-gray-200'}`} />
            </div>
        </form>
    )
}
