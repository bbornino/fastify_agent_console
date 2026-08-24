import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
// import { Button } from '@/components/ui/button';

interface Me {
    id: number;
    email: string;
    name: string;
    role: string;
    avatarUrl: string | null;
}

export function HomePage() {
    const logout = useAuthStore((state) => state.logout);
    const [me, setMe] = useState<Me | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient
            .get('/me')
            .then((res) => setMe(res.data))
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <div className="p-4">Loading...</div>

    return (
        <div className="p-4 space-y-4">
            <h1 className="text-2xl font-bold">Welcome, {me?.name}</h1>
            <p className="text-sm text-muted-foreground">{me?.email}</p>
            <p className="text-sm">Role: {me?.role}</p>
            {/* <Button onClick={logout}>Log out</Button> */}
        </div>
    )
}