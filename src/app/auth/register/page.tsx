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

const ERROR_MESSAGES: Record<string, string> = {
  'User already registered': 'Ya existe una cuenta con este email. ¿Querés iniciar sesión?',
  'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
  'Unable to validate email address: invalid format': 'El formato del email no es válido',
  'Email rate limit exceeded': 'Demasiados intentos. Esperá unos minutos.',
  'signup_disabled': 'El registro está deshabilitado temporalmente.',
}

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [showPwd, setShowPwd] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setServerError('')

    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        options: {
          data: { full_name: data.full_name.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error('[Register] Supabase error:', error)
        const msg = ERROR_MESSAGES[error.message] ?? `Error: ${error.message}`
        setServerError(msg)
        return
      }

      if (authData?.user?.identities?.length === 0) {
        setServerError('Ya existe una cuenta con este email. ¿Querés iniciar sesión?')
        return
      }

      // Sin confirmación de email → entra directo al dashboard
      if (authData?.session) {
        router.push(ROUTES.dashboard)
        router.refresh()
        return
      }

      // Con confirmación de email → mostrar mensaje
      if (authData?.user) {
        setNeedsEmailConfirm(true)
        setSuccess(true)
        return
      }

      setServerError('Ocurrió un error inesperado. Intentá de nuevo.')
    } catch (err) {
      console.error('[Register] Unexpected error:', err)
      setServerError('Error de conexión. Verificá tu internet e intentá de nuevo.')
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setServerError('Error al conectar con Google. Intentá de nuevo.')
      setGoogleLoading(false)
    }
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border border-border bg-card shadow-xl p-8 text-center"
      >
        <div className="text-5xl mb-4">{needsEmailConfirm ? '📬' : '✅'}</div>
        <h2 className="font-display text-xl font-bold mb-2">
          {needsEmailConfirm ? '¡Revisá tu email!' : '¡Cuenta creada!'}
        </h2>
        <p className="text-muted-foreground text-sm">
          {needsEmailConfirm
            ? 'Te enviamos un link de confirmación. Hacé click en el link para activar tu cuenta y luego iniciá sesión.'
            : 'Tu cuenta fue creada exitosamente.'}
        </p>
        <div className="mt-6">
          <Link
            href={ROUTES.login}
            className="block w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </motion.div>
    )
  }

  const inputClass = (hasError: boolean) => cn(
    'w-full rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
    hasError ? 'border-destructive' : 'border-border'
  )

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
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs text-muted-foreground">
          <span className="bg-card px-3">o con email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Nombre completo</label>
          <input
            {...register('full_name')}
            type="text"
            placeholder="Tu nombre"
            autoComplete="name"
            className={inputClass(!!errors.full_name)}
          />
          {errors.full_name && <p className="text-xs text-destructive mt-1">{errors.full_name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Email</label>
          <input
            {...register('email')}
            type="email"
            placeholder="vos@ejemplo.com"
            autoComplete="email"
            className={inputClass(!!errors.email)}
          />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Contraseña</label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPwd ? 'text' : 'password'}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              className={inputClass(!!errors.password)}
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
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
            className={inputClass(!!errors.confirm_password)}
          />
          {errors.confirm_password && <p className="text-xs text-destructive mt-1">{errors.confirm_password.message}</p>}
        </div>

        {serverError && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {serverError}
            {serverError.includes('iniciar sesión') && (
              <Link href={ROUTES.login} className="block mt-1 underline font-medium">
                Ir a login →
              </Link>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta gratis'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Ya tenés cuenta?{' '}
        <Link href={ROUTES.login} className="font-medium text-primary hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </motion.div>
  )
}