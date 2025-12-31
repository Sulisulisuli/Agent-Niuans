import { createClient } from '@/utils/supabase/server'
import { getTemplates } from './actions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Edit } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { redirect } from 'next/navigation'
import { DeleteTemplateButton } from './delete-button'
import { TemplateCardPreview } from './template-card-preview'
import { DuplicateTemplateButton } from './duplicate-button'

export default async function TemplatesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect('/login')

    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!member) {
        return <div className="p-8">No organization found. Please contact support.</div>
    }

    const { data: templates } = await getTemplates(member.organization_id)

    return (
        <>
            <header className="h-16 border-b border-gray-200 flex items-center px-8 flex-shrink-0 gap-8">
                <h1 className="text-xl font-bold tracking-tight">Settings</h1>
                <nav className="flex gap-4">
                    <a href="/settings" className="text-sm font-medium text-gray-400 hover:text-black transition-colors pb-5 mt-5 border-b-2 border-transparent hover:border-gray-200">Integrations</a>
                    <a href="/settings/organization" className="text-sm font-medium text-gray-400 hover:text-black transition-colors pb-5 mt-5 border-b-2 border-transparent hover:border-gray-200">Brand Identity</a>
                    <a href="/settings/templates" className="text-sm font-medium border-b-2 border-black pb-5 mt-5">Templates</a>
                </nav>
            </header>

            <div className="p-8 space-y-8 max-w-7xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-lg font-bold">Your Templates</h2>
                        <p className="text-sm text-gray-500">Manage styles for generated social media assets</p>
                    </div>
                    <Link href="/settings/templates/builder">
                        <Button className="rounded-none bg-[#eb4f27] hover:bg-black text-white px-6">
                            <Plus className="mr-2 h-4 w-4" /> New Template
                        </Button>
                    </Link>
                </div>

                {(!templates || templates.length === 0) ? (
                    <div className="text-center py-20 border border-dashed border-gray-300">
                        <p className="text-gray-500">No templates yet. Create your first branding style.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {templates.map((t: any) => (
                            <Card key={t.id} className="group rounded-none border-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
                                <div className="aspect-[1.91/1] bg-gray-100 border-b border-black flex items-center justify-center overflow-hidden relative">
                                    <TemplateCardPreview config={t.config} />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                                </div>
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg truncate pr-2">{t.name}</h3>
                                        <div className="px-2 py-0.5 border border-black text-[10px] uppercase font-bold tracking-wider">
                                            {t.category || 'General'}
                                        </div>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <Link href={`/settings/templates/builder?id=${t.id}`} className="w-full">
                                            <Button variant="outline" className="w-full rounded-none border-black hover:bg-gray-100">
                                                <Edit className="mr-2 h-3 w-3" /> Edit
                                            </Button>
                                        </Link>
                                        <DuplicateTemplateButton id={t.id} organizationId={member.organization_id} />
                                        <DeleteTemplateButton id={t.id} />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}
