import { Link, useLocation } from "react-router"
import { Button } from '@/components/ui/button'
import { useAuthStore } from "@/stores/auth-store"

const NAV_LINKS = [
    { to: '/', label: 'Home'},
    { to: '/tickets', label: 'Tickets'},
    { to: '/tickets/new', label: 'New Ticket'},
]

export function NavBar() {
    const location = useLocation()
    const logout = useAuthStore((state) => state.logout)
    const user = useAuthStore((state) => state.user)

    return (
        <nav className="border-b p-4 flex items-center justify-between">
            <div className="flex gap-4">
                {NAV_LINKS.map((link) => (
                    <Link
                        key={link.to}
                        to={link.to}
                        className={
                            location.pathname === link.to
                                ? 'font-semibold'
                                : 'text-muted-foreground hover: text-foreground'
                        }
                    >
                        {link.label}
                    </Link>
                ))}
            </div>
            <div className="flex items-center gap-3">
                { user && <span className="text-sm text-muted-foreground">{user.name}</span>}
                <Button variant="outline" size="sm" onClick={logout}>Log out</Button>
            </div>
        </nav>
    )
}