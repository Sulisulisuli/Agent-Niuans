import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface IntegrationCardProps {
    title: string
    description: string
    icon?: React.ReactNode
    isConnected: boolean
    statusText?: string
    children?: React.ReactNode
    className?: string
}

export function IntegrationCard({
    title,
    description,
    icon,
    isConnected,
    statusText,
    children,
    className
}: IntegrationCardProps) {
    return (
        <Card className={cn("border border-gray-200 shadow-sm", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        {icon}
                        {title}
                    </CardTitle>
                    <CardDescription>{description}</CardDescription>
                </div>
                <div className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                    isConnected
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-gray-50 text-gray-600 border-gray-200"
                )}>
                    {statusText || (isConnected ? 'Connected' : 'Not Connected')}
                </div>
            </CardHeader>
            <CardContent>
                {children}
            </CardContent>
        </Card>
    )
}
