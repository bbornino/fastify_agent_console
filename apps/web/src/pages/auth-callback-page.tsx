import { useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { apiClient } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"

export function AuthCallbackPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const setAuth = useAuthStore((state) => state.setAuth)

    useEffect(() => {
        const accessToken = searchParams.get('accessToken')

        if (!accessToken) {
            navigate('/login', {replace: true})
            return
        }

        apiClient
            .get('/me', {
                headers: {Authorization: `Bearer ${accessToken}`}
            })
            .then((res) => {
                setAuth(res.data, accessToken)
                navigate('/', { replace: true})
            })
            .catch(() => {
                navigate('/login', {replace: true})
            })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: process URL token exactly once on mount
    }, [])

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold">Completing sign-in...</h1>
        </div>
    )
}