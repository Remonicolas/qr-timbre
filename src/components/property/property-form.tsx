'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ROUTES, API_ROUTES, RING_COOLDOWN_OPTIONS } from '@/config/app'
import { PROPERTY_STATUS_LABELS, PROPERTY_TYPE_LABELS } from '@/types'
import type { Property } from '@/types'
import { cn } from '@/utils/cn'

const schema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
  type: z.enum(['house', 'apartment', 'office', 'store', 'other']),
  unit_number: z.string().max(20).optional(),
  address: z.string().max(200).optional(),
  phone_number: z.string().max(20).optional(),
  status: z.enum(['available', 'busy', 'sleeping', 'do_not_disturb', 'away']),
  is_building_mode: z.boolean(),
  notification_email: z.boolean(),
  notification_push: z.boolean(),
  notification_sound: z.boolean(),
  cooldown_seconds: z.coerce.number().min(0).max(3600),
  qr_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  qr_bg_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
})
type FormData = z.infer<typeof schema>

interface Props { property?: Property }

export function PropertyForm({ property }: Props) {
  const router = useRouter()
  const isEditing = !!property

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: property?.name ?? '',
      type: property?.type ?? 'apartment',
      unit_number: property?.unit_number ?? '',
      address: property?.address ?? '',
      phone_number: property?.phone_number ?? '',
      status: property?.status ?? 'available',
      is_building_mode: property?.is_building_mode ?? false,
      notification_email: property?.notification_email ?? true,
      notification_push: property?.notification_push ?? true,
      notification_sound: property?.notification_sound ?? true,
      cooldown_seconds: property?.cooldown_seconds ?? 60,
      qr_color: property?.qr_color ?? '#1a1a2e',
      qr_bg_color: property?.qr_bg_color ?? '#ffffff',
    },
  })

  const onSubmit = async (data: FormData) => {
    const url = isEditing ? API_ROUTES.property(property.id) : API_ROUTES.properties
    const method = isEditing ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const json = await res.json() as { error?: string }

    if (!res.ok) {
      toast.error(json.error ?? 'Error al guardar')
      return
    }

    toast.success(isEditing ? 'Propiedad actualizada' : 'Propiedad creada exitosamente')
    router.push(ROUTES.properties)
    router.refresh()
  }

  const inputClass = (hasError?: boolean) => cn(
    'w-full rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
    hasError ? 'border-destructive' : 'border-border'
  )

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="font-display font-bold text-base border-b border-border pb-2 mb-4">{children}</h3>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <SectionTitle>Información básica</SectionTitle>

        <div>
          <label className="block text-sm font-medium mb-1.5">Nombre de la propiedad *</label>
          <input {...register('name')} placeholder="Ej: Casa principal, Oficina centro" className={inputClass(!!errors.name)} />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Tipo</label>
            <select {...register('type')} className={inputClass()}>
              {Object.entries(PROPERTY_TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">N° Unidad</label>
            <input {...register('unit_number')} placeholder="Ej: 4B, PH" className={inputClass()} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Dirección (opcional)</label>
          <input {...register('address')} placeholder="Av. Corrientes 1234" className={inputClass()} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            Teléfono privado <span className="text-xs text-muted-foreground">(nunca se muestra al público)</span>
          </label>
          <input {...register('phone_number')} type="tel" placeholder="+54 11 1234-5678" className={inputClass()} />
        </div>
      </div>

      {/* Status */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <SectionTitle>Estado actual</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(PROPERTY_STATUS_LABELS).map(([value, label]) => {
            const statusClass: Record<string, string> = {
              available: 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400',
              busy: 'border-yellow-500 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
              sleeping: 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-400',
              do_not_disturb: 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-400',
              away: 'border-gray-400 bg-gray-500/10 text-gray-600 dark:text-gray-400',
            }
            const current = watch('status')
            return (
              <label key={value} className={cn('flex items-center gap-2 cursor-pointer rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all', current === value ? (statusClass[value] ?? 'border-primary') : 'border-border hover:border-border/80')}>
                <input {...register('status')} type="radio" value={value} className="sr-only" />
                {label}
              </label>
            )
          })}
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <SectionTitle>Notificaciones</SectionTitle>
        {[
          { name: 'notification_push', label: '📲 Push (celular/navegador)' },
          { name: 'notification_email', label: '📧 Email' },
          { name: 'notification_sound', label: '🔊 Sonido' },
          { name: 'is_building_mode', label: '🏢 Modo edificio (selector de unidades)' },
        ].map((f) => (
          <label key={f.name} className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium">{f.label}</span>
            <div className="relative">
              <input {...register(f.name as keyof FormData)} type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-border rounded-full peer peer-checked:bg-primary transition-all after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
            </div>
          </label>
        ))}

        <div>
          <label className="block text-sm font-medium mb-1.5">Tiempo entre timbrazos</label>
          <select {...register('cooldown_seconds')} className={inputClass()}>
            {RING_COOLDOWN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* QR Colors */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <SectionTitle>Personalización del QR</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Color del QR</label>
            <div className="flex items-center gap-3">
              <input {...register('qr_color')} type="color" className="h-10 w-14 rounded-lg border border-border cursor-pointer" />
              <input {...register('qr_color')} type="text" placeholder="#1a1a2e" className={cn(inputClass(), 'flex-1 font-mono text-xs')} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Fondo del QR</label>
            <div className="flex items-center gap-3">
              <input {...register('qr_bg_color')} type="color" className="h-10 w-14 rounded-lg border border-border cursor-pointer" />
              <input {...register('qr_bg_color')} type="text" placeholder="#ffffff" className={cn(inputClass(), 'flex-1 font-mono text-xs')} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-medium hover:bg-secondary transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {isEditing ? 'Guardar cambios' : 'Crear propiedad'}
        </button>
      </div>
    </form>
  )
}
