import { createClient } from '@/utils/supabase/server'
import { TemplateBuilder } from '@/components/templates/template-builder'
import { getTemplate } from '../actions'
import { redirect } from 'next/navigation'

export default async function BuilderPage(
    props: {
        searchParams: Promise<{ id?: string }>
    }
) {
    const searchParams = await props.searchParams;
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return redirect('/login')

    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!member) return redirect('/onboarding')

    let initialTemplate = undefined
    if (searchParams.id) {
        const { data } = await getTemplate(searchParams.id)
        if (data) initialTemplate = data
    }

    return (
        <div className="p-6 h-[calc(100vh-65px)] overflow-hidden">
            <TemplateBuilder
                organizationId={member.organization_id}
                initialTemplate={initialTemplate}
            />
        </div>
    )
}
