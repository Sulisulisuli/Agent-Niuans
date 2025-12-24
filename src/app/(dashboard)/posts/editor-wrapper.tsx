'use client'

import dynamic from 'next/dynamic'

const DynamicPostEditor = dynamic(() => import('./dynamic-post-editor'), {
    ssr: false,
    loading: () => <div className="p-8 text-center text-gray-500">Loading Editor...</div>
})

export default function EditorWrapper(props: any) {
    return <DynamicPostEditor {...props} />
}
