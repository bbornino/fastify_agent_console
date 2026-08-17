import { useEffect, type ReactNode } from "react"
import axios from "axios"
import { apiClient } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import { API_BASE_URL } from "@/lib/constants"

export function AuthBootstrap({ children }: { children: ReactNode}) {
    const isBootstrapping = useAuthStore((state) => state.isBootstrapping)
    const setAuth = useAuthStore((state) => state.setAuth)
    const finishBootstraping = useAuthStore((state) => state.finishBootstrapping)

    useEffect(() => {
        axios
            .post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true})
            .then((res) => {
                const { accessToken } = res.data
                return apiClient
                    .get('/me', { headers: { Authorization: `Bearer ${accessToken}` } })
                    .then((meRes) => {
                        setAuth(meRes.data, accessToken)
                    })
            })
            .catch(() => {
                // No valid cookie, or refresh failed - that's fine, user just isn't logged in
            })
            .finally(() => {
                finishBootstraping()
            })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: run once on app mount    
    }, [])

    if (isBootstrapping) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        )
    }

    return <div>{children}</div>
}