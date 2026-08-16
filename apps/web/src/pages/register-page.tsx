import { useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { registerSchema, type RegisterFormValues } from '@/lib/schemas/auth-schema'
import { apiClient } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import { GoogleAuthButton } from "@/components/google-auth-button"

export function RegisterPage() {
    const navigate = useNavigate()
    const setAuth = useAuthStore((state) => state.setAuth)
    const [serverError, setServerError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema)
    })

    const onSubmit = async (data: RegisterFormValues) => {
        setServerError(null)
        try {
            const response = await apiClient.post('/auth/register', data)
            const { user, accessToken, refreshToken } = response.data
            setAuth(user, accessToken, refreshToken)
            navigate('/')
        } catch (err) {
            if (axios.isAxiosError(err) &&err.response?.status === 409) {
                setServerError('An account with that email already exists')
            } else {
                setServerError('Something went wrong.  Please try again.')
            }
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="w-full max-w-sm space-y-4 p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-4 p-6">
                    <h1 className="text-2xl font-bold">Create an account</h1>

                    <div className="space-y-1">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" type="text" {...register('name')} />
                        {errors.name && (
                            <p className="text-sm text-destructive">{errors.name.message}</p>
                        )}
                    </div>

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
                        {isSubmitting ? 'Creating account...' : 'Create account'}
                    </Button>
                </form>

                <GoogleAuthButton mode="signup" />
            </div>

        </div>
    )
}