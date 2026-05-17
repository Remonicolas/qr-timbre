// ============================================================
// QR BELL - Core TypeScript Types
// ============================================================

// ─── User & Auth ────────────────────────────────────────────

export type UserRole = 'user' | 'admin' | 'superadmin'

export type SubscriptionPlan = 'free' | 'pro' | 'business'
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  role: UserRole
  subscription_plan: SubscriptionPlan
  subscription_status: SubscriptionStatus | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  max_properties: number
  created_at: string
  updated_at: string
}

// ─── Property ───────────────────────────────────────────────

export type PropertyType = 'house' | 'apartment' | 'office' | 'store' | 'other'
export type PropertyStatus = 'available' | 'busy' | 'sleeping' | 'do_not_disturb' | 'away'

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  available: 'Disponible',
  busy: 'Ocupado',
  sleeping: 'Durmiendo',
  do_not_disturb: 'No Molestar',
  away: 'Ausente',
}

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  house: 'Casa',
  apartment: 'Departamento',
  office: 'Oficina',
  store: 'Local',
  other: 'Otro',
}

export interface Property {
  id: string
  user_id: string
  name: string
  type: PropertyType
  unit_number: string | null
  address: string | null
  photo_url: string | null
  qr_code: string
  qr_color: string
  qr_bg_color: string
  status: PropertyStatus
  is_building_mode: boolean
  phone_number: string | null  // NEVER exposed publicly
  notification_email: boolean
  notification_push: boolean
  notification_sound: boolean
  cooldown_seconds: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type PropertyPublic = Omit<
  Property,
  'user_id' | 'phone_number' | 'notification_email' | 'notification_push' | 'notification_sound' | 'cooldown_seconds'
>

// ─── Ring Events ─────────────────────────────────────────────

export type VisitorCategory = 'delivery' | 'guest' | 'mail' | 'emergency' | 'other'

export const VISITOR_CATEGORY_LABELS: Record<VisitorCategory, string> = {
  delivery: '📦 Delivery',
  guest: '👤 Invitado',
  mail: '✉️ Correo',
  emergency: '🚨 Emergencia',
  other: '❓ Otro',
}

export type RingStatus = 'pending' | 'seen' | 'responded' | 'ignored'

export interface RingEvent {
  id: string
  property_id: string
  visitor_category: VisitorCategory
  visitor_message: string | null
  visitor_ip: string | null
  status: RingStatus
  quick_response: string | null
  responded_at: string | null
  created_at: string
  property?: Property
}

export interface RingEventWithProperty extends RingEvent {
  property: Property
}

// ─── Quick Responses ─────────────────────────────────────────

export interface QuickResponse {
  id: string
  user_id: string
  property_id: string | null  // null = global for user
  text: string
  is_default: boolean
  sort_order: number
  created_at: string
}

export const DEFAULT_QUICK_RESPONSES: string[] = [
  'Ya bajo 🏃',
  'Esperá un momento ⏳',
  'No estoy en casa 🏠',
  'Dejá el paquete en la puerta 📦',
  'Vuelvo en unos minutos 🕐',
]

// ─── Push Subscriptions ───────────────────────────────────────

export interface PushSubscription {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  fcm_token: string | null
  device_name: string | null
  browser: string | null
  is_active: boolean
  created_at: string
}

// ─── Notifications ────────────────────────────────────────────

export type NotificationType = 'ring' | 'system' | 'subscription' | 'promo'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string
  data: Record<string, unknown> | null
  is_read: boolean
  ring_event_id: string | null
  created_at: string
}

// ─── Building Units ───────────────────────────────────────────

export interface BuildingUnit {
  id: string
  property_id: string
  unit_name: string
  unit_number: string
  resident_name: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}

// ─── Analytics ────────────────────────────────────────────────

export interface AnalyticsSummary {
  total_rings: number
  rings_today: number
  rings_this_week: number
  rings_this_month: number
  average_response_time: number | null
  most_active_hour: number | null
  top_category: VisitorCategory | null
}

export interface RingsByHour {
  hour: number
  count: number
}

export interface RingsByDay {
  date: string
  count: number
}

export interface RingsByCategory {
  category: VisitorCategory
  count: number
}

// ─── Subscription Plans ───────────────────────────────────────

export interface PlanFeatures {
  max_properties: number
  building_mode: boolean
  analytics: boolean
  custom_qr: boolean
  quick_responses: boolean
  priority_support: boolean
  camera_intercom: boolean
  api_access: boolean
  white_label: boolean
}

export const PLAN_FEATURES: Record<SubscriptionPlan, PlanFeatures> = {
  free: {
    max_properties: 1,
    building_mode: false,
    analytics: false,
    custom_qr: false,
    quick_responses: true,
    priority_support: false,
    camera_intercom: false,
    api_access: false,
    white_label: false,
  },
  pro: {
    max_properties: 5,
    building_mode: false,
    analytics: true,
    custom_qr: true,
    quick_responses: true,
    priority_support: true,
    camera_intercom: false,
    api_access: false,
    white_label: false,
  },
  business: {
    max_properties: 50,
    building_mode: true,
    analytics: true,
    custom_qr: true,
    quick_responses: true,
    priority_support: true,
    camera_intercom: true,
    api_access: true,
    white_label: true,
  },
}

// ─── API Responses ────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data: T | null
  error: string | null
  code?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  per_page: number
  total_pages: number
}

// ─── Rate Limiting ────────────────────────────────────────────

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

// ─── Realtime ─────────────────────────────────────────────────

export type RealtimeEvent = 'ring' | 'property_status_change' | 'notification'

export interface RealtimePayload<T = unknown> {
  event: RealtimeEvent
  payload: T
  timestamp: string
}

// ─── Visitor Page ─────────────────────────────────────────────

export interface VisitorPageData {
  property: PropertyPublic
  building_units: BuildingUnit[]
  cooldown_seconds: number
}

export interface RingPayload {
  qr_code: string
  visitor_category: VisitorCategory
  visitor_message?: string
  unit_id?: string
}

// ─── Admin ────────────────────────────────────────────────────

export interface AdminStats {
  total_users: number
  total_properties: number
  total_rings_today: number
  total_rings_this_month: number
  active_subscriptions: number
  mrr: number
}

// ─── Camera/Intercom (Future) ─────────────────────────────────

export interface IntercomSession {
  id: string
  property_id: string
  ring_event_id: string
  webrtc_offer: string | null
  webrtc_answer: string | null
  status: 'pending' | 'active' | 'ended'
  started_at: string | null
  ended_at: string | null
  created_at: string
}

// ─── Form Types ───────────────────────────────────────────────

export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  full_name: string
  email: string
  password: string
  confirm_password: string
}

export interface PropertyFormData {
  name: string
  type: PropertyType
  unit_number?: string
  address?: string
  phone_number?: string
  status: PropertyStatus
  is_building_mode: boolean
  notification_email: boolean
  notification_push: boolean
  notification_sound: boolean
  cooldown_seconds: number
  qr_color: string
  qr_bg_color: string
}
