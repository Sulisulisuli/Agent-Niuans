'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Button } from '@/components/ui/button'
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Heading2,
    Heading3,
    Heading4,
    Heading5,
    Heading6,
    Quote,
    Undo,
    Redo,
    Code,
    Strikethrough,
    Link as LinkIcon,
    Unlink,
    Minus
} from 'lucide-react'
import { useEffect, useCallback } from 'react'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from 'react'

interface RichTextEditorProps {
    value: string
    onChange: (html: string) => void
    disabled?: boolean
}

export function RichTextEditor({ value, onChange, disabled }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-[#eb4f27] underline decoration-[#eb4f27]/30 underline-offset-4 hover:decoration-[#eb4f27]',
                },
            }),
        ],
        content: value,
        editable: !disabled,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[200px] p-6',
            },
        },
        immediatelyRender: false,
    })

    // Helper for Link Dialog
    const [linkUrl, setLinkUrl] = useState('')
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)

    const openLinkDialog = useCallback(() => {
        if (!editor) return
        const previousUrl = editor.getAttributes('link').href
        setLinkUrl(previousUrl || '')
        setIsLinkDialogOpen(true)
    }, [editor])

    const saveLink = useCallback(() => {
        if (!editor) return
        if (linkUrl === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
        } else {
            editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
        }
        setIsLinkDialogOpen(false)
    }, [editor, linkUrl])


    // Sync content if value changes externally (and isn't the same as current content to avoid cursor jumps)
    useEffect(() => {
        if (editor && value && value !== editor.getHTML()) {
            // Check for empty cases to avoid infinite loops if HTML structure differs slightly
            if (editor.getText() === '' && value === '') return
            editor.commands.setContent(value)
        }
    }, [value, editor])


    if (!editor) {
        return null
    }

    const ToolbarButton = ({
        onClick,
        isActive = false,
        icon: Icon,
        label,
        activeClass = 'bg-black text-white hover:bg-black/90'
    }: {
        onClick: () => void,
        isActive?: boolean,
        icon: any,
        label: string,
        activeClass?: string
    }) => (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClick}
            disabled={disabled}
            className={`h-8 w-8 p-0 rounded-none transition-all ${isActive ? activeClass : 'text-gray-500 hover:text-black hover:bg-gray-100'}`}
            title={label}
        >
            <Icon className="h-4 w-4" />
        </Button>
    )

    return (
        <div className={`border border-black flex flex-col ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 sticky top-0 z-10 w-full">
                {/* Text Style */}
                <div className="flex items-center gap-0.5">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        isActive={editor.isActive('bold')}
                        icon={Bold}
                        label="Bold"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        isActive={editor.isActive('italic')}
                        icon={Italic}
                        label="Italic"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        isActive={editor.isActive('strike')}
                        icon={Strikethrough}
                        label="Strikethrough"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleCode().run()}
                        isActive={editor.isActive('code')}
                        icon={Code}
                        label="Inline Code"
                    />
                </div>

                <div className="w-px h-5 bg-gray-300 mx-2" />

                {/* Headings */}
                <div className="flex items-center gap-0.5">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        isActive={editor.isActive('heading', { level: 2 })}
                        icon={Heading2}
                        label="Heading 2"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        isActive={editor.isActive('heading', { level: 3 })}
                        icon={Heading3}
                        label="Heading 3"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
                        isActive={editor.isActive('heading', { level: 4 })}
                        icon={Heading4}
                        label="Heading 4"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
                        isActive={editor.isActive('heading', { level: 5 })}
                        icon={Heading5}
                        label="Heading 5"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
                        isActive={editor.isActive('heading', { level: 6 })}
                        icon={Heading6}
                        label="Heading 6"
                    />
                </div>

                <div className="w-px h-5 bg-gray-300 mx-2" />

                {/* Lists & Quote */}
                <div className="flex items-center gap-0.5">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        isActive={editor.isActive('bulletList')}
                        icon={List}
                        label="Bullet List"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        isActive={editor.isActive('orderedList')}
                        icon={ListOrdered}
                        label="Ordered List"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        isActive={editor.isActive('blockquote')}
                        icon={Quote}
                        label="Blockquote"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().setHorizontalRule().run()}
                        icon={Minus}
                        label="Divider"
                    />
                </div>

                <div className="w-px h-5 bg-gray-300 mx-2" />

                {/* Link Logic */}
                <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={openLinkDialog}
                            className={`h-8 w-8 p-0 rounded-none transition-all ${editor.isActive('link') ? 'bg-black text-white' : 'text-gray-500 hover:text-black hover:bg-gray-100'}`}
                            title="Link"
                        >
                            <LinkIcon className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md rounded-none">
                        <DialogHeader>
                            <DialogTitle>Insert Link</DialogTitle>
                        </DialogHeader>
                        <div className="flex items-center space-x-2">
                            <div className="grid flex-1 gap-2">
                                <Label htmlFor="link" className="sr-only">
                                    Link
                                </Label>
                                <Input
                                    id="link"
                                    defaultValue={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    placeholder="https://example.com"
                                    className="rounded-none border-gray-300"
                                    onKeyDown={(e) => e.key === 'Enter' && saveLink()}
                                />
                            </div>
                        </div>
                        <DialogFooter className="sm:justify-end">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => editor.chain().focus().unsetLink().run()}
                                disabled={!editor.isActive('link')}
                                className="rounded-none"
                            >
                                <Unlink className="h-4 w-4 mr-2" />
                                Remove
                            </Button>
                            <Button type="button" onClick={saveLink} className="rounded-none bg-[#eb4f27] hover:bg-[#eb4f27]/90 text-white">
                                Save
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <div className="flex-1" />

                {/* History */}
                <div className="flex items-center gap-0.5 border-l border-gray-200 pl-2 ml-2">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().undo().run()}
                        icon={Undo}
                        label="Undo"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().redo().run()}
                        icon={Redo}
                        label="Redo"
                    />
                </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-y-auto bg-white min-h-[300px]">
                <EditorContent editor={editor} />
            </div>
        </div>
    )
}
