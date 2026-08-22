import { Navigate, Outlet } from 'react-router'
import { useAuthStore } from '@/stores/auth-store'
import { NavBar } from '@/components/nav-bar'

export function ProtectedRoute() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    return (
        <>
            <NavBar />
            <Outlet />
        </>
    ) 
}