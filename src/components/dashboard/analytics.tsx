'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts'
import { useTheme } from 'next-themes'
import type { AnalyticsSummary } from '@/types'

interface Props {
  summary: AnalyticsSummary | null
  byHour: Array<{ hour: number; count: number }>
  byDay: Array<{ date: string; count: number }>
  properties: Array<{ id: string; name: string }>
}

function StatCard({ label, value, icon, sub }: { label: string; value: string | number; icon: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="text-2xl mb-3">{icon}</div>
      <p className="font-display text-3xl font-bold">{value}</p>
      <p className="text-sm font-medium mt-1">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

const HOUR_LABELS = ['12am','1am','2am','3am','4am','5am','6am','7am','8am','9am','10am','11am',
  '12pm','1pm','2pm','3pm','4pm','5pm','6pm','7pm','8pm','9pm','10pm','11pm']

export function AnalyticsDashboard({ summary, byHour, byDay, properties }: Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const textColor = isDark ? '#94a3b8' : '#64748b'
  const gridColor = isDark ? '#1e2638' : '#f1f5f9'

  // Fill missing hours with 0
  const hourData = Array.from({ length: 24 }, (_, h) => ({
    hour: HOUR_LABELS[h] ?? `${h}h`,
    count: byHour.find((b) => b.hour === h)?.count ?? 0,
  }))

  const dayData = byDay.map((d) => ({
    date: new Date(d.date).toLocaleDateString('es-AR', { month: 'short', day: 'numeric' }),
    count: d.count,
  }))

  const formatTime = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    if (seconds < 60) return `${Math.round(seconds)}s`
    return `${Math.round(seconds / 60)}min`
  }

  if (!summary && properties.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-16 text-center">
        <div className="text-5xl mb-4">📊</div>
        <h3 className="font-display text-lg font-bold mb-2">Sin datos aún</h3>
        <p className="text-muted-foreground text-sm">Las analíticas aparecerán cuando recibas timbrazos.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total timbrazos" value={summary?.total_rings ?? 0} icon="🔔" />
        <StatCard label="Hoy" value={summary?.rings_today ?? 0} icon="📅" sub="últimas 24h" />
        <StatCard label="Esta semana" value={summary?.rings_this_week ?? 0} icon="📆" />
        <StatCard label="Tiempo de respuesta" value={formatTime(summary?.average_response_time ?? null)} icon="⚡" sub="promedio" />
      </div>

      {/* Activity by day */}
      {dayData.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display font-bold mb-4">Actividad diaria (últimos 30 días)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dayData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" tick={{ fill: textColor, fontSize: 11 }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: textColor, fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: isDark ? '#0f1117' : '#fff', border: '1px solid hsl(var(--border))', borderRadius: 12 }}
                labelStyle={{ color: isDark ? '#e2e8f0' : '#1e293b', fontWeight: 600 }}
              />
              <Line type="monotone" dataKey="count" stroke="hsl(235 82% 60%)" strokeWidth={2} dot={false} name="Timbrazos" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Activity by hour */}
      {hourData.some((h) => h.count > 0) && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display font-bold mb-1">Horarios más activos</h3>
          {summary?.most_active_hour != null && (
            <p className="text-sm text-muted-foreground mb-4">
              Hora pico: <span className="text-primary font-medium">{HOUR_LABELS[summary.most_active_hour]}</span>
            </p>
          )}
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hourData}>
              <XAxis dataKey="hour" tick={{ fill: textColor, fontSize: 10 }} tickLine={false} interval={3} />
              <YAxis tick={{ fill: textColor, fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: isDark ? '#0f1117' : '#fff', border: '1px solid hsl(var(--border))', borderRadius: 12 }}
                cursor={{ fill: 'hsl(235 82% 60% / 0.1)' }}
              />
              <Bar dataKey="count" fill="hsl(235 82% 60%)" radius={[4, 4, 0, 0]} name="Timbrazos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {summary?.top_category && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display font-bold mb-3">Visita más frecuente</h3>
          <div className="flex items-center gap-4">
            <div className="text-4xl">
              {summary.top_category === 'delivery' ? '📦' :
               summary.top_category === 'guest' ? '👤' :
               summary.top_category === 'mail' ? '✉️' :
               summary.top_category === 'emergency' ? '🚨' : '❓'}
            </div>
            <div>
              <p className="font-semibold">
                {summary.top_category === 'delivery' ? 'Delivery' :
                 summary.top_category === 'guest' ? 'Invitados' :
                 summary.top_category === 'mail' ? 'Correo' :
                 summary.top_category === 'emergency' ? 'Emergencia' : 'Otro'}
              </p>
              <p className="text-sm text-muted-foreground">categoría más común</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
