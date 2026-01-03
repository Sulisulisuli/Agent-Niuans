'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { disconnectGoogle } from '@/app/(dashboard)/analytics/config-actions';
import { toast } from 'sonner';
import { LogOut } from 'lucide-react';

export default function DisconnectGoogleButton() {
    const [loading, setLoading] = useState(false);

    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect Google Analytics & Search Console?')) return;

        setLoading(true);
        try {
            const res = await disconnectGoogle();
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success('Disconnected successfully');
                window.location.reload();
            }
        } catch (e) {
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="destructive"
            size="sm"
            onClick={handleDisconnect}
            disabled={loading}
            className="ml-auto"
        >
            <LogOut className="mr-2 h-4 w-4" />
            {loading ? 'Disconnecting...' : 'Disconnect'}
        </Button>
    );
}
