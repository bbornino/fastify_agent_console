import { Button } from '@/components/ui/button'

interface GoogleAuthButtonProps {
    mode: 'signin' | 'signup'
}

export function GoogleAuthButton({ mode }: GoogleAuthButtonProps) {
    return (
        <>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
            </div>

            <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                window.location.href = 'http://localhost:3000/auth/google';
                }}
            >
                {mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}
            </Button>
        </>
    )
}