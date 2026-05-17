// ============================================================
// QR BELL - App Configuration
// ============================================================

export const APP_CONFIG = {
  name: 'QR Bell',
  tagline: 'El timbre inteligente sin revelar tu número',
  description: 'Recibí visitas de forma segura con un código QR. Sin revelar tu teléfono.',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://qrbell.app',
  supportEmail: 'soporte@qrbell.app',
  twitterHandle: '@qrbell_app',
} as const

export const ROUTES = {
  home: '/',
  pricing: '/precios',
  about: '/nosotros',
  contact: '/contacto',
  privacy: '/privacidad',
  terms: '/terminos',
  visitor: (qrCode: string) => `/timbre/${qrCode}`,
  login: '/auth/login',
  register: '/auth/register',
  forgotPassword: '/auth/forgot-password',
  callback: '/auth/callback',
  dashboard: '/dashboard',
  properties: '/dashboard/propiedades',
  newProperty: '/dashboard/propiedades/nueva',
  property: (id: string) => `/dashboard/propiedades/${id}`,
  history: '/dashboard/historial',
  analytics: '/dashboard/analiticas',
  settings: '/dashboard/configuracion',
  billing: '/dashboard/suscripcion',
  notifications: '/dashboard/notificaciones',
  admin: '/admin',
  adminUsers: '/admin/usuarios',
  adminProperties: '/admin/propiedades',
  adminAnalytics: '/admin/analiticas',
} as const

export const API_ROUTES = {
  authCallback: '/api/auth/callback',
  properties: '/api/properties',
  property: (id: string) => `/api/properties/${id}`,
  ring: '/api/rings',
  ringRespond: (id: string) => `/api/rings/${id}/respond`,
  subscribe: '/api/subscriptions/push',
  unsubscribe: '/api/subscriptions/push',
  notifications: '/api/notifications',
  createCheckout: '/api/billing/checkout',
  createPortal: '/api/billing/portal',
  webhook: '/api/webhooks/stripe',
  health: '/api/health',
} as const

export const LIMITS = {
  free: { maxProperties: 1, maxRingsPerDay: 50, historyDays: 7 },
  pro: { maxProperties: 5, maxRingsPerDay: 500, historyDays: 90 },
  business: { maxProperties: 50, maxRingsPerDay: 5000, historyDays: 365 },
} as const

export const RING_COOLDOWN_OPTIONS = [
  { value: 30, label: '30 segundos' },
  { value: 60, label: '1 minuto' },
  { value: 120, label: '2 minutos' },
  { value: 300, label: '5 minutos' },
  { value: 600, label: '10 minutos' },
] as const

export const QR_DEFAULTS = {
  color: '#1a1a2e',
  bgColor: '#ffffff',
  size: 300,
  margin: 2,
} as const
