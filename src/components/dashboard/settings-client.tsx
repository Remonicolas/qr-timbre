'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, User, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PushNotificationPrompt } from '@/components/shared/push-notification-prompt'
import type { UserProfile } from '@/types'
import { cn } from '@/utils/cn'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Mínimo 2 caracteres').max(80),
  phone: z.string().max(20).optional(),
})
type ProfileData = z.infer<typeof profileSchema>

interface Props { profile: UserProfile }

export function SettingsClient({ profile }: Props) {
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile.full_name ?? '',
      phone: profile.phone ?? '',
    },
  })

  const onProfileSave = async (data: ProfileData) => {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        full_name: data.full_name,
        phone: data.phone ?? null,
      })
      .eq('id', profile.id)

    if (error) toast.error('Error al guardar')
    else toast.success('Perfil actualizado ✓')
  }

  const inputClass = (hasError?: boolean) => cn(
    'w-full rounded-xl border bg-background px-4 py-3 text-sm',
    'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
    hasError ? 'border-destructive' : 'border-border'
  )

  const SectionCard = ({
    title,
    emoji,
    children,
  }: {
    title: string
    emoji: string
    children: React.ReactNode
  }) => (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <span className="text-lg">{emoji}</span>
        <h3 className="font-display font-bold text-base">{title}</h3>
      </div>
      {children}
    </div>
  )

  return (
    <div className="space-y-5">
      {/* ── Perfil ──────────────────────────────────────────── */}
      <SectionCard title="Perfil" emoji="👤">
        <form onSubmit={handleSubmit(onProfileSave)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Nombre completo
            </label>
            <input
              {...register('full_name')}
              type="text"
              autoComplete="name"
              className={inputClass(!!errors.full_name)}
            />
            {errors.full_name && (
              <p className="text-xs text-destructive mt-1">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              value={profile.email}
              disabled
              className={cn(inputClass(), 'opacity-60 cursor-not-allowed')}
            />
            <p className="text-xs text-muted-foreground mt-1">
              El email no puede modificarse desde aquí.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Teléfono personal{' '}
              <span className="text-muted-foreground font-normal">(privado)</span>
            </label>
            <input
              {...register('phone')}
              type="tel"
              placeholder="+54 11 1234-5678"
              autoComplete="tel"
              className={inputClass()}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50"
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            Guardar perfil
          </button>
        </form>
      </SectionCard>

      {/* ── Notificaciones Push ──────────────────────────────── */}
      <SectionCard title="Notificaciones Push" emoji="🔔">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Recibí una alerta instantánea cuando alguien toque tu timbre —
          incluso con la app cerrada.
        </p>
        <PushNotificationPrompt
          variant="card"
          onSubscribed={() => toast.success('¡Notificaciones activadas! 🎉')}
        />
      </SectionCard>

      {/* ── Cuenta ───────────────────────────────────────────── */}
      <SectionCard title="Información de cuenta" emoji="🛡️">
        <dl className="space-y-3 text-sm">
          {[
            { label: 'Plan actual', value: { free: 'Gratis', pro: 'Pro', business: 'Business' }[profile.subscription_plan] ?? 'Gratis' },
            { label: 'Estado suscripción', value: profile.subscription_status ?? '—' },
            { label: 'Propiedades permitidas', value: String(profile.max_properties) },
            { label: 'Rol', value: profile.role },
            { label: 'Miembro desde', value: new Date(profile.created_at).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' }) },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-semibold capitalize">{value}</dd>
            </div>
          ))}
        </dl>
      </SectionCard>
    </div>
  )
}
