import { Suspense } from 'react'
import AuthForm from './auth-form'

export default function LoginPage() {
    return (
        <div className="flex min-h-screen w-full">
            {/* Left Side - Form Area */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-black relative">
                {/* Logo or Brand Mark Top Left */}
                <div className="absolute top-8 left-8">
                    <div className="h-8 w-8 bg-[#eb4f27]"></div>
                </div>

                <Suspense fallback={<div>Loading...</div>}>
                    <AuthForm />
                </Suspense>
            </div>

            {/* Right Side - Visual / Branding */}
            <div className="hidden lg:flex w-1/2 bg-[#eb4f27] items-center justify-center p-12 relative overflow-hidden group">
                <div className="absolute inset-x-0 top-0 h-px bg-black opacity-10"></div>
                <div className="absolute inset-y-0 left-0 w-px bg-black opacity-10"></div>

                <div className="relative z-10 text-white max-w-lg transition-transform duration-700 group-hover:scale-105">
                    <blockquote className="space-y-4">
                        <p className="text-5xl font-bold uppercase leading-[0.9] tracking-tighter">
                            "Automation<br />is not<br />the future.<br />It is<br />the present."
                        </p>
                        <footer className="text-xl font-medium opacity-80 pt-8 border-t border-white/20 mt-12 inline-block">
                            &mdash; Agent Niuans
                        </footer>
                    </blockquote>
                </div>

                {/* Decorative Grid Lines */}
                <div className="absolute inset-0 grid grid-cols-6 pointer-events-none opacity-20">
                    <div className="border-r border-black/20"></div>
                    <div className="border-r border-black/20"></div>
                    <div className="border-r border-black/20"></div>
                    <div className="border-r border-black/20"></div>
                    <div className="border-r border-black/20"></div>
                </div>
            </div>
        </div>
    )
}
