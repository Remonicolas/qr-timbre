'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ROUTES } from '@/config/app'
import { cn } from '@/utils/cn'

const schema = z.object({
  full_name: z.string().min(2, 'Mínimo 2 caracteres').max(80),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm_password'],
})
type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [showPwd, setShowPwd] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setServerError('')
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.full_name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setServerError(error.message === 'User already registered'
        ? 'Ya existe una cuenta con este email'
        : 'Error al registrarse. Intentá de nuevo.')
      return
    }
    setSuccess(true)
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border border-border bg-card shadow-xl p-8 text-center"
      >
        <div className="text-5xl mb-4">📬</div>
        <h2 className="font-display text-xl font-bold mb-2">¡Revisá tu email!</h2>
        <p className="text-muted-foreground text-sm">
          Te enviamos un link de confirmación. Hacé click en el link para activar tu cuenta.
        </p>
        <Link href={ROUTES.login} className="mt-6 inline-block text-sm text-primary hover:underline">
          Volver al inicio
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-border bg-card shadow-xl shadow-black/5 p-8"
    >
      <div className="mb-8 text-center">
        <h1 className="font-display text-2xl font-bold">Creá tu cuenta</h1>
        <p className="text-muted-foreground text-sm mt-1">Gratis para siempre, sin tarjeta</p>
      </div>

      <button
        onClick={handleGoogle}
        disabled={googleLoading}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm font-medium hover:bg-secondary transition-all disabled:opacity-50 mb-6"
      >
        {googleLoading ? <Loader2 size={16} className="animate-spin" /> : (
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        Registrarse con Google
      </button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-xs text-muted-foreground">
          <span className="bg-card px-3">o con email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {[
          { name: 'full_name', label: 'Nombre completo', type: 'text', placeholder: 'Tu nombre', autoComplete: 'name' },
          { name: 'email', label: 'Email', type: 'email', placeholder: 'vos@ejemplo.com', autoComplete: 'email' },
        ].map((f) => (
          <div key={f.name}>
            <label className="block text-sm font-medium mb-1.5">{f.label}</label>
            <input
              {...register(f.name as keyof FormData)}
              type={f.type}
              placeholder={f.placeholder}
              autoComplete={f.autoComplete}
              className={cn(
                'w-full rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
                errors[f.name as keyof FormData] ? 'border-destructive' : 'border-border'
              )}
            />
            {errors[f.name as keyof FormData] && (
              <p className="text-xs text-destructive mt-1">{errors[f.name as keyof FormData]?.message}</p>
            )}
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium mb-1.5">Contraseña</label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPwd ? 'text' : 'password'}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              className={cn(
                'w-full rounded-xl border bg-background px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
                errors.password ? 'border-destructive' : 'border-border'
              )}
            />
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Confirmar contraseña</label>
          <input
            {...register('confirm_password')}
            type="password"
            placeholder="Repetí tu contraseña"
            autoComplete="new-password"
            className={cn(
              'w-full rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
              errors.confirm_password ? 'border-destructive' : 'border-border'
            )}
          />
          {errors.confirm_password && <p className="text-xs text-destructive mt-1">{errors.confirm_password.message}</p>}
        </div>

        {serverError && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{serverError}</div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          Crear cuenta gratis
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Ya tenés cuenta?{' '}
        <Link href={ROUTES.login} className="font-medium text-primary hover:underline">Iniciá sesión</Link>
      </p>
    </motion.div>
  )
}
