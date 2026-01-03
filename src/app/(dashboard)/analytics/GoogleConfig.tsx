'use client';

import { useEffect, useState } from 'react';
import { getGoogleData, saveGoogleConfig } from './config-actions';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Settings2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export default function GoogleConfig() {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState<any>(null);
    const [open, setOpen] = useState(false);

    const [propId, setPropId] = useState('');
    const [siteUrl, setSiteUrl] = useState('');

    useEffect(() => {
        setLoading(true);
        getGoogleData().then(res => {
            if (!res.error) {
                setData(res);
                setPropId(res.selectedPropertyId || '');
                setSiteUrl(res.selectedSiteUrl || '');

                // Auto-open if connected but no property/site selected
                if (res.isConnected && (!res.selectedPropertyId || !res.selectedSiteUrl)) {
                    setOpen(true);
                }
            }
            setLoading(false);
        });
    }, []); // Run once on mount

    const handleSave = async () => {
        setSaving(true);
        const res = await saveGoogleConfig(propId, siteUrl);
        setSaving(false);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success('Configuration saved');
            setOpen(false);
            setTimeout(() => window.location.reload(), 500); // Reload to fetch fresh data
        }
    };

    if (!data?.isConnected && !loading) {
        // If not connected, no settings to show really, handled by main button
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Settings2 className="mr-2 h-4 w-4" />
                    Settings
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Google Analytics Settings</DialogTitle>
                    <DialogDescription>
                        Select the accounts you want to display on the dashboard.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>GA4 Property</Label>
                            <Select value={propId} onValueChange={setPropId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Property" />
                                </SelectTrigger>
                                <SelectContent>
                                    {data?.properties?.map((p: any) => {
                                        if (!p?.property) return null;
                                        return (
                                            <SelectItem key={p.property} value={p.property.split('/').pop() || ''}>
                                                {p.displayName || p.property}
                                            </SelectItem>
                                        );
                                    })}
                                    {(!data?.properties || data.properties.length === 0) && <div className="p-2 text-sm text-muted">No properties found</div>}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Search Console Site</Label>
                            <Select value={siteUrl} onValueChange={setSiteUrl}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Site" />
                                </SelectTrigger>
                                <SelectContent>
                                    {data?.sites?.map((s: any) => (
                                        <SelectItem key={s.siteUrl} value={s.siteUrl}>
                                            {s.siteUrl}
                                        </SelectItem>
                                    ))}
                                    {(!data?.sites || data.sites.length === 0) && <div className="p-2 text-sm text-muted">No sites found</div>}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button onClick={handleSave} disabled={saving} className="w-full">
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
