import { useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { apiClient } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"

export function AuthCallbackPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const setAuth = useAuthStore((state) => state.setAuth)
    const setTokens = useAuthStore((state) => state.setTokens)

    useEffect(() => {
        const accessToken = searchParams.get('accessToken')
        const refreshToken = searchParams.get('refreshToken')

        if (!accessToken || !refreshToken) {
            navigate('/login', {replace: true})
            return
        }

        setTokens(accessToken, refreshToken)

        apiClient
            .get('/me')
            .then((res) => {
                setAuth(res.data, accessToken, refreshToken)
                navigate('/', { replace: true})
            })
            .catch(() => {
                navigate('/login', {replace: true})
            })
    }, [])

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold">Completing sign-in...</h1>
        </div>
    )
}