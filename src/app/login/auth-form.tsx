'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { login, signup } from '../auth/actions'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from '@/lib/utils'
import { SubmitButton } from './submit-button'

export default function AuthForm() {
    const [isLogin, setIsLogin] = useState(true)
    const searchParams = useSearchParams()
    const error = searchParams.get('error')

    return (
        <div className="w-full max-w-sm">
            {/* Header & Toggle */}
            <div className="mb-10 space-y-6">
                <div className="flex border-b border-black/10 dark:border-white/10">
                    <button
                        onClick={() => setIsLogin(true)}
                        className={cn(
                            "pb-3 text-lg font-medium transition-all duration-200 mr-8 relative",
                            isLogin ? "text-black dark:text-white" : "text-gray-400 hover:text-gray-600"
                        )}
                    >
                        Log in
                        {isLogin && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#eb4f27]"
                            />
                        )}
                    </button>
                    <button
                        onClick={() => setIsLogin(false)}
                        className={cn(
                            "pb-3 text-lg font-medium transition-all duration-200 relative",
                            !isLogin ? "text-black dark:text-white" : "text-gray-400 hover:text-gray-600"
                        )}
                    >
                        Sign up
                        {!isLogin && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#eb4f27]"
                            />
                        )}
                    </button>
                </div>

                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white mb-2">
                        {isLogin ? 'Welcome back' : 'Create account'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {isLogin
                            ? 'Enter your details to access your workspace.'
                            : 'Fill in the form to start automating your content.'}
                    </p>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                    <p>Error: {error}</p>
                </div>
            )}

            {/* Forms Container */}
            <motion.div
                layout
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="relative overflow-hidden"
            >
                <AnimatePresence mode="wait" initial={false}>
                    {isLogin ? (
                        <motion.div
                            key="login"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <form action={login} className="space-y-5 px-1 py-1">
                                <div className="space-y-2">
                                    <Label htmlFor="login-email">Email</Label>
                                    <Input
                                        id="login-email"
                                        name="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        required
                                        className="h-12 border-black focus-visible:ring-black focus-visible:ring-offset-0 rounded-none bg-transparent"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="login-password">Password</Label>
                                        <a href="#" className="text-xs text-gray-500 hover:text-[#eb4f27]">Forgot password?</a>
                                    </div>
                                    <Input
                                        id="login-password"
                                        name="password"
                                        type="password"
                                        required
                                        className="h-12 border-black focus-visible:ring-black focus-visible:ring-offset-0 rounded-none bg-transparent"
                                    />
                                </div>
                                <SubmitButton className="w-full h-12 bg-[#eb4f27] hover:bg-black hover:text-white text-white font-medium rounded-none transition-colors duration-200 mt-2">
                                    Log in
                                </SubmitButton>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="signup"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <form action={signup} className="space-y-5 px-1 py-1">
                                <div className="space-y-2">
                                    <Label htmlFor="signup-name">Full Name</Label>
                                    <Input
                                        id="signup-name"
                                        name="full_name"
                                        type="text"
                                        placeholder="John Doe"
                                        required
                                        className="h-12 border-black focus-visible:ring-black focus-visible:ring-offset-0 rounded-none bg-transparent"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-email">Email</Label>
                                    <Input
                                        id="signup-email"
                                        name="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        required
                                        className="h-12 border-black focus-visible:ring-black focus-visible:ring-offset-0 rounded-none bg-transparent"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-password">Password</Label>
                                    <Input
                                        id="signup-password"
                                        name="password"
                                        type="password"
                                        required
                                        className="h-12 border-black focus-visible:ring-black focus-visible:ring-offset-0 rounded-none bg-transparent"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                                    <Input
                                        id="signup-confirm-password"
                                        name="confirmPassword"
                                        type="password"
                                        required
                                        className="h-12 border-black focus-visible:ring-black focus-visible:ring-offset-0 rounded-none bg-transparent"
                                    />
                                </div>
                                <SubmitButton className="w-full h-12 bg-black hover:bg-[#eb4f27] hover:text-white text-white font-medium rounded-none transition-colors duration-200 mt-2">
                                    Create account
                                </SubmitButton>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    )
}
