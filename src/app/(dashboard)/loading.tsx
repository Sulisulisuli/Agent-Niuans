import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <div className="flex flex-col space-y-6 p-8">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
                <Skeleton className="h-10 w-[120px]" />
            </div>

            <div className="space-y-4">
                <Skeleton className="h-[120px] w-full rounded-xl" />
                <Skeleton className="h-[120px] w-full rounded-xl" />
                <Skeleton className="h-[120px] w-full rounded-xl" />
            </div>
        </div>
    )
}
