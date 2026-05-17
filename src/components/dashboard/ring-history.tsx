'use client'

import { useState } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion } from 'framer-motion'
import { MessageSquare, Check, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { VISITOR_CATEGORY_LABELS, DEFAULT_QUICK_RESPONSES } from '@/types'
import type { RingEvent } from '@/types'
import { cn } from '@/utils/cn'

type RingWithProperty = RingEvent & {
  property: { name: string; type: string; unit_number: string | null } | null
}

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  pending: { label: 'Sin responder', class: 'text-yellow-500 bg-yellow-500/10' },
  seen: { label: 'Visto', class: 'text-blue-500 bg-blue-500/10' },
  responded: { label: 'Respondido', class: 'text-green-500 bg-green-500/10' },
  ignored: { label: 'Ignorado', class: 'text-gray-500 bg-gray-500/10' },
}

interface Props { rings: RingWithProperty[] }

export function RingHistoryList({ rings }: Props) {
  const [respondingId, setRespondingId] = useState<string | null>(null)
  const [localRings, setLocalRings] = useState(rings)

  const sendResponse = async (ringId: string, response: string) => {
    const res = await fetch(`/api/rings/${ringId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response }),
    })
    if (res.ok) {
      setLocalRings((prev) => prev.map((r) => r.id === ringId
        ? { ...r, status: 'responded', quick_response: response, responded_at: new Date().toISOString() }
        : r
      ))
      toast.success('Respuesta enviada')
    } else {
      toast.error('Error al responder')
    }
    setRespondingId(null)
  }

  if (localRings.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-16 text-center">
        <div className="text-5xl mb-4">🔔</div>
        <h3 className="font-display text-lg font-bold mb-2">Sin timbrazos aún</h3>
        <p className="text-muted-foreground text-sm">Cuando alguien use tu QR, aparecerá acá.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
      {localRings.map((ring, i) => (
        <motion.div
          key={ring.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.02 }}
          className="p-4"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg shrink-0">
              🔔
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <p className="font-medium text-sm">{ring.property?.name ?? 'Propiedad eliminada'}</p>
                  <p className="text-xs text-muted-foreground">
                    {VISITOR_CATEGORY_LABELS[ring.visitor_category]}
                    {ring.property?.unit_number && ` · Unidad ${ring.property.unit_number}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', STATUS_LABELS[ring.status]?.class ?? '')}>
                    {STATUS_LABELS[ring.status]?.label ?? ring.status}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock size={11} />
                    {formatDistanceToNow(new Date(ring.created_at), { addSuffix: true, locale: es })}
                  </span>
                </div>
              </div>

              {ring.visitor_message && (
                <p className="mt-1.5 text-xs italic text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
                  &ldquo;{ring.visitor_message}&rdquo;
                </p>
              )}

              {ring.quick_response && (
                <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
                  <Check size={12} />
                  Respondiste: &ldquo;{ring.quick_response}&rdquo;
                </p>
              )}

              {ring.status === 'pending' && (
                <div className="mt-2">
                  {respondingId === ring.id ? (
                    <div className="flex flex-wrap gap-1.5">
                      {DEFAULT_QUICK_RESPONSES.map((r) => (
                        <button
                          key={r}
                          onClick={() => sendResponse(ring.id, r)}
                          className="text-xs rounded-lg border border-primary/30 bg-primary/5 text-primary px-3 py-1.5 hover:bg-primary/10 transition-all"
                        >
                          {r}
                        </button>
                      ))}
                      <button onClick={() => setRespondingId(null)} className="text-xs text-muted-foreground px-2">
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRespondingId(ring.id)}
                      className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <MessageSquare size={12} />
                      Responder rápido
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
