import { z as zod } from 'zod'

export const loginSchema = zod.object({
    email: zod.string().email('Enter a valid email address'),
    password: zod.string().min(1, 'Password is required'),
})

export type LoginFormValues = zod.infer<typeof loginSchema>