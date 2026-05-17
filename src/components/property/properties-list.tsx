'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { QrCode, Download, Share2, Settings, Plus, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import QRCode from 'qrcode'
import { ROUTES, APP_CONFIG } from '@/config/app'
import { PROPERTY_STATUS_LABELS, PROPERTY_TYPE_LABELS } from '@/types'
import type { Property } from '@/types'
import { cn } from '@/utils/cn'

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-500/10 text-green-600 border-green-500/20',
  busy: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  sleeping: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  do_not_disturb: 'bg-red-500/10 text-red-600 border-red-500/20',
  away: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
}

const TYPE_EMOJI: Record<string, string> = {
  house: '🏠', apartment: '🏘️', office: '🏢', store: '🏪', other: '🏗️',
}

interface Props { properties: Property[] }

export function PropertiesList({ properties }: Props) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const getVisitorUrl = (qrCode: string) =>
    `${APP_CONFIG.url}/timbre/${qrCode}`

  const downloadQR = async (property: Property) => {
    setDownloadingId(property.id)
    try {
      const url = getVisitorUrl(property.qr_code)
      const dataUrl = await QRCode.toDataURL(url, {
        width: 512,
        margin: 3,
        color: { dark: property.qr_color, light: property.qr_bg_color },
        errorCorrectionLevel: 'H',
      })
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `qrbell-${property.name.toLowerCase().replace(/\s+/g, '-')}.png`
      link.click()
      toast.success('QR descargado exitosamente')
    } catch {
      toast.error('Error al generar el QR')
    } finally {
      setDownloadingId(null)
    }
  }

  const shareQR = async (property: Property) => {
    const url = getVisitorUrl(property.qr_code)
    if (navigator.share) {
      await navigator.share({ title: `Timbre - ${property.name}`, url })
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Link copiado al portapapeles')
    }
  }

  if (properties.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-16 text-center">
        <div className="text-6xl mb-4">🔔</div>
        <h3 className="font-display text-xl font-bold mb-2">Sin propiedades aún</h3>
        <p className="text-muted-foreground text-sm mb-8 max-w-sm mx-auto">
          Creá tu primera propiedad y generá un QR para que tus visitantes puedan llamarte.
        </p>
        <Link
          href={ROUTES.newProperty}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all"
        >
          <Plus size={16} />
          Crear primera propiedad
        </Link>
      </div>
    )
  }

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {properties.map((property, i) => (
        <motion.div
          key={property.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-2xl border border-border bg-card overflow-hidden group hover:border-primary/30 hover:shadow-lg transition-all"
        >
          {/* Card Header */}
          <div className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">
                  {TYPE_EMOJI[property.type] ?? '🏠'}
                </div>
                <div>
                  <h3 className="font-semibold leading-tight">{property.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {PROPERTY_TYPE_LABELS[property.type]}
                    {property.unit_number && ` · ${property.unit_number}`}
                  </p>
                </div>
              </div>
              <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full border', STATUS_COLORS[property.status])}>
                {PROPERTY_STATUS_LABELS[property.status]}
              </span>
            </div>

            {/* Visitor URL */}
            <div className="flex items-center gap-2 rounded-xl bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
              <QrCode size={14} className="shrink-0 text-primary" />
              <span className="truncate font-mono">/timbre/{property.qr_code.slice(0, 12)}...</span>
              <Link
                href={getVisitorUrl(property.qr_code)}
                target="_blank"
                className="shrink-0 hover:text-primary"
              >
                <ExternalLink size={12} />
              </Link>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-border grid grid-cols-3 divide-x divide-border">
            <button
              onClick={() => downloadQR(property)}
              disabled={downloadingId === property.id}
              className="flex flex-col items-center gap-1 p-3 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
            >
              <Download size={15} />
              <span>QR</span>
            </button>
            <button
              onClick={() => shareQR(property)}
              className="flex flex-col items-center gap-1 p-3 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
            >
              <Share2 size={15} />
              <span>Link</span>
            </button>
            <Link
              href={ROUTES.property(property.id)}
              className="flex flex-col items-center gap-1 p-3 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
            >
              <Settings size={15} />
              <span>Editar</span>
            </Link>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
