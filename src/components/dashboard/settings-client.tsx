'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Bell, BellOff, User, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { API_ROUTES } from '@/config/app'
import type { UserProfile } from '@/types'
import { cn } from '@/utils/cn'

const profileSchema = z.object({
  full_name: z.string().min(2).max(80),
  phone: z.string().max(20).optional(),
})

type ProfileData = z.infer<typeof profileSchema>

interface Props {
  profile: UserProfile
}

// ✅ FIX iOS Safari Push
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)

  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)

  return Uint8Array.from(
    [...rawData].map(char => char.charCodeAt(0))
  )
}

export function SettingsClient({ profile }: Props) {
  const supabase = createClient()

  const [pushStatus, setPushStatus] = useState<
    'unknown' | 'granted' | 'denied' | 'subscribing'
  >('unknown')

  const [isSubscribed, setIsSubscribed] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileData>({
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

    if (error) {
      toast.error('Error al guardar')
    } else {
      toast.success('Perfil actualizado')
    }
  }

  const subscribePush = async () => {
    if (
      !('serviceWorker' in navigator) ||
      !('PushManager' in window)
    ) {
      toast.error('Tu navegador no soporta notificaciones push')
      return
    }

    setPushStatus('subscribing')

    try {
      console.log('pidiendo permisos...')

      const permission = await Notification.requestPermission()

      console.log('permission:', permission)

      if (permission !== 'granted') {
        setPushStatus('denied')

        toast.error(
          'Permiso denegado. Habilitá las notificaciones en tu navegador.'
        )

        return
      }

      console.log('registrando sw...')

      const reg = await navigator.serviceWorker.register(
        '/service-worker.js'
      )

      console.log('sw registrado:', reg)

      await navigator.serviceWorker.ready

      console.log('sw ready')

      const existing = await reg.pushManager.getSubscription()

      if (existing) {
        await existing.unsubscribe()
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,

        // ✅ FIX iOS
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })

      const key = sub.getKey('p256dh')
      const auth = sub.getKey('auth')

      await fetch(API_ROUTES.subscribe, {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          endpoint: sub.endpoint,

          p256dh: key
            ? btoa(
                String.fromCharCode(...new Uint8Array(key))
              )
            : '',

          auth: auth
            ? btoa(
                String.fromCharCode(...new Uint8Array(auth))
              )
            : '',

          browser: navigator.userAgent.slice(0, 50),
        }),
      })

      setPushStatus('granted')
      setIsSubscribed(true)

      toast.success('¡Notificaciones push activadas!')
    } catch (err) {
      console.error(err)

      setPushStatus('unknown')

      toast.error('Error al activar notificaciones')
    }
  }

  const SectionCard = ({
    title,
    icon: Icon,
    children,
  }: {
    title: string
    icon: React.ElementType
    children: React.ReactNode
  }) => (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <Icon size={18} className="text-primary" />
        <h3 className="font-display font-bold">{title}</h3>
      </div>

      {children}
    </div>
  )

  const inputClass = (err?: boolean) =>
    cn(
      'w-full rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
      err ? 'border-destructive' : 'border-border'
    )

  return (
    <div className="space-y-5">
      {/* Profile */}
      <SectionCard title="Perfil" icon={User}>
        <form
          onSubmit={handleSubmit(onProfileSave)}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Nombre completo
            </label>

            <input
              {...register('full_name')}
              className={inputClass(!!errors.full_name)}
            />

            {errors.full_name && (
              <p className="text-xs text-destructive mt-1">
                {errors.full_name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Email
            </label>

            <input
              value={profile.email}
              disabled
              className={cn(
                inputClass(),
                'opacity-60 cursor-not-allowed'
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Teléfono personal
            </label>

            <input
              {...register('phone')}
              type="tel"
              placeholder="+54 11 1234-5678"
              className={inputClass()}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50"
          >
            {isSubmitting && (
              <Loader2 size={14} className="animate-spin" />
            )}

            Guardar perfil
          </button>
        </form>
      </SectionCard>

      {/* Push Notifications */}
      <SectionCard
        title="Notificaciones Push"
        icon={Bell}
      >
        <p className="text-sm text-muted-foreground">
          Recibí alertas en tu celular o computadora
          aunque tengas el navegador cerrado.
        </p>

        {isSubscribed || pushStatus === 'granted' ? (
          <div className="flex items-center gap-3 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3">
            <Bell
              size={18}
              className="text-green-500"
            />

            <div>
              <p className="text-sm font-semibold text-green-600">
                Notificaciones activas
              </p>

              <p className="text-xs text-muted-foreground">
                Recibirás alertas cuando toquen tu
                timbre
              </p>
            </div>
          </div>
        ) : pushStatus === 'denied' ? (
          <div className="flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
            <BellOff
              size={18}
              className="text-red-500"
            />

            <div>
              <p className="text-sm font-semibold text-red-600">
                Notificaciones bloqueadas
              </p>

              <p className="text-xs text-muted-foreground">
                Habilitá los permisos en tu navegador
                manualmente
              </p>
            </div>
          </div>
        ) : (
          <button
            onClick={subscribePush}
            disabled={pushStatus === 'subscribing'}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50"
          >
            {pushStatus === 'subscribing' ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <Bell size={16} />
            )}

            Activar notificaciones push
          </button>
        )}
      </SectionCard>

      {/* Security */}
      <SectionCard title="Seguridad" icon={Shield}>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">
              Plan actual
            </span>

            <span className="font-semibold capitalize">
              {profile.subscription_plan}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">
              Rol
            </span>

            <span className="font-semibold capitalize">
              {profile.role}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">
              Propiedades permitidas
            </span>

            <span className="font-semibold">
              {profile.max_properties}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">
              Miembro desde
            </span>

            <span className="font-semibold">
              {new Date(
                profile.created_at
              ).toLocaleDateString('es-AR')}
            </span>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}