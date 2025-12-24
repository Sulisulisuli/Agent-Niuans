import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function PostsLoading() {
    return (
        <div className="p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-40" />
                    <Button disabled className="rounded-none bg-[#eb4f27] opacity-80 text-white">
                        <Plus className="mr-2 h-4 w-4" />
                        Create New
                    </Button>
                </div>

                <div className="grid gap-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Card key={i} className="group rounded-xl border border-gray-200 bg-white shadow-sm">
                            <CardContent className="p-5 flex items-start justify-between">
                                <div className="space-y-3 w-full">
                                    <Skeleton className="h-6 w-3/4 max-w-sm" />
                                    <div className="flex gap-4">
                                        <Skeleton className="h-7 w-24" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Skeleton className="h-9 w-9" />
                                    <Skeleton className="h-9 w-9" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
