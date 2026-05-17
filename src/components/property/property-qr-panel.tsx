'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, Share2, ExternalLink, Copy } from 'lucide-react'
import { toast } from 'sonner'
import QRCode from 'qrcode'
import Link from 'next/link'
import { APP_CONFIG, ROUTES } from '@/config/app'
import type { Property } from '@/types'

interface Props { property: Property }

export function PropertyQRPanel({ property }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const visitorUrl = `${APP_CONFIG.url}/timbre/${property.qr_code}`

  useEffect(() => {
    if (!canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, visitorUrl, {
      width: 200,
      margin: 2,
      color: { dark: property.qr_color, light: property.qr_bg_color },
      errorCorrectionLevel: 'H',
    })
    QRCode.toDataURL(visitorUrl, {
      width: 512,
      margin: 3,
      color: { dark: property.qr_color, light: property.qr_bg_color },
      errorCorrectionLevel: 'H',
    }).then(setQrDataUrl)
  }, [visitorUrl, property.qr_color, property.qr_bg_color])

  const download = () => {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `qrbell-${property.name.toLowerCase().replace(/\s+/g, '-')}.png`
    a.click()
    toast.success('QR descargado')
  }

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: `Timbre - ${property.name}`, url: visitorUrl })
    } else {
      await navigator.clipboard.writeText(visitorUrl)
      toast.success('Link copiado')
    }
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(visitorUrl)
    toast.success('Link copiado al portapapeles')
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-5 sticky top-24">
      <h3 className="font-display font-bold text-base border-b border-border pb-2">Tu código QR</h3>

      {/* QR Canvas */}
      <div className="flex justify-center">
        <div
          className="rounded-2xl p-4 shadow-md"
          style={{ backgroundColor: property.qr_bg_color }}
        >
          <canvas ref={canvasRef} className="rounded-xl" />
        </div>
      </div>

      {/* Visitor URL */}
      <div className="rounded-xl bg-secondary/60 p-3 space-y-1">
        <p className="text-xs text-muted-foreground font-medium">Link del visitante</p>
        <div className="flex items-center gap-2">
          <p className="text-xs font-mono truncate flex-1">{visitorUrl}</p>
          <button onClick={copyLink} className="shrink-0 text-muted-foreground hover:text-primary transition-colors">
            <Copy size={13} />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={download}
          className="flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-xs font-medium hover:bg-secondary transition-all"
        >
          <Download size={14} />
          Descargar
        </button>
        <button
          onClick={share}
          className="flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-xs font-medium hover:bg-secondary transition-all"
        >
          <Share2 size={14} />
          Compartir
        </button>
      </div>

      <Link
        href={visitorUrl}
        target="_blank"
        className="flex items-center justify-center gap-2 rounded-xl bg-primary/10 text-primary px-3 py-2.5 text-xs font-medium hover:bg-primary/20 transition-all w-full"
      >
        <ExternalLink size={14} />
        Ver como visitante
      </Link>

      <p className="text-xs text-muted-foreground text-center">
        Imprimí y pegá este QR en tu puerta.<br />
        Tus visitantes lo escanean para llamarte.
      </p>
    </div>
  )
}
