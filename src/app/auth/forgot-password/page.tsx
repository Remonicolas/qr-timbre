'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ROUTES } from '@/config/app'
import { cn } from '@/utils/cn'

const schema = z.object({ email: z.string().email('Email inválido') })
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/configuracion`,
    })
    setSent(true)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-border bg-card shadow-xl p-8">
      {sent ? (
        <div className="text-center">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="font-display text-xl font-bold mb-2">Revisá tu email</h2>
          <p className="text-muted-foreground text-sm mb-6">Si el email existe, te enviamos el link para restablecer tu contraseña.</p>
          <Link href={ROUTES.login} className="text-sm text-primary hover:underline">Volver al inicio</Link>
        </div>
      ) : (
        <>
          <div className="mb-8 text-center">
            <h1 className="font-display text-2xl font-bold">Recuperar contraseña</h1>
            <p className="text-muted-foreground text-sm mt-1">Te enviamos un link a tu email</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input {...register('email')} type="email" placeholder="vos@ejemplo.com" className={cn('w-full rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all', errors.email ? 'border-destructive' : 'border-border')} />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50">
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Enviar link
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href={ROUTES.login} className="font-medium text-primary hover:underline">Volver al inicio</Link>
          </p>
        </>
      )}
    </motion.div>
  )
}
