'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info, Loader2 } from 'lucide-react';
import ConnectGoogleButton from './ConnectGoogleButton';
import GoogleConfig from '@/app/(dashboard)/analytics/GoogleConfig';
import { useState } from 'react';
import { generateAIReport } from '@/app/(dashboard)/analytics/actions';
import { toast } from 'sonner';


// Types for our data
interface AnalyticsData {
    traffic?: any[];
    search?: any[];
    pageSpeed?: any;
    isConnected: boolean;
}

export default function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
    if (!data.isConnected) {
        return (
            <div className="w-full max-w-2xl mx-auto mt-10">
                <ConnectGoogleButton isConnected={false} />
                <div className="mt-8 text-center text-muted-foreground">
                    <p>Connect your Google account to see website analytics and search performance.</p>
                </div>
            </div>
        );
    }

    // Sample data fallback if empty but connected (or loading state handling in parent)
    const trafficData = data.traffic || [];
    const searchData = data.search || [];

    return (
        <TooltipProvider delayDuration={0}>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
                    <div className="flex items-center gap-2">
                        <GoogleConfig />
                        <ConnectGoogleButton isConnected={true} />
                    </div>
                </div>

                <Tabs defaultValue="traffic" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="traffic">Traffic (GA4)</TabsTrigger>
                        <TabsTrigger value="search">Search (GSC)</TabsTrigger>
                        <TabsTrigger value="performance">Performance</TabsTrigger>
                        <TabsTrigger value="reports">AI Reports</TabsTrigger>
                    </TabsList>

                    <TabsContent value="traffic" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 grid-rows-[auto_auto]">
                            {/* Row 1: Key Metrics - Bento Style */}

                            {/* Users - Large Card */}
                            <Card className="col-span-1 lg:col-span-1">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <Info className="h-4 w-4 text-muted-foreground" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>The total number of unique users who initiated at least one session.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {trafficData.reduce((acc: any, curr: any) => acc + (parseInt(curr.activeUsers) || 0), 0).toLocaleString()}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* New Users */}
                            <Card className="col-span-1 lg:col-span-1">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-sm font-medium">New Users</CardTitle>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <Info className="h-4 w-4 text-muted-foreground" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>The number of users who interacted with your site for the first time.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {trafficData.reduce((acc: any, curr: any) => acc + (parseInt(curr.newUsers) || 0), 0).toLocaleString()}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Engagement Rate */}
                            <Card className="col-span-1 lg:col-span-1">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <Info className="h-4 w-4 text-muted-foreground" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>The percentage of sessions that were engaged sessions.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {trafficData.length > 0
                                            ? `${(trafficData.reduce((acc: any, curr: any) => acc + (parseFloat(curr.engagementRate) || 0), 0) / trafficData.length * 100).toFixed(1)}%`
                                            : '0%'}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Avg Session Duration */}
                            <Card className="col-span-1 lg:col-span-1">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-sm font-medium">Avg. Visit Time</CardTitle>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <Info className="h-4 w-4 text-muted-foreground" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>The average duration of user sessions.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {trafficData.length > 0
                                            ? `${Math.round(trafficData.reduce((acc: any, curr: any) => acc + (parseFloat(curr.averageSessionDuration) || 0), 0) / trafficData.length)}s`
                                            : '0s'}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Row 2: Graph - Spans full width */}
                            <Card className="col-span-1 md:col-span-2 lg:col-span-4 max-h-[400px]">
                                <CardHeader>
                                    <CardTitle>Traffic Overview</CardTitle>
                                </CardHeader>
                                <CardContent className="pl-2">
                                    <div className="h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={trafficData}>
                                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                                <XAxis dataKey="date" className="text-sm text-muted-foreground" />
                                                <YAxis className="text-sm text-muted-foreground" />
                                                <RechartsTooltip
                                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                                />
                                                <Line type="monotone" dataKey="activeUsers" name="Active Users" stroke="#8884d8" strokeWidth={2} />
                                                <Line type="monotone" dataKey="newUsers" name="New Users" stroke="#82ca9d" strokeWidth={2} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="search" className="space-y-4">
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Search Performance</CardTitle>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <div className="h-[350px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={searchData}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                            <XAxis dataKey="keys[0]" className="text-sm text-muted-foreground" />
                                            <YAxis className="text-sm text-muted-foreground" />
                                            <YAxis className="text-sm text-muted-foreground" />
                                            <RechartsTooltip
                                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                                                itemStyle={{ color: 'hsl(var(--foreground))' }}
                                            />
                                            <Bar dataKey="clicks" fill="#8884d8" name="Clicks" />
                                            <Bar dataKey="impressions" fill="#82ca9d" name="Impressions" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="performance" className="space-y-4">
                        {!data.pageSpeed ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg border-dashed">
                                <p className="text-muted-foreground">No PageSpeed data available. Select a site in settings.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                {Object.entries(data.pageSpeed).map(([key, score]) => (
                                    <Card key={key}>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center justify-center py-4">
                                                <div className="relative flex items-center justify-center">
                                                    <svg className="h-24 w-24 transform -rotate-90">
                                                        <circle
                                                            cx="48"
                                                            cy="48"
                                                            r="40"
                                                            stroke="currentColor"
                                                            strokeWidth="8"
                                                            fill="transparent"
                                                            className="text-muted/20"
                                                        />
                                                        <circle
                                                            cx="48"
                                                            cy="48"
                                                            r="40"
                                                            stroke="currentColor"
                                                            strokeWidth="8"
                                                            fill="transparent"
                                                            strokeDasharray={251.2}
                                                            strokeDashoffset={251.2 - (251.2 * (score as number)) / 100}
                                                            className={`transition-all duration-1000 ${(score as number) >= 90 ? 'text-green-500' :
                                                                (score as number) >= 50 ? 'text-yellow-500' : 'text-red-500'
                                                                }`}
                                                        />
                                                    </svg>
                                                    <span className="absolute text-2xl font-bold">{score}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="reports">
                        <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg border-dashed">
                            <h3 className="text-lg font-semibold">AI Insights</h3>
                            <p className="text-muted-foreground mb-4">Generate comprehensive reports based on your data.</p>
                            <ReportGenerator />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </TooltipProvider>
    );
}

function ReportGenerator() {
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<string | null>(null);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await generateAIReport();
            if (res.error) {
                toast.error(res.error);
            } else {
                setReport(res.report || "");
            }
        } catch (e) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (report) {
        return (
            <div className="w-full text-left mt-4 prose dark:prose-invert max-w-none bg-card p-6 rounded-lg border">
                <div className="whitespace-pre-wrap">{report}</div>
                <Button variant="outline" onClick={() => setReport(null)} className="mt-4">Generate New Report</Button>
            </div>
        )
    }

    return (
        <Button onClick={handleGenerate} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Report
        </Button>
    );
}
