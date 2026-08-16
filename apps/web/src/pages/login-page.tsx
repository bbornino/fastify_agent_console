import { useState } from "react"
import { useNavigate } from "react-router"
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from "@/components/ui/input"
import { Label } from '@/components/ui/label'
import { loginSchema, type LoginFormValues } from "@/lib/schemas/auth-schema"
import { apiClient } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import { GoogleAuthButton } from "@/components/google-auth-button"

export function LoginPage() {
    const navigate = useNavigate()
    const setAuth = useAuthStore((state => state.setAuth))
    const [serverError, setServerError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema)
    })

    const onSubmit = async (data: LoginFormValues) => {
        setServerError(null)
        try {
            const response = await apiClient.post('/auth/login', data)
            const { user, accessToken } = response.data
            setAuth(user, accessToken)
            navigate('/')
        } catch (err) {
            setServerError('Invalid email or password')
        }
    }


    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="w-full max-w-sm space-y-4 p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <h1 className="text-2xl font-bold">Log in</h1>

                    <div className="space-y-1">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" {...register('email')} />
                        {errors.email && (
                            <p className="text-sm text-destructive">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" {...register('password')} />
                        {errors.password && (
                            <p className="text-sm text-destructive">{errors.password.message}</p>
                        )}
                    </div>

                    {serverError && <p className="text-sm text-destructive">{serverError}</p>}

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? 'Logging in...' : 'Log in'}
                    </Button>
                </form>

                <GoogleAuthButton mode="signin" />
            </div>
        </div>
    )
}