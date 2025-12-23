'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { getWebflowCollections, saveWebflowConfig } from '@/app/settings/actions'
import { useRouter } from 'next/navigation'

interface CollectionSwitcherProps {
    token: string
    siteId: string
    currentCollectionId: string
}

export function CollectionSwitcher({ token, siteId, currentCollectionId }: CollectionSwitcherProps) {
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState(currentCollectionId)
    const [collections, setCollections] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    useEffect(() => {
        async function fetchCols() {
            if (!siteId) return
            setLoading(true)
            const res = await getWebflowCollections(token, siteId)
            setLoading(false)
            if (res.collections) {
                setCollections(res.collections)
            }
        }
        fetchCols()
    }, [siteId, token])

    const handleSelect = async (collectionId: string) => {
        setValue(collectionId)
        setOpen(false)

        // Save to DB and Refresh
        await saveWebflowConfig({ collectionId }, true)
        router.refresh()
    }

    const currentName = collections.find((c) => c.id === value)?.displayName || "Select Collection..."

    if (!siteId) return null

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[250px] justify-between rounded-none border-black"
                >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {currentName}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0 rounded-none border-black">
                <Command>
                    <CommandInput placeholder="Search collection..." />
                    <CommandList>
                        <CommandEmpty>No collection found.</CommandEmpty>
                        <CommandGroup>
                            {collections.map((collection) => (
                                <CommandItem
                                    key={collection.id}
                                    value={collection.displayName}
                                    onSelect={() => handleSelect(collection.id)}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === collection.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {collection.displayName}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
